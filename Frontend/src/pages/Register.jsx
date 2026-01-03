import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Register = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    const { name, email, password } = formData;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!name.trim()) { alert("Name is required."); return false; }
    if (!email || !emailRegex.test(email)) { alert("Please enter a valid email address (e.g., name@domain.com)."); return false; }
    if (!password || password.length < 6) { alert("Password must be at least 6 characters long."); return false; }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email,
        password: formData.password,
      };
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get('content-type') || '';
      let data = null;
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || `Registration failed with status ${res.status}`);
      }

      if (!res.ok || !data?.success) throw new Error(data?.error || 'Registration failed');
      setMessage('Registration successful');
      if (data.token) {
        try { localStorage.setItem('token', data.token); } catch { }
      }
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      {/* Register Form */}
      <div className="flex flex-1 justify-center items-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="bg-transparent w-full max-w-md text-center p-6">
          <h1 className="text-3xl font-bold text-blue-800 mb-2">Register</h1>
          <p className="text-sm text-blue-700 mb-6">
            Create an account to start moderating your content effectively.
          </p>

          {message && (
            <div className="text-green-700 bg-green-50 border border-green-200 rounded-md px-4 py-2 mb-2">{message}</div>
          )}
          {error && (
            <div className="text-red-700 bg-red-50 border border-red-200 rounded-md px-4 py-2 mb-2">{error}</div>
          )}
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              className="px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              {submitting ? 'Creating account...' : 'Register'}
            </button>
          </form>

          <p className="text-sm mt-4 text-blue-800">
            Already have an account?{' '}
            <Link to="/login" className="underline text-blue-900 hover:text-blue-700">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
