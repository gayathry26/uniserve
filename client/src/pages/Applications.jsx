import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { StatusBadge, Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  FileCheck2,
  Filter,
  Award,
  XCircle,
  CheckCircle2,
  ArrowRight,
  Clock,
  CalendarDays,
  MapPin,
  Building2,
  Video,
  AlertTriangle,
  Bell,
  Search,
  ChevronRight,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  ExternalLink,
  GraduationCap,
} from 'lucide-react';

export function Applications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentTheme } = useTheme();

  const isStudent = user?.roleName === 'STUDENT';
  const isAdminOrTpo = ['SUPER_ADMIN', 'TPO_OFFICER', 'ADMIN', 'RECRUITER'].includes(user?.roleName);

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Offer release modal (for Recruiters / TPO Officers)
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [offerCtc, setOfferCtc] = useState('');

  // Withdrawing state
  const [withdrawingId, setWithdrawingId] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, [statusFilter, departmentFilter]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const endpoint = isStudent ? '/applications/my' : '/applications';
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (departmentFilter !== 'ALL') params.department = departmentFilter;

      const res = await apiClient.get(endpoint, { params });
      setApplications(res.data.data || []);
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (appId, status, nextRound = null) => {
    try {
      await apiClient.put(`/applications/${appId}/status`, {
        status,
        current_round_number: nextRound,
      });
      fetchApplications();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleReleaseOffer = async (e) => {
    e.preventDefault();
    if (!selectedApp || !offerCtc) return;

    try {
      await apiClient.post('/offers/issue', {
        application_id: selectedApp.id,
        offered_ctc_lpa: parseFloat(offerCtc),
      });
      setOfferModalOpen(false);
      fetchApplications();
      alert(`Offer letter for ₹${offerCtc} LPA issued to ${selectedApp.first_name}!`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to issue offer.');
    }
  };

  const handleWithdrawApplication = async (appId, companyName) => {
    if (!window.confirm(`Are you sure you want to withdraw your application for ${companyName}? This action will be recorded in your placement audit log.`)) {
      return;
    }
    setWithdrawingId(appId);
    try {
      await apiClient.post(`/applications/${appId}/withdraw`, {
        reason: 'Candidate self-withdrawal before recruitment drive deadline',
      });
      alert('Application withdrawn successfully.');
      fetchApplications();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to withdraw application.');
    } finally {
      setWithdrawingId(null);
    }
  };

  // Filter applications by search term
  const filteredApplications = applications.filter((app) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const company = (app.company_name || '').toLowerCase();
    const job = (app.job_title || '').toLowerCase();
    const student = `${app.first_name || ''} ${app.last_name || ''} ${app.register_number || ''}`.toLowerCase();
    return company.includes(term) || job.includes(term) || student.includes(term);
  });

  // Student metrics
  const activeCount = applications.filter((a) => !['REJECTED', 'WITHDRAWN'].includes(a.status)).length;
  const shortlistedCount = applications.filter((a) => ['SHORTLISTED', 'IN_PROCESS'].includes(a.status)).length;
  const offeredCount = applications.filter((a) => ['OFFERED', 'ACCEPTED'].includes(a.status) || a.final_result === 'SELECTED').length;

  // ----------------------------------------------------
  // RENDER: STUDENT MY APPLICATIONS TRACKING DASHBOARD
  // ----------------------------------------------------
  if (isStudent) {
    return (
      <div className="space-y-6 pb-12">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 p-6 rounded-2xl text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white"
                style={{ backgroundColor: currentTheme.primary }}
              >
                Candidate Portal
              </span>
              <span className="text-xs text-slate-300 font-medium">Placement Governance Tracking</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2.5 text-white">
              <FileCheck2 className="w-7 h-7 text-blue-400" /> My Placement Applications
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Real-time multi-stage recruitment pipeline tracking, eligibility status verification, confirmed interview schedules, and official selection results.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/companies"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all"
            >
              <Building2 className="w-4 h-4" /> Browse More Companies
            </Link>
          </div>
        </div>

        {/* Student Profile Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">Total Applied</span>
              <FileCheck2 className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{applications.length}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Campus recruitment drives</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">In Progress</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-700">{activeCount}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Active under evaluation</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">Shortlisted & Tech</span>
              <Sparkles className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-purple-700">{shortlistedCount}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Assessment & Interview stages</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">Offers Released</span>
              <Award className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-700">{offeredCount}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Final selections confirmed</p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by company name or job role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[11px] font-medium hidden sm:inline">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-700"
            >
              <option value="ALL">All Application Statuses</option>
              <option value="APPLIED">Applied</option>
              <option value="SHORTLISTED">Shortlisted</option>
              <option value="IN_PROCESS">In Process / Interview</option>
              <option value="OFFERED">Offer Released</option>
              <option value="REJECTED">Rejected</option>
              <option value="WITHDRAWN">Withdrawn</option>
            </select>
          </div>
        </div>

        {/* Applications List */}
        {loading ? (
          <LoadingSpinner text="Retrieving candidate application tracking..." />
        ) : filteredApplications.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-200">
              <FileCheck2 className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">No Applications Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              {searchTerm || statusFilter !== 'ALL'
                ? 'No applications match your selected filter criteria. Try clearing search filters.'
                : 'You have not submitted applications to any corporate placement drives yet. Browse open drives to begin your campus placement journey.'}
            </p>
            <div className="pt-2">
              <Link
                to="/companies"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                Explore Eligible Companies <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredApplications.map((app) => {
              const driveRounds = Array.isArray(app.selection_rounds) ? app.selection_rounds : [];
              const announcements = Array.isArray(app.announcements) ? app.announcements : [];
              const currentRoundNum = app.current_round_number || 1;
              const isWithdrawn = app.status === 'WITHDRAWN';
              const isRejected = app.status === 'REJECTED' || app.final_result === 'REJECTED';
              const isSelected = app.status === 'OFFERED' || app.status === 'ACCEPTED' || app.final_result === 'SELECTED';

              return (
                <div
                  key={app.id}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-300 shadow-2xs hover:shadow-md transition-all overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-50/70 to-white">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white font-black text-xl flex items-center justify-center shadow-xs">
                        {app.company_name ? app.company_name[0] : 'C'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-slate-900">{app.company_name}</h3>
                          <StatusBadge status={app.company_tier || 'REGULAR'} />
                          {app.ctc_lpa && (
                            <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              ₹{app.ctc_lpa} LPA
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Role: <strong className="text-slate-800">{app.job_title}</strong>
                          {app.locations ? ` • ${app.locations}` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Metadata & Status Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-right hidden sm:block mr-2">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Application ID</span>
                        <span className="text-xs font-mono font-bold text-slate-800">#APPL-{app.id}</span>
                      </div>

                      {/* Eligibility Badge */}
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                          app.eligibility_status === 'ELIGIBLE'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : app.eligibility_status === 'INELIGIBLE'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {app.eligibility_status === 'ELIGIBLE' && '✓ Eligibility Verified'}
                        {app.eligibility_status === 'INELIGIBLE' && '✕ Ineligible'}
                        {app.eligibility_status === 'PENDING_REVIEW' && '⏳ Eligibility In Review'}
                        {!app.eligibility_status && '✓ Verified'}
                      </span>

                      {/* Application Status Badge */}
                      <StatusBadge status={app.status} />

                      {/* Final Result Badge (if released) */}
                      {app.final_result && app.final_result !== 'PENDING' && (
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                            app.final_result === 'SELECTED'
                              ? 'bg-emerald-600 text-white'
                              : app.final_result === 'WAITLISTED'
                              ? 'bg-amber-600 text-white'
                              : 'bg-rose-600 text-white'
                          }`}
                        >
                          {app.final_result === 'SELECTED' && '🎉 SELECTED'}
                          {app.final_result === 'WAITLISTED' && '⏱ WAITLISTED'}
                          {app.final_result === 'REJECTED' && 'REJECTED'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Visual Progression Timeline */}
                  <div className="p-5 space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-3">
                        <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-blue-600" /> Multi-Round Selection Timeline
                        </span>
                        <span className="text-slate-500 font-medium">
                          Current Stage: <strong className="text-blue-700">{app.current_round_name || `Round ${currentRoundNum}`}</strong>
                        </span>
                      </div>

                      {/* Stepper container */}
                      <div className="overflow-x-auto pb-2">
                        <div className="flex items-center min-w-[620px] text-xs">
                          {/* Step 1: Applied */}
                          <div className="flex-1 flex flex-col items-center text-center relative group">
                            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs z-10">
                              ✓
                            </div>
                            <span className="font-bold text-slate-800 text-[11px] mt-2">Applied</span>
                            <span className="text-[10px] text-slate-400">
                              {app.applied_at ? app.applied_at.split('T')[0] : 'Confirmed'}
                            </span>
                          </div>

                          <div className="h-0.5 flex-1 bg-emerald-500 -mt-7" />

                          {/* Step 2: Eligibility Verified */}
                          <div className="flex-1 flex flex-col items-center text-center relative group">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-xs z-10 ${
                                app.eligibility_status === 'INELIGIBLE'
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-emerald-600 text-white'
                              }`}
                            >
                              {app.eligibility_status === 'INELIGIBLE' ? '✕' : '✓'}
                            </div>
                            <span className="font-bold text-slate-800 text-[11px] mt-2">Eligibility</span>
                            <span className="text-[10px] text-slate-400">
                              {app.eligibility_status === 'INELIGIBLE' ? 'Flagged' : 'Verified'}
                            </span>
                          </div>

                          <div
                            className={`h-0.5 flex-1 -mt-7 ${
                              ['SHORTLISTED', 'IN_PROCESS', 'OFFERED', 'ACCEPTED'].includes(app.status)
                                ? 'bg-emerald-500'
                                : 'bg-slate-200'
                            }`}
                          />

                          {/* Dynamic Drive Rounds */}
                          {driveRounds.length > 0 ? (
                            driveRounds.map((rnd, idx) => {
                              const isPastRound = currentRoundNum > rnd.round_number || isSelected;
                              const isCurrentRound = currentRoundNum === rnd.round_number && !isWithdrawn && !isSelected && !isRejected;
                              const isFailedHere = isRejected && currentRoundNum === rnd.round_number;

                              return (
                                <React.Fragment key={rnd.id || idx}>
                                  <div className="flex-1 flex flex-col items-center text-center relative group">
                                    <div
                                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-xs z-10 ${
                                        isPastRound
                                          ? 'bg-emerald-600 text-white'
                                          : isFailedHere
                                          ? 'bg-rose-600 text-white'
                                          : isCurrentRound
                                          ? 'bg-blue-600 text-white ring-4 ring-blue-100 animate-pulse'
                                          : 'bg-slate-100 text-slate-400 border border-slate-300'
                                      }`}
                                    >
                                      {isPastRound ? '✓' : isFailedHere ? '✕' : rnd.round_number}
                                    </div>
                                    <span className={`font-bold text-[11px] mt-2 truncate max-w-[110px] ${
                                      isCurrentRound ? 'text-blue-700' : 'text-slate-800'
                                    }`}>
                                      {rnd.round_name}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      {isCurrentRound ? 'In Progress' : isPastRound ? 'Cleared' : isFailedHere ? 'Not Cleared' : 'Pending'}
                                    </span>
                                  </div>

                                  {idx < driveRounds.length - 1 && (
                                    <div
                                      className={`h-0.5 flex-1 -mt-7 ${
                                        currentRoundNum > rnd.round_number || isSelected ? 'bg-emerald-500' : 'bg-slate-200'
                                      }`}
                                    />
                                  )}
                                </React.Fragment>
                              );
                            })
                          ) : (
                            // Default Fallback Stages if rounds empty
                            <>
                              <div className="flex-1 flex flex-col items-center text-center relative group">
                                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs z-10">
                                  1
                                </div>
                                <span className="font-bold text-slate-800 text-[11px] mt-2">Assessment</span>
                                <span className="text-[10px] text-slate-400">In Progress</span>
                              </div>
                              <div className="h-0.5 flex-1 bg-slate-200 -mt-7" />
                              <div className="flex-1 flex flex-col items-center text-center relative group">
                                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 border border-slate-300 flex items-center justify-center font-bold text-xs shadow-xs z-10">
                                  2
                                </div>
                                <span className="font-bold text-slate-800 text-[11px] mt-2">Interview</span>
                                <span className="text-[10px] text-slate-400">Upcoming</span>
                              </div>
                            </>
                          )}

                          <div
                            className={`h-0.5 flex-1 -mt-7 ${
                              isSelected ? 'bg-emerald-500' : isRejected ? 'bg-rose-400' : 'bg-slate-200'
                            }`}
                          />

                          {/* Final Outcome Step */}
                          <div className="flex-1 flex flex-col items-center text-center relative group">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-xs z-10 ${
                                isSelected
                                  ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                                  : isRejected
                                  ? 'bg-rose-600 text-white'
                                  : isWithdrawn
                                  ? 'bg-slate-400 text-white'
                                  : 'bg-slate-100 text-slate-400 border border-slate-300'
                              }`}
                            >
                              {isSelected ? '★' : isRejected ? '✕' : isWithdrawn ? '—' : '🏆'}
                            </div>
                            <span className="font-bold text-slate-800 text-[11px] mt-2">Final Outcome</span>
                            <span className="text-[10px] text-slate-400">
                              {isSelected
                                ? 'Selected!'
                                : isRejected
                                ? 'Rejected'
                                : isWithdrawn
                                ? 'Withdrawn'
                                : 'Pending'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Interview / Assessment Schedule Alert (if scheduled) */}
                    {app.interview_scheduled_at && (
                      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <CalendarDays className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="font-bold text-blue-900 block text-xs">
                              Upcoming Interview / Assessment Slot Confirmed
                            </span>
                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 mt-0.5">
                              <span>
                                Date & Time: <strong className="text-slate-800">{new Date(app.interview_scheduled_at).toLocaleString()}</strong>
                              </span>
                              {app.interview_venue_or_link && (
                                <span>
                                  Venue / Meet: <strong className="text-slate-800">{app.interview_venue_or_link}</strong>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {app.interview_venue_or_link && (app.interview_venue_or_link.includes('http') || app.interview_venue_or_link.includes('room')) && (
                          <Link
                            to="/videocall/interview"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-xs"
                          >
                            <Video className="w-3.5 h-3.5" /> Join Room
                          </Link>
                        )}
                      </div>
                    )}

                    {/* Officer Feedback Banner (if released) */}
                    {app.feedback && (
                      <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-3 text-xs text-purple-900 space-y-1">
                        <span className="font-bold text-[11px] flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Evaluation Remarks & Feedback:
                        </span>
                        <p className="text-[11px] text-purple-800 italic">{app.feedback}</p>
                      </div>
                    )}

                    {/* Announcements for this company */}
                    {announcements.length > 0 && (
                      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 space-y-2 text-xs">
                        <span className="font-bold text-slate-700 text-[11px] flex items-center gap-1.5">
                          <Bell className="w-3.5 h-3.5 text-blue-600" /> Recruitment Announcements ({announcements.length})
                        </span>
                        <div className="space-y-1.5">
                          {announcements.slice(0, 2).map((ann) => (
                            <div key={ann.id} className="p-2.5 rounded-lg bg-white border border-slate-200/80 text-[11px] space-y-0.5">
                              <div className="flex items-center justify-between font-bold text-slate-800">
                                <span>{ann.title}</span>
                                <span className="text-[10px] text-slate-400 font-normal">
                                  {ann.created_at ? ann.created_at.split('T')[0] : 'Recent'}
                                </span>
                              </div>
                              <p className="text-slate-600 text-[11px]">{ann.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="px-5 py-3.5 bg-slate-50/90 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                      <span>
                        Drive Date: <strong className="text-slate-800">{app.drive_date?.split('T')[0] || 'TBD'}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Venue: <strong className="text-slate-800">{app.drive_venue || 'Campus Placement Cell'}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to="/companies"
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-lg border border-slate-200 text-xs transition-colors"
                      >
                        Company Info
                      </Link>

                      {/* Withdrawal Button */}
                      {!isWithdrawn && !['OFFERED', 'ACCEPTED'].includes(app.status) && app.final_result !== 'SELECTED' && (
                        <button
                          onClick={() => handleWithdrawApplication(app.id, app.company_name)}
                          disabled={withdrawingId === app.id}
                          className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 font-semibold rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {withdrawingId === app.id ? 'Withdrawing...' : 'Withdraw Application'}
                        </button>
                      )}

                      {isWithdrawn && (
                        <span className="px-3 py-1.5 bg-slate-200 text-slate-600 font-bold rounded-lg text-xs">
                          Withdrawn
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER: TPO OFFICER / ADMIN / RECRUITER PIPELINE VIEW
  // ----------------------------------------------------
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Recruitment Applications Pipeline</h1>
          <p className="text-xs text-slate-500">Track candidate progression from initial apply through shortlisting, interviews, and final offers.</p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search candidate or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-700"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-700"
          >
            <option value="ALL">All Application Statuses</option>
            <option value="APPLIED">Applied</option>
            <option value="SHORTLISTED">Shortlisted</option>
            <option value="IN_PROCESS">In Process</option>
            <option value="OFFERED">Offered</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="REJECTED">Rejected</option>
          </select>

          {user?.roleName !== 'FACULTY_COORDINATOR' && (
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-700"
            >
              <option value="ALL">All Departments</option>
              <option value="CSE">CSE</option>
              <option value="ECE">ECE</option>
              <option value="EEE">EEE</option>
              <option value="MECH">MECH</option>
              <option value="CIVIL">CIVIL</option>
              <option value="IT">IT</option>
            </select>
          )}
        </div>

        <span className="text-xs text-slate-500 font-semibold">Showing {filteredApplications.length} candidates</span>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Loading candidate pipeline..." />
        ) : filteredApplications.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No applications match the current filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Dept & CGPA</th>
                  <th className="py-3 px-4">Company & Job</th>
                  <th className="py-3 px-4">Eligibility</th>
                  <th className="py-3 px-4">Round</th>
                  <th className="py-3 px-4">Status</th>
                  {isAdminOrTpo && (
                    <th className="py-3 px-4 text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{app.first_name} {app.last_name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{app.register_number}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{app.department_code}</div>
                      <div className="text-[11px] text-blue-600 font-bold">CGPA: {app.cgpa}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{app.company_name}</div>
                      <div className="text-[11px] text-slate-500">{app.job_title} (₹{app.ctc_lpa} LPA)</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        app.eligibility_status === 'ELIGIBLE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : app.eligibility_status === 'INELIGIBLE'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {app.eligibility_status || 'ELIGIBLE'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-medium">Round {app.current_round_number}</span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={app.status} />
                    </td>

                    {/* Recruiter / TPO Action buttons */}
                    {isAdminOrTpo && (
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {app.status === 'APPLIED' && (
                            <button
                              onClick={() => handleUpdateStatus(app.id, 'SHORTLISTED', 2)}
                              className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-[11px] cursor-pointer"
                            >
                              Shortlist
                            </button>
                          )}
                          {app.status === 'SHORTLISTED' && (
                            <button
                              onClick={() => handleUpdateStatus(app.id, 'IN_PROCESS', 3)}
                              className="px-2.5 py-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 font-semibold text-[11px] cursor-pointer"
                            >
                              Advance
                            </button>
                          )}
                          {['SHORTLISTED', 'IN_PROCESS'].includes(app.status) && (
                            <button
                              onClick={() => {
                                setSelectedApp(app);
                                setOfferCtc(app.ctc_lpa || '12.0');
                                setOfferModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-[11px] cursor-pointer flex items-center gap-1"
                            >
                              <Award className="w-3 h-3" /> Offer
                            </button>
                          )}
                          {app.status !== 'REJECTED' && app.status !== 'OFFERED' && app.status !== 'ACCEPTED' && (
                            <button
                              onClick={() => handleUpdateStatus(app.id, 'REJECTED')}
                              className="px-2 py-1 rounded text-rose-600 hover:bg-rose-50 text-[11px] cursor-pointer"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Offer Release Modal */}
      <Modal isOpen={offerModalOpen} onClose={() => setOfferModalOpen(false)} title={`Issue Placement Offer to ${selectedApp?.first_name} ${selectedApp?.last_name}`}>
        <form onSubmit={handleReleaseOffer} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Company</label>
            <input type="text" readOnly value={selectedApp?.company_name || ''} className="w-full p-2 border bg-slate-50 rounded" />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Role</label>
            <input type="text" readOnly value={selectedApp?.job_title || ''} className="w-full p-2 border bg-slate-50 rounded" />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Offered CTC Package (LPA)</label>
            <input
              type="number"
              step="0.1"
              required
              value={offerCtc}
              onChange={(e) => setOfferCtc(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded font-bold text-emerald-600 text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setOfferModalOpen(false)} className="px-4 py-2 border rounded text-slate-600">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white font-bold rounded hover:bg-emerald-700">Release Offer Letter</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
