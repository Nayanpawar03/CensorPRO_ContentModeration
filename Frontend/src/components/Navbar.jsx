import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import censorProLogo from '../assets/CensorProLogo.png';

const Navbar = () => {
  const navigate = useNavigate();
  const API_BASE_URL = useMemo(
    () => import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
    []
  );

  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    try {
      setIsAuthed(!!localStorage.getItem('token'));
    } catch {
      setIsAuthed(false);
    }

    const handleStorage = (event) => {
      if (event.key === 'token') {
        setIsAuthed(!!event.newValue);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleSignOut = async () => {
    try {
      localStorage.removeItem('token');
    } catch {}
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST' });
    } catch {}
    setIsAuthed(false);
    navigate('/', { replace: true });
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur shadow-md py-4 px-6 flex justify-between items-center rounded-b-xl border-b border-slate-200">
      <div className="flex items-center gap-2">
        <img src={censorProLogo} alt="CensorPro Logo" className="w-10 h-10" />
        <span className="font-bold text-xl text-blue-600">CensorPro</span>
      </div>
      <nav className="hidden md:flex gap-6 text-blue-700 font-medium">
        <Link to="/" className="hover:underline cursor-pointer">
          Home
        </Link>
        <a href="#features" className="hover:underline">
          Features
        </a>
        <a href="#how-it-works" className="hover:underline">
          How it works
        </a>
        <a href="#contact" className="hover:underline">
          Contact
        </a>
      </nav>
      <div className="flex items-center gap-3">
        {isAuthed && (
          <button
            onClick={() => navigate('/dashboard')}
            className="hidden sm:inline-flex px-4 py-2 rounded-md text-sm font-medium text-blue-700 hover:bg-blue-50 cursor-pointer"
          >
            Go to dashboard
          </button>
        )}
        {isAuthed ? (
          <button
            onClick={handleSignOut}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 cursor-pointer text-sm font-medium"
          >
            Sign Out
          </button>
        ) : (
          <Link
            to="/login"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 cursor-pointer text-sm font-medium"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
};

export default Navbar;
