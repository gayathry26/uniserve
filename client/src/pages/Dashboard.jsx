import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/Badge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  Users,
  Building2,
  CalendarDays,
  Award,
  TrendingUp,
  GraduationCap,
  Briefcase,
  CheckCircle2,
  Clock,
  Terminal,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export function Dashboard() {
  const { user } = useAuth();
  const { chartColors, isDark } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardMetrics();
  }, [user]);

  const fetchDashboardMetrics = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/dashboard/metrics');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading placement analytics and database counts..." />;

  const COLORS = chartColors;

  // 1. TPO / MANAGEMENT / ADMIN VIEW
  if (['TPO_OFFICER', 'MANAGEMENT', 'ADMIN', 'SUPER_ADMIN'].includes(user?.roleName)) {
    const ov = data?.overview || {};
    const deptData = data?.departmentAnalytics || [];
    const salaryBins = data?.salaryDistribution || {};

    const salaryChartData = [
      { name: '< 6 LPA', value: parseInt(salaryBins.bracket_below_6 || 0, 10) },
      { name: '6 - 10 LPA', value: parseInt(salaryBins.bracket_6_to_10 || 0, 10) },
      { name: '10 - 20 LPA', value: parseInt(salaryBins.bracket_10_to_20 || 0, 10) },
      { name: '20+ LPA', value: parseInt(salaryBins.bracket_above_20 || 0, 10) },
    ].filter(item => item.value > 0);

    return (
      <div className="space-y-6">
        {/* Welcome Banner - Neutral Card */}
        <div className="bg-neutral-100 dark:bg-neutral-900 rounded-2xl p-6 text-foreground border border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-secondary text-foreground text-xs font-semibold mb-2 border border-border">
              <span className="w-1.5 h-1.5 rounded-full bg-foreground" />
              Institutional Campus Drive 2026-27 Active
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">CampusCorp Central Placement Governance</h1>
            <p className="text-muted-foreground text-xs mt-1 max-w-2xl leading-relaxed">
              Real-time synchronization across central institutional records (`lms`) and department databases (`lms_cse`, `lms_ece`, `lms_mech`, etc.).
            </p>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1.5 bg-card rounded-lg text-xs font-semibold text-foreground border border-border shadow-2xs">
              Batch: 2023-2027
            </span>
          </div>
        </div>

        {/* Primary KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Students Enrolled"
            value={ov.totalStudents}
            subtitle={`${ov.registeredStudents} Registered for Drives`}
            icon={Users}
          />
          <StatCard
            title="Institutional Placement Rate"
            value={`${ov.placementRate}%`}
            subtitle={`${ov.placedStudents} Students Placed`}
            icon={GraduationCap}
            trend={+12}
          />
          <StatCard
            title="Average CTC Package"
            value={`₹${ov.averagePackageLpa} LPA`}
            subtitle={`Highest: ₹${ov.highestPackageLpa} LPA`}
            icon={TrendingUp}
          />
          <StatCard
            title="Active Companies"
            value={ov.totalCompanies}
            subtitle={`${ov.upcomingDrives} Upcoming Drives`}
            icon={Building2}
          />
        </div>

        {/* Analytics Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Department-wise Placement Rates */}
          <div className="lg:col-span-2 bg-card text-card-foreground rounded-xl border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">Department Placement Performance</h3>
                <p className="text-xs text-muted-foreground">Placement percentage by department</p>
              </div>
              <span className="text-xs font-medium text-foreground bg-secondary px-2 py-1 rounded-md border border-border">Live Multi-DB</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.08)" : "#e5e5e5"} vertical={false} />
                  <XAxis dataKey="department_code" tick={{ fontSize: 11, fill: isDark ? '#a1a1a1' : '#737373' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: isDark ? '#a1a1a1' : '#737373' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: isDark ? '#171717' : '#ffffff', color: isDark ? '#fafafa' : '#0a0a0a', borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#e5e5e5', borderRadius: '10px', fontSize: '12px' }}
                    formatter={(val) => [`${val}%`, 'Placement Rate']}
                  />
                  <Bar dataKey="placement_rate" fill={COLORS[0]} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Salary Package Distribution */}
          <div className="bg-card text-card-foreground rounded-xl border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">Salary Band Distribution</h3>
                <p className="text-xs text-muted-foreground">Offers by CTC range</p>
              </div>
            </div>
            <div className="h-64 flex items-center justify-center">
              {salaryChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={salaryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {salaryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: isDark ? '#171717' : '#ffffff', color: isDark ? '#fafafa' : '#0a0a0a', borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#e5e5e5', borderRadius: '10px', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-muted-foreground">No offers issued yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Compiler Environment Diagnostic */}
        {data?.compilersStatus && (
          <div className="bg-card text-card-foreground rounded-xl border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-foreground" />
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Assessment Sandbox Environment Status</h3>
              </div>
              <span className="text-[11px] text-muted-foreground">Host Hardware Probed at Startup</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg border bg-secondary border-border">
                <span className="text-muted-foreground font-medium">Python 3:</span>
                <p className="font-bold text-foreground mt-1">
                  {data.compilersStatus.python?.available ? `Ready (${data.compilersStatus.python.version?.split(' ')[1] || '3.13'})` : 'Missing'}
                </p>
              </div>
              <div className="p-3 rounded-lg border bg-secondary border-border">
                <span className="text-muted-foreground font-medium">C (GCC):</span>
                <p className="font-semibold text-foreground mt-1">
                  {data.compilersStatus.c?.available ? 'GCC Ready' : 'Install MinGW in PATH'}
                </p>
              </div>
              <div className="p-3 rounded-lg border bg-secondary border-border">
                <span className="text-muted-foreground font-medium">C++ (G++):</span>
                <p className="font-semibold text-foreground mt-1">
                  {data.compilersStatus.cpp?.available ? 'G++ Ready' : 'Install MinGW in PATH'}
                </p>
              </div>
              <div className="p-3 rounded-lg border bg-secondary border-border">
                <span className="text-muted-foreground font-medium">Java (javac):</span>
                <p className="font-semibold text-foreground mt-1">
                  {data.compilersStatus.java?.available ? 'Java Ready' : 'Install JDK in PATH'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. STUDENT PORTAL VIEW
  if (user?.roleName === 'STUDENT') {
    const prof = data?.studentProfile || {};
    const apps = data?.applications || [];
    const stats = data?.stats || {};

    return (
      <div className="space-y-6">
        <div className="bg-neutral-100 dark:bg-neutral-900 rounded-2xl p-6 text-foreground border border-border">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-xs bg-secondary text-foreground border border-border px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider">
                Student Self-Service Portal
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-foreground mt-2">Welcome, {user.firstName} {user.lastName}</h1>
              <p className="text-muted-foreground text-xs mt-1">
                Reg No: {user.registerNumber} • Department: {user.departmentCode} • CGPA: {prof.cgpa || '8.50'}
              </p>
            </div>
            <div className="bg-card p-3 rounded-xl border border-border text-center shadow-2xs">
              <span className="text-xs text-muted-foreground font-medium">AI Readiness Score</span>
              <div className="text-2xl font-black text-foreground mt-0.5">{stats.readinessScore || 75}%</div>
            </div>
          </div>
        </div>

        {/* Student Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatCard title="Total Applied" value={stats.totalApplications} icon={Briefcase} />
          <StatCard title="In Progress / Shortlist" value={stats.shortlistedCount} icon={Clock} />
          <StatCard title="Placement Offers" value={stats.offersCount} icon={Award} />
          <StatCard title="Placement Status" value={prof.placement_status || 'REGISTERED'} icon={CheckCircle2} />
        </div>

        {/* Skill Analyzer Quick Banner */}
        <div className="bg-card rounded-xl border border-purple-500/30 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">Skill Analyzer & IT Career Match</h4>
              <p className="text-xs text-muted-foreground">Discover your technical fitment across 12+ IT roles and follow your personalized placement roadmap.</p>
            </div>
          </div>
          <Link
            to="/skill-analyzer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shrink-0 shadow-xs transition-transform active:scale-95"
          >
            <span>Analyze My Skills</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Active Applications Table */}
        <div className="bg-card text-card-foreground rounded-xl border border-border p-6 shadow-sm">
          <h3 className="text-sm font-bold text-foreground mb-3">My Application Status</h3>
          {apps.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">You have not applied for any drives yet. Check the Jobs tab.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-muted-foreground">
                <thead className="bg-secondary text-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="py-2.5 px-3">Company</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Package (CTC)</th>
                    <th className="py-2.5 px-3">Current Round</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {apps.map((app) => (
                    <tr key={app.id} className="hover:bg-secondary transition-colors">
                      <td className="py-3 px-3 font-semibold text-foreground">{app.company_name}</td>
                      <td className="py-3 px-3">{app.job_title}</td>
                      <td className="py-3 px-3 font-semibold text-foreground">₹{app.ctc_lpa} LPA</td>
                      <td className="py-3 px-3">Round {app.current_round_number}</td>
                      <td className="py-3 px-3"><StatusBadge status={app.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. FACULTY COORDINATOR VIEW
  if (user?.roleName === 'FACULTY_COORDINATOR') {
    const ov = data?.overview || {};
    const academicRoster = data?.academicRoster || [];

    return (
      <div className="space-y-6">
        <div className="bg-neutral-100 dark:bg-neutral-900 rounded-2xl p-6 text-foreground border border-border">
          <span className="text-xs bg-secondary text-foreground border border-border px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider">
            Department Isolation Portal
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-2">Department of {data?.departmentCode} Placement Coordination</h1>
          <p className="text-muted-foreground text-xs mt-1">
            Isolated Department Database: `lms_{data?.departmentCode?.toLowerCase()}` • Academic History & Waivers
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Department Cohort" value={ov.totalStudents} subtitle={`${ov.placedStudents} Placed Students`} icon={Users} />
          <StatCard title="Department Placement Rate" value={`${ov.placementRate}%`} subtitle="Class of 2027" icon={GraduationCap} />
          <StatCard title="Average Department CGPA" value={ov.avgCgpa} subtitle="Verified by Faculty Mentors" icon={Award} />
        </div>

        {/* Academic Roster from Department Database */}
        <div className="bg-card text-card-foreground rounded-xl border border-border p-6 shadow-sm">
          <h3 className="text-sm font-bold text-foreground mb-3">Department Academic Roster (Isolated SQL DB)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-muted-foreground">
              <thead className="bg-secondary text-foreground font-semibold border-b border-border">
                <tr>
                  <th className="py-2.5 px-3">Register No</th>
                  <th className="py-2.5 px-3">Current CGPA</th>
                  <th className="py-2.5 px-3">Active Backlogs</th>
                  <th className="py-2.5 px-3">Dept Rank</th>
                  <th className="py-2.5 px-3">Faculty Mentor</th>
                  <th className="py-2.5 px-3">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {academicRoster.map((r, i) => (
                  <tr key={i} className="hover:bg-secondary transition-colors">
                    <td className="py-3 px-3 font-semibold text-foreground">{r.register_number}</td>
                    <td className="py-3 px-3 font-bold text-foreground">{r.current_cgpa}</td>
                    <td className="py-3 px-3">{r.active_backlogs}</td>
                    <td className="py-3 px-3">#{r.department_rank}</td>
                    <td className="py-3 px-3">{r.faculty_mentor_name}</td>
                    <td className="py-3 px-3"><StatusBadge status={r.verification_status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // 4. RECRUITER VIEW
  return (
    <div className="space-y-6">
      <div className="bg-neutral-100 dark:bg-neutral-900 rounded-2xl p-6 text-foreground border border-border">
        <span className="text-xs bg-secondary text-foreground border border-border px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider">
          Company Recruiter Portal
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-foreground mt-2">{data?.companyName || 'Corporate Partner'} Campus Drive Portal</h1>
        <p className="text-muted-foreground text-xs mt-1">Review candidates, progress rounds, and issue offers.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard title="Active Postings" value={data?.stats?.jobsCount || 0} icon={Briefcase} />
        <StatCard title="Total Candidates" value={data?.stats?.totalApplicants || 0} icon={Users} />
        <StatCard title="Shortlisted" value={data?.stats?.shortlisted || 0} icon={CheckCircle2} />
        <StatCard title="Offers Released" value={data?.stats?.offersReleased || 0} icon={Award} />
      </div>
    </div>
  );
}
