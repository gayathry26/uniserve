import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../context/PermissionContext';
import {
  LayoutDashboard,
  Compass,
  GitCompare,
  Layers,
  Cpu,
  ChevronDown,
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
  const { canAccessPage } = usePermissions();
  const location = useLocation();
  const role = user?.roleName;
  const isSuperAdmin = role === 'SUPER_ADMIN';

  // Career Explorer sub-routes
  const isCareerExplorerActive =
    location.pathname.startsWith('/domains') ||
    location.pathname.startsWith('/compare') ||
    location.pathname.startsWith('/skill-analyzer') ||
    location.pathname.startsWith('/role-analyzer') ||
    location.pathname.startsWith('/career-explorer');

  const [careerExplorerOpen, setCareerExplorerOpen] = useState(true);

  const careerExplorerItems = [
    { to: '/domains', label: 'Explore Domains', icon: Layers },
    { to: '/compare', label: 'Compare Roles', icon: GitCompare },
    { to: '/skill-analyzer', label: 'Skill Analyzer', icon: Cpu },
  ];

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
  const filteredNav = navItems.filter((item) => {
    return canAccessPage(role, item.to);
  });

  const canAccessCareerExplorer =
    canAccessPage(role, '/domains') || canAccessPage(role, '/compare') || canAccessPage(role, '/skill-analyzer');

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground min-h-[calc(100vh-4rem)] flex flex-col justify-between border-r border-sidebar-border transition-colors">
      <div className="p-4 space-y-1">
        {isSuperAdmin && (
          <div className="mb-3 p-2.5 rounded-xl bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 flex items-center gap-2 text-foreground text-xs font-bold">
            <ShieldAlert className="w-4 h-4 text-foreground shrink-0" />
            <span className="truncate">SUPER ADMIN (Full Access)</span>
          </div>
        )}

        {/* Section Header */}
        <div className="px-3 py-2 text-[11px] font-semibold tracking-wider uppercase text-muted-foreground flex items-center justify-between">
          <span>CampusCorp Modules</span>
          <span className="text-[10px] font-bold text-muted-foreground">
            {filteredNav.length + (canAccessCareerExplorer ? 2 : 0)} visible
          </span>
        </div>

        {/* Dashboard link */}
        <nav className="space-y-0.5">
          {filteredNav.slice(0, 1).map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md text-xs transition-all ${
                    isActive
                      ? 'bg-[#171717] text-[#fafafa] dark:bg-[#fafafa] dark:text-[#0a0a0a] font-semibold shadow-xs'
                      : 'text-foreground hover:bg-neutral-200 dark:hover:bg-neutral-800 font-medium'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-[#fafafa] dark:text-[#0a0a0a]' : 'text-muted-foreground'
                      }`}
                    />
                    <span className="flex-1 truncate">{item.label}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#fafafa] dark:bg-[#0a0a0a]" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}

          {/* New Section: Career Explorer Accordion / Section */}
          {canAccessCareerExplorer && (
            <div className="pt-1.5 pb-1 space-y-0.5">
              <button
                type="button"
                onClick={() => setCareerExplorerOpen(!careerExplorerOpen)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  isCareerExplorerActive
                    ? 'bg-neutral-200 dark:bg-neutral-800 text-foreground'
                    : 'text-foreground hover:bg-neutral-200 dark:hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Compass
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isCareerExplorerActive ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  />
                  <span className="truncate">Career Explorer</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-secondary text-muted-foreground">
                    New
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${
                      careerExplorerOpen ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>

              {careerExplorerOpen && (
                <div className="pl-6 space-y-0.5 pt-0.5 border-l-2 border-border/80 ml-4 my-1">
                  {careerExplorerItems.map((sub) => {
                    const SubIcon = sub.icon;
                    return (
                      <NavLink
                        key={sub.to}
                        to={sub.to}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-all ${
                            isActive
                              ? 'bg-[#171717] text-[#fafafa] dark:bg-[#fafafa] dark:text-[#0a0a0a] font-semibold shadow-xs'
                              : 'text-muted-foreground hover:text-foreground hover:bg-neutral-200 dark:hover:bg-neutral-800 font-medium'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <SubIcon
                              className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                                isActive
                                  ? 'text-[#fafafa] dark:text-[#0a0a0a]'
                                  : 'text-muted-foreground'
                              }`}
                            />
                            <span className="flex-1 truncate">{sub.label}</span>
                            {isActive && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#fafafa] dark:bg-[#0a0a0a]" />
                            )}
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Remaining Core Nav Items */}
          {filteredNav.slice(1).map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md text-xs transition-all ${
                    isActive
                      ? 'bg-[#171717] text-[#fafafa] dark:bg-[#fafafa] dark:text-[#0a0a0a] font-semibold shadow-xs'
                      : 'text-foreground hover:bg-neutral-200 dark:hover:bg-neutral-800 font-medium'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-[#fafafa] dark:text-[#0a0a0a]' : 'text-muted-foreground'
                      }`}
                    />
                    <span className="flex-1 truncate">{item.label}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#fafafa] dark:bg-[#0a0a0a]" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Info Pill */}
      <div className="p-3.5 m-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-sidebar-border text-xs">
        <div className="flex items-center gap-2 text-sidebar-foreground font-semibold mb-1">
          <span className="w-2 h-2 rounded-full bg-foreground" />
          <span>CampusCorp Multi-DB Active</span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {isSuperAdmin
            ? 'Root access active. Managing institutional permissions & clusters.'
            : 'Role-based access active with dynamic page governance.'}
        </p>
      </div>
    </aside>
  );
}
