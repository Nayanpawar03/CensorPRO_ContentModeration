import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  const saveTokenAndRedirect = (token) => {
    try {
      localStorage.setItem('token', token);
    } catch {}
    // Basic role check if token is JWT with payload containing role
    try {
      const payload = JSON.parse(atob(token.split('.')[1] || ''));
      const isAdmin = payload?.role === 'admin' || payload?.isAdmin === true;
      navigate(isAdmin ? '/admin' : '/dashboard', { replace: true });
    } catch {
      navigate('/dashboard', { replace: true });
    }
  };


  const handleManualLogin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      const payload = {
        email: email,
        password: password,
      };
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
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
        throw new Error(text || `Login failed with status ${res.status}`);
      }

      if (!res.ok || !data?.success) throw new Error(data?.error || 'Login failed');
      setMessage('Login successful');
      if (data.token) saveTokenAndRedirect(data.token);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      {/* Login Form */}
      <div className="flex flex-1 justify-center items-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="bg-transparent w-full max-w-md text-center p-6">
          <h1 className="text-3xl font-bold text-slate-50 mb-2">Login</h1>
          <p className="text-sm text-slate-200 mb-6">
            Sign in to manage and moderate your content safely.
          </p>

          {message && (
            <div className="text-green-700 bg-green-50 border border-green-200 rounded-md px-4 py-2 mb-2">{message}</div>
          )}
          {error && (
            <div className="text-red-700 bg-red-50 border border-red-200 rounded-md px-4 py-2 mb-2">{error}</div>
          )}
          <form className="flex flex-col gap-4 text-left" onSubmit={handleManualLogin}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-4 py-3 border border-slate-600 bg-slate-900/70 text-slate-50 placeholder:text-slate-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-4 py-3 border border-slate-600 bg-slate-900/70 text-slate-50 placeholder:text-slate-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              {submitting ? 'Signing in...' : 'Login'}
            </button>
          </form>

          <p className="text-sm mt-4 text-slate-200">
            Don’t have an account?{' '}
            <Link to="/register" className="underline cursor-pointer text-slate-50 hover:text-blue-300">
              Register
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
};

export default Login;
