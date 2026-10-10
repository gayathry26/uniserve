import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
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
  ArrowRight
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

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

  // 1. TPO / MANAGEMENT / ADMIN VIEW
  if (['TPO_OFFICER', 'MANAGEMENT', 'ADMIN'].includes(user?.roleName)) {
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
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-2 border border-blue-400/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Institutional Campus Drive 2026-27 Active
            </div>
            <h1 className="text-2xl font-bold tracking-tight">University Placement Central Governance</h1>
            <p className="text-slate-300 text-xs mt-1 max-w-2xl leading-relaxed">
              Real-time synchronization across central institutional records (`lms`) and department databases (`lms_cse`, `lms_ece`, `lms_mech`, etc.).
            </p>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold text-white transition-colors cursor-pointer border border-white/10">
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
            color="blue"
          />
          <StatCard
            title="Institutional Placement Rate"
            value={`${ov.placementRate}%`}
            subtitle={`${ov.placedStudents} Students Placed`}
            icon={GraduationCap}
            color="emerald"
            trend={+12}
          />
          <StatCard
            title="Average CTC Package"
            value={`₹${ov.averagePackageLpa} LPA`}
            subtitle={`Highest: ₹${ov.highestPackageLpa} LPA`}
            icon={TrendingUp}
            color="purple"
          />
          <StatCard
            title="Active Companies"
            value={ov.totalCompanies}
            subtitle={`${ov.upcomingDrives} Upcoming Drives`}
            icon={Building2}
            color="amber"
          />
        </div>

        {/* Analytics Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Department-wise Placement Rates */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Department Placement Performance</h3>
                <p className="text-xs text-slate-500">Placement percentage by department</p>
              </div>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md">Live Multi-DB</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="department_code" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(val) => [`${val}%`, 'Placement Rate']}
                  />
                  <Bar dataKey="placement_rate" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Salary Package Distribution */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Salary Band Distribution</h3>
                <p className="text-xs text-slate-500">Offers by CTC range</p>
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
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-slate-400">No offers issued yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Compiler Environment Diagnostic */}
        {data?.compilersStatus && (
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-slate-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Assessment Sandbox Environment Status</h3>
              </div>
              <span className="text-[11px] text-slate-500">Host Hardware Probed at Startup</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg border bg-slate-50 border-slate-200">
                <span className="text-slate-500 font-medium">Python 3:</span>
                <p className="font-bold text-emerald-600 mt-1">
                  {data.compilersStatus.python?.available ? `✅ Ready (${data.compilersStatus.python.version?.split(' ')[1] || '3.13'})` : '❌ Missing'}
                </p>
              </div>
              <div className="p-3 rounded-lg border bg-slate-50 border-slate-200">
                <span className="text-slate-500 font-medium">C (GCC):</span>
                <p className="font-semibold text-slate-700 mt-1">
                  {data.compilersStatus.c?.available ? '✅ GCC Ready' : '⚠️ Install MinGW in PATH'}
                </p>
              </div>
              <div className="p-3 rounded-lg border bg-slate-50 border-slate-200">
                <span className="text-slate-500 font-medium">C++ (G++):</span>
                <p className="font-semibold text-slate-700 mt-1">
                  {data.compilersStatus.cpp?.available ? '✅ G++ Ready' : '⚠️ Install MinGW in PATH'}
                </p>
              </div>
              <div className="p-3 rounded-lg border bg-slate-50 border-slate-200">
                <span className="text-slate-500 font-medium">Java (javac):</span>
                <p className="font-semibold text-slate-700 mt-1">
                  {data.compilersStatus.java?.available ? '✅ Java Ready' : '⚠️ Install JDK in PATH'}
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
    const offers = data?.offers || [];
    const interviews = data?.interviews || [];
    const stats = data?.stats || {};

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-6 text-white shadow-md">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider">
                Student Self-Service Portal
              </span>
              <h1 className="text-2xl font-bold tracking-tight mt-2">Welcome, {user.firstName} {user.lastName}</h1>
              <p className="text-blue-100 text-xs mt-1">
                Reg No: {user.registerNumber} • Department: {user.departmentCode} • CGPA: {prof.cgpa || '8.50'}
              </p>
            </div>
            <div className="bg-white/10 p-3 rounded-xl border border-white/20 text-center">
              <span className="text-xs text-blue-200 font-medium">AI Readiness Score</span>
              <div className="text-2xl font-extrabold text-white mt-0.5">{stats.readinessScore || 75}%</div>
            </div>
          </div>
        </div>

        {/* Student Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatCard title="Total Applied" value={stats.totalApplications} icon={Briefcase} color="blue" />
          <StatCard title="In Progress / Shortlist" value={stats.shortlistedCount} icon={Clock} color="amber" />
          <StatCard title="Placement Offers" value={stats.offersCount} icon={Award} color="emerald" />
          <StatCard title="Placement Status" value={prof.placement_status || 'REGISTERED'} icon={CheckCircle2} color="purple" />
        </div>

        {/* Active Applications Table */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-3">My Application Status</h3>
          {apps.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">You have not applied for any drives yet. Check the Jobs tab.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Company</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Package (CTC)</th>
                    <th className="py-2.5 px-3">Current Round</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {apps.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-3 font-semibold text-slate-800">{app.company_name}</td>
                      <td className="py-3 px-3">{app.job_title}</td>
                      <td className="py-3 px-3 font-semibold text-emerald-600">₹{app.ctc_lpa} LPA</td>
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
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-6 text-white shadow-md">
          <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider">
            Department Isolation Portal
          </span>
          <h1 className="text-2xl font-bold tracking-tight mt-2">Department of {data?.departmentCode} Placement Coordination</h1>
          <p className="text-emerald-100 text-xs mt-1">
            Isolated Department Database: `lms_{data?.departmentCode?.toLowerCase()}` • Academic History & Waivers
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Department Cohort" value={ov.totalStudents} subtitle={`${ov.placedStudents} Placed Students`} icon={Users} color="emerald" />
          <StatCard title="Department Placement Rate" value={`${ov.placementRate}%`} subtitle="Class of 2027" icon={GraduationCap} color="blue" />
          <StatCard title="Average Department CGPA" value={ov.avgCgpa} subtitle="Verified by Faculty Mentors" icon={Award} color="purple" />
        </div>

        {/* Academic Roster from Department Database */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Department Academic Roster (Isolated SQL DB)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Register No</th>
                  <th className="py-2.5 px-3">Current CGPA</th>
                  <th className="py-2.5 px-3">Active Backlogs</th>
                  <th className="py-2.5 px-3">Dept Rank</th>
                  <th className="py-2.5 px-3">Faculty Mentor</th>
                  <th className="py-2.5 px-3">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {academicRoster.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3 font-semibold text-slate-800">{r.register_number}</td>
                    <td className="py-3 px-3 font-bold text-blue-600">{r.current_cgpa}</td>
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
      <div className="bg-gradient-to-r from-purple-800 to-indigo-900 rounded-2xl p-6 text-white shadow-md">
        <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider">
          Company Recruiter Portal
        </span>
        <h1 className="text-2xl font-bold tracking-tight mt-2">{data?.companyName || 'Corporate Partner'} Campus Drive Portal</h1>
        <p className="text-purple-200 text-xs mt-1">Review candidates, progress rounds, and issue offers.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard title="Active Postings" value={data?.stats?.jobsCount || 0} icon={Briefcase} color="purple" />
        <StatCard title="Total Candidates" value={data?.stats?.totalApplicants || 0} icon={Users} color="blue" />
        <StatCard title="Shortlisted" value={data?.stats?.shortlisted || 0} icon={CheckCircle2} color="emerald" />
        <StatCard title="Offers Released" value={data?.stats?.offersReleased || 0} icon={Award} color="amber" />
      </div>
    </div>
  );
}
