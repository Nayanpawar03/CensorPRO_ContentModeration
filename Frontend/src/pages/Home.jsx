import React from 'react';
import { FaShieldAlt, FaImage, FaCheckCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { TypeAnimation } from 'react-type-animation';

const Home = () => {
  const navigate = useNavigate();

  const handleTryItNow = () => {
    let token = null;
    try {
      token = localStorage.getItem('token');
    } catch {}

    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1] || ''));
      const isAdmin = payload?.role === 'admin' || payload?.isAdmin === true;
      navigate(isAdmin ? '/admin' : '/dashboard');
    } catch {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50">
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center items-center text-center px-6 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <section className="w-full max-w-5xl pt-10" id="hero">
          <p className="uppercase tracking-[0.25em] text-xs text-blue-400 mb-4">
            Trust &amp; Safety · Content Moderation Platform
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            Keep your community {" "}
            <TypeAnimation
            sequence = {[
            'safe',
             1000,
            'sure',
             1000,
            'firm',
             1000,
            ]}
            wrapper="span"
            speed={50}
            className="text-blue-400"
            repeat={Infinity}
            />
          {" "}without slowing it down.
          </h1>
          <p className="max-w-2xl mx-auto text-base md:text-lg text-slate-200 mb-8">
            CensorPro combines real-time AI with expert review workflows so you can detect toxic,
            unsafe, and non-compliant content across images and text before it reaches your users.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-10">
            <button
              onClick={handleTryItNow}
              className="bg-blue-500 hover:bg-blue-400 text-slate-950 font-semibold px-8 py-3 rounded-lg text-lg cursor-pointer shadow-lg shadow-blue-500/30"
            >
              Launch moderation console
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('how-it-works');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="border border-slate-600 text-slate-100 px-6 py-3 rounded-lg text-sm font-medium hover:border-blue-400 hover:text-blue-300 cursor-pointer"
            >
              See how it works
            </button>
          </div>
        </section>

        {/* Feature Highlights */}
        <section
          id="features"
          className="grid md:grid-cols-3 gap-6 mt-4 w-full max-w-5xl text-left"
        >
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-xl shadow-sm">
            <FaImage className="text-3xl text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Multi-format ingestion</h3>
            <p className="text-sm text-slate-200">
              Upload images or paste raw text. CensorPro automatically routes content through the
              right moderation pipeline.
            </p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-xl shadow-sm">
            <FaShieldAlt className="text-3xl text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">AI + policy controls</h3>
            <p className="text-sm text-slate-200">
              AI flagging for nudity, violence, hate, and more, aligned with your trust &amp; safety
              thresholds and compliance rules.
            </p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-xl shadow-sm">
            <FaCheckCircle className="text-3xl text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Human-in-the-loop review</h3>
            <p className="text-sm text-slate-200">
              Route edge cases to expert moderators with a clear queue, audit trail, and structured
              response options.
            </p>
          </div>
        </section>

        {/* How it works strip */}
        <section
          id="how-it-works"
          className="w-full max-w-5xl mt-16 bg-slate-900/70 border border-slate-800 rounded-2xl p-6 md:p-8 text-left"
        >
          <h2 className="text-2xl font-semibold mb-4">How CensorPro moderates content</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-slate-200">
            <li>Creators upload an image or paste text directly into the moderation console.</li>
            <li>
              Our AI models instantly score content for toxicity, nudity, violence, hate and other
              sensitive categories.
            </li>
            <li>
              Clear, color-coded labels explain why something was flagged so your team can act with
              confidence.
            </li>
            <li>
              If needed, items are escalated to expert reviewers who provide a final decision and
              guidance.
            </li>
          </ol>
        </section>
      </main>

      {/* Footer */}
      <footer
        id="contact"
        className="bg-slate-950 border-t border-slate-800 py-6 mt-10 text-center text-xs md:text-sm text-slate-400"
      >
        <p>&copy; {new Date().getFullYear()} CensorPro-SEWDL. All rights reserved.</p>
        <div className="mt-2 space-x-4">
          <button className="hover:text-blue-300" type="button">
            Privacy
          </button>
          <button className="hover:text-blue-300" type="button">
            Terms
          </button>
          <button className="hover:text-blue-300" type="button">
            Support
          </button>
        </div>
      </footer>
    </div>
  );
};

export default Home;
