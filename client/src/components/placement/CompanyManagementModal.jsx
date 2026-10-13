import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { Modal } from '../Modal';
import { StatusBadge } from '../Badge';
import { LoadingSpinner } from '../LoadingSpinner';
import { ApplicantReviewModal } from './ApplicantReviewModal';
import { StudentProfileViewModal } from './StudentProfileViewModal';
import {
  Building2,
  Users,
  Layers,
  CalendarDays,
  CheckCircle2,
  XCircle,
  FileText,
  Download,
  Filter,
  Search,
  CheckSquare,
  Square,
  Award,
  Sparkles,
  MapPin,
  Globe,
  Mail,
  Phone,
  Send,
  Bell,
  Clock,
  ArrowRight,
  ShieldCheck,
  Edit3,
  ChevronRight,
  Plus,
} from 'lucide-react';

export function CompanyManagementModal({
  isOpen,
  onClose,
  companyId,
  onCompanyUpdated,
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'registered' | 'eligibility' | 'rounds' | 'results' | 'announcements'
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);

  // Applicants state
  const [applicants, setApplicants] = useState([]);
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [deptCounts, setDeptCounts] = useState({});
  const [statusCounts, setStatusCounts] = useState({});
  const [totalRegistered, setTotalRegistered] = useState(0);

  // Filters for registered students
  const [applicantSearch, setApplicantSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [batchFilter, setBatchFilter] = useState('ALL');
  const [eligibilityFilter, setEligibilityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roundFilter, setRoundFilter] = useState('ALL');

  // Bulk actions
  const [selectedAppIds, setSelectedAppIds] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Sub-modals
  const [reviewingApplicant, setReviewingApplicant] = useState(null);
  const [viewingProfile, setViewingProfile] = useState(null);
  const [savingReview, setSavingReview] = useState(false);

  // Announcements state
  const [announcements, setAnnouncements] = useState([]);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [postingAnn, setPostingAnn] = useState(false);

  // Round editing state
  const [editingRound, setEditingRound] = useState(null);
  const [roundForm, setRoundForm] = useState({ scheduled_at: '', venue_or_link: '', status: 'PENDING' });
  const [savingRound, setSavingRound] = useState(false);

  // Notification message
  const [bannerNotice, setBannerNotice] = useState(null);

  useEffect(() => {
    if (isOpen && companyId) {
      loadCompanyDetails();
      loadApplicants();
      loadAnnouncements();
    } else {
      setSelectedAppIds([]);
      setActiveTab('overview');
    }
  }, [isOpen, companyId]);

  useEffect(() => {
    if (isOpen && companyId && (activeTab === 'registered' || activeTab === 'eligibility' || activeTab === 'results')) {
      loadApplicants();
    }
  }, [applicantSearch, deptFilter, batchFilter, eligibilityFilter, statusFilter, roundFilter]);

  const loadCompanyDetails = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/companies/${companyId}`);
      setCompany(res.data.data);
    } catch (err) {
      console.error('Failed to load company details:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadApplicants = async () => {
    setApplicantsLoading(true);
    try {
      const params = {};
      if (applicantSearch) params.search = applicantSearch;
      if (deptFilter !== 'ALL') params.department = deptFilter;
      if (batchFilter !== 'ALL') params.batch = batchFilter;
      if (eligibilityFilter !== 'ALL') params.eligibility_status = eligibilityFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (roundFilter !== 'ALL') params.round_number = roundFilter;

      const res = await apiClient.get(`/companies/${companyId}/applicants`, { params });
      setApplicants(res.data.data || []);
      setDeptCounts(res.data.department_counts || {});
      setStatusCounts(res.data.status_counts || {});
      setTotalRegistered(res.data.total_registered || 0);
    } catch (err) {
      console.error('Failed to load company applicants:', err);
    } finally {
      setApplicantsLoading(false);
    }
  };

  const loadAnnouncements = async () => {
    try {
      const res = await apiClient.get(`/companies/${companyId}/announcements`);
      setAnnouncements(res.data.data || []);
    } catch (err) {
      console.error('Failed to load announcements:', err);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (applicants.length === 0) {
      alert('No applicant records available to export.');
      return;
    }

    const headers = [
      'Application ID',
      'Register Number',
      'Student Name',
      'Department',
      'Batch',
      'Email',
      'Phone',
      'CGPA',
      'Active Backlogs',
      'Applied Date',
      'Eligibility Status',
      'Ineligibility Reason',
      'Application Status',
      'Current Round',
      'Final Result',
      'Interview Schedule',
      'Interview Venue/Link',
      'Feedback',
    ];

    const rows = applicants.map((a) => [
      a.application_id,
      `"${a.register_number}"`,
      `"${a.first_name} ${a.last_name}"`,
      a.department_code,
      `"${a.academic_year || a.batch || ''}"`,
      `"${a.email}"`,
      `"${a.phone || ''}"`,
      a.cgpa,
      a.active_backlogs || 0,
      a.applied_at ? new Date(a.applied_at).toLocaleString() : '',
      a.eligibility_status || 'ELIGIBLE',
      `"${(a.ineligibility_reason || '').replace(/"/g, '""')}"`,
      a.application_status,
      `"Round ${a.current_round_number}: ${a.current_round_name || ''}"`,
      a.final_result || 'PENDING',
      a.interview_scheduled_at ? new Date(a.interview_scheduled_at).toLocaleString() : '',
      `"${(a.interview_venue_or_link || '').replace(/"/g, '""')}"`,
      `"${(a.feedback || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${company?.name || 'Company'}_Registered_Applicants.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Toggle selection
  const toggleSelectApplicant = (id) => {
    setSelectedAppIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (selectedAppIds.length === applicants.length) {
      setSelectedAppIds([]);
    } else {
      setSelectedAppIds(applicants.map((a) => a.application_id));
    }
  };

  // Bulk action handler
  const handleBulkAction = async (action, targetRound = null) => {
    if (selectedAppIds.length === 0) {
      alert('Please select at least one applicant.');
      return;
    }

    if (!window.confirm(`Apply '${action}' to ${selectedAppIds.length} selected candidates?`)) {
      return;
    }

    setBulkActionLoading(true);
    try {
      await apiClient.post(`/companies/${companyId}/applicants/bulk-update`, {
        application_ids: selectedAppIds,
        action,
        target_round: targetRound,
      });
      setBannerNotice({
        type: 'success',
        text: `Bulk action '${action}' applied to ${selectedAppIds.length} candidate(s) successfully!`,
      });
      setSelectedAppIds([]);
      loadApplicants();
      loadCompanyDetails();
      if (onCompanyUpdated) onCompanyUpdated();
      setTimeout(() => setBannerNotice(null), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to execute bulk action.');
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Save individual applicant review
  const handleSaveApplicantReview = async (formData) => {
    if (!reviewingApplicant) return;
    setSavingReview(true);
    try {
      await apiClient.put(`/companies/${companyId}/applicants/${reviewingApplicant.application_id}`, formData);
      setBannerNotice({
        type: 'success',
        text: `Applicant ${reviewingApplicant.first_name} (${reviewingApplicant.register_number}) updated!`,
      });
      setReviewingApplicant(null);
      loadApplicants();
      loadCompanyDetails();
      if (onCompanyUpdated) onCompanyUpdated();
      setTimeout(() => setBannerNotice(null), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update applicant.');
    } finally {
      setSavingReview(false);
    }
  };

  // Post announcement
  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;
    setPostingAnn(true);
    try {
      await apiClient.post(`/companies/${companyId}/announcements`, {
        title: annTitle,
        content: annContent,
      });
      setAnnTitle('');
      setAnnContent('');
      setBannerNotice({ type: 'success', text: 'Announcement published & notifications dispatched to applicants!' });
      loadAnnouncements();
      setTimeout(() => setBannerNotice(null), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post announcement.');
    } finally {
      setPostingAnn(false);
    }
  };

  // Save Round Edit
  const handleSaveRound = async (roundId) => {
    setSavingRound(true);
    try {
      await apiClient.put(`/companies/${companyId}/rounds/${roundId}`, roundForm);
      setEditingRound(null);
      setBannerNotice({ type: 'success', text: 'Round schedule & status updated!' });
      loadCompanyDetails();
      setTimeout(() => setBannerNotice(null), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update round.');
    } finally {
      setSavingRound(false);
    }
  };

  if (!isOpen) return null;

  const quota = company?.configured_eligible_quota || company?.eligible_student_count || 60;
  const appliedCount = totalRegistered || company?.applied_count || 0;
  const shortlistedCount = statusCounts['SHORTLISTED'] || company?.shortlisted_count || 0;
  const selectedCount = statusCounts['ACCEPTED'] || company?.selected_count || 0;
  const rejectedCount = statusCounts['REJECTED'] || company?.rejected_count || 0;
  const quotaPercent = Math.min(100, Math.round((appliedCount / quota) * 100));

  const rounds = company?.selection_rounds || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={company ? `Manage Placement Company: ${company.name}` : 'Loading Company...'}
      maxWidth="max-w-5xl"
    >
      <div className="space-y-4 text-xs max-h-[82vh] overflow-y-auto pr-1">
        {/* Banner Notice */}
        {bannerNotice && (
          <div
            className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold animate-fadeIn ${
              bannerNotice.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-rose-50 text-rose-800 border-rose-300'
            }`}
          >
            <span>{bannerNotice.text}</span>
            <button onClick={() => setBannerNotice(null)} className="text-slate-400 hover:text-slate-700">
              ✕
            </button>
          </div>
        )}

        {/* Company Header Card */}
        {company && (
          <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-black text-2xl flex items-center justify-center shadow-inner">
                {company.name[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{company.name}</h3>
                  <StatusBadge status={company.tier} />
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/15 text-white border border-white/20">
                    {company.status}
                  </span>
                </div>
                <p className="text-indigo-200 text-xs font-medium mt-0.5">
                  {company.industry} • ₹{company.package_ctc} LPA
                </p>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-indigo-300 mt-1">
                  {company.headquarters && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {company.headquarters}
                    </span>
                  )}
                  {company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-blue-300 hover:underline"
                    >
                      <Globe className="w-3 h-3" /> Website
                    </a>
                  )}
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" /> Drive: {company.drive_date?.split('T')[0] || '2026-11-25'} (
                    {company.drive_mode || 'ON_CAMPUS'})
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-row md:flex-col items-start md:items-end justify-between gap-2 border-t md:border-t-0 pt-2 md:pt-0 border-white/10 text-right">
              <div>
                <span className="text-[10px] text-indigo-200 uppercase font-semibold">Drive Quota</span>
                <div className="text-base font-black text-white">
                  {appliedCount} / {quota} Registered
                </div>
              </div>
              <div className="w-36 bg-white/20 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full transition-all" style={{ width: `${quotaPercent}%` }} />
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation Navigation Bar */}
        <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600 font-bold bg-blue-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('registered')}
            className={`px-4 py-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'registered'
                ? 'border-blue-600 text-blue-600 font-bold bg-blue-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Registered Students ({totalRegistered})</span>
          </button>

          <button
            onClick={() => setActiveTab('eligibility')}
            className={`px-4 py-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'eligibility'
                ? 'border-blue-600 text-blue-600 font-bold bg-blue-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Eligibility Review</span>
          </button>

          <button
            onClick={() => setActiveTab('rounds')}
            className={`px-4 py-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'rounds'
                ? 'border-blue-600 text-blue-600 font-bold bg-blue-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Selection Rounds ({rounds.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('results')}
            className={`px-4 py-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'results'
                ? 'border-blue-600 text-blue-600 font-bold bg-blue-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Results & Offers ({selectedCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('announcements')}
            className={`px-4 py-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'announcements'
                ? 'border-blue-600 text-blue-600 font-bold bg-blue-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Announcements ({announcements.length})</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && company && (
          <div className="space-y-4">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Registered</span>
                <div className="text-xl font-black text-blue-700">{appliedCount}</div>
                <span className="text-[10px] text-slate-400">Quota: {quota} Candidates</span>
              </div>

              <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Shortlisted</span>
                <div className="text-xl font-black text-purple-700">{shortlistedCount}</div>
                <span className="text-[10px] text-slate-400">Advanced to Rounds</span>
              </div>

              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Selected / Offers</span>
                <div className="text-xl font-black text-emerald-700">{selectedCount}</div>
                <span className="text-[10px] text-slate-400">Final Placements</span>
              </div>

              <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Disqualified / Rejected</span>
                <div className="text-xl font-black text-rose-700">{rejectedCount}</div>
                <span className="text-[10px] text-slate-400">Concluded Drives</span>
              </div>
            </div>

            {/* Description & Mission */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-800 text-xs block">Company Hiring Profile & Mission</span>
              <p className="text-slate-600 text-xs leading-relaxed">
                {company.description || 'No corporate description provided.'}
              </p>
            </div>

            {/* Eligibility & Drive Logistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-600" /> Eligibility Rules
                </span>
                <div className="space-y-1.5 text-[11px] text-slate-600">
                  <div>
                    Minimum CGPA: <strong className="text-slate-900">{company.min_cgpa || '6.50'}</strong>
                  </div>
                  <div>
                    Target Batch / Cohort: <strong className="text-slate-900">{company.academic_year || '2026-2027'}</strong>
                  </div>
                  <div>
                    Maximum Allowed Backlogs: <strong className="text-slate-900">{company.max_backlogs ?? 0}</strong>
                  </div>
                  <div>
                    Eligible Departments:
                    <div className="flex flex-wrap gap-1 mt-1">
                      {company.eligible_departments?.map((d) => (
                        <span key={d} className="px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-800 text-[10px] border border-slate-200">
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-purple-600" /> Drive Schedule & Venue
                </span>
                <div className="space-y-1.5 text-[11px] text-slate-600">
                  <div>
                    Drive Date: <strong className="text-slate-900">{company.drive_date?.split('T')[0] || '2026-11-25'}</strong>
                  </div>
                  <div>
                    Venue: <strong className="text-slate-900">{company.drive_venue || 'Main Campus Placement Block'}</strong>
                  </div>
                  <div>
                    Drive Mode: <strong className="text-slate-900">{company.drive_mode || 'ON_CAMPUS'}</strong>
                  </div>
                  <div>
                    Application Deadline:{' '}
                    <strong className="text-slate-900">
                      {company.application_deadline ? new Date(company.application_deadline).toLocaleString() : 'Open'}
                    </strong>
                  </div>
                  <div>
                    Recruiter Contact:{' '}
                    <strong className="text-slate-900">{company.contact_email || 'Talent Acquisition Team'}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: REGISTERED STUDENTS TABLE & EXPORT */}
        {activeTab === 'registered' && (
          <div className="space-y-3.5">
            {/* Department Breakdown Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase shrink-0">By Department:</span>
              <button
                onClick={() => setDeptFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  deptFilter === 'ALL' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All ({totalRegistered})
              </button>
              {Object.entries(deptCounts).map(([dept, cnt]) => (
                <button
                  key={dept}
                  onClick={() => setDeptFilter(dept)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    deptFilter === dept ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {dept}: {cnt}
                </button>
              ))}
            </div>

            {/* Search & Multi-Filters Toolbar */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by student name, register number, or email..."
                    value={applicantSearch}
                    onChange={(e) => setApplicantSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="APPLIED">Applied</option>
                  <option value="SHORTLISTED">Shortlisted</option>
                  <option value="IN_PROCESS">In Process</option>
                  <option value="ACCEPTED">Accepted / Selected</option>
                  <option value="OFFERED">Offered</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="WITHDRAWN">Withdrawn</option>
                </select>

                <select
                  value={eligibilityFilter}
                  onChange={(e) => setEligibilityFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700"
                >
                  <option value="ALL">All Eligibility</option>
                  <option value="ELIGIBLE">Eligible</option>
                  <option value="INELIGIBLE">Ineligible</option>
                  <option value="PENDING_REVIEW">Pending Review</option>
                </select>

                <select
                  value={roundFilter}
                  onChange={(e) => setRoundFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700"
                >
                  <option value="ALL">All Rounds</option>
                  {rounds.map((rnd) => (
                    <option key={rnd.round_number} value={rnd.round_number}>
                      Round {rnd.round_number}
                    </option>
                  ))}
                </select>

                {/* CSV Export Button */}
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs transition-colors cursor-pointer"
                  title="Export to CSV spreadsheet"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Bulk Action Controls Toolbar */}
            {selectedAppIds.length > 0 && (
              <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl flex flex-wrap items-center justify-between gap-2 animate-fadeIn text-[11px]">
                <span className="font-bold text-indigo-900">
                  {selectedAppIds.length} candidate(s) selected for bulk operation:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    disabled={bulkActionLoading}
                    onClick={() => handleBulkAction('SHORTLIST')}
                    className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold cursor-pointer"
                  >
                    Bulk Shortlist
                  </button>
                  <button
                    disabled={bulkActionLoading}
                    onClick={() => handleBulkAction('ADVANCE_ROUND')}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold cursor-pointer"
                  >
                    Advance Round (+1)
                  </button>
                  <button
                    disabled={bulkActionLoading}
                    onClick={() => handleBulkAction('MARK_ELIGIBLE')}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold cursor-pointer"
                  >
                    Mark Eligible
                  </button>
                  <button
                    disabled={bulkActionLoading}
                    onClick={() => handleBulkAction('SELECT')}
                    className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold cursor-pointer"
                  >
                    Mark Selected
                  </button>
                  <button
                    disabled={bulkActionLoading}
                    onClick={() => handleBulkAction('REJECT')}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold cursor-pointer"
                  >
                    Reject Selected
                  </button>
                  <button
                    onClick={() => setSelectedAppIds([])}
                    className="px-2 py-1 bg-white text-slate-600 border border-slate-200 rounded-lg font-semibold hover:bg-slate-100 cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            {/* Registered Students Table */}
            {applicantsLoading ? (
              <LoadingSpinner text="Loading registered candidate records..." />
            ) : applicants.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-xs">No registered applicants found for this filter criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs">
                <table className="w-full text-left text-xs bg-white">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-[11px]">
                    <tr>
                      <th className="p-3 w-8 text-center">
                        <input
                          type="checkbox"
                          checked={selectedAppIds.length === applicants.length && applicants.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded text-blue-600 cursor-pointer"
                        />
                      </th>
                      <th className="p-3">Register No</th>
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Dept & Batch</th>
                      <th className="p-3">CGPA / Backlogs</th>
                      <th className="p-3">Eligibility</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Selection Round</th>
                      <th className="p-3">Final Result</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {applicants.map((a) => {
                      const isSelected = selectedAppIds.includes(a.application_id);
                      return (
                        <tr key={a.application_id} className={`hover:bg-blue-50/40 transition-colors ${isSelected ? 'bg-blue-50/60' : ''}`}>
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectApplicant(a.application_id)}
                              className="rounded text-blue-600 cursor-pointer"
                            />
                          </td>

                          <td className="p-3 font-mono font-bold text-slate-900">
                            {a.register_number}
                          </td>

                          <td className="p-3">
                            <button
                              onClick={() => setViewingProfile(a)}
                              className="font-semibold text-slate-900 hover:text-blue-600 hover:underline cursor-pointer block text-left"
                            >
                              {a.first_name} {a.last_name}
                            </button>
                            <span className="text-[10px] text-slate-400 block truncate max-w-[160px]">{a.email}</span>
                          </td>

                          <td className="p-3 text-slate-600">
                            <span className="font-bold text-slate-800">{a.department_code}</span>
                            <span className="text-[10px] text-slate-400 block">{a.academic_year || a.batch}</span>
                          </td>

                          <td className="p-3">
                            <strong className="text-emerald-700">{a.cgpa}</strong>
                            <span className={`block text-[10px] ${a.active_backlogs > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                              {a.active_backlogs || 0} Backlogs
                            </span>
                          </td>

                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                a.eligibility_status === 'ELIGIBLE'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : a.eligibility_status === 'INELIGIBLE'
                                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              {a.eligibility_status || 'ELIGIBLE'}
                            </span>
                          </td>

                          <td className="p-3">
                            <StatusBadge status={a.application_status} />
                          </td>

                          <td className="p-3 font-medium text-slate-700">
                            <span className="font-bold text-blue-700">R{a.current_round_number}</span>
                            <span className="text-[10px] text-slate-500 block truncate max-w-[140px]">
                              {a.current_round_name || `Round ${a.current_round_number}`}
                            </span>
                          </td>

                          <td className="p-3">
                            {a.final_result === 'SELECTED' ? (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-[10px] border border-emerald-300">
                                SELECTED
                              </span>
                            ) : a.final_result === 'WAITLISTED' ? (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px] border border-amber-300">
                                WAITLISTED
                              </span>
                            ) : a.final_result === 'REJECTED' ? (
                              <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px] border border-rose-300">
                                REJECTED
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px] font-medium">In Process</span>
                            )}
                          </td>

                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setReviewingApplicant(a)}
                                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg border border-blue-200 text-[11px] cursor-pointer"
                              >
                                Review
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ELIGIBILITY REVIEW */}
        {activeTab === 'eligibility' && (
          <div className="space-y-3">
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-slate-700 leading-relaxed text-xs">
              <strong className="text-blue-900 block font-bold mb-0.5">Eligibility Governance Console</strong>
              Verify and enforce university academic eligibility thresholds against the company's criteria. You can review disqualified applicants, approve waivers, or confirm verified cohorts.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Eligible Candidates ({applicants.filter((a) => a.eligibility_status === 'ELIGIBLE').length})
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-2">Candidates meeting branch whitelists and minimum CGPA criteria.</p>
              </div>

              <div className="p-3.5 bg-rose-50/50 rounded-xl border border-rose-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-rose-900 flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    Flagged / Ineligible Candidates ({applicants.filter((a) => a.eligibility_status === 'INELIGIBLE').length})
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-2">Candidates failing backlog or department rules.</p>
              </div>
            </div>

            <div className="space-y-2">
              {applicants.map((a) => (
                <div
                  key={a.application_id}
                  className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-900">{a.register_number}</span>
                    <span className="font-semibold text-slate-800">
                      {a.first_name} {a.last_name}
                    </span>
                    <span className="text-slate-400">({a.department_code})</span>
                    <span className="text-emerald-700 font-bold">CGPA: {a.cgpa}</span>
                    {a.ineligibility_reason && (
                      <span className="text-rose-600 text-[11px] font-medium">({a.ineligibility_reason})</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSaveApplicantReview({ eligibility_status: 'ELIGIBLE', ineligibility_reason: null })}
                      className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold hover:bg-emerald-100 cursor-pointer"
                    >
                      Clear / Verify
                    </button>
                    <button
                      onClick={() => setReviewingApplicant(a)}
                      className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 cursor-pointer"
                    >
                      Custom Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SELECTION ROUNDS */}
        {activeTab === 'rounds' && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-xs">Configured Drive Selection Rounds</h4>
                <p className="text-[11px] text-slate-500">Configure round schedules, test venues, virtual links, and progression status.</p>
              </div>
            </div>

            <div className="space-y-3">
              {rounds.map((rnd) => {
                const isEditing = editingRound === rnd.id;
                const candidateCountAtRound = applicants.filter((a) => a.current_round_number === rnd.round_number).length;

                return (
                  <div key={rnd.id} className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-purple-600 text-white font-black flex items-center justify-center text-sm">
                          {rnd.round_number}
                        </span>
                        <div>
                          <h5 className="font-bold text-slate-900 text-sm">{rnd.round_name}</h5>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">{rnd.round_type}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 font-bold text-xs border border-blue-200">
                          {candidateCountAtRound} Candidates at this Round
                        </span>
                        <StatusBadge status={rnd.status} />
                        {!isEditing && (
                          <button
                            onClick={() => {
                              setEditingRound(rnd.id);
                              setRoundForm({
                                scheduled_at: rnd.scheduled_at ? rnd.scheduled_at.slice(0, 16) : '',
                                venue_or_link: rnd.venue_or_link || '',
                                status: rnd.status || 'PENDING',
                              });
                            }}
                            className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                            title="Edit Round Schedule"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Scheduled Date & Time</label>
                            <input
                              type="datetime-local"
                              value={roundForm.scheduled_at}
                              onChange={(e) => setRoundForm({ ...roundForm, scheduled_at: e.target.value })}
                              className="w-full p-2 border border-slate-200 bg-white rounded-lg text-xs"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Venue / Online Meet Link</label>
                            <input
                              type="text"
                              value={roundForm.venue_or_link}
                              onChange={(e) => setRoundForm({ ...roundForm, venue_or_link: e.target.value })}
                              placeholder="e.g. Auditorium or WebRTC Link"
                              className="w-full p-2 border border-slate-200 bg-white rounded-lg text-xs"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Round Status</label>
                            <select
                              value={roundForm.status}
                              onChange={(e) => setRoundForm({ ...roundForm, status: e.target.value })}
                              className="w-full p-2 border border-slate-200 bg-white rounded-lg text-xs font-semibold"
                            >
                              <option value="PENDING">PENDING</option>
                              <option value="IN_PROGRESS">IN_PROGRESS</option>
                              <option value="COMPLETED">COMPLETED</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingRound(null)}
                            className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={savingRound}
                            onClick={() => handleSaveRound(rnd.id)}
                            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
                          >
                            {savingRound ? 'Saving...' : 'Save Schedule'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {rnd.scheduled_at ? new Date(rnd.scheduled_at).toLocaleString() : 'Schedule Pending'}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {rnd.venue_or_link || 'Main Placement Block'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: RESULTS */}
        {activeTab === 'results' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-xs">Drive Final Outcomes & Offers</h4>
                <p className="text-[11px] text-slate-500">Recruitment outcomes marked as Selected, Waitlisted, or Concluded.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="font-bold text-emerald-900 text-xs block mb-1">
                  🌟 Selected / Offers ({applicants.filter((a) => a.final_result === 'SELECTED' || a.application_status === 'ACCEPTED').length})
                </span>
                <div className="space-y-1.5 pt-2">
                  {applicants
                    .filter((a) => a.final_result === 'SELECTED' || a.application_status === 'ACCEPTED')
                    .map((a) => (
                      <div key={a.application_id} className="p-2 bg-white rounded-lg border border-emerald-200 flex justify-between">
                        <span className="font-bold text-slate-900">{a.first_name} {a.last_name}</span>
                        <span className="font-mono text-emerald-700">{a.department_code}</span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200">
                <span className="font-bold text-amber-900 text-xs block mb-1">
                  ⏳ Waitlisted Candidates ({applicants.filter((a) => a.final_result === 'WAITLISTED').length})
                </span>
                <div className="space-y-1.5 pt-2">
                  {applicants
                    .filter((a) => a.final_result === 'WAITLISTED')
                    .map((a) => (
                      <div key={a.application_id} className="p-2 bg-white rounded-lg border border-amber-200 flex justify-between">
                        <span className="font-bold text-slate-900">{a.first_name} {a.last_name}</span>
                        <span className="font-mono text-amber-700">{a.department_code}</span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 text-xs block mb-1">
                  In Process ({applicants.filter((a) => !a.final_result || a.final_result === 'PENDING').length})
                </span>
                <p className="text-[11px] text-slate-500 pt-2">Candidates currently completing active interview stages.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: ANNOUNCEMENTS */}
        {activeTab === 'announcements' && (
          <div className="space-y-4">
            {/* Publish Form */}
            <form onSubmit={handlePostAnnouncement} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Send className="w-4 h-4 text-blue-600" /> Dispatch Announcement to All Registered Candidates
              </h4>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Announcement Title</label>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="e.g. Round 2 Shortlist Released or PPT Timings"
                  className="w-full p-2 border border-slate-200 bg-white rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Detailed Message / Instructions</label>
                <textarea
                  rows="2"
                  required
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  placeholder="Provide instructions regarding hall tickets, virtual links, code repository submissions, or reporting venue..."
                  className="w-full p-2 border border-slate-200 bg-white rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={postingAnn}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{postingAnn ? 'Broadcasting...' : 'Publish & Broadcast'}</span>
                </button>
              </div>
            </form>

            {/* List of past announcements */}
            <div className="space-y-2.5">
              <h5 className="font-bold text-slate-800 text-xs">Drive Broadcast History</h5>
              {announcements.length === 0 ? (
                <p className="text-slate-400 text-xs p-4 bg-white rounded-xl border border-slate-200 text-center">
                  No announcements published yet.
                </p>
              ) : (
                announcements.map((ann) => (
                  <div key={ann.id} className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">{ann.title}</span>
                      <span className="text-[10px] text-slate-400">
                        {ann.created_at ? new Date(ann.created_at).toLocaleString() : ''}
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs leading-relaxed">{ann.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Modal Close Button */}
        <div className="flex justify-end pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
          >
            Close Console
          </button>
        </div>
      </div>

      {/* Sub-Modal: Review Individual Applicant */}
      <ApplicantReviewModal
        isOpen={!!reviewingApplicant}
        onClose={() => setReviewingApplicant(null)}
        applicant={reviewingApplicant}
        rounds={rounds}
        onSave={handleSaveApplicantReview}
        saving={savingReview}
      />

      {/* Sub-Modal: Student Profile Viewer */}
      <StudentProfileViewModal
        isOpen={!!viewingProfile}
        onClose={() => setViewingProfile(null)}
        student={viewingProfile}
      />
    </Modal>
  );
}
