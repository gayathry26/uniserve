import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { UniserveLoader } from '../components/UniserveLoader';
import {
  GraduationCap,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Building2,
  BookOpen,
  Briefcase,
  Sparkles,
  Database,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react';

export function Login({ portal = 'student' }) {
  const { login } = useAuth();
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine portal from prop or pathname
  const currentPortal = (() => {
    if (portal) return portal;
    const path = location.pathname.toLowerCase();
    if (path.includes('/superadmin')) return 'superadmin';
    if (path.includes('/admin')) return 'admin';
    if (path.includes('/placement')) return 'placement';
    if (path.includes('/staff')) return 'staff';
    return 'student';
  })();

  // Portal configuration metadata
  const portalConfigs = {
    superadmin: {
      key: 'superadmin',
      title: 'Super Administrator Portal',
      badge: 'Master Super Admin (All Pages)',
      tagline: 'Absolute institutional authority with access to all pages and permissions.',
      description:
        'Master root control console with permissions to configure page visibility checkboxes per user type, manage database tenants, and inspect institutional audits.',
      defaultUsername: 'superadmin',
      defaultPassword: 'Password@123',
      redirectPath: '/settings',
      features: [
        {
          title: 'Unrestricted Page Access',
          desc: 'Automatic bypass and full visibility across all 20 Uniserve modules and management screens.',
          icon: ShieldAlert,
        },
        {
          title: 'User Role Permissions Matrix',
          desc: 'Grant or revoke module checkboxes per user role in Settings with instant live sync.',
          icon: CheckCircle2,
        },
        {
          title: 'Multi-Tenant DB Governance',
          desc: 'Manage centralized schema synchronization across isolated departmental databases.',
          icon: Database,
        },
        {
          title: 'Global Audit Logs',
          desc: 'Real-time cryptographic monitoring of institutional logins and grade modifications.',
          icon: Sparkles,
        },
      ],
      stats: [
        { label: 'Role Authority', value: 'Root Super' },
        { label: 'Page Access', value: '100% (All)' },
        { label: 'Active Clusters', value: '6 Depts' },
        { label: 'Security Level', value: 'Tier 4' },
      ],
    },
    student: {
      key: 'student',
      title: 'Student Placement Portal',
      badge: 'Student Direct Access',
      tagline: 'Launch your high-impact corporate career through Uniserve.',
      description:
        'Unified career management ecosystem connecting undergraduate & postgraduate students with elite global recruiters, mock assessments, and automated eligibility clearance.',
      defaultUsername: 'student.cse1@college.edu',
      defaultPassword: 'Password@123',
      redirectPath: '/profile',
      features: [
        {
          title: 'Direct Campus Drives',
          desc: '1-click applications to Tier-1 product & service leaders with automated CGPA verification.',
          icon: Briefcase,
        },
        {
          title: 'AI Career Intelligence',
          desc: 'Instant resume scoring, real-time skill matching, and tailored interview readiness.',
          icon: Sparkles,
        },
        {
          title: 'Isolated Department Sync',
          desc: 'Seamless academic sync across departmental databases with tamper-proof records.',
          icon: Database,
        },
        {
          title: 'Verified Digital Offers',
          desc: 'Instant PPO tracking, verified digital appointment letters, and joining roadmaps.',
          icon: GraduationCap,
        },
      ],
      stats: [
        { label: 'Placement Rate', value: '94.8%' },
        { label: 'Top Recruiters', value: '250+' },
        { label: 'Highest Package', value: '₹45 LPA' },
        { label: 'Verified Students', value: '12K+' },
      ],
    },
    placement: {
      key: 'placement',
      title: 'Placement Officer (TPO) Portal',
      badge: 'Training & Placement Office',
      tagline: 'End-to-end recruitment drive orchestration & institutional governance.',
      description:
        'Comprehensive multi-tier management console for Placement Officers to coordinate corporate recruitment rounds, shortlisting, and regulatory compliance.',
      defaultUsername: 'tpo@college.edu',
      defaultPassword: 'Password@123',
      redirectPath: '/',
      features: [
        {
          title: 'Drive Scheduling & Tiers',
          desc: 'Orchestrate Dream, Super Dream, and Core placement rounds with customizable rules.',
          icon: Briefcase,
        },
        {
          title: 'NIRF / NAAC Analytics',
          desc: 'Automated institutional report generation with department-wise placement metrics.',
          icon: ShieldCheck,
        },
        {
          title: 'Eligibility Rule Engine',
          desc: 'Filter candidates by historical backlogs, department cutoffs, and attendance.',
          icon: CheckCircle2,
        },
        {
          title: 'Corporate Relationships',
          desc: 'Manage enterprise recruiters, slot schedules, and multi-campus pooled drives.',
          icon: Building2,
        },
      ],
      stats: [
        { label: 'Active Drives', value: '48+' },
        { label: 'Corporate Partners', value: '280+' },
        { label: 'Total Offers', value: '1,420' },
        { label: 'NIRF Ranking', value: 'Top 25' },
      ],
    },
    staff: {
      key: 'staff',
      title: 'Staff & Faculty Portal',
      badge: 'Faculty Placement Coordinator',
      tagline: 'Academic department placement tracking & student clearance.',
      description:
        'Dedicated workspace for department heads and faculty coordinators to monitor batch-level performance, approve training attendance, and mentor students.',
      defaultUsername: 'hod.cse@college.edu',
      defaultPassword: 'Password@123',
      redirectPath: '/students',
      features: [
        {
          title: 'Department Roster',
          desc: 'Track placed vs unplaced student distribution across all academic sections.',
          icon: BookOpen,
        },
        {
          title: 'Attendance Clearance',
          desc: 'Verify mandatory pre-placement training hours and corporate workshops.',
          icon: CheckCircle2,
        },
        {
          title: 'Assessment Endorsements',
          desc: 'Review student performance in internal programming sprints and viva slots.',
          icon: Sparkles,
        },
        {
          title: 'Internship & PPO Approvals',
          desc: 'Approve semester-long industry internships and academic credit conversions.',
          icon: GraduationCap,
        },
      ],
      stats: [
        { label: 'Eligible Students', value: '420' },
        { label: 'Batch Placed', value: '88.5%' },
        { label: 'Active Interns', value: '115' },
        { label: 'Dept Rank', value: '#1 CSE' },
      ],
    },
    admin: {
      key: 'admin',
      title: 'System Administrator Portal',
      badge: 'Institutional System Admin',
      tagline: 'Multi-database infrastructure, RBAC security, and compiler services.',
      description:
        'Master administrative control room managing multi-tenant database isolation, user registry, security audit logs, and microservice compilers.',
      defaultUsername: 'admin@college.edu',
      defaultPassword: 'Password@123',
      redirectPath: '/admin',
      features: [
        {
          title: 'Multi-DB Architecture',
          desc: 'Manage dedicated department MySQL instances with common registry sync.',
          icon: Database,
        },
        {
          title: 'Role-Based Access (RBAC)',
          desc: 'Granular permissions covering Students, TPOs, Recruiters, and Faculty.',
          icon: ShieldCheck,
        },
        {
          title: 'Tamper-Proof Audit Logs',
          desc: 'Cryptographic trace of logins, grade modifications, and offer rollouts.',
          icon: CheckCircle2,
        },
        {
          title: 'Assessment Compilers',
          desc: 'Real-time execution sandbox monitors for C, C++, Java, and Python microservices.',
          icon: Sparkles,
        },
      ],
      stats: [
        { label: 'Synced DBs', value: '7 Active' },
        { label: 'System Uptime', value: '99.98%' },
        { label: 'Total Users', value: '14.5K' },
        { label: 'Security Grade', value: 'Tier 3' },
      ],
    },
  };

  const config = portalConfigs[currentPortal] || portalConfigs.student;

  const [username, setUsername] = useState(config.defaultUsername);
  const [password, setPassword] = useState(config.defaultPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Update default credentials whenever portal route changes
  useEffect(() => {
    setUsername(config.defaultUsername);
    setPassword(config.defaultPassword);
    setError('');
  }, [currentPortal]);

  // Brief pre-login loader effect using logo.jpeg
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, [currentPortal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please provide both username and password.');
      return;
    }
    setLoading(true);
    setError('');

    const res = await login(username.trim(), password);
    setLoading(false);

    if (res.success) {
      navigate(config.redirectPath);
    } else {
      setError(res.message || 'Invalid username or password.');
    }
  };

  if (initialLoading || loading) {
    return (
      <UniserveLoader
        title="UNISERVE"
        subtitle={config.title}
        status={loading ? 'Authenticating with Uniserve Secure Gate...' : 'Loading Uniserve Portal...'}
      />
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-950 font-sans text-slate-100 overflow-x-hidden">
      {/* ========================================================================= */}
      {/* LEFT SEGMENT: The Details                                                 */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-1/2 xl:w-7/12 relative flex flex-col justify-between p-6 sm:p-10 lg:p-14 border-b lg:border-b-0 lg:border-r border-slate-800/80 overflow-hidden bg-slate-950">
        {/* Dynamic Background Glow using Active Theme */}
        <div
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ background: currentTheme.glow }}
        />
        <div
          className="absolute bottom-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: currentTheme.primary }}
        />

        {/* Top Header: Brand Logo & Portal Badge */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white p-1.5 shadow-xl flex items-center justify-center border border-slate-200">
              <img
                src="/logo.jpeg"
                alt="Uniserve Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-wider text-white">
                  UNISERVE
                </span>
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: currentTheme.accent }}
                />
              </div>
              <p className="text-[11px] font-semibold text-slate-400 tracking-wide">
                University Career & Placement Governance
              </p>
            </div>
          </div>

          {/* Active Portal Badge */}
          <span
            className="px-3 py-1 rounded-full text-[11px] font-bold border backdrop-blur-md shadow-xs"
            style={{
              backgroundColor: currentTheme.primaryLight,
              color: currentTheme.primaryText,
              borderColor: currentTheme.primaryBorder,
            }}
          >
            {config.badge}
          </span>
        </div>

        {/* Center: Hero Information & Features */}
        <div className="relative z-10 my-auto py-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-300 font-medium mb-4">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: currentTheme.primary }}
            />
            <span>Institutional Unified Multi-Database Architecture</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
            {config.title}
          </h2>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl mb-8">
            {config.description}
          </p>

          {/* 4 Feature Highlights Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-8">
            {config.features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all hover:bg-slate-900/90 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: currentTheme.primaryLight,
                        color: currentTheme.primaryText,
                      }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-100">
                      {f.title}
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Metric Statistics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
            {config.stats.map((s, idx) => (
              <div key={idx} className="text-left">
                <div
                  className="text-lg sm:text-xl font-black tracking-tight"
                  style={{ color: currentTheme.accent }}
                >
                  {s.value}
                </div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Fast Route Switcher Navigation */}
        <div className="relative z-10 pt-6 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="font-semibold text-[11px] uppercase tracking-wider">
              Uniserve Routes:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <Link
                to="/superadmin"
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  currentPortal === 'superadmin'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'bg-amber-950/40 text-amber-300 border border-amber-500/30 hover:bg-amber-900/60'
                }`}
              >
                👑 Super Admin
              </Link>
              <Link
                to="/login"
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  currentPortal === 'student'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Direct / Student
              </Link>
              <Link
                to="/placement"
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  currentPortal === 'placement'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                /placement
              </Link>
              <Link
                to="/staff"
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  currentPortal === 'staff'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                /staff
              </Link>
              <Link
                to="/admin"
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  currentPortal === 'admin'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                /admin
              </Link>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            Uniserve v2.4 Enterprise
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT SEGMENT: User Name and Password - NOTHING ELSE                      */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-1/2 xl:w-5/12 bg-white flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16 text-slate-900">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="mb-8 text-center sm:text-left">
            <span
              className="inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-md mb-2"
              style={{
                backgroundColor: currentTheme.primaryLight,
                color: currentTheme.primaryText,
              }}
            >
              Secure Portal Authentication
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Sign In
            </h1>
            <p className="mt-1.5 text-xs text-slate-500">
              Enter your username and password to proceed.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200 font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form: Username and Password ONLY */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* User Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                User Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username or University Email"
                  autoComplete="username"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all bg-slate-50/50 hover:bg-white"
                  style={{
                    borderColor: '#e2e8f0',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = currentTheme.primary;
                    e.target.style.boxShadow = `0 0 0 3px ${currentTheme.glow}`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password"
                  autoComplete="current-password"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all bg-slate-50/50 hover:bg-white"
                  style={{
                    borderColor: '#e2e8f0',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = currentTheme.primary;
                    e.target.style.boxShadow = `0 0 0 3px ${currentTheme.glow}`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-[0.99] disabled:opacity-70"
                style={{
                  backgroundColor: currentTheme.primary,
                  boxShadow: `0 4px 14px 0 ${currentTheme.glow}`,
                }}
              >
                <span>Sign In to Uniserve</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
