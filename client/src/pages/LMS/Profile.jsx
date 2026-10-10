import React from 'react';
import AppShell from '../components/AppShell';
import { getSessionUser, clearSession } from '../services/api';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const user = getSessionUser();
  const navigate = useNavigate();

  const logout = () => {
    clearSession();
    navigate('/login');
  };

  return (
    <AppShell
      title="User Profile"
      user={user}
      onLogout={logout}
      items={[
        { to: '/student/dashboard/overview', label: 'Dashboard' },
        { to: '/student/dashboard/profile', label: 'Profile' }
      ]}
    >
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="bg-brand-600 h-32 relative">
             <div className="absolute -bottom-12 left-8">
                <div className="w-24 h-24 rounded-2xl bg-white border-4 border-white shadow-md flex items-center justify-center text-3xl font-bold text-brand-600">
                    {user?.name?.charAt(0) || 'U'}
                </div>
             </div>
          </div>
          <div className="pt-16 pb-8 px-8">
            <h1 className="text-2xl font-bold text-slate-900">{user?.name}</h1>
            <p className="text-slate-500 font-medium">{user?.roll_number}</p>
            
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Department</p>
                    <p className="text-slate-700 font-semibold">{user?.department}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Role</p>
                    <p className="text-slate-700 font-semibold capitalize">{user?.role || 'Student'}</p>
                </div>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-100">
                <button 
                    onClick={logout}
                    className="flex items-center gap-2 text-red-600 font-bold hover:text-red-700 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                    </svg>
                    Sign Out from Account
                </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default Profile;
