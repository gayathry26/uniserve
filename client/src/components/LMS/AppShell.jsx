import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

const AppShell = ({ title, user, items, onLogout, children, headerExtra }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white print:min-h-0 flex flex-col">
      <div className="flex flex-1 print:block h-full relative">
        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed lg:sticky top-0 h-screen z-50
          w-72 border-r border-slate-200 bg-white p-4 print:hidden
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          overflow-y-auto
        `}>
          <div className="mb-6 rounded-xl bg-brand-600 p-4 text-white flex justify-between items-center">
            <div>
              <div className="mb-3 flex justify-center rounded-lg bg-white p-2 w-max">
                <img src="/logo.png" alt="Palette Production Logo" className="h-10 object-contain" />
              </div>
              <h1 className="text-lg font-bold">Palette Production LMS</h1>
              <p className="text-sm text-white/80">Assessment portal</p>
            </div>
            {/* Close button for mobile */}
            <button 
              className="lg:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="space-y-2 pb-6">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-brand-100 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 print:w-full print:block">
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6 print:hidden sticky top-0 z-30">
            <div className="flex items-center gap-3">
              {/* Hamburger Menu (Mobile) */}
              <button 
                className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                onClick={() => setSidebarOpen(true)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h2 className="text-lg font-semibold truncate max-w-[150px] md:max-w-none">{title}</h2>
            </div>
            
            {/* Inject extra header content (e.g. College Selection) */}
            {headerExtra && (
              <div className="flex-1 px-4 flex justify-center hidden sm:flex">
                {headerExtra}
              </div>
            )}

            <div className="flex items-center gap-3 md:gap-4">
              <div className="text-right text-sm hidden sm:block">
                <p className="font-semibold truncate max-w-[150px]">{user?.name || user?.username}</p>
                <p className="text-slate-500 text-xs truncate max-w-[150px]">{user?.department || user?.roll_number || user?.role}</p>
              </div>
              <button
                onClick={onLogout}
                className="rounded-lg border border-slate-300 px-3 py-1.5 md:px-3 md:py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap"
              >
                Logout
              </button>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 print:p-0 print:bg-white overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppShell;

