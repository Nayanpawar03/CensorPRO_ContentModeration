# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project overview

CensorPRO is a full-stack content moderation system for user-generated text and images. It provides:
- Automatic AI-based moderation (text via Hugging Face/Gradio, images via an external service consumed from the frontend).
- Manual moderation workflows (admin review queue, expert response, decisions).
- User management with roles (user, admin) and JWT-based authentication.

The root `README.md` describes the motivation, feature list, and high-level stack (Node/Express backend, React frontend, PostgreSQL database, DistilBERT-based text moderation, and an external image moderation API). Use it for product-level context; prefer the commands in this WARP file for day-to-day development.

## Local development commands

### Backend (Express API, PostgreSQL)

From the repo root:

- Install dependencies:
  - `cd Backend`
  - `npm install`
- Run the backend in watch mode for local development (nodemon):
  - `cd Backend`
  - `npm run dev`
- Run the backend with plain Node (no auto-restart):
  - `cd Backend`
  - `npm start`

Key notes:
- The main Express app is in `Backend/src/index.js`. It reads `PORT` (default 5000) and `FRONTEND_URL` from environment variables and configures CORS accordingly.
- For Azure Static Web Apps, `Backend/src/api/index.js` wraps the same Express app via `@vendia/serverless-express` and exports a `handler` for serverless `api` endpoints.
- `Backend/src/db.js` connects to PostgreSQL using `pg.Pool` and `process.env.DATABASE_URL` with TLS enabled.

### Frontend (React + Vite SPA)

From the repo root:

- Install dependencies:
  - `cd Frontend`
  - `npm install`
- Start the Vite dev server (React app):
  - `cd Frontend`
  - `npm run dev`
- Build production assets:
  - `cd Frontend`
  - `npm run build`
- Preview the built app locally:
  - `cd Frontend`
  - `npm run preview`
- Lint the frontend codebase (ESLint):
  - `cd Frontend`
  - `npm run lint`

Key notes:
- `Frontend/vite.config.js` configures a dev-time proxy so any request to `/api` is forwarded to `http://localhost:5000`. Frontend code uses both relative `/api/...` URLs and an explicit `API_BASE_URL` (see below).
- The environment variable `VITE_API_BASE_URL` (if set) is used by several pages to compute `API_BASE_URL`; otherwise they default to `http://localhost:5000`.

### Tests

As of this snapshot, neither `Backend/package.json` nor `Frontend/package.json` defines a `test` script or a specific test runner. There is no configured command for running a test suite or a single test.

The backend CI workflow (`.github/workflows/main_censorpro-backend.yml`) already calls `npm run test --if-present` in the `Backend` directory, so adding a `test` script there later will automatically integrate with CI.

## CI/CD and deployment

### Azure Static Web Apps (frontend + serverless API)

The workflow `.github/workflows/azure-static-web-apps-white-sea-0a964fe00.yml` configures Azure Static Web Apps:

- App (frontend) source: `Frontend`.
- API source: `Backend/src/api` (serverless wrapper around the Express app).
- Build commands:
  - Frontend: `npm run build` (executed in `Frontend`).
  - API: `npm install` (executed in `Backend/src/api`, which depends on the Backend project).

Azure Static Web Apps deploys the built frontend from `Frontend/dist` and exposes the serverless API under the configured `/api` route.

### Azure App Service (full backend app)

The workflow `.github/workflows/main_censorpro-backend.yml` builds and deploys the backend as a standalone Node app:

- Working directory for build: `./Backend`.
- Build steps:
  - `npm ci`
  - `npm run build --if-present`
  - `npm run test --if-present`
- Deployment target: Azure Web App named `censorpro-backend` (Production slot).

If you add build or test steps to the backend, ensure they are compatible with this workflow.

## High-level architecture

### Backend architecture

**Entrypoint and hosting modes**
- `Backend/src/index.js` creates the main Express app and:
  - Configures CORS with `FRONTEND_URL` (fallback `http://localhost:3000` by default in code).
  - Parses JSON bodies with `body-parser`.
  - Initializes Passport (for Google OAuth; strategy wiring is currently commented out in `passport-setup.js`).
  - Serves uploaded images from `/uploads` via `express.static`.
  - Mounts feature routes under `/auth` and `/content`.
  - Starts an HTTP server on all interfaces (`0.0.0.0`) only when not running inside the Azure Static Web Apps API host (it checks `NODE_ENV` and `IS_AZURE_STATIC_WEB_APPS_API`).
- `Backend/src/api/index.js` adapts the same Express app to Azure Functions using `@vendia/serverless-express` and exports `handler(event, context)`.

**Database and data model (PostgreSQL)**
- `Backend/src/db.js` exports a singleton `pg.Pool` using `DATABASE_URL` and TLS (`ssl: { rejectUnauthorized: false }`). All controllers share this pool.
- The code assumes at least two tables:
  - `users`: fields used include `id`, `name`, `email`, `password`, `role`, and optional `google_id`.
  - `content`: fields used include `id`, `user_id`, `text_content`, `image_path`, `status`, `decision`, `expert_response`, and `created_at`.

**Authentication and authorization**
- JWT utilities:
  - `Backend/src/utils/jwt.js` signs tokens with `JWT_SECRET`, embedding `id`, `email`, and `role` (defaulting to `"user"` if not set). It also provides a `verifyToken` helper.
- Middleware:
  - `Backend/src/middlewares/authMiddleware.js` reads `Authorization: Bearer <token>` headers, verifies the JWT, attaches the decoded user to `req.user`, and returns 401/403 on missing/invalid tokens.
  - `isAdmin` checks `req.user.role === "admin"` before allowing access to admin-only endpoints.
- Auth controllers and routes:
  - `Backend/src/controllers/authController.js` implements manual register/login using `bcryptjs` for password hashing and the `users` table for persistence, then issues JWTs.
  - Logout is stateless (it just tells the client to clear its JWT; no server-side session store).
  - `Backend/src/routes/auth.js` exposes:
    - `POST /auth/register` → `registerUser`.
    - `POST /auth/login` → `loginUser`.
    - `POST /auth/logout` → `logoutUser`.
    - Google OAuth endpoints (`/auth/google`, `/auth/google/callback`) wired to Passport; `passport-setup.js` currently contains a commented-out Google strategy implementation, which you must re-enable and configure before Google OAuth works end-to-end.

**Content moderation and workflows**
- Controller: `Backend/src/controllers/contentController.js` centralizes moderation logic.
- File uploads:
  - Uses `multer` with disk storage; files are written under the `uploads/` directory and served under `/uploads`.
  - `upload` (the configured Multer instance) is exported and used in the `content` routes.
- Routes in `Backend/src/routes/content.js`:
  - `POST /content/moderate/text` (auth required): text-only moderation via Gradio (see below).
  - `POST /content/moderate/ai/:id`: AI-driven moderation of previously submitted text content, addressed by `content.id`.
  - `POST /content/upload`: authenticated user upload of either text **or** image (but not both at once). Uses `upload.single("image")`.
  - `GET /content/my-content`: authenticated user fetch for their own content history.
  - `GET /content/admin/queue`: admin-only queue of `status='pending'` items, joined with user emails.
  - `GET /content/admin/stats`: admin-only aggregate counts for key statuses (`pending`, `done`, `under review`) and decisions (`Approved`, `Rejected`).
  - `POST /content/admin/review/:id`: admin-only endpoint to set `expert_response` and `decision` on a content item and mark it as `done`.

**External AI integrations**
- Text moderation (Gradio):
  - `moderateText` takes `req.body.text`, connects to the Gradio Space `"Sheshank2609/content-moderation-demo"` using `@gradio/client`, calls the `/moderate_text` endpoint, and returns the raw result JSON to the client.
- Text moderation (Hugging Face Inference API):
  - `aiModeration` fetches a content row, then sends `content.text_content` to the Hugging Face Inference endpoint for the model `"Sheshank2609/content-moderation-distilbert"` using `HF_API_KEY` as a bearer token.
  - It inspects the model response to derive a coarse `decision` (`Approved` vs `Rejected` based on whether the top label is `"safe"`), updates the `content` row, and persists a detailed `expert_response` containing the raw AI output.

### Frontend architecture

**Entry and routing**
- `Frontend/src/main.jsx` bootstraps the React app with `BrowserRouter`.
- `Frontend/src/App.jsx` defines the main route map:
  - `/` → `Home` page.
  - `/login` → `Login` page.
  - `/register` → `Register` page.
  - `/dashboard` → `Dashboard` (standard user experience).
  - `/admin` → `AdminDashboard` (admin queue and review tools).
  - `/Dashboard` (capital D) redirects to `/dashboard` to support legacy/backend redirects.

**API access patterns and environment configuration**
- Several pages compute `API_BASE_URL` as `import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'` and call the backend directly (e.g., `Home`, `Dashboard`, `AdminDashboard`).
- Other flows (notably `Login` and `Register`) call relative URLs like `/api/auth/login` and `/api/auth/register`, which are proxied to the backend by Vite in dev (`vite.config.js`).
- JWT tokens are stored in `localStorage` on successful authentication and then:
  - Sent to the backend as `Authorization: Bearer <token>`.
  - Parsed client-side (via `atob`) to infer the user's `role` and other claims for routing decisions.

**Key pages and responsibilities**

- `Home.jsx`:
  - Landing/marketing page.
  - Detects whether a JWT token exists and conditionally renders Sign In / Sign Out.
  - `Try It Now` button routes users to `/login` if unauthenticated, otherwise dispatches them to `/admin` or `/dashboard` based on the decoded `role` claim.

- `Login.jsx`:
  - Implements manual email/password login via `POST /api/auth/login`.
  - On success, stores the JWT, decodes its payload to determine whether to route the user to `/admin` or `/dashboard`, and redirects accordingly.
  - Handles Google OAuth by redirecting the browser to `/api/auth/google` and then parsing the returned token from the URL hash after redirect.

- `Register.jsx`:
  - Implements manual registration via `POST /api/auth/register`, including basic client-side validation.
  - On success, optionally stores the returned JWT and redirects users to the login page.
  - Provides a Google signup path that reuses the same `/api/auth/google` flow.

- `Dashboard.jsx` (user dashboard):
  - Main panel for end users to submit content and view moderation outcomes.
  - Maintains local state for:
    - Uploaded file (image), text content to moderate, last moderation result, and AI moderation result.
    - User-specific content history fetched from `GET /content/my-content`.
    - Derived stats (`total`, `approved`, `pending`, `underReview`, `rejected`) computed client-side from the history.
  - Uses `API_BASE_URL` to call backend `/content` endpoints (including AI moderation and content listing) with the JWT attached.
  - Contains logic to interpret image moderation responses from an external service (e.g., Sightengine) and summarize them as "safe" or "inappropriate" categories.
  - Contains `processTextModerationResults` to convert raw text moderation scores from the Gradio/HF pipeline into a human-readable classification with reasons.

- `AdminDashboard.jsx` (admin review console):
  - Checks for a JWT in `localStorage` and, on initial load, can parse tokens provided via a `?token=` URL parameter after OAuth redirects (and enforce that `role === 'admin'`).
  - Periodically polls `GET /content/admin/queue` for pending items and `GET /content/admin/stats` for aggregate metrics, using `API_BASE_URL` and the JWT.
  - For each queue item, allows admins to:
    - View either the uploaded image (via the `/uploads` path) or text content.
    - Enter an `expert_response` and set a `decision` (`Approved` or `Rejected`).
    - Submit via `POST /content/admin/review/:id`, which removes the item from the queue on success.
  - Renders live stats for total, pending, under review, approved, and rejected counts.

**Additional frontend/server utilities**
- `Frontend/server/moderationConfig.js` exports a plain object grouping lists of keywords under categories such as `violence`, `self_harm`, `hate_speech`, etc. This is suitable for custom heuristic checks on text but is separate from the ML-based moderation.

## Environment configuration (non-secret overview)

The following environment variables are used throughout the codebase (values are supplied via `.env` files or deployment configuration and must **not** be committed):

- Backend:
  - `PORT`: HTTP port for the Express server (default 5000 in code).
  - `FRONTEND_URL`: Allowed origin for CORS (e.g., `http://localhost:5173` during local dev).
  - `DATABASE_URL`: PostgreSQL connection string for `pg.Pool`.
  - `JWT_SECRET`: Secret key for signing/verifying JWTs.
  - `HF_API_KEY`: Hugging Face API token for the Inference endpoints used in `aiModeration`.
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `BACKEND_URL`: Present in the commented-out Google OAuth strategy; required if Google OAuth is re-enabled.
  - `NODE_ENV`, `IS_AZURE_STATIC_WEB_APPS_API`: Used to distinguish between local server mode and Azure Static Web Apps serverless mode.

- Frontend:
  - `VITE_API_BASE_URL`: Optional override for the backend base URL; when unset, components fall back to `http://localhost:5000` and/or rely on the Vite `/api` proxy.

## Notes for future Warp agents

- There is no root-level `package.json` at the time of writing, even though the root `README.md` mentions running `npm run dev` from the repo root. Prefer the per-folder commands in this file.
- Auth and moderation flows are tightly coupled to the PostgreSQL schema and external AI services; when making changes, trace from the frontend pages → backend routes → controllers → queries/AI calls to keep behavior consistent.
- When adjusting deployment or build steps, keep `.github/workflows/azure-static-web-apps-*.yml` and `.github/workflows/main_censorpro-backend.yml` in sync with any new scripts or paths.
