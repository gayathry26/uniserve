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
  Download,
  Search,
  Award,
  Sparkles,
  MapPin,
  Globe,
  Mail,
  Phone,
  Send,
  Bell,
  Clock,
  ShieldCheck,
  Edit3,
  X,
  Briefcase,
  AlertTriangle,
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

  // Pagination for registered students
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

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
      setCurrentPage(1);
    }
  }, [isOpen, companyId]);

  useEffect(() => {
    if (isOpen && companyId && (activeTab === 'registered' || activeTab === 'eligibility' || activeTab === 'results')) {
      loadApplicants();
      setCurrentPage(1);
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

  // Pagination slice for registered students
  const totalApplicantPages = Math.ceil(applicants.length / pageSize) || 1;
  const paginatedApplicants = applicants.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={company ? `Placement Company: ${company.name}` : 'Loading Company...'}
      maxWidth="max-w-5xl"
    >
      <div className="space-y-4 text-xs max-h-[82vh] overflow-y-auto pr-1">
        {/* Banner Notice */}
        {bannerNotice && (
          <div className="p-3 rounded-xl border border-border bg-secondary text-foreground flex items-center justify-between text-xs font-semibold animate-fadeIn">
            <span>{bannerNotice.text}</span>
            <button onClick={() => setBannerNotice(null)} className="text-muted-foreground hover:text-foreground">
              ✕
            </button>
          </div>
        )}

        {/* 3.A Company Summary Header */}
        {company && (
          <div className="p-5 bg-secondary border border-border rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground font-black text-2xl flex items-center justify-center shadow-xs shrink-0">
                {company.name ? company.name[0].toUpperCase() : 'C'}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-black text-foreground tracking-tight">
                    {company.name}
                  </h2>
                  <StatusBadge status={company.tier} />
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-card text-foreground border border-border">
                    {company.status}
                  </span>
                  {company.package_ctc && (
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-black bg-card text-foreground border border-border">
                      ₹{company.package_ctc} LPA
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-xs font-medium mt-1">
                  {company.industry} {company.job_title ? `• Role: ${company.job_title}` : ''}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground mt-1.5">
                  {company.headquarters && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> {company.headquarters}
                    </span>
                  )}
                  {company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-foreground font-semibold hover:underline"
                    >
                      <Globe className="w-3.5 h-3.5" /> Website
                    </a>
                  )}
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" /> Drive: {company.drive_date?.split('T')[0] || 'TBD'} ({company.drive_mode || 'ON_CAMPUS'})
                  </span>
                </div>
              </div>
            </div>

            {/* Quota Progress & Quick CSV */}
            <div className="flex flex-col md:items-end justify-between gap-2.5 border-t md:border-t-0 pt-3 md:pt-0 border-border">
              <div className="text-left md:text-right">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Recruitment Quota</span>
                <div className="text-sm font-black text-foreground">
                  {appliedCount} / {quota} Registered ({quotaPercent}%)
                </div>
              </div>
              <div className="w-40 bg-neutral-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${quotaPercent}%` }} />
              </div>
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card hover:bg-neutral-200 dark:hover:bg-neutral-800 text-foreground border border-border rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-foreground" />
                <span>Export Applicants CSV</span>
              </button>
            </div>
          </div>
        )}

        {/* 3.B Organised Tabs (Exact Order) */}
        <div className="flex items-center gap-1.5 p-1 bg-secondary rounded-xl border border-border overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'overview'
                ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-neutral-200 dark:hover:bg-neutral-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('registered')}
            className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'registered'
                ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-neutral-200 dark:hover:bg-neutral-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Registered Students ({totalRegistered})</span>
          </button>

          <button
            onClick={() => setActiveTab('eligibility')}
            className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'eligibility'
                ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-neutral-200 dark:hover:bg-neutral-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Eligibility Review</span>
          </button>

          <button
            onClick={() => setActiveTab('rounds')}
            className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'rounds'
                ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-neutral-200 dark:hover:bg-neutral-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Selection Rounds ({rounds.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('results')}
            className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'results'
                ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-neutral-200 dark:hover:bg-neutral-800'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Results & Offers ({selectedCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('announcements')}
            className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'announcements'
                ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-neutral-200 dark:hover:bg-neutral-800'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Announcements ({announcements.length})</span>
          </button>
        </div>

        {/* 4. TAB 1: OVERVIEW */}
        {activeTab === 'overview' && company && (
          <div className="space-y-4">
            {/* Recruitment Statistics Top Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-card rounded-xl border border-border shadow-xs">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Total Registered</span>
                <div className="text-2xl font-black text-foreground mt-0.5">{appliedCount}</div>
                <span className="text-[11px] text-muted-foreground">Quota: {quota} Candidates</span>
              </div>

              <div className="p-3.5 bg-card rounded-xl border border-border shadow-xs">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Shortlisted</span>
                <div className="text-2xl font-black text-foreground mt-0.5">{shortlistedCount}</div>
                <span className="text-[11px] text-muted-foreground">Advanced to rounds</span>
              </div>

              <div className="p-3.5 bg-card rounded-xl border border-border shadow-xs">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Selected / Offers</span>
                <div className="text-2xl font-black text-foreground mt-0.5">{selectedCount}</div>
                <span className="text-[11px] text-muted-foreground">Final placements</span>
              </div>

              <div className="p-3.5 bg-card rounded-xl border border-border shadow-xs">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Disqualified / Rejected</span>
                <div className="text-2xl font-black text-foreground mt-0.5">{rejectedCount}</div>
                <span className="text-[11px] text-muted-foreground">Concluded drives</span>
              </div>
            </div>

            {/* Two-Column Overview Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Company Overview & Hiring Profile */}
              <div className="space-y-4">
                <div className="bg-card p-4 rounded-xl border border-border space-y-2">
                  <h4 className="font-bold text-foreground text-xs flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-foreground" /> Company Overview & Mission
                  </h4>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {company.description || 'Global industry partner actively participating in campus placement drives and talent recruitment initiatives.'}
                  </p>
                </div>

                <div className="bg-card p-4 rounded-xl border border-border space-y-2">
                  <h4 className="font-bold text-foreground text-xs flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-foreground" /> Hiring Profile & Job Roles
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-border">
                      <span className="text-muted-foreground">Designation / Role:</span>
                      <strong className="text-foreground">{company.job_title || 'Software Development Engineer'}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border">
                      <span className="text-muted-foreground">Hiring Tier:</span>
                      <strong className="text-foreground">{company.tier || 'REGULAR'}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border">
                      <span className="text-muted-foreground">Annual CTC:</span>
                      <strong className="text-foreground">₹{company.package_ctc || '12.00'} LPA</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">Target Batch:</span>
                      <strong className="text-foreground">{company.academic_year || '2026-2027'}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Eligibility Summary & Drive Logistics & Contact */}
              <div className="space-y-4">
                <div className="bg-card p-4 rounded-xl border border-border space-y-2">
                  <h4 className="font-bold text-foreground text-xs flex items-center gap-2">
                    <Layers className="w-4 h-4 text-foreground" /> Eligibility Summary
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-border">
                      <span className="text-muted-foreground">Minimum CGPA:</span>
                      <strong className="text-foreground">{company.min_cgpa || '6.50'}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border">
                      <span className="text-muted-foreground">Max Active Backlogs:</span>
                      <strong className="text-foreground">{company.max_backlogs ?? 0} Backlogs</strong>
                    </div>
                    <div className="py-1">
                      <span className="text-muted-foreground block mb-1">Eligible Departments:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {(company.eligible_departments || ['CSE', 'ECE', 'IT']).map((d) => (
                          <span key={d} className="px-2 py-0.5 rounded bg-secondary text-foreground text-[10px] font-bold border border-border">
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-card p-4 rounded-xl border border-border space-y-2">
                  <h4 className="font-bold text-foreground text-xs flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-foreground" /> Drive Schedule & Venue
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-border">
                      <span className="text-muted-foreground">Drive Date:</span>
                      <strong className="text-foreground">{company.drive_date?.split('T')[0] || '2026-11-25'}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border">
                      <span className="text-muted-foreground">Drive Mode:</span>
                      <strong className="text-foreground">{company.drive_mode || 'ON_CAMPUS'}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border">
                      <span className="text-muted-foreground">Campus Venue:</span>
                      <strong className="text-foreground">{company.drive_venue || 'Main Placement Block'}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">Recruiter Contact:</span>
                      <strong className="text-foreground">{company.contact_email || 'campus-relations@company.com'}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. TAB 2: REGISTERED STUDENTS */}
        {activeTab === 'registered' && (
          <div className="space-y-3.5">
            {/* Department Breakdown Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-[11px] font-bold text-muted-foreground uppercase shrink-0">Filter by Dept:</span>
              <button
                onClick={() => setDeptFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  deptFilter === 'ALL'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-secondary text-foreground hover:bg-neutral-200 dark:hover:bg-neutral-800'
                }`}
              >
                All ({totalRegistered})
              </button>
              {Object.entries(deptCounts).map(([dept, cnt]) => (
                <button
                  key={dept}
                  onClick={() => setDeptFilter(dept)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    deptFilter === dept
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-secondary text-foreground hover:bg-neutral-200 dark:hover:bg-neutral-800'
                  }`}
                >
                  {dept}: {cnt}
                </button>
              ))}
            </div>

            {/* Search & Multi-Filters Toolbar */}
            <div className="bg-card p-3 rounded-xl border border-border flex flex-wrap items-center justify-between gap-2.5">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student name, register number, or email..."
                  value={applicantSearch}
                  onChange={(e) => setApplicantSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-border bg-secondary font-medium text-foreground"
                >
                  <option value="ALL">All Application Statuses</option>
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
                  className="px-2.5 py-1.5 rounded-lg border border-border bg-secondary font-medium text-foreground"
                >
                  <option value="ALL">All Eligibility</option>
                  <option value="ELIGIBLE">Eligible</option>
                  <option value="INELIGIBLE">Ineligible</option>
                  <option value="PENDING_REVIEW">Pending Review</option>
                </select>

                <select
                  value={roundFilter}
                  onChange={(e) => setRoundFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-border bg-secondary font-medium text-foreground"
                >
                  <option value="ALL">All Rounds</option>
                  {rounds.map((rnd) => (
                    <option key={rnd.round_number} value={rnd.round_number}>
                      Round {rnd.round_number}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground hover:opacity-90 rounded-lg font-bold shadow-xs transition-opacity cursor-pointer"
                  title="Export to CSV spreadsheet"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Bulk Actions Toolbar */}
            {selectedAppIds.length > 0 && (
              <div className="p-3 bg-secondary border border-border rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-bold text-foreground">
                  {selectedAppIds.length} candidate(s) selected for bulk operation:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    disabled={bulkActionLoading}
                    onClick={() => handleBulkAction('SHORTLIST')}
                    className="px-2.5 py-1 bg-primary text-primary-foreground rounded-lg font-bold cursor-pointer hover:opacity-90"
                  >
                    Bulk Shortlist
                  </button>
                  <button
                    disabled={bulkActionLoading}
                    onClick={() => handleBulkAction('ADVANCE_ROUND')}
                    className="px-2.5 py-1 bg-primary text-primary-foreground rounded-lg font-bold cursor-pointer hover:opacity-90"
                  >
                    Advance Round (+1)
                  </button>
                  <button
                    disabled={bulkActionLoading}
                    onClick={() => handleBulkAction('MARK_ELIGIBLE')}
                    className="px-2.5 py-1 bg-primary text-primary-foreground rounded-lg font-bold cursor-pointer hover:opacity-90"
                  >
                    Mark Eligible
                  </button>
                  <button
                    disabled={bulkActionLoading}
                    onClick={() => handleBulkAction('SELECT')}
                    className="px-2.5 py-1 bg-primary text-primary-foreground rounded-lg font-bold cursor-pointer hover:opacity-90"
                  >
                    Mark Selected
                  </button>
                  <button
                    disabled={bulkActionLoading}
                    onClick={() => handleBulkAction('REJECT')}
                    className="px-2.5 py-1 bg-secondary text-foreground border border-border rounded-lg font-bold cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-800"
                  >
                    Reject Selected
                  </button>
                  <button
                    onClick={() => setSelectedAppIds([])}
                    className="px-2.5 py-1 bg-card text-foreground border border-border rounded-lg font-semibold hover:bg-secondary cursor-pointer"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            )}

            {/* Registered Students Table */}
            {applicantsLoading ? (
              <LoadingSpinner text="Loading registered candidate records..." />
            ) : applicants.length === 0 ? (
              <div className="p-12 text-center bg-card rounded-xl border border-border text-muted-foreground space-y-2">
                <Users className="w-8 h-8 text-muted-foreground mx-auto" />
                <h4 className="font-bold text-foreground text-sm">No Registered Applicants Found</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  No student records match the active search or filters for this company.
                </p>
              </div>
            ) : (
              <div className="border border-border rounded-xl overflow-hidden bg-card shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-secondary border-b border-border text-foreground font-bold text-[11px]">
                      <tr>
                        <th className="p-3 w-8 text-center">
                          <input
                            type="checkbox"
                            checked={selectedAppIds.length === applicants.length && applicants.length > 0}
                            onChange={toggleSelectAll}
                            className="rounded text-foreground cursor-pointer"
                          />
                        </th>
                        <th className="p-3">Student ID</th>
                        <th className="p-3">Student Name</th>
                        <th className="p-3">Department</th>
                        <th className="p-3">Cohort</th>
                        <th className="p-3">CGPA / Backlogs</th>
                        <th className="p-3">Eligibility</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Current Round</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {paginatedApplicants.map((a) => {
                        const isSelected = selectedAppIds.includes(a.application_id);
                        return (
                          <tr key={a.application_id} className={`hover:bg-secondary/60 transition-colors ${isSelected ? 'bg-secondary' : ''}`}>
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectApplicant(a.application_id)}
                                className="rounded text-foreground cursor-pointer"
                              />
                            </td>
                            <td className="p-3 font-mono font-bold text-foreground">
                              {a.register_number}
                            </td>
                            <td className="p-3">
                              <button
                                onClick={() => setViewingProfile(a)}
                                className="font-bold text-foreground hover:underline cursor-pointer block text-left"
                              >
                                {a.first_name} {a.last_name}
                              </button>
                              <span className="text-[10px] text-muted-foreground block truncate max-w-[160px]">{a.email}</span>
                            </td>
                            <td className="p-3">
                              <span className="font-bold text-foreground">{a.department_code}</span>
                            </td>
                            <td className="p-3 text-muted-foreground">
                              {a.academic_year || a.batch || '2026-2027'}
                            </td>
                            <td className="p-3">
                              <strong className="text-foreground">{a.cgpa}</strong>
                              <span className="block text-[10px] text-muted-foreground">
                                {a.active_backlogs || 0} Backlogs
                              </span>
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                  a.eligibility_status === 'ELIGIBLE'
                                    ? 'bg-secondary text-foreground border-border'
                                    : 'bg-secondary text-foreground border-border'
                                }`}
                              >
                                {a.eligibility_status === 'ELIGIBLE' ? '✓ Eligible' : a.eligibility_status === 'INELIGIBLE' ? '✕ Ineligible' : 'Pending'}
                              </span>
                            </td>
                            <td className="p-3">
                              <StatusBadge status={a.application_status} />
                            </td>
                            <td className="p-3 text-foreground font-medium">
                              <span className="font-bold">R{a.current_round_number}</span>: {a.current_round_name || `Round ${a.current_round_number}`}
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setReviewingApplicant(a)}
                                  className="px-2.5 py-1 bg-primary text-primary-foreground font-semibold rounded-lg text-[11px] hover:opacity-90 cursor-pointer shadow-xs"
                                >
                                  Review
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setViewingProfile(a)}
                                  className="px-2.5 py-1 bg-secondary text-foreground border border-border font-semibold rounded-lg text-[11px] hover:bg-neutral-200 dark:hover:bg-neutral-800 cursor-pointer"
                                >
                                  Profile
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Table Pagination */}
                {totalApplicantPages > 1 && (
                  <div className="p-3 bg-secondary border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, applicants.length)} of {applicants.length} candidates
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className="px-2.5 py-1 rounded bg-card border border-border text-foreground font-semibold disabled:opacity-40 cursor-pointer"
                      >
                        Previous
                      </button>
                      <span className="px-2 text-foreground font-bold">
                        {currentPage} / {totalApplicantPages}
                      </span>
                      <button
                        disabled={currentPage === totalApplicantPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalApplicantPages, p + 1))}
                        className="px-2.5 py-1 rounded bg-card border border-border text-foreground font-semibold disabled:opacity-40 cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 4. TAB 3: ELIGIBILITY REVIEW */}
        {activeTab === 'eligibility' && company && (
          <div className="space-y-4">
            {/* Criteria Summary Card */}
            <div className="p-4 bg-card rounded-xl border border-border shadow-xs space-y-2">
              <h4 className="font-bold text-foreground text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-foreground" /> Configured Eligibility Criteria Rules
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Automated eligibility rules enforced on all candidates registering for {company.name}.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                <div className="p-2.5 bg-secondary rounded-lg border border-border">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Min CGPA</span>
                  <strong className="text-foreground text-sm">{company.min_cgpa || '6.50'}</strong>
                </div>
                <div className="p-2.5 bg-secondary rounded-lg border border-border">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Max Backlogs</span>
                  <strong className="text-foreground text-sm">{company.max_backlogs ?? 0} Backlogs</strong>
                </div>
                <div className="p-2.5 bg-secondary rounded-lg border border-border">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Target Cohort</span>
                  <strong className="text-foreground text-sm">{company.academic_year || '2026-2027'}</strong>
                </div>
                <div className="p-2.5 bg-secondary rounded-lg border border-border">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Eligible Branches</span>
                  <strong className="text-foreground text-sm">{(company.eligible_departments || []).join(', ')}</strong>
                </div>
              </div>
            </div>

            {/* Candidates Eligibility Clearance Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-card rounded-xl border border-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-foreground" />
                    Eligible Candidates ({applicants.filter((a) => a.eligibility_status === 'ELIGIBLE').length})
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">Meeting department whitelist and minimum CGPA criteria.</p>
              </div>

              <div className="p-3.5 bg-card rounded-xl border border-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-foreground" />
                    Flagged / Ineligible Candidates ({applicants.filter((a) => a.eligibility_status === 'INELIGIBLE').length})
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">Failing CGPA, backlog, or branch restriction rules.</p>
              </div>
            </div>

            {/* Candidate Eligibility Results List */}
            <div className="space-y-2">
              <h4 className="font-bold text-foreground text-xs">Individual Student Eligibility Evaluation</h4>
              {applicants.length === 0 ? (
                <div className="p-8 text-center bg-card rounded-xl border border-border text-muted-foreground">
                  No applicants registered to evaluate.
                </div>
              ) : (
                applicants.map((a) => {
                  const isCandidateEligible = a.eligibility_status === 'ELIGIBLE';
                  return (
                    <div
                      key={a.application_id}
                      className="p-3.5 bg-card rounded-xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-mono font-bold text-foreground">{a.register_number}</span>
                        <span className="font-bold text-foreground">
                          {a.first_name} {a.last_name}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-secondary text-foreground text-[10px] font-bold border border-border">
                          {a.department_code}
                        </span>
                        <span className="text-foreground">CGPA: <strong>{a.cgpa}</strong></span>
                        <span className="text-muted-foreground">({a.active_backlogs || 0} backlogs)</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            isCandidateEligible
                              ? 'bg-secondary text-foreground border-border'
                              : 'bg-secondary text-foreground border-border'
                          }`}
                        >
                          {isCandidateEligible ? '✓ ELIGIBLE' : '✕ INELIGIBLE'}
                        </span>
                        {a.ineligibility_reason && (
                          <span className="text-foreground font-medium text-[11px]">
                            — Reason: {a.ineligibility_reason}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleSaveApplicantReview({ eligibility_status: 'ELIGIBLE', ineligibility_reason: null })}
                          className="px-2.5 py-1 bg-primary text-primary-foreground rounded-lg font-bold hover:opacity-90 cursor-pointer"
                        >
                          Verify Clearance
                        </button>
                        <button
                          onClick={() => setReviewingApplicant(a)}
                          className="px-2.5 py-1 bg-secondary text-foreground border border-border rounded-lg font-semibold hover:bg-neutral-200 dark:hover:bg-neutral-800 cursor-pointer"
                        >
                          Override Rule
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 4. TAB 4: SELECTION ROUNDS */}
        {activeTab === 'rounds' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-foreground text-xs">Drive Selection Rounds & Pipeline</h4>
                <p className="text-[11px] text-muted-foreground">Chronological recruitment stages, evaluation types, and venue links.</p>
              </div>
            </div>

            <div className="space-y-3">
              {rounds.map((rnd) => {
                const isEditing = editingRound === rnd.id;
                const candidateCountAtRound = applicants.filter((a) => a.current_round_number === rnd.round_number).length;

                return (
                  <div key={rnd.id} className="p-4 bg-card rounded-xl border border-border shadow-xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-xl bg-primary text-primary-foreground font-black flex items-center justify-center text-sm shadow-xs">
                          {rnd.round_number}
                        </span>
                        <div>
                          <h5 className="font-bold text-foreground text-sm">{rnd.round_name}</h5>
                          <span className="text-[10px] text-muted-foreground font-bold uppercase">{rnd.round_type || 'TECHNICAL_EVALUATION'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-secondary text-foreground font-bold text-xs border border-border">
                          {candidateCountAtRound} Candidates in Round
                        </span>
                        <StatusBadge status={rnd.status || 'PENDING'} />
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
                            className="p-1.5 text-foreground hover:bg-secondary rounded-lg border border-border cursor-pointer transition-colors"
                            title="Edit Round Schedule"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="p-3.5 bg-secondary rounded-xl border border-border space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <label className="block font-semibold text-foreground mb-1">Scheduled Date & Time</label>
                            <input
                              type="datetime-local"
                              value={roundForm.scheduled_at}
                              onChange={(e) => setRoundForm({ ...roundForm, scheduled_at: e.target.value })}
                              className="w-full p-2 border border-border bg-background text-foreground rounded-lg text-xs"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-foreground mb-1">Venue / Meet Link</label>
                            <input
                              type="text"
                              value={roundForm.venue_or_link}
                              onChange={(e) => setRoundForm({ ...roundForm, venue_or_link: e.target.value })}
                              placeholder="e.g. Auditorium or WebRTC Link"
                              className="w-full p-2 border border-border bg-background text-foreground rounded-lg text-xs"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-foreground mb-1">Round Status</label>
                            <select
                              value={roundForm.status}
                              onChange={(e) => setRoundForm({ ...roundForm, status: e.target.value })}
                              className="w-full p-2 border border-border bg-background text-foreground rounded-lg text-xs font-semibold"
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
                            className="px-3 py-1.5 border border-border rounded-lg text-foreground hover:bg-neutral-200 dark:hover:bg-neutral-800"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={savingRound}
                            onClick={() => handleSaveRound(rnd.id)}
                            className="px-4 py-1.5 bg-primary text-primary-foreground hover:opacity-90 rounded-lg font-bold shadow-xs"
                          >
                            {savingRound ? 'Saving...' : 'Save Schedule'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground pt-1 border-t border-border">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                          {rnd.scheduled_at ? new Date(rnd.scheduled_at).toLocaleString() : 'Schedule Pending'}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                          {rnd.venue_or_link || 'Campus Placement Cell'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. TAB 5: RESULTS & OFFERS */}
        {activeTab === 'results' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-foreground text-xs">Selection Results & Offer Letters</h4>
                <p className="text-[11px] text-muted-foreground">Official selections, issued packages, and joining outcomes.</p>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-card rounded-xl border border-border shadow-xs">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Selected Candidates</span>
                <div className="text-xl font-black text-foreground mt-0.5">{selectedCount}</div>
              </div>
              <div className="p-3.5 bg-card rounded-xl border border-border shadow-xs">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Offers Issued</span>
                <div className="text-xl font-black text-foreground mt-0.5">{statusCounts['OFFERED'] || selectedCount}</div>
              </div>
              <div className="p-3.5 bg-card rounded-xl border border-border shadow-xs">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Offers Accepted</span>
                <div className="text-xl font-black text-foreground mt-0.5">{statusCounts['ACCEPTED'] || selectedCount}</div>
              </div>
              <div className="p-3.5 bg-card rounded-xl border border-border shadow-xs">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Concluded / Rejected</span>
                <div className="text-xl font-black text-foreground mt-0.5">{rejectedCount}</div>
              </div>
            </div>

            {/* Selected Candidates Table */}
            <div className="border border-border rounded-xl overflow-hidden bg-card shadow-xs">
              <div className="p-3 bg-secondary border-b border-border font-bold text-foreground text-xs">
                Final Selections & Placements Roster
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-secondary/40 border-b border-border text-foreground font-bold text-[11px]">
                    <tr>
                      <th className="p-3">Register No</th>
                      <th className="p-3">Candidate Name</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Offered Role</th>
                      <th className="p-3">Package (CTC)</th>
                      <th className="p-3">Final Decision</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {applicants
                      .filter((a) => a.final_result === 'SELECTED' || a.application_status === 'ACCEPTED' || a.application_status === 'OFFERED')
                      .map((a) => (
                        <tr key={a.application_id} className="hover:bg-secondary/50">
                          <td className="p-3 font-mono font-bold text-foreground">{a.register_number}</td>
                          <td className="p-3 font-bold text-foreground">{a.first_name} {a.last_name}</td>
                          <td className="p-3 text-foreground">{a.department_code}</td>
                          <td className="p-3 text-muted-foreground">{company.job_title || 'Software Engineer'}</td>
                          <td className="p-3 font-black text-foreground">₹{company.package_ctc || '12.00'} LPA</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded bg-secondary text-foreground font-bold text-[10px] border border-border">
                              SELECTED
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => setViewingProfile(a)}
                              className="px-2.5 py-1 bg-card hover:bg-secondary text-foreground border border-border rounded-lg font-semibold text-[11px] cursor-pointer"
                            >
                              View Offer
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {applicants.filter((a) => a.final_result === 'SELECTED' || a.application_status === 'ACCEPTED' || a.application_status === 'OFFERED').length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-xs">
                  No final selections confirmed yet for this recruitment drive.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. TAB 6: ANNOUNCEMENTS */}
        {activeTab === 'announcements' && (
          <div className="space-y-4">
            {/* Create Announcement Form */}
            <div className="p-4 bg-card rounded-xl border border-border shadow-xs space-y-3">
              <h4 className="font-bold text-foreground text-xs flex items-center gap-2">
                <Bell className="w-4 h-4 text-foreground" /> Dispatch Recruitment Announcement
              </h4>
              <form onSubmit={handlePostAnnouncement} className="space-y-3">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Announcement Title (e.g., Shortlist Announced for Technical Interview Round 2)..."
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    className="w-full p-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div>
                  <textarea
                    rows="3"
                    required
                    placeholder="Detailed announcement briefing, meeting links, instructions, reporting time, and guidelines for students..."
                    value={annContent}
                    onChange={(e) => setAnnContent(e.target.value)}
                    className="w-full p-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={postingAnn}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground hover:opacity-90 font-bold rounded-lg text-xs shadow-xs transition-opacity cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{postingAnn ? 'Broadcasting...' : 'Publish Announcement'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Existing Announcements Feed */}
            <div className="space-y-2.5">
              <h4 className="font-bold text-foreground text-xs">Published Announcements ({announcements.length})</h4>
              {announcements.length === 0 ? (
                <div className="p-8 text-center bg-card rounded-xl border border-border text-muted-foreground">
                  No announcements published yet for this placement company.
                </div>
              ) : (
                announcements.map((ann) => (
                  <div key={ann.id} className="p-4 bg-card rounded-xl border border-border shadow-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-foreground text-sm">{ann.title}</h5>
                      <span className="text-[11px] text-muted-foreground">
                        {ann.created_at ? new Date(ann.created_at).toLocaleString() : 'Recent'}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-xs leading-relaxed whitespace-pre-wrap">
                      {ann.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Console Footer */}
        <div className="pt-3 border-t border-border flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            CampusCorp Multi-Tenant Governance • {company?.name || 'Company Details'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-secondary hover:bg-neutral-200 dark:hover:bg-neutral-800 text-foreground border border-border font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Close Console
          </button>
        </div>
      </div>

      {/* Sub-Modal: Individual Applicant Review Form */}
      {reviewingApplicant && (
        <ApplicantReviewModal
          isOpen={!!reviewingApplicant}
          onClose={() => setReviewingApplicant(null)}
          applicant={reviewingApplicant}
          company={company}
          onSave={handleSaveApplicantReview}
          loading={savingReview}
        />
      )}

      {/* Sub-Modal: Student Complete Academic Profile Drawer */}
      {viewingProfile && (
        <StudentProfileViewModal
          isOpen={!!viewingProfile}
          onClose={() => setViewingProfile(null)}
          applicant={viewingProfile}
          company={company}
        />
      )}
    </Modal>
  );
}
