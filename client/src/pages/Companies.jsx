import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { StatusBadge, Badge } from '../components/Badge';
import { Modal, LoadingSpinner } from '../components/Modal';
import {
  Building2,
  Globe,
  MapPin,
  Mail,
  Phone,
  Plus,
  Star,
  CalendarDays,
  Users,
  CheckCircle2,
  XCircle,
  GraduationCap,
  Clock,
  Sparkles,
  Edit3,
  Trash2,
  Search,
  Filter,
  Check,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Info,
  Layers,
  Award,
} from 'lucide-react';

const ALL_DEPARTMENTS = [
  { code: 'CSE', name: 'Computer Science & Engineering' },
  { code: 'ECE', name: 'Electronics & Communication Engineering' },
  { code: 'EEE', name: 'Electrical & Electronics Engineering' },
  { code: 'MECH', name: 'Mechanical Engineering' },
  { code: 'CIVIL', name: 'Civil Engineering' },
  { code: 'IT', name: 'Information Technology' },
  { code: 'AIDS', name: 'Artificial Intelligence & Data Science' },
];

const ACADEMIC_YEARS = ['2026-2027', '2025-2026', '2024-2025', '2027-2028'];

export function Companies() {
  const { user } = useAuth();
  const { currentTheme } = useTheme();

  const isAdmin = ['SUPER_ADMIN', 'TPO_OFFICER', 'ADMIN'].includes(user?.roleName);
  const isStudent = user?.roleName === 'STUDENT';

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState('ALL');

  // Admin Student Simulation filter (preview what specific dept sees)
  const [adminSimulateDept, setAdminSimulateDept] = useState('NONE');

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [viewDossierCompany, setViewDossierCompany] = useState(null);

  // Applying state
  const [applyingCompanyId, setApplyingCompanyId] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const defaultFormData = {
    name: '',
    industry: 'Information Technology & Software',
    tier: 'REGULAR',
    status: 'ACTIVE',
    rating: 4.5,
    website: '',
    headquarters: '',
    contact_email: '',
    contact_phone: '',
    description: '',
    eligible_departments: ['CSE', 'ECE', 'IT'],
    academic_year: '2026-2027',
    eligible_student_count: 60,
    min_cgpa: 6.5,
    package_ctc: 10.0,
    drive_date: '2026-11-25',
    drive_venue: 'Main Campus Placement Block',
    drive_mode: 'ON_CAMPUS',
    selection_stage: 'Online Assessment',
    selection_rounds: ['Resume Screening', 'Online Coding Assessment', 'Technical Interview', 'HR Discussion'],
    application_deadline: '2026-11-20T23:59',
  };

  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    fetchCompanies();
  }, [tierFilter, deptFilter, yearFilter, search, adminSimulateDept]);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const params = {};
      if (tierFilter !== 'ALL') params.tier = tierFilter;
      if (search) params.search = search;

      // Handle Department filter
      if (adminSimulateDept !== 'NONE') {
        params.viewAsRole = 'STUDENT';
        params.viewAsDept = adminSimulateDept;
      } else if (deptFilter !== 'ALL') {
        params.department = deptFilter;
      }

      // Handle Academic Year filter
      if (yearFilter !== 'ALL') {
        params.academic_year = yearFilter;
      }

      const res = await apiClient.get('/companies', { params });
      setCompanies(res.data.data || []);
    } catch (err) {
      console.error('Failed to load placement companies:', err);
    } finally {
      setLoading(false);
    }
  };

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setSelectedCompanyId(null);
    setFormData(defaultFormData);
    setIsAddEditModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (comp) => {
    setModalMode('edit');
    setSelectedCompanyId(comp.id);

    let depts = comp.eligible_departments || ['CSE', 'ECE', 'IT'];
    if (typeof depts === 'string') {
      try {
        depts = JSON.parse(depts);
      } catch (e) {
        depts = depts.split(',');
      }
    }

    let rounds = comp.selection_rounds || ['Online Assessment', 'Technical Interview'];
    if (typeof rounds === 'string') {
      try {
        rounds = JSON.parse(rounds);
      } catch (e) {
        rounds = rounds.split(',');
      }
    }

    setFormData({
      name: comp.name || '',
      industry: comp.industry || 'Information Technology',
      tier: comp.tier || 'REGULAR',
      status: comp.status || 'ACTIVE',
      rating: comp.rating || 4.5,
      website: comp.website || '',
      headquarters: comp.headquarters || '',
      contact_email: comp.contact_email || '',
      contact_phone: comp.contact_phone || '',
      description: comp.description || '',
      eligible_departments: depts,
      academic_year: comp.academic_year || '2026-2027',
      eligible_student_count: comp.eligible_student_count || comp.configured_eligible_quota || 60,
      min_cgpa: comp.min_cgpa || 6.5,
      package_ctc: comp.package_ctc || 10.0,
      drive_date: comp.drive_date ? comp.drive_date.split('T')[0] : '2026-11-25',
      drive_venue: comp.drive_venue || 'Main Campus Placement Block',
      drive_mode: comp.drive_mode || 'ON_CAMPUS',
      selection_stage: comp.selection_stage || 'Online Assessment',
      selection_rounds: rounds,
      application_deadline: comp.application_deadline ? comp.application_deadline.slice(0, 16) : '',
    });

    setIsAddEditModalOpen(true);
  };

  // Handle Form Submit (Add or Edit)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      alert('Company Name is required.');
      return;
    }
    if (!formData.industry?.trim()) {
      alert('Industry Domain is required.');
      return;
    }
    setIsSubmitting(true);
    try {
      if (modalMode === 'create') {
        await apiClient.post('/companies', formData);
        setFeedbackMessage({ type: 'success', text: `Placement Company '${formData.name}' created successfully.` });
      } else {
        await apiClient.put(`/companies/${selectedCompanyId}`, formData);
        setFeedbackMessage({ type: 'success', text: `Company '${formData.name}' updated with new eligibility and quota.` });
      }
      setIsAddEditModalOpen(false);
      fetchCompanies();
      setTimeout(() => setFeedbackMessage(null), 5000);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to save company details.';
      alert(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleDeleteCompany = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove placement partner '${name}'? This will also remove associated drives.`)) {
      return;
    }
    try {
      await apiClient.delete(`/companies/${id}`);
      setFeedbackMessage({ type: 'success', text: `Company '${name}' deleted successfully.` });
      fetchCompanies();
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete company.');
    }
  };

  // Handle Student Apply for Drive
  const handleApplyDrive = async (companyId, companyName) => {
    setApplyingCompanyId(companyId);
    try {
      const res = await apiClient.post(`/companies/${companyId}/apply`);
      setFeedbackMessage({
        type: 'success',
        text: res.data.message || `Application for ${companyName} placement drive submitted successfully!`,
      });
      fetchCompanies();
      setTimeout(() => setFeedbackMessage(null), 6000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit drive application.');
    } finally {
      setApplyingCompanyId(null);
    }
  };

  // Department checkbox toggle helper
  const toggleDepartment = (deptCode) => {
    setFormData((prev) => {
      const current = prev.eligible_departments || [];
      if (current.includes(deptCode)) {
        return { ...prev, eligible_departments: current.filter((d) => d !== deptCode) };
      } else {
        return { ...prev, eligible_departments: [...current, deptCode] };
      }
    });
  };

  const selectAllDepartments = () => {
    setFormData((prev) => ({
      ...prev,
      eligible_departments: ALL_DEPARTMENTS.map((d) => d.code),
    }));
  };

  const clearAllDepartments = () => {
    setFormData((prev) => ({
      ...prev,
      eligible_departments: [],
    }));
  };

  // Metrics summary
  const totalCompaniesCount = companies.length;
  const superDreamCount = companies.filter((c) => c.tier === 'SUPER_DREAM' || c.tier === 'DREAM').length;
  const totalQuotaCapacity = companies.reduce((acc, c) => acc + (parseInt(c.configured_eligible_quota) || 0), 0);
  const nextDriveDate = companies.filter((c) => c.drive_date).map((c) => c.drive_date.split('T')[0]).sort()[0] || 'TBD';

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Heading */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl text-white shadow-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white"
              style={{ backgroundColor: currentTheme.primary }}
            >
              Recruitment Cell
            </span>
            <span className="text-xs text-slate-300 font-medium">Placement Governance System</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Placement Companies & Corporate Partners
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            {isStudent
              ? `Personalized student clearance: Displaying placement drives open to your branch and graduation batch.`
              : `Administrator directory for managing campus recruitment partners, setting branch eligibility, academic year cohorts, and student quota capacity.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isAdmin && (
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Placement Company
            </button>
          )}
        </div>
      </div>

      {/* Student Profile Context Card (shown when Student is logged in) */}
      {isStudent && (
        <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-emerald-50/80 border border-blue-200/80 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">
                  {user.firstName} {user.lastName}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[11px] font-bold">
                  ID: {user.registerNumber || user.studentId || '2023CSE001'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-0.5">
                <span>
                  Department: <strong className="text-blue-700">{user.departmentCode || 'CSE'}</strong>
                </span>
                <span>•</span>
                <span>
                  Academic Year: <strong className="text-blue-700">{user.academicYear || '2026-2027'}</strong>
                </span>
                <span>•</span>
                <span>
                  CGPA: <strong className="text-emerald-700">{user.cgpa || '9.35'}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 bg-white/80 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Showing <strong className="text-slate-900">{companies.length}</strong> placement drives eligible for your branch & batch
            </span>
          </div>
        </div>
      )}

      {/* Global Feedback Banner */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-xs font-bold hover:underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Metric Counters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Available Companies</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalCompaniesCount}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Corporate partners active</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Dream & Super Dream</span>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-700">{superDreamCount}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">&gt; 10 LPA Tier roles</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Eligible Student Quota</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{totalQuotaCapacity}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Configured seats across drives</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Next Scheduled Drive</span>
            <CalendarDays className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-lg font-black text-amber-700 truncate">{nextDriveDate}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Upcoming campus assessment</p>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search companies by name, industry, headquarters, or venue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Department Filter (Admin view) */}
            {isAdmin && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 text-[11px] font-medium hidden sm:inline">Dept:</span>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-700"
                >
                  <option value="ALL">All Departments</option>
                  {ALL_DEPARTMENTS.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Academic Year Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[11px] font-medium hidden sm:inline">Batch / Year:</span>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-700"
              >
                <option value="ALL">All Academic Years</option>
                {ACADEMIC_YEARS.map((y) => (
                  <option key={y} value={y}>
                    AY {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Hiring Tier Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[11px] font-medium hidden sm:inline">Tier:</span>
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-700"
              >
                <option value="ALL">All Hiring Tiers</option>
                <option value="SUPER_DREAM">Super Dream (&gt; 20 LPA)</option>
                <option value="DREAM">Dream (10 - 20 LPA)</option>
                <option value="REGULAR">Regular (&lt; 10 LPA)</option>
                <option value="MASS_RECRUITER">Mass Recruiter</option>
              </select>
            </div>
          </div>
        </div>

        {/* Administrator Student Simulator Switcher */}
        {isAdmin && (
          <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded font-bold text-[10px] uppercase">
                Admin Simulation Tool
              </span>
              <span>Test Department Visibility View:</span>
              <select
                value={adminSimulateDept}
                onChange={(e) => setAdminSimulateDept(e.target.value)}
                className="px-2.5 py-1 rounded border border-amber-300 bg-amber-50/70 text-slate-800 font-semibold"
              >
                <option value="NONE">Disabled (Viewing all companies)</option>
                <option value="CSE">Simulate CSE Student Portal</option>
                <option value="MECH">Simulate MECH Student Portal</option>
                <option value="ECE">Simulate ECE Student Portal</option>
                <option value="CIVIL">Simulate CIVIL Student Portal</option>
                <option value="IT">Simulate IT Student Portal</option>
              </select>
            </div>

            {adminSimulateDept !== 'NONE' && (
              <span className="text-amber-700 font-semibold text-[11px]">
                Showing only companies configured for {adminSimulateDept} students!
              </span>
            )}
          </div>
        )}
      </div>

      {/* Companies Grid */}
      {loading ? (
        <LoadingSpinner text="Retrieving verified placement company listings..." />
      ) : companies.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">No Placement Companies Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {isStudent
              ? `There are currently no active placement drives configured for branch '${user.departmentCode}' and academic year '${user.academicYear}'. Please check back as the placement season progresses.`
              : `No companies match the selected search and filter criteria. You can register a new company profile above.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-5">
          {companies.map((comp) => {
            const depts = Array.isArray(comp.eligible_departments)
              ? comp.eligible_departments
              : typeof comp.eligible_departments === 'string'
              ? JSON.parse(comp.eligible_departments || '[]')
              : ['CSE', 'ECE', 'IT'];

            const rounds = Array.isArray(comp.selection_rounds)
              ? comp.selection_rounds
              : typeof comp.selection_rounds === 'string'
              ? JSON.parse(comp.selection_rounds || '[]')
              : ['Online Assessment', 'Technical Interview', 'HR Discussion'];

            const quota = comp.configured_eligible_quota || comp.eligible_student_count || 60;
            const matchingCount = comp.enrolled_matching_students_count || 0;
            const capacityPercent = Math.min(100, Math.round((matchingCount / quota) * 100));

            const isStudentDeptEligible = isStudent ? depts.includes(user.departmentCode) : true;
            const meetsCgpa = isStudent ? parseFloat(user.cgpa || 0) >= parseFloat(comp.min_cgpa || 0) : true;

            return (
              <div
                key={comp.id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-400/80 shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden group"
              >
                {/* Card Header & Badges */}
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-indigo-900 text-white flex items-center justify-center font-black text-lg shadow-sm">
                        {comp.name[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors">
                          {comp.name}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">{comp.industry}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <StatusBadge status={comp.tier} />
                      <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        ₹{comp.package_ctc || '12.00'} LPA
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {comp.description || 'Global industry leader participating in campus placement drives.'}
                  </p>

                  {/* Key Metadata: Departments & Academic Year */}
                  <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100 space-y-2.5 text-xs">
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1.5">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-blue-600" /> Eligible Departments ({depts.length}):
                        </span>
                        <span className="text-slate-700 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                          Batch: {comp.academic_year || '2026-2027'}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {depts.map((d) => {
                          const isCurrentStudentDept = isStudent && user.departmentCode === d;
                          return (
                            <span
                              key={d}
                              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                                isCurrentStudentDept
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-white text-slate-700 border border-slate-200'
                              }`}
                            >
                              {isCurrentStudentDept && '✓ '}
                              {d}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Enrolled Students Capacity & Quota */}
                    <div className="pt-2 border-t border-slate-200/60">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-slate-500">
                          Configured Student Quota: <strong className="text-slate-800">{quota} Students</strong>
                        </span>
                        <span className="text-blue-700 font-bold">
                          {matchingCount} Eligible Enrolled ({capacityPercent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all"
                          style={{ width: `${capacityPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Eligibility Criteria Check */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 text-[11px]">
                      <span className="text-slate-500">
                        Min CGPA Cutoff: <strong className="text-slate-800">{comp.min_cgpa || '6.50'}</strong>
                      </span>

                      {isStudent && (
                        <div>
                          {meetsCgpa ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" /> You Meet Criteria ({user.cgpa} &ge; {comp.min_cgpa})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              <XCircle className="w-3.5 h-3.5" /> Requires {comp.min_cgpa} (Yours: {user.cgpa})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Placement Drive Schedule Details */}
                  <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between font-semibold text-slate-800 text-[11px]">
                      <span className="flex items-center gap-1.5 text-blue-900 font-bold">
                        <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
                        Drive Date: {comp.drive_date?.split('T')[0] || '2026-11-25'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                        {comp.drive_mode || 'ON_CAMPUS'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-600">
                      <span className="flex items-center gap-1 truncate max-w-[240px]">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        {comp.drive_venue || 'Main Campus Placement Cell'}
                      </span>
                      <span className="font-semibold text-slate-700">
                        Current: <strong className="text-blue-700">{comp.selection_stage || 'Online Assessment'}</strong>
                      </span>
                    </div>

                    {/* Recruitment Stages Mini Stepper */}
                    {rounds && rounds.length > 0 && (
                      <div className="pt-1.5 border-t border-blue-100/70 flex items-center gap-1 overflow-x-auto text-[10px] text-slate-500">
                        {rounds.map((rnd, idx) => (
                          <span
                            key={idx}
                            className="shrink-0 bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700 font-medium"
                          >
                            {idx + 1}. {rnd}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs">
                  {/* Left: Star Rating and Dossier button */}
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-amber-600 font-bold text-xs bg-white px-2 py-1 rounded border border-slate-200">
                      <Star className="w-3.5 h-3.5 fill-current" /> {comp.rating || '4.5'}
                    </span>
                    <button
                      onClick={() => setViewDossierCompany(comp)}
                      className="text-slate-600 hover:text-blue-600 font-semibold text-xs hover:underline cursor-pointer"
                    >
                      View Dossier
                    </button>
                  </div>

                  {/* Right Actions: Admin Edit/Delete vs Student Apply */}
                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => handleOpenEditModal(comp)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-lg border border-slate-200 transition-colors cursor-pointer text-xs"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-blue-600" /> Edit
                        </button>

                        <button
                          onClick={() => handleDeleteCompany(comp.id, comp.name)}
                          className="p-1.5 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                          title="Delete Company"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {isStudent && (
                      <div>
                        {comp.has_applied ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg font-bold text-xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Registered ({comp.application_status || 'APPLIED'})
                          </span>
                        ) : meetsCgpa ? (
                          <button
                            onClick={() => handleApplyDrive(comp.id, comp.name)}
                            disabled={applyingCompanyId === comp.id}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {applyingCompanyId === comp.id ? (
                              'Submitting...'
                            ) : (
                              <>
                                Apply for Drive <ChevronRight className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            disabled
                            className="px-3 py-1.5 bg-slate-200 text-slate-500 font-semibold rounded-lg text-xs cursor-not-allowed"
                            title="You do not meet the minimum CGPA cutoff."
                          >
                            CGPA Cutoff Unmet
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Placement Company Modal */}
      <Modal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        title={modalMode === 'create' ? 'Register New Placement Company' : `Edit Placement Company: ${formData.name}`}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSubmitForm} className="space-y-5 text-xs max-h-[75vh] overflow-y-auto pr-1">
          {/* Section 1: Company Profile */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 pb-1 border-b border-slate-100">
              <Building2 className="w-4 h-4 text-blue-600" /> Corporate Profile & Recruiter Contact
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Google India, Amazon, Infosys"
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Industry Domain *</label>
                <input
                  type="text"
                  required
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  placeholder="e.g. Information Technology & Cloud"
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Recruitment Tier</label>
                <select
                  value={formData.tier}
                  onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs bg-white"
                >
                  <option value="SUPER_DREAM">Super Dream (&gt; 20 LPA)</option>
                  <option value="DREAM">Dream (10 - 20 LPA)</option>
                  <option value="REGULAR">Regular (&lt; 10 LPA)</option>
                  <option value="MASS_RECRUITER">Mass Recruiter</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Website URL</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://company.com/careers"
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Headquarters</label>
                <input
                  type="text"
                  value={formData.headquarters}
                  onChange={(e) => setFormData({ ...formData, headquarters: e.target.value })}
                  placeholder="e.g. Bengaluru / Hyderabad"
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Recruiter Email</label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="campus-talent@company.com"
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  placeholder="+91 9876543210"
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company Description & Hiring Mission</label>
              <textarea
                rows="2"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Overview of company business model, technology stack, and student hiring goals..."
                className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Section 2: Department & Academic Year Eligibility */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 pb-1 border-b border-slate-100">
              <Layers className="w-4 h-4 text-emerald-600" /> Branch & Academic Year Eligibility Rules
            </h4>

            {/* Department Multi-Select */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold text-slate-700">
                  Select Eligible University Departments ({formData.eligible_departments?.length || 0} selected) *
                </label>
                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={selectAllDepartments}
                    className="text-blue-600 hover:underline font-semibold cursor-pointer"
                  >
                    Select All
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={clearAllDepartments}
                    className="text-slate-500 hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                {ALL_DEPARTMENTS.map((dept) => {
                  const isChecked = formData.eligible_departments?.includes(dept.code);
                  return (
                    <label
                      key={dept.code}
                      onClick={() => toggleDepartment(dept.code)}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                        isChecked
                          ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded text-blue-600"
                      />
                      <span>{dept.code}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Academic Year Cohort *</label>
                <select
                  value={formData.academic_year}
                  onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs bg-white"
                >
                  {ACADEMIC_YEARS.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Enrolled Students Quota Capacity *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="5000"
                  value={formData.eligible_student_count}
                  onChange={(e) => setFormData({ ...formData, eligible_student_count: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                />
                <span className="text-[10px] text-slate-400">Max candidates allowed to attend drive</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Minimum CGPA Cutoff</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="10"
                  value={formData.min_cgpa}
                  onChange={(e) => setFormData({ ...formData, min_cgpa: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Package / CTC (LPA) *</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  value={formData.package_ctc}
                  onChange={(e) => setFormData({ ...formData, package_ctc: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Partner Rating (Out of 5.0)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Placement Drive Schedule */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 pb-1 border-b border-slate-100">
              <CalendarDays className="w-4 h-4 text-purple-600" /> Placement Drive Schedule & Stages
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Drive Date *</label>
                <input
                  type="date"
                  required
                  value={formData.drive_date}
                  onChange={(e) => setFormData({ ...formData, drive_date: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Drive Mode</label>
                <select
                  value={formData.drive_mode}
                  onChange={(e) => setFormData({ ...formData, drive_mode: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs bg-white"
                >
                  <option value="ON_CAMPUS">On-Campus</option>
                  <option value="VIRTUAL">Virtual / Remote</option>
                  <option value="HYBRID">Hybrid (Coding Online + F2F Interviews)</option>
                  <option value="POOLED">Pooled Campus</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Current Drive Stage</label>
                <select
                  value={formData.selection_stage}
                  onChange={(e) => setFormData({ ...formData, selection_stage: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs bg-white"
                >
                  <option value="Registration Stage">Registration Stage</option>
                  <option value="Online Assessment">Online Assessment</option>
                  <option value="Technical Interviews">Technical Interviews</option>
                  <option value="Leadership & HR">Leadership & HR</option>
                  <option value="Offers Released">Offers Released</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Campus Venue / Assessment Link</label>
                <input
                  type="text"
                  value={formData.drive_venue}
                  onChange={(e) => setFormData({ ...formData, drive_venue: e.target.value })}
                  placeholder="e.g. Placement Auditorium & Computing Block"
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Application Deadline</label>
                <input
                  type="datetime-local"
                  value={formData.application_deadline}
                  onChange={(e) => setFormData({ ...formData, application_deadline: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* Modal Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsAddEditModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 text-white rounded-xl font-bold shadow-xs transition-all ${
                isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
              }`}
            >
              {isSubmitting
                ? 'Saving Details...'
                : modalMode === 'create'
                ? 'Save Placement Company'
                : 'Update Company & Eligibility'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Dossier Detail Modal */}
      {viewDossierCompany && (
        <Modal
          isOpen={!!viewDossierCompany}
          onClose={() => setViewDossierCompany(null)}
          title={`Corporate Dossier: ${viewDossierCompany.name}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg">
                  {viewDossierCompany.name[0]}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{viewDossierCompany.name}</h3>
                  <p className="text-slate-500">{viewDossierCompany.industry}</p>
                </div>
              </div>
              <StatusBadge status={viewDossierCompany.tier} />
            </div>

            <p className="text-slate-700 leading-relaxed">{viewDossierCompany.description}</p>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Package CTC</span>
                <span className="text-sm font-bold text-slate-900">₹{viewDossierCompany.package_ctc} LPA</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Academic Year</span>
                <span className="text-sm font-bold text-slate-900">{viewDossierCompany.academic_year}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Eligible Quota</span>
                <span className="text-sm font-bold text-slate-900">{viewDossierCompany.configured_eligible_quota} Enrolled Students</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Min CGPA Cutoff</span>
                <span className="text-sm font-bold text-slate-900">{viewDossierCompany.min_cgpa}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-slate-600">
              {viewDossierCompany.headquarters && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" /> Headquarters: {viewDossierCompany.headquarters}
                </div>
              )}
              {viewDossierCompany.website && (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-slate-400" />
                  <a href={viewDossierCompany.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                    {viewDossierCompany.website}
                  </a>
                </div>
              )}
              {viewDossierCompany.contact_email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" /> Recruiter: {viewDossierCompany.contact_email}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewDossierCompany(null)}
                className="px-4 py-1.5 bg-slate-800 text-white rounded-lg font-semibold cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
