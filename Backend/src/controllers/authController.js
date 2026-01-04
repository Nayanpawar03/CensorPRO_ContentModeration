import pool from "../db.js";
import bcrypt from "bcryptjs";
import { signToken } from "../utils/jwt.js";
import { OAuth2Client } from "google-auth-library";
import dotenv from "dotenv";
dotenv.config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const oauthClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Registration
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "All fields required" });

  try {
    const existing = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (existing.rows.length > 0) return res.status(400).json({ error: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1,$2,$3) RETURNING *",
      [name, email, hashedPassword]
    );

    const token = signToken(result.rows[0]);
    res.json({ success: true, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
};

// Login
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "All fields required" });

  try {
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    const user = result.rows[0];
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid credentials" });

    const token = signToken(user);
    res.json({ success: true, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
};

// Logout User
export const logoutUser = (req, res) => {
  // For JWT, the backend doesnt store sessions, so logout just instructs client to clear token
  res.clearCookie("token"); // only useful if youre using cookies
  return res.json({ message: "Logged out successfully" });
};

// Google OAuth login
export const googleLogin = async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: "Missing Google credential" });

  try {
    const ticket = await oauthClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const googleId = payload?.sub;
    const email = payload?.email;
    const name = payload?.name || `${payload?.given_name || ""} ${payload?.family_name || ""}`.trim();

    if (!googleId || !email) {
      return res.status(400).json({ error: "Invalid Google token" });
    }

    let result = await pool.query(
      "SELECT * FROM users WHERE google_id = $1 OR email = $2",
      [googleId, email]
    );
    let user = result.rows[0];

    if (!user) {
      const insert = await pool.query(
        "INSERT INTO users (google_id, email, name) VALUES ($1, $2, $3) RETURNING *",
        [googleId, email, name || email]
      );
      user = insert.rows[0];
    } else if (!user.google_id) {
      const update = await pool.query(
        "UPDATE users SET google_id = $1 WHERE email = $2 RETURNING *",
        [googleId, email]
      );
      user = update.rows[0];
    }

    const token = signToken(user);
    return res.json({ success: true, token });
  } catch (err) {
    console.error("Google login error:", err);
    return res.status(401).json({ error: "Google authentication failed" });
  }
};
