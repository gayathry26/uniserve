import React from 'react';

const Modal = ({ open, title, onClose, children, size = '2xl' }) => {
  if (!open) return null;

  const sizeClasses = {
    'sm': 'max-w-sm',
    'md': 'max-w-md',
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl'
  };
  const widthClass = sizeClasses[size] || 'max-w-2xl';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onClick={onClose}>
      <div className={`w-full ${widthClass} rounded-xl bg-white shadow-xl flex flex-col max-h-[90vh]`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 flex-shrink-0">
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="rounded px-2.5 py-1 text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all">Close</button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
