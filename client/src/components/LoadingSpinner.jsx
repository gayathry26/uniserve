import React from 'react';

export function LoadingSpinner({ text = 'Loading data...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-8 h-8 border-3 border-border border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xs font-semibold text-slate-500">{text}</p>
    </div>
  );
}

export default LoadingSpinner;
