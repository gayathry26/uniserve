import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  GraduationCap, 
  Bell, 
  ChevronDown, 
  LogOut, 
  ShieldCheck, 
  User, 
  Building2, 
  BookOpen, 
  Award,
  Palette,
} from 'lucide-react';

export function Navbar() {
  const { user, switchRole, logout } = useAuth();
  const { currentTheme } = useTheme();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const portals = [
    { role: 'SUPER_ADMIN', label: 'Master Super Administrator (All Pages)', icon: ShieldCheck, color: 'text-amber-500' },
    { role: 'TPO_OFFICER', label: 'Placement Officer / TPO Portal', icon: Award, color: 'text-amber-600' },
    { role: 'STUDENT', label: 'Student Portal (Aditya - CSE)', icon: GraduationCap, color: 'text-blue-600' },
    { role: 'FACULTY_COORDINATOR', label: 'Dept Coordinator (Prof. Suresh - CSE)', icon: BookOpen, color: 'text-emerald-600' },
    { role: 'RECRUITER', label: 'Company Recruiter (Google)', icon: Building2, color: 'text-purple-600' },
    { role: 'MANAGEMENT', label: 'Management / Principal Portal', icon: ShieldCheck, color: 'text-rose-600' },
    { role: 'ALUMNI', label: 'Alumni Portal (Alex - AWS)', icon: User, color: 'text-cyan-600' },
  ];

  const handleRoleSelect = async (r) => {
    setRoleDropdownOpen(false);
    await switchRole(r);
  };

  const getPortalLabel = () => {
    if (!user) return 'Uniserve Portal';
    const found = portals.find(p => p.role === user.roleName);
    return found ? found.label : `${user.roleName} Portal`;
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Uniserve Brand & Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-white p-1 border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
            <img
              src="/logo.jpeg"
              alt="Uniserve Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 tracking-wider text-lg flex items-center">
                UNISERVE
                <span
                  className="w-1.5 h-1.5 rounded-full inline-block ml-1"
                  style={{ backgroundColor: currentTheme.primary }}
                />
              </span>
              <span
                className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border"
                style={{
                  backgroundColor: currentTheme.primaryLight,
                  color: currentTheme.primaryText,
                  borderColor: currentTheme.primaryBorder,
                }}
              >
                Placement Cell
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden md:block">
              University Career & Placement Governance System
            </p>
          </div>
        </Link>

        {/* Center: Instant Portal Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100/80 text-slate-800 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <span
              className="inline-block w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: currentTheme.primary }}
            />
            <span className="hidden md:inline text-slate-500 font-medium">Active Portal:</span>
            <span className="text-slate-900 font-bold">{getPortalLabel()}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 ml-1" />
          </button>

          {roleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50">
              <div className="px-3 py-1.5 border-b border-slate-100">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Switch Connected Portal</p>
                <p className="text-xs text-slate-500">Live data with department role isolation</p>
              </div>
              <div className="py-1 max-h-72 overflow-y-auto">
                {portals.map((p) => {
                  const Icon = p.icon;
                  const isActive = user?.roleName === p.role;
                  return (
                    <button
                      key={p.role}
                      onClick={() => handleRoleSelect(p.role)}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-xs font-medium transition-colors ${
                        isActive ? 'bg-slate-50 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                      style={isActive ? { color: currentTheme.primary } : undefined}
                    >
                      <Icon className={`w-4 h-4 ${p.color}`} />
                      <span className="flex-1 truncate">{p.label}</span>
                      {isActive && (
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: currentTheme.primary }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Theme Quick Action, Notifications, Profile & Logout */}
        <div className="flex items-center gap-3">
          {/* Quick Settings & Theme Shortcut */}
          <Link
            to="/settings"
            title="Appearance & Themes"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg relative transition-colors flex items-center justify-center"
          >
            <Palette className="w-4 h-4" />
          </Link>

          {/* Notifications button */}
          <div className="relative">
            <button
              onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg relative transition-colors cursor-pointer"
            >
              <Bell className="w-5 h-5" />
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 ring-white"
                style={{ backgroundColor: currentTheme.primary }}
              />
            </button>

            {notifDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                  <span className="text-xs font-semibold text-slate-800">Uniserve Placement Alerts</span>
                  <span
                    className="text-[10px] font-bold"
                    style={{ color: currentTheme.primary }}
                  >
                    3 New
                  </span>
                </div>
                <div className="space-y-2 text-xs text-slate-600">
                  <div
                    className="p-2.5 rounded-lg border"
                    style={{
                      backgroundColor: currentTheme.primaryLight,
                      borderColor: currentTheme.primaryBorder,
                    }}
                  >
                    <p
                      className="font-bold text-xs"
                      style={{ color: currentTheme.primaryText }}
                    >
                      Google Campus Recruitment Live
                    </p>
                    <p className="text-[11px] text-slate-600 mt-0.5">SDE applications deadline is Nov 30.</p>
                  </div>
                  <div className="p-2.5 bg-amber-50/70 rounded-lg border border-amber-200">
                    <p className="font-semibold text-amber-900">Coding Assessment Saturday 10AM</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">National CodeSprint mock challenge.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile pill */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div
              className="w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs"
              style={{
                backgroundColor: currentTheme.primaryLight,
                color: currentTheme.primaryText,
              }}
            >
              {user ? user.firstName?.[0] || 'U' : 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-800 leading-tight">
                {user ? `${user.firstName} ${user.lastName}` : 'Guest User'}
              </p>
              <p className="text-[10px] text-slate-500 leading-none mt-0.5">
                {user?.departmentCode ? `${user.departmentCode} • ` : ''}{user?.roleName}
              </p>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </header>
  );
}
