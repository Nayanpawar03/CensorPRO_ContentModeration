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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    setIsMenuOpen(false);
  };

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur shadow-md py-4 px-6 flex items-center justify-between rounded-b-xl border-b border-slate-200 relative">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <img src={censorProLogo} alt="CensorPro Logo" className="w-10 h-10" />
        <span className="font-bold text-xl text-blue-600">CensorPro</span>
      </div>

      {/* Desktop nav */}
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

      {/* Right section: actions + hamburger */}
      <div className="flex items-center gap-3">
        {isAuthed && (
          <button
            onClick={() => {
              navigate('/dashboard');
              closeMenu();
            }}
            className="hidden sm:inline-flex px-4 py-2 rounded-md text-sm font-medium text-blue-700 hover:bg-blue-50 cursor-pointer"
          >
            Go to dashboard
          </button>
        )}

        {/* Desktop auth button */}
        <div className="hidden md:block">
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

        {/* Mobile hamburger button */}
        <button
          type="button"
          className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-blue-700 hover:bg-blue-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
          onClick={toggleMenu}
          aria-label="Toggle navigation menu"
        >
          <span className="sr-only">Toggle navigation menu</span>
          <span
            className={`block h-0.5 w-5 bg-blue-700 transition-transform duration-200 ease-out ${
              isMenuOpen ? 'translate-y-1.5 rotate-45' : ''
            }`}
          />
          <span
            className={`block h-0.5 w-5 bg-blue-700 transition-opacity duration-200 ease-out ${
              isMenuOpen ? 'opacity-0' : 'opacity-100'
            }`}
          />
          <span
            className={`block h-0.5 w-5 bg-blue-700 transition-transform duration-200 ease-out ${
              isMenuOpen ? '-translate-y-1.5 -rotate-45' : ''
            }`}
          />
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-t border-slate-200 shadow-md md:hidden">
          <nav className="flex flex-col px-6 py-4 gap-3 text-blue-700 font-medium">
            <Link to="/" onClick={closeMenu} className="hover:underline">
              Home
            </Link>
            <a href="#features" onClick={closeMenu} className="hover:underline">
              Features
            </a>
            <a href="#how-it-works" onClick={closeMenu} className="hover:underline">
              How it works
            </a>
            <a href="#contact" onClick={closeMenu} className="hover:underline">
              Contact
            </a>

            <div className="pt-3 border-t border-slate-200 mt-2">
              {isAuthed ? (
                <button
                  onClick={handleSignOut}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 cursor-pointer text-sm font-medium"
                >
                  Sign Out
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="block text-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 cursor-pointer text-sm font-medium"
                >
                  Sign In
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
