import React, { createContext, useContext, useState, useEffect } from 'react';

// All pages/routes available in Uniserve
export const ALL_PAGES = [
  { path: '/', label: 'Placement Dashboard', category: 'Core & Overview' },
  { path: '/students', label: 'Students Roster', category: 'Student Management' },
  { path: '/profile', label: 'My Student Profile', category: 'Student Management' },
  { path: '/companies', label: 'Hiring Companies', category: 'Recruitment & Drives' },
  { path: '/jobs', label: 'Jobs & Openings', category: 'Recruitment & Drives' },
  { path: '/drives', label: 'Placement Drives', category: 'Recruitment & Drives' },
  { path: '/applications', label: 'Applications Pipeline', category: 'Applications & Evaluation' },
  { path: '/assessment', label: 'Programming Assessment', category: 'Applications & Evaluation' },
  { path: '/interviews', label: 'Interview Slots', category: 'Applications & Evaluation' },
  { path: '/videocall/interview', label: 'Mock Video Call Meet', category: 'Applications & Evaluation' },
  { path: '/training', label: 'Training & Attendance', category: 'Career Development' },
  { path: '/internships', label: 'Internships & PPO', category: 'Career Development' },
  { path: '/offers', label: 'Offers & Joining', category: 'Career Development' },
  { path: '/policies', label: 'Placement Policies', category: 'Governance & Institutional' },
  { path: '/reports', label: 'NIRF / NAAC Reports', category: 'Governance & Institutional' },
  { path: '/finance', label: 'Budget & Finance', category: 'Governance & Institutional' },
  { path: '/alumni', label: 'Alumni Network', category: 'Community & Support' },
  { path: '/grievances', label: 'Grievance Desk', category: 'Community & Support' },
  { path: '/ai-assistant', label: 'AI Career Assistant', category: 'Intelligence & Tools' },
  { path: '/admin', label: 'Admin & DB Registry', category: 'System Administration' },
  { path: '/settings', label: 'Settings & Themes', category: 'System Administration' },
];

export const USER_ROLES = [
  { id: 'SUPER_ADMIN', label: 'Super Admin', desc: 'Absolute root administrator with access to all pages' },
  { id: 'ADMIN', label: 'System Admin', desc: 'Institutional system & security administrator' },
  { id: 'TPO_OFFICER', label: 'Placement Officer (TPO)', desc: 'Placement cell director managing corporate drives' },
  { id: 'STUDENT', label: 'Student', desc: 'Enrolled university candidate participating in recruitment' },
  { id: 'FACULTY_COORDINATOR', label: 'Staff / Faculty', desc: 'Department academic placement coordinator' },
  { id: 'RECRUITER', label: 'Company Recruiter', desc: 'Corporate hiring manager or technical interviewer' },
  { id: 'MANAGEMENT', label: 'Management / Principal', desc: 'Dean, Principal, and executive board members' },
  { id: 'ALUMNI', label: 'Alumni Network', desc: 'Graduated alumni providing mentorship and referrals' },
];

const DEFAULT_ROLE_PERMISSIONS = {
  SUPER_ADMIN: ALL_PAGES.map((p) => p.path),
  ADMIN: [
    '/',
    '/students',
    '/companies',
    '/jobs',
    '/drives',
    '/applications',
    '/assessment',
    '/interviews',
    '/videocall/interview',
    '/training',
    '/internships',
    '/offers',
    '/policies',
    '/reports',
    '/finance',
    '/alumni',
    '/grievances',
    '/ai-assistant',
    '/admin',
    '/settings',
  ],
  TPO_OFFICER: [
    '/',
    '/students',
    '/companies',
    '/jobs',
    '/drives',
    '/applications',
    '/assessment',
    '/interviews',
    '/videocall/interview',
    '/training',
    '/internships',
    '/offers',
    '/policies',
    '/reports',
    '/finance',
    '/alumni',
    '/grievances',
    '/ai-assistant',
    '/admin',
    '/settings',
  ],
  STUDENT: [
    '/profile',
    '/companies',
    '/jobs',
    '/drives',
    '/applications',
    '/assessment',
    '/interviews',
    '/videocall/interview',
    '/training',
    '/internships',
    '/offers',
    '/policies',
    '/alumni',
    '/grievances',
    '/ai-assistant',
    '/settings',
  ],
  FACULTY_COORDINATOR: [
    '/',
    '/students',
    '/companies',
    '/jobs',
    '/drives',
    '/applications',
    '/assessment',
    '/interviews',
    '/videocall/interview',
    '/training',
    '/internships',
    '/offers',
    '/policies',
    '/reports',
    '/alumni',
    '/grievances',
    '/ai-assistant',
    '/settings',
  ],
  RECRUITER: [
    '/',
    '/jobs',
    '/drives',
    '/applications',
    '/assessment',
    '/interviews',
    '/offers',
    '/policies',
    '/settings',
  ],
  MANAGEMENT: [
    '/',
    '/students',
    '/companies',
    '/jobs',
    '/drives',
    '/offers',
    '/policies',
    '/reports',
    '/finance',
    '/grievances',
    '/admin',
    '/settings',
  ],
  ALUMNI: [
    '/alumni',
    '/jobs',
    '/policies',
    '/grievances',
    '/ai-assistant',
    '/settings',
  ],
};

const PermissionContext = createContext(null);

export function PermissionProvider({ children }) {
  const [rolePermissions, setRolePermissionsState] = useState(() => {
    try {
      const saved = localStorage.getItem('uniserve_role_permissions');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure SUPER_ADMIN always has all pages
        parsed.SUPER_ADMIN = ALL_PAGES.map((p) => p.path);
        return parsed;
      }
    } catch (e) {
      console.warn('Error loading role permissions from localStorage', e);
    }
    return DEFAULT_ROLE_PERMISSIONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('uniserve_role_permissions', JSON.stringify(rolePermissions));
    } catch (e) {
      console.warn('Error saving role permissions', e);
    }
  }, [rolePermissions]);

  // Check if a role has access to a specific path
  const canAccessPage = (roleName, pagePath) => {
    if (!roleName) return false;
    // Super admin ALWAYS has access to all pages
    if (roleName === 'SUPER_ADMIN') return true;

    const allowed = rolePermissions[roleName] || [];
    if (allowed.includes(pagePath)) return true;

    // Subpath matching for video call meet, room codes, and exam
    if (pagePath.startsWith('/videocall/interview') || pagePath.startsWith('/interview/room')) {
      return allowed.includes('/videocall/interview') || allowed.includes('/interviews');
    }
    if (pagePath.startsWith('/exam')) {
      return allowed.includes('/assessment');
    }

    return false;
  };

  // Toggle page permission for a given role
  const togglePermission = (roleId, pagePath) => {
    if (roleId === 'SUPER_ADMIN') {
      // Super admin is locked to all pages
      return;
    }

    setRolePermissionsState((prev) => {
      const currentList = prev[roleId] || [];
      const hasPage = currentList.includes(pagePath);
      const updatedList = hasPage
        ? currentList.filter((p) => p !== pagePath)
        : [...currentList, pagePath];

      return {
        ...prev,
        [roleId]: updatedList,
      };
    });
  };

  // Set all permissions for a role
  const setAllPermissionsForRole = (roleId, enableAll) => {
    if (roleId === 'SUPER_ADMIN') return;

    setRolePermissionsState((prev) => ({
      ...prev,
      [roleId]: enableAll ? ALL_PAGES.map((p) => p.path) : [],
    }));
  };

  // Reset to system defaults
  const resetToDefaults = () => {
    setRolePermissionsState(DEFAULT_ROLE_PERMISSIONS);
  };

  return (
    <PermissionContext.Provider
      value={{
        allPages: ALL_PAGES,
        userRoles: USER_ROLES,
        rolePermissions,
        canAccessPage,
        togglePermission,
        setAllPermissionsForRole,
        resetToDefaults,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
}
