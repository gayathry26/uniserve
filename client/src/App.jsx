import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { PermissionProvider, usePermissions } from './context/PermissionContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { UniserveLoader } from './components/UniserveLoader';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Students } from './pages/Students';
import { Profile } from './pages/Profile';
import { Companies } from './pages/Companies';
import { Jobs } from './pages/Jobs';
import { Drives } from './pages/Drives';
import { Applications } from './pages/Applications';
import { Assessment } from './pages/Assessment';
import { Interviews } from './pages/Interviews';
import { Training } from './pages/Training';
import { Internships } from './pages/Internships';
import { Offers } from './pages/Offers';
import { Policies } from './pages/Policies';
import { Reports } from './pages/Reports';
import { Finance } from './pages/Finance';
import { Alumni } from './pages/Alumni';
import { Grievances } from './pages/Grievances';
import { AIAssistant } from './pages/AIAssistant';
import { Admin } from './pages/Admin';
import { Settings } from './pages/Settings';
import ExamScreen from './pages/LMS/ExamScreen';
import { InterviewRoomPage } from './pages/videocall/interview';

function Layout({ children }) {
  const location = useLocation();
  const isExam = location.pathname.startsWith('/exam');
  const isVideoCall = location.pathname.startsWith('/videocall') || location.pathname.startsWith('/interview/room');

  if (isExam || isVideoCall) {
    return (
      <div className="min-h-screen bg-[#202124] font-sans w-full p-0 m-0 overflow-hidden">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}

function ProtectedRoute({ children, path }) {
  const { user, loading } = useAuth();
  const { canAccessPage } = usePermissions();
  const location = useLocation();
  const currentPath = path || location.pathname;

  if (loading) {
    return <UniserveLoader title="UNISERVE" subtitle="Verifying Security Gate..." />;
  }
  if (!user) return <Navigate to="/login" replace />;

  // Super Admin ALWAYS has access to all pages!
  // For other users, only ticked checkbox pages are allowed!
  if (user.roleName !== 'SUPER_ADMIN' && !canAccessPage(user.roleName, currentPath)) {
    return (
      <Layout>
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center max-w-lg mx-auto my-12 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Page Access Restricted</h2>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            The page <strong className="font-mono text-slate-800">{currentPath}</strong> is currently not ticked in the Super Admin Page Permissions Matrix for your role (<strong>{user.roleName}</strong>).
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              to={user.roleName === 'STUDENT' ? '/profile' : '/'}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-bold shadow-xs transition-transform active:scale-95"
              style={{ backgroundColor: 'var(--theme-primary, #2563eb)' }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Accessible Modules</span>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return <Layout>{children}</Layout>;
}

// Dedicated Route Handlers per User Prompt Requirements:
// Direct login is student login
function DirectRoute() {
  const { user, loading } = useAuth();
  if (loading) {
    return <UniserveLoader title="UNISERVE" subtitle="Student Career Gateway" status="Connecting to student database..." />;
  }
  if (!user) {
    return <Login portal="student" />;
  }
  return (
    <Layout>
      {user.roleName === 'STUDENT' ? <Profile /> : <Dashboard />}
    </Layout>
  );
}

// /superadmin route handler
function SuperAdminRoute() {
  const { user, loading } = useAuth();
  if (loading) {
    return <UniserveLoader title="UNISERVE" subtitle="Super Administrator Console" status="Connecting to root cluster..." />;
  }
  if (!user) {
    return <Login portal="superadmin" />;
  }
  return (
    <Layout>
      <Settings />
    </Layout>
  );
}

// /admin route handler
function AdminRoute() {
  const { user, loading } = useAuth();
  if (loading) {
    return <UniserveLoader title="UNISERVE" subtitle="Super Administrator Console" status="Verifying security permissions..." />;
  }
  if (!user) {
    return <Login portal="superadmin" />;
  }
  return (
    <Layout>
      {user.roleName === 'SUPER_ADMIN' ? <Admin /> : <Navigate to="/" replace />}
    </Layout>
  );
}

// /placement route handler
function PlacementRoute() {
  const { user, loading } = useAuth();
  if (loading) {
    return <UniserveLoader title="UNISERVE" subtitle="Training & Placement Office" status="Loading recruitment drives..." />;
  }
  if (!user) {
    return <Login portal="placement" />;
  }
  return (
    <Layout>
      <Dashboard />
    </Layout>
  );
}

// /staff route handler
function StaffRoute() {
  const { user, loading } = useAuth();
  if (loading) {
    return <UniserveLoader title="UNISERVE" subtitle="Faculty & Staff Portal" status="Accessing departmental roster..." />;
  }
  if (!user) {
    return <Login portal="staff" />;
  }
  return (
    <Layout>
      <Students />
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <PermissionProvider>
          <BrowserRouter>
            <Routes>
              {/* Direct Login and Specified Routes */}
              <Route path="/" element={<DirectRoute />} />
              <Route path="/login" element={<Login portal="student" />} />
              <Route path="/superadmin" element={<SuperAdminRoute />} />
              <Route path="/admin" element={<AdminRoute />} />
              <Route path="/placement" element={<PlacementRoute />} />
              <Route path="/staff" element={<StaffRoute />} />

              {/* Settings & Appearance */}
              <Route path="/settings" element={<ProtectedRoute path="/settings"><Settings /></ProtectedRoute>} />

              {/* Portal Modules with Permission Enforcement */}
              <Route path="/students" element={<ProtectedRoute path="/students"><Students /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute path="/profile"><Profile /></ProtectedRoute>} />
              <Route path="/companies" element={<ProtectedRoute path="/companies"><Companies /></ProtectedRoute>} />
              <Route path="/jobs" element={<ProtectedRoute path="/jobs"><Jobs /></ProtectedRoute>} />
              <Route path="/drives" element={<ProtectedRoute path="/drives"><Drives /></ProtectedRoute>} />
              <Route path="/applications" element={<ProtectedRoute path="/applications"><Applications /></ProtectedRoute>} />
              <Route path="/assessment" element={<ProtectedRoute path="/assessment"><Assessment /></ProtectedRoute>} />
              <Route path="/exam" element={<ProtectedRoute path="/assessment"><ExamScreen /></ProtectedRoute>} />
              <Route path="/interviews" element={<ProtectedRoute path="/interviews"><Interviews /></ProtectedRoute>} />
              <Route path="/videocall/interview" element={<ProtectedRoute path="/videocall/interview"><InterviewRoomPage /></ProtectedRoute>} />
              <Route path="/videocall/interview/:roomCode" element={<ProtectedRoute path="/videocall/interview"><InterviewRoomPage /></ProtectedRoute>} />
              <Route path="/interview/room/:roomCode" element={<ProtectedRoute path="/videocall/interview"><InterviewRoomPage /></ProtectedRoute>} />
              <Route path="/training" element={<ProtectedRoute path="/training"><Training /></ProtectedRoute>} />
              <Route path="/internships" element={<ProtectedRoute path="/internships"><Internships /></ProtectedRoute>} />
              <Route path="/offers" element={<ProtectedRoute path="/offers"><Offers /></ProtectedRoute>} />
              <Route path="/policies" element={<ProtectedRoute path="/policies"><Policies /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute path="/reports"><Reports /></ProtectedRoute>} />
              <Route path="/finance" element={<ProtectedRoute path="/finance"><Finance /></ProtectedRoute>} />
              <Route path="/alumni" element={<ProtectedRoute path="/alumni"><Alumni /></ProtectedRoute>} />
              <Route path="/grievances" element={<ProtectedRoute path="/grievances"><Grievances /></ProtectedRoute>} />
              <Route path="/ai-assistant" element={<ProtectedRoute path="/ai-assistant"><AIAssistant /></ProtectedRoute>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </PermissionProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
