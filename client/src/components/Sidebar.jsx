import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usePermissions } from '../context/PermissionContext';
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  CalendarDays,
  FileCheck2,
  Code2,
  CalendarCheck,
  Video,
  GraduationCap,
  Sparkles,
  Award,
  BookOpen,
  PieChart,
  DollarSign,
  HeartHandshake,
  AlertCircle,
  Database,
  Settings,
  FileText,
  ShieldAlert,
} from 'lucide-react';

export function Sidebar() {
  const { user } = useAuth();
  const { currentTheme } = useTheme();
  const { canAccessPage } = usePermissions();
  const role = user?.roleName;
  const isSuperAdmin = role === 'SUPER_ADMIN';

  const navItems = [
    { to: '/', label: 'Placement Dashboard', icon: LayoutDashboard },
    { to: '/students', label: 'Students Roster', icon: Users },
    { to: '/profile', label: 'My Student Profile', icon: Users },
    { to: '/companies', label: 'Placement Companies', icon: Building2 },
    { to: '/jobs', label: 'Jobs & Openings', icon: Briefcase },
    { to: '/drives', label: 'Placement Drives', icon: CalendarDays },
    { to: '/applications', label: role === 'STUDENT' ? 'My Applications' : 'Applications Pipeline', icon: FileCheck2 },
    { to: '/assessment', label: 'Programming Assessment', icon: Code2 },
    { to: '/interviews', label: 'Interview Slots', icon: CalendarCheck },
    { to: '/videocall/interview', label: 'Mock Video Interview', icon: Video },
    { to: '/training', label: 'Training & Attendance', icon: BookOpen },
    { to: '/internships', label: 'Internships & PPO', icon: GraduationCap },
    { to: '/offers', label: 'Offers & Joining', icon: Award },
    { to: '/policies', label: 'Placement Policies', icon: FileText },
    { to: '/reports', label: 'NIRF / NAAC Reports', icon: PieChart },
    { to: '/finance', label: 'Budget & Finance', icon: DollarSign },
    { to: '/alumni', label: 'Alumni Network', icon: HeartHandshake },
    { to: '/grievances', label: 'Grievance Desk', icon: AlertCircle },
    { to: '/ai-assistant', label: 'AI Career Assistant', icon: Sparkles },
    { to: '/admin', label: 'Admin & DB Registry', icon: Database },
    { to: '/settings', label: 'Settings & Themes', icon: Settings },
  ];

  // Dynamic permission filter: only show pages that are ticked in settings!
  // Super admin has access to all pages!
  const filteredNav = navItems.filter((item) => {
    return canAccessPage(role, item.to);
  });

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-[calc(100vh-4rem)] flex flex-col justify-between border-r border-slate-800">
      <div className="p-4 space-y-1">
        {isSuperAdmin && (
          <div className="mb-3 p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-500/30 flex items-center gap-2 text-amber-300 text-xs font-bold">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">SUPER ADMIN (Full Access)</span>
          </div>
        )}

        <div className="px-3 py-2 text-[11px] font-semibold tracking-wider uppercase text-slate-400 flex items-center justify-between">
          <span>Uniserve Modules</span>
          <span className="text-[10px] font-bold text-slate-400">
            {filteredNav.length} visible
          </span>
        </div>

        <nav className="space-y-0.5">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                style={({ isActive }) =>
                  isActive
                    ? {
                        backgroundColor: currentTheme.primary,
                        boxShadow: `0 3px 12px ${currentTheme.glow}`,
                      }
                    : undefined
                }
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'text-white font-semibold shadow-xs'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Info Pill */}
      <div className="p-4 m-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
        <div className="flex items-center gap-2 text-slate-300 font-semibold mb-1">
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: currentTheme.accent }}
          />
          <span>Uniserve Multi-DB Active</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          {isSuperAdmin
            ? 'Root access active. Managing institutional permissions & clusters.'
            : 'Role-based access active with dynamic page governance.'}
        </p>
      </div>
    </aside>
  );
}
