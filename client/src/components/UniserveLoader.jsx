import React from 'react';

export function UniserveLoader({
  title = 'CAMPUSSCORP',
  subtitle = 'IT Career Hub & Placement Gateway',
  status = 'Initializing workspace...',
  fullScreen = true,
}) {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 max-w-sm w-full text-center relative z-10">
      {/* Emblem Container */}
      <div className="relative mb-8 flex items-center justify-center">
        {/* Outer Rotating Monochrome Border */}
        <div
          className="w-28 h-28 rounded-3xl p-1 animate-spin"
          style={{
            animationDuration: '6s',
            background: 'conic-gradient(from 0deg, transparent, #fafafa, transparent 70%, #737373)',
          }}
        >
          <div className="w-full h-full rounded-3xl bg-neutral-950" />
        </div>

        {/* Center Logo Frame */}
        <div className="absolute w-20 h-20 rounded-2xl bg-black p-1.5 shadow-2xl flex items-center justify-center border border-neutral-800 overflow-hidden">
          <img
            src="/logo-dark.jpeg"
            alt="CampusCorp Official Logo"
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {/* Brand Wordmark & Title */}
      <div className="space-y-1.5 mb-6">
        <h1 className="text-2xl font-black tracking-wider text-white flex items-center justify-center gap-1">
          <span>{title}</span>
          <span className="w-1.5 h-1.5 rounded-full inline-block ml-1 bg-white" />
        </h1>
        <p className="text-xs font-medium text-neutral-400 tracking-wide">
          {subtitle}
        </p>
      </div>

      {/* Sleek Animated Progress Bar */}
      <div className="w-full bg-neutral-800 rounded-full h-1.5 mb-3 overflow-hidden border border-neutral-700">
        <div
          className="h-full rounded-full bg-neutral-200"
          style={{
            width: '100%',
            animation: 'shimmerProgress 1.6s ease-in-out infinite',
          }}
        />
      </div>

      {/* Dynamic Status Text */}
      <div className="flex items-center gap-2 text-[11px] font-semibold text-neutral-400">
        <span className="w-1.5 h-1.5 rounded-full animate-ping bg-neutral-400" />
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
      <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col items-center justify-center overflow-hidden">
        {content}
      </div>
    );
  }

  return content;
}

export const CampusCorpLoader = UniserveLoader;
