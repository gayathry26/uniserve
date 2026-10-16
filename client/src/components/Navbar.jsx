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
  Sun,
  Moon,
} from 'lucide-react';

export function Navbar() {
  const { user, switchRole, logout } = useAuth();
  const { isDark, toggleDarkMode } = useTheme();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const portals = [
    { role: 'SUPER_ADMIN', label: 'Master Super Administrator (All Pages)', icon: ShieldCheck },
    { role: 'TPO_OFFICER', label: 'Placement Officer / TPO Portal', icon: Award },
    { role: 'STUDENT', label: 'Student Portal (Aditya - CSE)', icon: GraduationCap },
    { role: 'FACULTY_COORDINATOR', label: 'Dept Coordinator (Prof. Suresh - CSE)', icon: BookOpen },
    { role: 'RECRUITER', label: 'Company Recruiter (Google)', icon: Building2 },
    { role: 'MANAGEMENT', label: 'Management / Principal Portal', icon: ShieldCheck },
    { role: 'ALUMNI', label: 'Alumni Portal (Alex - AWS)', icon: User },
  ];

  const handleRoleSelect = async (r) => {
    setRoleDropdownOpen(false);
    await switchRole(r);
  };

  const getPortalLabel = () => {
    if (!user) return 'CampusCorp Portal';
    const found = portals.find(p => p.role === user.roleName);
    return found ? found.label : `${user.roleName} Portal`;
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-card border-border text-card-foreground transition-colors">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: CampusCorp Brand & Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-card p-1 border border-border shadow-xs flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
            {/* Light Theme Logo */}
            <img
              src="/logo-light.jpeg"
              alt="CampusCorp Logo"
              className="w-full h-full object-contain dark:hidden"
            />
            {/* Dark Theme Logo */}
            <img
              src="/logo-dark.jpeg"
              alt="CampusCorp Logo"
              className="w-full h-full object-contain hidden dark:block"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-foreground tracking-wider text-lg flex items-center">
                CampusCorp
                <span className="w-1.5 h-1.5 rounded-full inline-block ml-1 bg-foreground" />
              </span>
              <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                IT Career Hub
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground hidden md:block">
              Placement & Career Governance Platform
            </p>
          </div>
        </Link>

        {/* Center: Instant Portal Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg border border-border bg-secondary hover:bg-neutral-200 dark:hover:bg-neutral-800 text-foreground text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <span className="inline-block w-2 h-2 rounded-full bg-foreground" />
            <span className="hidden md:inline text-muted-foreground font-medium">Active Portal:</span>
            <span className="text-foreground font-bold">{getPortalLabel()}</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-1" />
          </button>

          {roleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-popover text-popover-foreground rounded-xl shadow-xl border border-border py-1.5 z-50">
              <div className="px-3 py-1.5 border-b border-border">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Switch Connected Portal</p>
                <p className="text-xs text-muted-foreground">Live data with department role isolation</p>
              </div>
              <div className="py-1 max-h-72 overflow-y-auto">
                {portals.map((p) => {
                  const Icon = p.icon;
                  const isActive = user?.roleName === p.role;
                  return (
                    <button
                      key={p.role}
                      onClick={() => handleRoleSelect(p.role)}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-xs font-medium transition-colors cursor-pointer ${
                        isActive ? 'bg-neutral-200 dark:bg-neutral-800 font-semibold text-foreground' : 'text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-foreground" />
                      <span className="flex-1 truncate">{p.label}</span>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-foreground" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Theme Toggle, Appearance, Notifications, Profile & Logout */}
        <div className="flex items-center gap-2.5">
          {/* Light / Dark Mode Toggle Button */}
          <button
            onClick={toggleDarkMode}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle theme mode"
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg relative transition-colors flex items-center justify-center cursor-pointer"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-foreground" />
            ) : (
              <Moon className="w-4 h-4 text-foreground" />
            )}
          </button>

          {/* Quick Settings & Theme Shortcut */}
          <Link
            to="/settings"
            title="Appearance & Themes"
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg relative transition-colors flex items-center justify-center"
          >
            <Palette className="w-4 h-4" />
          </Link>

          {/* Notifications button */}
          <div className="relative">
            <button
              onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg relative transition-colors cursor-pointer"
            >
              <Bell className="w-5 h-5 text-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 ring-card bg-foreground" />
            </button>

            {notifDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-popover text-popover-foreground rounded-xl shadow-xl border border-border p-3 z-50">
                <div className="flex items-center justify-between pb-2 border-b border-border mb-2">
                  <span className="text-xs font-semibold text-foreground">CampusCorp Career Alerts</span>
                  <span className="text-[10px] font-bold text-muted-foreground">
                    3 New
                  </span>
                </div>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="p-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-foreground">
                    <p className="font-bold text-xs text-foreground">
                      Google Campus Recruitment Live
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">SDE applications deadline is Nov 30.</p>
                  </div>
                  <div className="p-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-foreground">
                    <p className="font-semibold text-xs text-foreground">Coding Assessment Saturday 10AM</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">National CodeSprint mock challenge.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile pill */}
          <div className="flex items-center gap-2 pl-2 border-l border-border">
            <div className="w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900">
              {user ? user.firstName?.[0] || 'U' : 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-foreground leading-tight">
                {user ? `${user.firstName} ${user.lastName}` : 'Guest User'}
              </p>
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5">
                {user?.departmentCode ? `${user.departmentCode} • ` : ''}{user?.roleName}
              </p>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors ml-1 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </header>
  );
}
