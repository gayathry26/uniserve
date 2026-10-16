import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { apiFetch, getSessionUser } from '../services/api';

const MaintenanceScreen = () => {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-white overflow-hidden font-sans">
      {/* Background Decorative Blurs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-slate-800/30 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-secondary text-foreground blur-3xl pointer-events-none"></div>

      {/* Main Glassmorphic Container */}
      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900/60 p-8 md:p-12 text-center backdrop-blur-xl shadow-2xl">
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-[#171717] text-[#fafafa] dark:bg-[#fafafa] dark:text-[#0a0a0a]/20 blur-xl"></div>
            <img src="/logo.png" alt="Palette Production Logo" className="relative h-24 w-24 object-contain animate-pulse" />
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-2 uppercase">
          Palette Production Academy
        </h1>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-800 text-white dark:bg-neutral-200 dark:text-black/10 border border-border text-foreground text-xs font-bold uppercase tracking-wider mb-6">
          <span className="w-2 h-2 rounded-full bg-neutral-800 text-white dark:bg-neutral-200 dark:text-black animate-ping"></span>
          Portal Offline
        </div>

        <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-8">
          The online examination portal is currently turned off for updates or configuration. Student login will be enabled shortly. Thank you for your patience.
        </p>
      </div>
      
      {/* Footer */}
      <div className="absolute bottom-6 text-center text-xs text-slate-600 tracking-wider">
        &copy; {new Date().getFullYear()} Palette Production Academy. All rights reserved.
      </div>
    </div>
  );
};

export const SiteStatusGuard = ({ children }) => {
  const location = useLocation();
  const [status, setStatus] = useState('on');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If it's an admin path or the bankdata path, don't block
    if (location.pathname.startsWith('/admin') || location.pathname === '/bankdata') {
      setLoading(false);
      return;
    }

    const checkStatus = async () => {
      try {
        const data = await apiFetch('/api/admin/config/site-status');
        if (data && data.success) {
          setStatus(data.status);
        }
      } catch (err) {
        console.error('Failed to check site status:', err);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen w-screen items-center justify-center bg-slate-950 text-white">
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        <div style={{
          width: '50px',
          height: '50px',
          border: '5px solid rgba(255,255,255,0.1)',
          borderRadius: '50%',
          borderTopColor: '#fafafa',
          animation: 'spin 1s ease-in-out infinite'
        }}></div>
      </div>
    );
  }

  const user = getSessionUser();
  const isAdmin = user && user.role === 'admin';
  const isAdminPath = location.pathname.startsWith('/admin');
  const isBankDataPath = location.pathname === '/bankdata';

  if (status === 'off' && !isAdmin && !isAdminPath && !isBankDataPath) {
    return <MaintenanceScreen />;
  }

  return children;
};
