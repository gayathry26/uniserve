import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, storeSession, getSessionUser } from '../../../../LMS/src/services/api';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const user = getSessionUser();
    if (user && user.role === 'admin') {
      navigate('/admin/dashboard/questions');
    }
  }, [navigate]);

  const submit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);
    const startTime = Date.now();
    try {
      const data = await apiFetch('/api/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });

      // Ensure the premium loader runs for at least 5 seconds
      const elapsed = Date.now() - startTime;
      const remaining = 5000 - elapsed;
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }

      storeSession(data.token, data.user);
      navigate('/admin/dashboard/questions');
    } catch (err) {
      setError(err.message || 'Login failed. Please verify admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Premium Black and White Loader Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md transition-all duration-500">
          <div className="relative flex flex-col items-center">
            {/* Pulsing deep neutral glow */}
            <div className="absolute h-40 w-40 rounded-full bg-white/5 blur-2xl animate-pulse"></div>

            {/* Spinning decorative monochromatic rings */}
            <div className="absolute h-32 w-32 rounded-full border-2 border-dashed border-white/20 animate-[spin_10s_linear_infinite]"></div>
            <div className="absolute h-28 w-28 rounded-full border border-white/10 animate-[spin_6s_linear_infinite_reverse]"></div>

            {/* Logo card inside center badge */}
            <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-2xl transition-transform duration-300">
              <img src="/logo.png" alt="Palette Production Logo" className="h-14 w-14 object-contain animate-bounce" />
            </div>

            {/* Glowing active bar */}
            <div className="mt-8 flex flex-col items-center space-y-2 text-center">
              <h3 className="text-xl font-black tracking-widest text-white uppercase leading-none">
                Palette Production
              </h3>
              <p className="text-[10px] font-black text-neutral-400 tracking-widest uppercase">
                Academy LMS
              </p>
              <div className="flex gap-1.5 justify-center pt-2">
                <span className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 rounded-full bg-neutral-600 animate-bounce"></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Left Section - Showcase Branding (Hidden on Mobile) */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-neutral-100 dark:bg-neutral-900 border border-border text-foreground p-16 text-white lg:flex overflow-hidden border-r border-neutral-800">
        {/* Subtle Decorative Neutral Glow */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] rounded-full bg-white/5 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-neutral-800/10 blur-3xl pointer-events-none"></div>

        {/* Spacer at top */}
        <div></div>

        {/* Branding Container */}
        <div className="relative z-10 my-auto flex flex-col items-start gap-8">
          {/* Logo badge with glowing white border */}
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-white border border-neutral-800 shadow-2xl transition-transform duration-500 hover:scale-105">
            <img src="/logo.png" alt="Palette Production logo" className="relative z-10 h-12 w-12 object-contain" />
          </div>

          <div className="space-y-3">
            <h1 className="text-5xl font-black tracking-tight leading-none text-white uppercase font-outfit">
              Palette Production Academy
            </h1>
            <div className="pt-1">
              <span className="text-4xl font-bold tracking-wide text-neutral-300 font-playfair italic">
                LMS Portal
              </span>
            </div>
          </div>
        </div>

        {/* Branding Footer */}
        <div className="relative z-10 text-sm text-neutral-500 font-medium tracking-wide">
          &copy; 2026 Palette Production Academy. All rights reserved.
        </div>
      </div>

      {/* Right Section - Form Panel */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 md:p-12 bg-slate-50">
        <div className="w-full max-w-md space-y-8">

          {/* Header Mobile Logo */}
          <div className="flex flex-col items-center text-center lg:hidden">
            <img src="/logo.png" alt="Palette Production logo" className="h-16 w-16 object-contain mb-3" />
            <h1 className="text-2xl font-black text-slate-900">PALETTE PRODUCTION ACADEMY</h1>
            <p className="text-slate-500 text-xs mt-1">LMS ADMINISTRATION</p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/70 p-8 shadow-xl/10">
            {/* Header Desk Welcome */}
            <div className="mb-6">
              <h2 className="text-2xl font-black text-slate-900">Admin Sign In</h2>
              <p className="text-slate-400 text-sm mt-1">Access central administration dashboard</p>
            </div>

            {error && (
              <div className="mb-5 flex items-center gap-2 rounded-2xl bg-secondary border border-border p-4 text-sm text-foreground">
                <svg className="h-5 w-5 text-foreground shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-semibold leading-snug">{error}</p>
              </div>
            )}

            <form onSubmit={submit} className="space-y-5">
              {/* Username Input */}
              <div className="space-y-1.5 group">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block transition-colors group-focus-within:text-black">Username</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-black">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 pl-12 pr-4 py-3.5 text-sm font-bold text-slate-800 placeholder-slate-400 bg-slate-50/50 focus:bg-white focus:border-black focus:ring-4 focus:ring-black/5 outline-none transition-all duration-200"
                    placeholder="Enter Admin Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5 group">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block transition-colors group-focus-within:text-black">Password</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-black">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 pl-12 pr-4 py-3.5 text-sm font-bold text-slate-800 placeholder-slate-400 bg-slate-50/50 focus:bg-white focus:border-black focus:ring-4 focus:ring-black/5 outline-none transition-all duration-200"
                    type="password"
                    placeholder="Enter Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-black hover:bg-neutral-900 active:scale-[0.99] disabled:opacity-75 disabled:active:scale-100 disabled:cursor-not-allowed py-4 text-sm font-bold text-white shadow-xl shadow-black/10 hover:shadow-black/20 hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  Sign In
                </button>
              </div>
            </form>
          </div>

          {/* Helper details */}
          <div className="text-center">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Palette Production Academy LMS Central Panel
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
