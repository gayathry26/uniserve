import React from 'react';
import { useTheme } from '../context/ThemeContext';

export function UniserveLoader({
  title = 'UNISERVE',
  subtitle = 'Institutional Placement & Career Gateway',
  status = 'Initializing secure workspace...',
  fullScreen = true,
}) {
  const { currentTheme } = useTheme();

  const content = (
    <div className="flex flex-col items-center justify-center p-8 max-w-sm w-full text-center relative z-10">
      {/* Outer Pulse Rings & Glowing Emblem Container */}
      <div className="relative mb-8 flex items-center justify-center">
        {/* Animated Ambient Aura */}
        <div
          className="absolute w-36 h-36 rounded-full blur-2xl opacity-60 animate-pulse pointer-events-none"
          style={{ background: currentTheme?.glow || 'rgba(37,99,235,0.4)' }}
        />

        {/* Outer Rotating Conic Border */}
        <div
          className="w-32 h-32 rounded-3xl p-1 animate-spin"
          style={{
            animationDuration: '6s',
            background: `conic-gradient(from 0deg, transparent, ${currentTheme?.primary || '#2563eb'}, transparent 70%, ${currentTheme?.accent || '#38bdf8'})`,
          }}
        >
          <div className="w-full h-full rounded-3xl bg-slate-950/90" />
        </div>

        {/* Center Logo Frame */}
        <div className="absolute w-24 h-24 rounded-2xl bg-white p-2.5 shadow-2xl flex items-center justify-center border border-slate-100 overflow-hidden transform transition-transform hover:scale-105 duration-300">
          <img
            src="/logo.jpeg"
            alt="Uniserve Official Logo"
            className="w-full h-full object-contain filter drop-shadow-sm"
          />
        </div>

        {/* Subtle Ping Dot */}
        <span
          className="absolute -top-1 -right-1 flex h-4 w-4"
        >
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ backgroundColor: currentTheme?.accent || '#38bdf8' }}
          />
          <span
            className="relative inline-flex rounded-full h-4 w-4"
            style={{ backgroundColor: currentTheme?.primary || '#2563eb' }}
          />
        </span>
      </div>

      {/* Brand Wordmark & Title */}
      <div className="space-y-1.5 mb-6">
        <h1 className="text-3xl font-extrabold tracking-wider text-white flex items-center justify-center gap-1">
          <span>{title}</span>
          <span
            className="w-2 h-2 rounded-full inline-block ml-1"
            style={{ backgroundColor: currentTheme?.accent || '#38bdf8' }}
          />
        </h1>
        <p className="text-xs font-medium text-slate-400 tracking-wide">
          {subtitle}
        </p>
      </div>

      {/* Sleek Animated Progress Bar */}
      <div className="w-full bg-slate-800/80 rounded-full h-1.5 mb-3 overflow-hidden border border-slate-700/50">
        <div
          className="h-full rounded-full animate-pulse"
          style={{
            width: '100%',
            background: `linear-gradient(90deg, ${currentTheme?.gradientFrom || '#1e40af'}, ${currentTheme?.primary || '#2563eb'}, ${currentTheme?.accent || '#38bdf8'})`,
            backgroundSize: '200% 100%',
            animation: 'shimmerProgress 1.6s ease-in-out infinite',
          }}
        />
      </div>

      {/* Dynamic Status Text */}
      <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
        <span
          className="w-1.5 h-1.5 rounded-full animate-ping"
          style={{ backgroundColor: currentTheme?.primary || '#2563eb' }}
        />
        <span>{status}</span>
      </div>

      <style>{`
        @keyframes shimmerProgress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
        {/* Subtle Background Radial Pattern */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, ${currentTheme?.primary || '#2563eb'} 0%, transparent 60%)`,
          }}
        />
        {content}
      </div>
    );
  }

  return content;
}
