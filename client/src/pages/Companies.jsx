import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, Badge } from '../components/Badge';
import { Modal, LoadingSpinner } from '../components/Modal';
import { CompanyManagementModal } from '../components/placement/CompanyManagementModal';
import { StudentCompanyDetailsModal } from '../components/placement/StudentCompanyDetailsModal';
import { StudentApplyConfirmModal } from '../components/placement/StudentApplyConfirmModal';
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
  ArrowRight,
  ShieldCheck,
  FileCheck2,
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
  const navigate = useNavigate();
  const { user } = useAuth();

  const isAdmin = ['SUPER_ADMIN', 'TPO_OFFICER', 'ADMIN'].includes(user?.roleName);
  const isStudent = user?.roleName === 'STUDENT';

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState('ALL');

  // Student Logical Category Tab: 'ELIGIBLE' | 'APPLIED' | 'INELIGIBLE' | 'ALL'
  const [studentCategoryTab, setStudentCategoryTab] = useState('ELIGIBLE');

  // Admin Student Simulation filter (preview what specific dept sees)
  const [adminSimulateDept, setAdminSimulateDept] = useState('NONE');

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [viewDossierCompany, setViewDossierCompany] = useState(null);

  // Placement Officer Company Management Drawer / Modal (All 6 tabs)
  const [manageCompanyId, setManageCompanyId] = useState(null);

  // Student Detail & Application Modals
  const [studentDetailsCompany, setStudentDetailsCompany] = useState(null);
  const [applyConfirmCompany, setApplyConfirmCompany] = useState(null);
  const [withdrawingCompanyId, setWithdrawingCompanyId] = useState(null);

  // Applying state
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
      eligible_student_count: comp.configured_eligible_quota || comp.eligible_student_count || 60,
      min_cgpa: comp.min_cgpa || 6.5,
      package_ctc: comp.package_ctc || 10.0,
      drive_date: comp.drive_date ? comp.drive_date.split('T')[0] : '2026-11-25',
      drive_venue: comp.drive_venue || 'Main Campus Placement Block',
      drive_mode: comp.drive_mode || 'ON_CAMPUS',
      selection_stage: comp.selection_stage || 'Online Assessment',
      selection_rounds: rounds,
      application_deadline: comp.application_deadline ? comp.application_deadline.slice(0, 16) : '2026-11-20T23:59',
    });
    setIsAddEditModalOpen(true);
  };

  // Submit Create or Edit Form
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (modalMode === 'create') {
        await apiClient.post('/companies', formData);
        setFeedbackMessage({ type: 'success', text: `Company '${formData.name}' registered successfully!` });
      } else {
        await apiClient.put(`/companies/${selectedCompanyId}`, formData);
        setFeedbackMessage({ type: 'success', text: `Company '${formData.name}' updated successfully!` });
      }
      setIsAddEditModalOpen(false);
      fetchCompanies();
      setTimeout(() => setFeedbackMessage(null), 5000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save company information.');
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

  // Student Confirm and Submit Application
  const handleConfirmApply = async (companyId) => {
    setIsSubmitting(true);
    try {
      const res = await apiClient.post(`/companies/${companyId}/apply`);
      const resData = res.data?.data;
      setFeedbackMessage({
        type: 'success',
        text: `Application submitted successfully! Application ID: ${resData?.application_id ? `#APPL-${resData.application_id}` : 'Confirmed'}. You can track your progression under My Applications.`,
      });
      setApplyConfirmCompany(null);
      if (studentDetailsCompany && studentDetailsCompany.id === companyId) {
        setStudentDetailsCompany({
          ...studentDetailsCompany,
          has_applied: true,
          application_status: 'APPLIED',
          application_id: resData?.application_id,
        });
      }
      fetchCompanies();
      setTimeout(() => setFeedbackMessage(null), 8000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit drive application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Student Withdraw Application before deadline
  const handleWithdrawCompany = async (companyId) => {
    if (!window.confirm('Are you sure you want to withdraw your application for this placement drive?')) {
      return;
    }
    setWithdrawingCompanyId(companyId);
    try {
      const res = await apiClient.post(`/companies/${companyId}/withdraw`);
      setFeedbackMessage({
        type: 'success',
        text: res.data?.message || 'Application withdrawn successfully.',
      });
      if (studentDetailsCompany && studentDetailsCompany.id === companyId) {
        setStudentDetailsCompany(null);
      }
      fetchCompanies();
      setTimeout(() => setFeedbackMessage(null), 6000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to withdraw application.');
    } finally {
      setWithdrawingCompanyId(null);
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

  // Student 3 Logical Categories Computation
  const eligibleCompanies = companies.filter((c) => !c.has_applied && c.is_eligible !== false);
  const appliedCompanies = companies.filter((c) => c.has_applied);
  const ineligibleCompanies = companies.filter((c) => !c.has_applied && c.is_eligible === false);

  const displayedCompanies = isStudent
    ? studentCategoryTab === 'ELIGIBLE'
      ? eligibleCompanies
      : studentCategoryTab === 'APPLIED'
      ? appliedCompanies
      : studentCategoryTab === 'INELIGIBLE'
      ? ineligibleCompanies
      : companies
    : companies;

  // Metrics summary
  const totalCompaniesCount = companies.length;
  const superDreamCount = companies.filter((c) => c.tier === 'SUPER_DREAM' || c.tier === 'DREAM').length;
  const totalQuotaCapacity = companies.reduce((acc, c) => acc + (parseInt(c.configured_eligible_quota) || 0), 0);
  const nextDriveDate = companies.filter((c) => c.drive_date).map((c) => c.drive_date.split('T')[0]).sort()[0] || 'TBD';

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Heading - Clean Neutral Styling */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-secondary border border-border p-6 rounded-2xl text-foreground">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-card text-foreground border border-border">
              Recruitment Cell
            </span>
            <span className="text-xs text-muted-foreground font-medium">Placement Governance System</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            Placement Companies & Corporate Partners
          </h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
            {isStudent
              ? 'Personalized student clearance: Displaying placement drives open to your branch and graduation batch.'
              : 'Administrator directory for managing campus recruitment partners, setting branch eligibility, academic year cohorts, and student quota capacity.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isAdmin && (
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:opacity-90 text-primary-foreground rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" /> Add Placement Company
            </button>
          )}
        </div>
      </div>

      {/* Student Profile Context Card - Strict Neutral */}
      {isStudent && (
        <div className="bg-card border border-border p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-xs">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground text-sm">
                  {user.firstName} {user.lastName}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-secondary text-foreground text-[11px] font-bold border border-border">
                  ID: {user.registerNumber || user.studentId || '2023CSE001'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span>
                  Department: <strong className="text-foreground">{user.departmentCode || 'CSE'}</strong>
                </span>
                <span>•</span>
                <span>
                  Academic Year: <strong className="text-foreground">{user.academicYear || '2026-2027'}</strong>
                </span>
                <span>•</span>
                <span>
                  CGPA: <strong className="text-foreground">{user.cgpa || '9.35'}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card px-3 py-1.5 rounded-lg border border-border">
            <CheckCircle2 className="w-4 h-4 text-foreground shrink-0" />
            <span>
              Showing <strong className="text-foreground">{companies.length}</strong> placement drives eligible for your branch & batch
            </span>
          </div>
        </div>
      )}

      {/* Global Feedback Banner */}
      {feedbackMessage && (
        <div className="p-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-foreground flex items-center justify-between transition-all">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-foreground" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-foreground" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-xs font-bold hover:underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Metric Counters Grid - Pure Monochrome */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-xl border border-border shadow-xs hover:border-neutral-400 dark:hover:border-neutral-600 transition-all">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold">Available Companies</span>
            <Building2 className="w-4 h-4 text-foreground" />
          </div>
          <div className="text-2xl font-black text-foreground">{totalCompaniesCount}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Corporate partners active</p>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border shadow-xs hover:border-neutral-400 dark:hover:border-neutral-600 transition-all">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold">Dream & Super Dream</span>
            <Sparkles className="w-4 h-4 text-foreground" />
          </div>
          <div className="text-2xl font-black text-foreground">{superDreamCount}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">&gt; 10 LPA Tier roles</p>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border shadow-xs hover:border-neutral-400 dark:hover:border-neutral-600 transition-all">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold">Eligible Student Quota</span>
            <Users className="w-4 h-4 text-foreground" />
          </div>
          <div className="text-2xl font-black text-foreground">{totalQuotaCapacity}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Configured seats across drives</p>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border shadow-xs hover:border-neutral-400 dark:hover:border-neutral-600 transition-all">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold">Next Scheduled Drive</span>
            <CalendarDays className="w-4 h-4 text-foreground" />
          </div>
          <div className="text-lg font-black text-foreground truncate">{nextDriveDate}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Upcoming campus assessment</p>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-card p-4 rounded-xl border border-border shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search companies by name, industry, headquarters, or venue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-neutral-400"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Department Filter (Admin view) */}
            {isAdmin && (
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground text-[11px] font-medium hidden sm:inline">Dept:</span>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-border bg-secondary font-medium text-foreground"
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
              <span className="text-muted-foreground text-[11px] font-medium hidden sm:inline">Cohort:</span>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-border bg-secondary font-medium text-foreground"
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
              <span className="text-muted-foreground text-[11px] font-medium hidden sm:inline">Tier:</span>
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-border bg-secondary font-medium text-foreground"
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
          <div className="pt-2.5 border-t border-border flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-neutral-200 dark:bg-neutral-800 text-foreground rounded font-bold text-[10px] uppercase border border-border">
                Admin Simulation Tool
              </span>
              <span>Test Department Visibility View:</span>
              <select
                value={adminSimulateDept}
                onChange={(e) => setAdminSimulateDept(e.target.value)}
                className="px-2.5 py-1 rounded border border-border bg-secondary text-foreground font-semibold"
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
              <span className="text-foreground font-semibold text-[11px]">
                Showing only companies configured for {adminSimulateDept} students!
              </span>
            )}
          </div>
        )}
      </div>

      {/* Student 3 Logical Categories Navigation Tabs - Strict B&W */}
      {isStudent && (
        <div className="bg-card p-2.5 rounded-2xl border border-border space-y-2">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-secondary rounded-xl">
            <button
              onClick={() => setStudentCategoryTab('ELIGIBLE')}
              className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                studentCategoryTab === 'ELIGIBLE'
                  ? 'bg-[#171717] text-[#fafafa] dark:bg-[#fafafa] dark:text-[#0a0a0a] shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-neutral-200 dark:hover:bg-neutral-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Eligible Companies</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                studentCategoryTab === 'ELIGIBLE'
                  ? 'bg-neutral-700 text-white dark:bg-neutral-300 dark:text-black'
                  : 'bg-neutral-200 dark:bg-neutral-700 text-foreground'
              }`}>
                {eligibleCompanies.length}
              </span>
            </button>

            <button
              onClick={() => setStudentCategoryTab('APPLIED')}
              className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                studentCategoryTab === 'APPLIED'
                  ? 'bg-[#171717] text-[#fafafa] dark:bg-[#fafafa] dark:text-[#0a0a0a] shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-neutral-200 dark:hover:bg-neutral-800'
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Applied Companies</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                studentCategoryTab === 'APPLIED'
                  ? 'bg-neutral-700 text-white dark:bg-neutral-300 dark:text-black'
                  : 'bg-neutral-200 dark:bg-neutral-700 text-foreground'
              }`}>
                {appliedCompanies.length}
              </span>
            </button>

            <button
              onClick={() => setStudentCategoryTab('INELIGIBLE')}
              className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                studentCategoryTab === 'INELIGIBLE'
                  ? 'bg-[#171717] text-[#fafafa] dark:bg-[#fafafa] dark:text-[#0a0a0a] shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-neutral-200 dark:hover:bg-neutral-800'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Ineligible Companies</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                studentCategoryTab === 'INELIGIBLE'
                  ? 'bg-neutral-700 text-white dark:bg-neutral-300 dark:text-black'
                  : 'bg-neutral-200 dark:bg-neutral-700 text-foreground'
              }`}>
                {ineligibleCompanies.length}
              </span>
            </button>

            <button
              onClick={() => setStudentCategoryTab('ALL')}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                studentCategoryTab === 'ALL'
                  ? 'bg-[#171717] text-[#fafafa] dark:bg-[#fafafa] dark:text-[#0a0a0a] shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-neutral-200 dark:hover:bg-neutral-800'
              }`}
            >
              <span>All ({companies.length})</span>
            </button>
          </div>

          <div className="px-3 py-1 text-[11px] text-muted-foreground flex items-center justify-between">
            <span>
              {studentCategoryTab === 'ELIGIBLE' && 'Showing recruitment drives that match your department, graduation year, and minimum CGPA.'}
              {studentCategoryTab === 'APPLIED' && 'Showing placement drives you have applied for. Track multi-stage progression in My Applications.'}
              {studentCategoryTab === 'INELIGIBLE' && 'Showing companies with restrictions (branch restriction, CGPA cutoff unmet, or max active backlogs).'}
              {studentCategoryTab === 'ALL' && 'Viewing all university corporate recruitment drives.'}
            </span>
            <span className="font-semibold text-foreground">
              {displayedCompanies.length} opportunities listed
            </span>
          </div>
        </div>
      )}

      {/* Companies Grid */}
      {loading ? (
        <LoadingSpinner text="Retrieving verified placement company listings..." />
      ) : displayedCompanies.length === 0 ? (
        <div className="bg-card p-12 text-center rounded-2xl border border-border space-y-3">
          <div className="w-12 h-12 rounded-full bg-secondary text-muted-foreground mx-auto flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-foreground text-sm">
            {isStudent && studentCategoryTab === 'APPLIED'
              ? 'No Applications Submitted Yet'
              : isStudent && studentCategoryTab === 'INELIGIBLE'
              ? 'No Ineligible Companies Found'
              : 'No Placement Companies Found'}
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            {isStudent && studentCategoryTab === 'APPLIED'
              ? 'You have not submitted applications to any placement drives yet. Switch to "Eligible Companies" to browse and apply for open opportunities.'
              : isStudent
              ? `There are currently no placement drives matching this view for branch '${user.departmentCode}' and academic year '${user.academicYear}'.`
              : 'No companies match the selected search and filter criteria. You can register a new company profile above.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-5">
          {displayedCompanies.map((comp) => {
            const depts = Array.isArray(comp.eligible_departments)
              ? comp.eligible_departments
              : typeof comp.eligible_departments === 'string'
              ? JSON.parse(comp.eligible_departments || '[]')
              : ['CSE', 'ECE', 'IT'];

            const rounds = Array.isArray(comp.selection_rounds)
              ? comp.selection_rounds
              : typeof comp.selection_rounds === 'string'
              ? JSON.parse(comp.selection_rounds || '[]')
              : ['Resume Screening', 'Online Coding Assessment', 'Technical Interview', 'HR Discussion'];

            const quota = comp.configured_eligible_quota || comp.eligible_student_count || 60;
            const matchingCount = comp.enrolled_matching_students_count || 0;
            const capacityPercent = Math.min(100, Math.round((matchingCount / quota) * 100));

            const isStudentDeptEligible = isStudent ? depts.includes(user.departmentCode) : true;
            const meetsCgpa = isStudent ? parseFloat(user.cgpa || 0) >= parseFloat(comp.min_cgpa || 0) : true;
            const isEligible = comp.is_eligible !== false;
            const hasApplied = comp.has_applied;

            return (
              <div
                key={comp.id}
                className="bg-card rounded-2xl border border-border hover:border-neutral-400 dark:hover:border-neutral-600 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
              >
                {/* Card Header & Badges */}
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#171717] text-[#fafafa] dark:bg-[#fafafa] dark:text-[#0a0a0a] flex items-center justify-center font-black text-lg shadow-xs">
                        {comp.name[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-foreground group-hover:underline transition-colors">
                          {comp.name}
                        </h3>
                        <p className="text-xs text-muted-foreground font-medium">
                          {comp.job_title ? `${comp.job_title} • ` : ''}{comp.industry}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <StatusBadge status={comp.tier} />
                      <span className="text-xs font-black text-foreground bg-secondary px-2 py-0.5 rounded-md border border-border">
                        ₹{comp.package_ctc || '12.00'} LPA
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {comp.description || 'Global industry leader participating in campus placement drives.'}
                  </p>

                  {/* Key Metadata: Departments & Academic Year */}
                  <div className="bg-secondary rounded-xl p-3.5 border border-border space-y-2.5 text-xs">
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground mb-1.5">
                        <span className="flex items-center gap-1 text-foreground">
                          <Layers className="w-3.5 h-3.5 text-foreground" /> Eligible Departments ({depts.length}):
                        </span>
                        <span className="text-foreground font-bold bg-card px-2 py-0.5 rounded border border-border">
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
                                  ? 'bg-[#171717] text-[#fafafa] dark:bg-[#fafafa] dark:text-[#0a0a0a] shadow-xs'
                                  : 'bg-card text-foreground border border-border'
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
                    <div className="pt-2 border-t border-border">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-muted-foreground">
                          Configured Student Quota: <strong className="text-foreground">{quota} Students</strong>
                        </span>
                        <span className="text-foreground font-bold">
                          {matchingCount} Eligible Enrolled ({capacityPercent}%)
                        </span>
                      </div>
                      <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-neutral-900 dark:bg-neutral-100 h-full rounded-full transition-all"
                          style={{ width: `${capacityPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Eligibility Criteria Check */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 text-[11px]">
                      <span className="text-muted-foreground">
                        Min CGPA Cutoff: <strong className="text-foreground">{comp.min_cgpa || '6.50'}</strong>
                      </span>

                      {isStudent && (
                        <div>
                          {meetsCgpa && isStudentDeptEligible ? (
                            <span className="inline-flex items-center gap-1 text-foreground font-bold bg-card px-2 py-0.5 rounded border border-border">
                              <CheckCircle2 className="w-3.5 h-3.5 text-foreground" /> You Meet Criteria ({user.cgpa} &ge; {comp.min_cgpa})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-muted-foreground font-bold bg-card px-2 py-0.5 rounded border border-border">
                              <XCircle className="w-3.5 h-3.5 text-foreground" /> Cutoff {comp.min_cgpa} (Yours: {user.cgpa})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Placement Drive Schedule Details */}
                  <div className="rounded-xl border border-border bg-card p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between font-semibold text-foreground text-[11px]">
                      <span className="flex items-center gap-1.5 font-bold">
                        <CalendarDays className="w-3.5 h-3.5 text-foreground" />
                        Drive Date: {comp.drive_date?.split('T')[0] || '2026-11-25'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-secondary text-foreground text-[10px] font-bold border border-border">
                        {comp.drive_mode || 'ON_CAMPUS'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1 truncate max-w-[240px]">
                        <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                        {comp.drive_venue || 'Main Campus Placement Cell'}
                      </span>
                      <span className="font-semibold text-foreground">
                        Current: <strong>{comp.selection_stage || 'Online Assessment'}</strong>
                      </span>
                    </div>

                    {/* Recruitment Stages Mini Stepper */}
                    {rounds && rounds.length > 0 && (
                      <div className="pt-1.5 border-t border-border flex items-center gap-1 overflow-x-auto text-[10px] text-muted-foreground">
                        {rounds.map((rnd, idx) => {
                          const roundLabel = typeof rnd === 'string' ? rnd : (rnd.round_name || `Round ${idx + 1}`);
                          return (
                            <span
                              key={idx}
                              className="shrink-0 bg-secondary px-2 py-0.5 rounded border border-border text-foreground font-medium"
                            >
                              {idx + 1}. {roundLabel}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Ineligible Alert Banner (if student is ineligible) */}
                  {isStudent && !hasApplied && !isEligible && (
                    <div className="rounded-xl border border-border bg-secondary p-3 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-foreground text-[11px]">
                        <AlertTriangle className="w-4 h-4 text-foreground shrink-0" />
                        <span>Ineligibility Notice</span>
                      </div>
                      <ul className="list-disc list-inside text-[11px] text-muted-foreground pl-1 space-y-0.5">
                        {(comp.ineligibility_reasons || ['Branch or academic criteria unmet']).map((reason, i) => (
                          <li key={i}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Registered Status Banner (if student already applied) */}
                  {isStudent && hasApplied && (
                    <div className="rounded-xl border border-border bg-secondary p-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-foreground shrink-0" />
                        <div>
                          <span className="font-bold text-foreground text-xs">Application Submitted</span>
                          <span className="text-[11px] text-muted-foreground block">
                            App ID: #{comp.application_id || 'REGISTERED'} • Status: {comp.application_status || 'APPLIED'} • Round {comp.current_round || 1}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate('/applications')}
                        className="px-2.5 py-1 bg-[#171717] hover:bg-[#262626] text-[#fafafa] dark:bg-[#fafafa] dark:hover:bg-[#e5e5e5] dark:text-[#0a0a0a] rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                      >
                        Track &rarr;
                      </button>
                    </div>
                  )}

                  {/* Placement Officer Pipeline Counters Box */}
                  {isAdmin && (
                    <div className="rounded-xl border border-border bg-secondary p-2.5 flex items-center justify-between text-[11px] font-semibold text-foreground">
                      <div className="flex items-center gap-3">
                        <span>Applicants: <strong className="text-foreground">{comp.total_applicants || 0}</strong></span>
                        <span>•</span>
                        <span>Shortlisted: <strong className="text-foreground">{comp.shortlisted_count || 0}</strong></span>
                        <span>•</span>
                        <span>Selected: <strong className="text-foreground">{comp.selected_count || 0}</strong></span>
                      </div>
                      <button
                        onClick={() => setManageCompanyId(comp.id)}
                        className="text-foreground hover:underline font-bold"
                      >
                        View Registered &rarr;
                      </button>
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="px-5 py-3.5 bg-secondary border-t border-border flex items-center justify-between text-xs">
                  {/* Left: Rating and Details button */}
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-foreground font-bold text-xs bg-card px-2 py-1 rounded border border-border">
                      <Star className="w-3.5 h-3.5 fill-current" /> {comp.rating || '4.5'}
                    </span>
                    <button
                      onClick={() => (isStudent ? setStudentDetailsCompany(comp) : setManageCompanyId(comp.id))}
                      className="text-muted-foreground hover:text-foreground font-semibold text-xs hover:underline cursor-pointer"
                    >
                      View Details
                    </button>
                  </div>

                  {/* Right Actions: Admin vs Student */}
                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => setManageCompanyId(comp.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#171717] hover:bg-[#262626] text-[#fafafa] dark:bg-[#fafafa] dark:hover:bg-[#e5e5e5] dark:text-[#0a0a0a] font-bold rounded-lg shadow-xs transition-colors cursor-pointer text-xs"
                          title="View registered students, review eligibility, schedule rounds, and publish results"
                        >
                          <Users className="w-3.5 h-3.5" /> Manage Company
                        </button>

                        <button
                          onClick={() => handleOpenEditModal(comp)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-card hover:bg-secondary text-foreground font-semibold rounded-lg border border-border transition-colors cursor-pointer text-xs"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-foreground" /> Edit
                        </button>

                        <button
                          onClick={() => handleDeleteCompany(comp.id, comp.name)}
                          className="p-1.5 bg-card hover:bg-neutral-200 dark:hover:bg-neutral-800 text-muted-foreground hover:text-foreground rounded-lg border border-border transition-colors cursor-pointer"
                          title="Delete Company"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {isStudent && (
                      <div className="flex items-center gap-2">
                        {hasApplied ? (
                          <>
                            <button
                              onClick={() => navigate('/applications')}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#171717] hover:bg-[#262626] text-[#fafafa] dark:bg-[#fafafa] dark:hover:bg-[#e5e5e5] dark:text-[#0a0a0a] rounded-lg font-bold text-xs shadow-xs cursor-pointer transition-colors"
                            >
                              <FileCheck2 className="w-3.5 h-3.5" />
                              Track in My Applications
                            </button>
                            <button
                              onClick={() => setStudentDetailsCompany(comp)}
                              className="px-3 py-1.5 bg-card hover:bg-secondary text-foreground font-semibold rounded-lg border border-border text-xs cursor-pointer"
                            >
                              Details
                            </button>
                          </>
                        ) : !isEligible ? (
                          <>
                            <button
                              disabled
                              className="px-3 py-1.5 bg-neutral-200 dark:bg-neutral-800 text-neutral-500 font-semibold rounded-lg text-xs cursor-not-allowed border border-border"
                              title={comp.ineligibility_reasons?.join(', ') || 'Ineligible for this placement opportunity.'}
                            >
                              Ineligible to Apply
                            </button>
                            <button
                              onClick={() => setStudentDetailsCompany(comp)}
                              className="px-3 py-1.5 bg-card hover:bg-secondary text-foreground font-semibold rounded-lg border border-border text-xs cursor-pointer"
                            >
                              View Reasons
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleConfirmApply(comp.id)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#171717] hover:bg-[#262626] text-[#fafafa] dark:bg-[#fafafa] dark:hover:bg-[#e5e5e5] dark:text-[#0a0a0a] font-bold rounded-lg shadow-xs transition-colors cursor-pointer text-xs"
                            >
                              Apply Now <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setStudentDetailsCompany(comp)}
                              className="px-3 py-1.5 bg-card hover:bg-secondary text-foreground font-semibold rounded-lg border border-border text-xs cursor-pointer"
                            >
                              View Details
                            </button>
                          </>
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
            <h4 className="font-bold text-foreground text-sm flex items-center gap-2 pb-1 border-b border-border">
              <Building2 className="w-4 h-4 text-foreground" /> Corporate Profile & Recruiter Contact
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-foreground mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Google India, Amazon, Infosys"
                  className="w-full p-2.5 border border-border bg-background text-foreground rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">Industry Domain *</label>
                <input
                  type="text"
                  required
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  placeholder="e.g. Information Technology & Cloud"
                  className="w-full p-2.5 border border-border bg-background text-foreground rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-foreground mb-1">Recruitment Tier</label>
                <select
                  value={formData.tier}
                  onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                  className="w-full p-2.5 border border-border bg-secondary text-foreground rounded-lg text-xs"
                >
                  <option value="SUPER_DREAM">Super Dream (&gt; 20 LPA)</option>
                  <option value="DREAM">Dream (10 - 20 LPA)</option>
                  <option value="REGULAR">Regular (&lt; 10 LPA)</option>
                  <option value="MASS_RECRUITER">Mass Recruiter</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">Website URL</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://company.com/careers"
                  className="w-full p-2.5 border border-border bg-background text-foreground rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">Headquarters</label>
                <input
                  type="text"
                  value={formData.headquarters}
                  onChange={(e) => setFormData({ ...formData, headquarters: e.target.value })}
                  placeholder="e.g. Bengaluru / Hyderabad"
                  className="w-full p-2.5 border border-border bg-background text-foreground rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-foreground mb-1">Recruiter Email</label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="campus-talent@company.com"
                  className="w-full p-2.5 border border-border bg-background text-foreground rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  placeholder="+91 9876543210"
                  className="w-full p-2.5 border border-border bg-background text-foreground rounded-lg text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Company Description & Hiring Mission</label>
              <textarea
                rows="2"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Overview of company business model, technology stack, and student hiring goals..."
                className="w-full p-2.5 border border-border bg-background text-foreground rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Section 2: Department & Academic Year Eligibility */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-foreground text-sm flex items-center gap-2 pb-1 border-b border-border">
              <Layers className="w-4 h-4 text-foreground" /> Branch & Academic Year Eligibility Rules
            </h4>

            {/* Department Multi-Select */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold text-foreground">
                  Select Eligible University Departments ({formData.eligible_departments?.length || 0} selected) *
                </label>
                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={selectAllDepartments}
                    className="text-foreground hover:underline font-semibold cursor-pointer"
                  >
                    Select All
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={clearAllDepartments}
                    className="text-muted-foreground hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-secondary p-3 rounded-xl border border-border">
                {ALL_DEPARTMENTS.map((dept) => {
                  const isChecked = formData.eligible_departments?.includes(dept.code);
                  return (
                    <label
                      key={dept.code}
                      onClick={() => toggleDepartment(dept.code)}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                        isChecked
                          ? 'bg-[#171717] text-[#fafafa] dark:bg-[#fafafa] dark:text-[#0a0a0a] border-transparent font-bold'
                          : 'bg-card border-border text-foreground hover:bg-neutral-200 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded accent-black dark:accent-white"
                      />
                      <span>{dept.code}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-foreground mb-1">Academic Year Cohort *</label>
                <select
                  value={formData.academic_year}
                  onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                  className="w-full p-2.5 border border-border bg-secondary text-foreground rounded-lg text-xs"
                >
                  {ACADEMIC_YEARS.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Enrolled Students Quota Capacity *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="5000"
                  value={formData.eligible_student_count}
                  onChange={(e) => setFormData({ ...formData, eligible_student_count: e.target.value })}
                  className="w-full p-2.5 border border-border bg-background text-foreground rounded-lg text-xs"
                />
                <span className="text-[10px] text-muted-foreground">Max candidates allowed to attend drive</span>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">Minimum CGPA Cutoff</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="10"
                  value={formData.min_cgpa}
                  onChange={(e) => setFormData({ ...formData, min_cgpa: e.target.value })}
                  className="w-full p-2.5 border border-border bg-background text-foreground rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-foreground mb-1">Package / CTC (LPA) *</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  value={formData.package_ctc}
                  onChange={(e) => setFormData({ ...formData, package_ctc: e.target.value })}
                  className="w-full p-2.5 border border-border bg-background text-foreground rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">Partner Rating (Out of 5.0)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                  className="w-full p-2.5 border border-border bg-background text-foreground rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Placement Drive Schedule */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-foreground text-sm flex items-center gap-2 pb-1 border-b border-border">
              <CalendarDays className="w-4 h-4 text-foreground" /> Placement Drive Schedule & Stages
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-foreground mb-1">Drive Date *</label>
                <input
                  type="date"
                  required
                  value={formData.drive_date}
                  onChange={(e) => setFormData({ ...formData, drive_date: e.target.value })}
                  className="w-full p-2.5 border border-border bg-background text-foreground rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">Drive Mode</label>
                <select
                  value={formData.drive_mode}
                  onChange={(e) => setFormData({ ...formData, drive_mode: e.target.value })}
                  className="w-full p-2.5 border border-border bg-secondary text-foreground rounded-lg text-xs"
                >
                  <option value="ON_CAMPUS">On-Campus</option>
                  <option value="VIRTUAL">Virtual / Remote</option>
                  <option value="HYBRID">Hybrid (Coding Online + F2F Interviews)</option>
                  <option value="POOLED">Pooled Campus</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">Current Drive Stage</label>
                <select
                  value={formData.selection_stage}
                  onChange={(e) => setFormData({ ...formData, selection_stage: e.target.value })}
                  className="w-full p-2.5 border border-border bg-secondary text-foreground rounded-lg text-xs"
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
                <label className="block font-semibold text-foreground mb-1">Campus Venue / Assessment Link</label>
                <input
                  type="text"
                  value={formData.drive_venue}
                  onChange={(e) => setFormData({ ...formData, drive_venue: e.target.value })}
                  placeholder="e.g. Placement Auditorium & Computing Block"
                  className="w-full p-2.5 border border-border bg-background text-foreground rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">Application Deadline</label>
                <input
                  type="datetime-local"
                  value={formData.application_deadline}
                  onChange={(e) => setFormData({ ...formData, application_deadline: e.target.value })}
                  className="w-full p-2.5 border border-border bg-background text-foreground rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* Modal Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setIsAddEditModalOpen(false)}
              className="px-4 py-2 border border-border rounded-xl text-foreground hover:bg-secondary font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#171717] hover:bg-[#262626] text-[#fafafa] dark:bg-[#fafafa] dark:hover:bg-[#e5e5e5] dark:text-[#0a0a0a] rounded-xl font-bold shadow-xs transition-all cursor-pointer"
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
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 flex items-center justify-center font-bold text-lg">
                  {viewDossierCompany.name[0]}
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">{viewDossierCompany.name}</h3>
                  <p className="text-muted-foreground">{viewDossierCompany.industry}</p>
                </div>
              </div>
              <StatusBadge status={viewDossierCompany.tier} />
            </div>

            <p className="text-foreground leading-relaxed">{viewDossierCompany.description}</p>

            <div className="grid grid-cols-2 gap-3 p-3 bg-secondary rounded-xl border border-border">
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Package CTC</span>
                <span className="text-sm font-bold text-foreground">₹{viewDossierCompany.package_ctc} LPA</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Academic Year</span>
                <span className="text-sm font-bold text-foreground">{viewDossierCompany.academic_year}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Eligible Quota</span>
                <span className="text-sm font-bold text-foreground">{viewDossierCompany.configured_eligible_quota} Enrolled Students</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Min CGPA Cutoff</span>
                <span className="text-sm font-bold text-foreground">{viewDossierCompany.min_cgpa}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-muted-foreground">
              {viewDossierCompany.headquarters && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" /> Headquarters: {viewDossierCompany.headquarters}
                </div>
              )}
              {viewDossierCompany.website && (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <a href={viewDossierCompany.website} target="_blank" rel="noreferrer" className="text-foreground hover:underline">
                    {viewDossierCompany.website}
                  </a>
                </div>
              )}
              {viewDossierCompany.contact_email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" /> Recruiter: {viewDossierCompany.contact_email}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-border flex justify-end">
              <button
                onClick={() => setViewDossierCompany(null)}
                className="px-4 py-1.5 bg-[#171717] hover:bg-[#262626] text-[#fafafa] dark:bg-[#fafafa] dark:hover:bg-[#e5e5e5] dark:text-[#0a0a0a] rounded-lg font-semibold cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Placement Officer Company Management Drawer / Modal */}
      <CompanyManagementModal
        isOpen={!!manageCompanyId}
        onClose={() => setManageCompanyId(null)}
        companyId={manageCompanyId}
        onCompanyUpdated={fetchCompanies}
      />

      {/* Student Company Full Opportunity Details Modal */}
      <StudentCompanyDetailsModal
        isOpen={!!studentDetailsCompany}
        onClose={() => setStudentDetailsCompany(null)}
        company={studentDetailsCompany}
        user={user}
        onOpenApply={(c) => {
          setStudentDetailsCompany(null);
          setApplyConfirmCompany(c);
        }}
        onWithdraw={handleWithdrawCompany}
        withdrawing={withdrawingCompanyId === studentDetailsCompany?.id}
      />

      {/* Student Apply Confirmation Modal */}
      <StudentApplyConfirmModal
        isOpen={!!applyConfirmCompany}
        onClose={() => setApplyConfirmCompany(null)}
        company={applyConfirmCompany}
        user={user}
        onConfirmApply={handleConfirmApply}
        applying={isSubmitting}
      />
    </div>
  );
}
