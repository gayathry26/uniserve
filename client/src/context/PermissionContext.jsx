import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';

// All pages/routes available in Uniserve
export const ALL_PAGES = [
  { path: '/', label: 'Placement Dashboard', category: 'Core & Overview' },
  { path: '/students', label: 'Students Roster', category: 'Student Management' },
  { path: '/profile', label: 'My Student Profile', category: 'Student Management' },
  { path: '/companies', label: 'Placement Companies', category: 'Recruitment & Drives' },
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
  { id: 'SUPER_ADMIN', label: 'Super Admin', desc: 'Absolute root administrator with unrestricted access to all modules' },
  { id: 'TPO_OFFICER', label: 'Placement Officer (TPO)', desc: 'Placement cell director managing corporate drives' },
  { id: 'STUDENT', label: 'Student', desc: 'Enrolled university candidate participating in recruitment' },
  { id: 'FACULTY_COORDINATOR', label: 'Staff / Faculty', desc: 'Department academic placement coordinator' },
  { id: 'RECRUITER', label: 'Company Recruiter', desc: 'Corporate hiring manager or technical interviewer' },
  { id: 'MANAGEMENT', label: 'Management / Principal', desc: 'Dean, Principal, and executive board members' },
  { id: 'ALUMNI', label: 'Alumni Network', desc: 'Graduated alumni providing mentorship and referrals' },
];

const DEFAULT_ROLE_PERMISSIONS = {
  SUPER_ADMIN: ALL_PAGES.map((p) => p.path),
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
    '/videocall/interview',
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
        parsed.SUPER_ADMIN = ALL_PAGES.map((p) => p.path);
        delete parsed.ADMIN; // Ensure legacy ADMIN is removed
        return parsed;
      }
    } catch (e) {
      console.warn('Error loading role permissions from cache', e);
    }
    return DEFAULT_ROLE_PERMISSIONS;
  });

  const [backendSynced, setBackendSynced] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch live role permissions from MySQL backend on startup
  const fetchBackendPermissions = useCallback(async () => {
    try {
      const res = await apiClient.get('/permissions');
      if (res.data?.success && res.data?.permissions) {
        const perms = res.data.permissions;
        perms.SUPER_ADMIN = ALL_PAGES.map((p) => p.path);
        delete perms.ADMIN;
        setRolePermissionsState(perms);
        setBackendSynced(true);
        try {
          localStorage.setItem('uniserve_role_permissions', JSON.stringify(perms));
        } catch (e) {}
      }
    } catch (err) {
      console.warn('Using cached permissions while connecting to backend:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBackendPermissions();
  }, [fetchBackendPermissions]);

  // Check if a role has access to a specific path
  const canAccessPage = useCallback((roleName, pagePath) => {
    if (!roleName) return false;
    // Super admin ALWAYS has unrestricted access to all pages!
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
  }, [rolePermissions]);

  // Toggle page permission for a given role (persists to MySQL backend)
  const togglePermission = async (roleId, pagePath) => {
    if (roleId === 'SUPER_ADMIN') {
      return; // Super admin is locked to all pages
    }

    setRolePermissionsState((prev) => {
      const currentList = prev[roleId] || [];
      const hasPage = currentList.includes(pagePath);
      const updatedList = hasPage
        ? currentList.filter((p) => p !== pagePath)
        : [...currentList, pagePath];

      const next = {
        ...prev,
        [roleId]: updatedList,
      };

      try {
        localStorage.setItem('uniserve_role_permissions', JSON.stringify(next));
      } catch (e) {}

      // Persist to MySQL Backend asynchronously
      apiClient.put('/permissions', {
        roleName: roleId,
        allowedPages: updatedList,
      }).then(() => {
        setBackendSynced(true);
      }).catch((err) => {
        console.error('Failed to sync permission update to backend MySQL:', err);
      });

      return next;
    });
  };

  // Set all permissions for a role (persists to MySQL backend)
  const setAllPermissionsForRole = async (roleId, enableAll) => {
    if (roleId === 'SUPER_ADMIN') return;

    const newList = enableAll ? ALL_PAGES.map((p) => p.path) : [];

    setRolePermissionsState((prev) => {
      const next = {
        ...prev,
        [roleId]: newList,
      };

      try {
        localStorage.setItem('uniserve_role_permissions', JSON.stringify(next));
      } catch (e) {}

      apiClient.put('/permissions', {
        roleName: roleId,
        allowedPages: newList,
      }).then(() => {
        setBackendSynced(true);
      }).catch((err) => {
        console.error('Failed to sync bulk permissions to backend MySQL:', err);
      });

      return next;
    });
  };

  // Reset to system defaults in MySQL backend
  const resetToDefaults = async () => {
    try {
      const res = await apiClient.post('/permissions/reset');
      if (res.data?.success && res.data?.permissions) {
        const perms = res.data.permissions;
        perms.SUPER_ADMIN = ALL_PAGES.map((p) => p.path);
        delete perms.ADMIN;
        setRolePermissionsState(perms);
        localStorage.setItem('uniserve_role_permissions', JSON.stringify(perms));
        setBackendSynced(true);
        return;
      }
    } catch (err) {
      console.warn('Backend reset failed, using default local reset:', err);
    }
    setRolePermissionsState(DEFAULT_ROLE_PERMISSIONS);
  };

  return (
    <PermissionContext.Provider
      value={{
        allPages: ALL_PAGES,
        userRoles: USER_ROLES,
        rolePermissions,
        backendSynced,
        loading,
        canAccessPage,
        togglePermission,
        setAllPermissionsForRole,
        resetToDefaults,
        refreshPermissions: fetchBackendPermissions,
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
