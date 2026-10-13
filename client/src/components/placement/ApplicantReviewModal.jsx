import React, { useState } from 'react';
import { Modal } from '../Modal';
import { StatusBadge } from '../Badge';
import {
  User,
  GraduationCap,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Send,
  FileText,
} from 'lucide-react';

export function ApplicantReviewModal({
  isOpen,
  onClose,
  applicant,
  rounds = [],
  onSave,
  saving,
}) {
  if (!applicant) return null;

  const [status, setStatus] = useState(applicant.application_status || 'APPLIED');
  const [eligibilityStatus, setEligibilityStatus] = useState(applicant.eligibility_status || 'ELIGIBLE');
  const [ineligibilityReason, setIneligibilityReason] = useState(applicant.ineligibility_reason || '');
  const [roundNumber, setRoundNumber] = useState(applicant.current_round_number || 1);
  const [finalResult, setFinalResult] = useState(applicant.final_result || 'PENDING');
  const [scheduledAt, setScheduledAt] = useState(
    applicant.interview_scheduled_at ? applicant.interview_scheduled_at.slice(0, 16) : ''
  );
  const [venueOrLink, setVenueOrLink] = useState(applicant.interview_venue_or_link || '');
  const [feedback, setFeedback] = useState(applicant.feedback || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      status,
      eligibility_status: eligibilityStatus,
      ineligibility_reason: ineligibilityReason,
      current_round_number: parseInt(roundNumber, 10),
      final_result: finalResult,
      interview_scheduled_at: scheduledAt || null,
      interview_venue_or_link: venueOrLink || null,
      feedback: feedback || null,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Candidate Review: ${applicant.first_name} ${applicant.last_name}`}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
        {/* Candidate Profile Summary */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
            <div>
              <span className="font-bold text-slate-900 text-sm">
                {applicant.first_name} {applicant.last_name}
              </span>
              <span className="font-mono text-slate-500 ml-2">({applicant.register_number})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <StatusBadge status={applicant.application_status} />
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                {applicant.eligibility_status || 'ELIGIBLE'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
            <div>
              <span className="text-slate-400 block text-[10px]">Department & Batch</span>
              <strong className="text-slate-800">
                {applicant.department_code} • {applicant.academic_year || applicant.batch}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Current CGPA</span>
              <strong className="text-emerald-700 font-bold">{applicant.cgpa}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Active Backlogs</span>
              <strong className={applicant.active_backlogs > 0 ? 'text-rose-600 font-bold' : 'text-slate-800'}>
                {applicant.active_backlogs || 0} Backlog(s)
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Applied Date</span>
              <strong className="text-slate-800">
                {applicant.applied_at ? new Date(applicant.applied_at).toLocaleDateString() : 'N/A'}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-1.5 text-[11px] text-slate-600 border-t border-slate-200/60">
            <span>Email: <strong className="text-slate-800">{applicant.email}</strong></span>
            <span>Phone: <strong className="text-slate-800">{applicant.phone || 'N/A'}</strong></span>
          </div>
        </div>

        {/* Status & Eligibility Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Eligibility Clearance Status</label>
            <select
              value={eligibilityStatus}
              onChange={(e) => setEligibilityStatus(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-medium"
            >
              <option value="ELIGIBLE">ELIGIBLE (Approved by Placement Officer)</option>
              <option value="PENDING_REVIEW">PENDING_REVIEW (Under Verification)</option>
              <option value="INELIGIBLE">INELIGIBLE (Disqualified)</option>
              <option value="FLAGGED">FLAGGED (Requires Manual Review)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Application Pipeline Stage</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-medium"
            >
              <option value="APPLIED">APPLIED (New Submission)</option>
              <option value="SHORTLISTED">SHORTLISTED (Advanced to rounds)</option>
              <option value="IN_PROCESS">IN_PROCESS (In Progress)</option>
              <option value="ACCEPTED">ACCEPTED (Offer Accepted / Selected)</option>
              <option value="OFFERED">OFFERED (Offer Letter Issued)</option>
              <option value="REJECTED">REJECTED (Disqualified)</option>
              <option value="WITHDRAWN">WITHDRAWN (Candidate Withdrew)</option>
            </select>
          </div>

          {eligibilityStatus === 'INELIGIBLE' && (
            <div className="sm:col-span-2">
              <label className="block font-semibold text-rose-700 mb-1">Ineligibility Reason / Clause</label>
              <input
                type="text"
                value={ineligibilityReason}
                onChange={(e) => setIneligibilityReason(e.target.value)}
                placeholder="e.g. Backlog threshold exceeded or CGPA below cutoff"
                className="w-full p-2 border border-rose-200 bg-rose-50/50 rounded-lg text-xs"
              />
            </div>
          )}
        </div>

        {/* Selection Round & Final Result */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Current Active Round</label>
            <select
              value={roundNumber}
              onChange={(e) => setRoundNumber(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-medium"
            >
              {rounds.length > 0 ? (
                rounds.map((rnd) => (
                  <option key={rnd.round_number} value={rnd.round_number}>
                    Round {rnd.round_number}: {rnd.round_name}
                  </option>
                ))
              ) : (
                <>
                  <option value={1}>Round 1: Screening & Aptitude</option>
                  <option value={2}>Round 2: Technical Assessment</option>
                  <option value={3}>Round 3: System Design & Technical</option>
                  <option value={4}>Round 4: Leadership & HR Interview</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Final Result Verdict</label>
            <select
              value={finalResult}
              onChange={(e) => setFinalResult(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-medium"
            >
              <option value="PENDING">PENDING (In Progress)</option>
              <option value="SELECTED">SELECTED (Final Offer Cleared)</option>
              <option value="WAITLISTED">WAITLISTED (On Standby List)</option>
              <option value="REJECTED">REJECTED (Did Not Clear Final Round)</option>
            </select>
          </div>
        </div>

        {/* Assessment / Interview Scheduling */}
        <div className="p-3.5 bg-blue-50/40 rounded-xl border border-blue-200/70 space-y-2.5">
          <h4 className="font-bold text-blue-950 text-xs flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4 text-blue-600" /> Assessment / Interview Scheduling
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Scheduled Date & Time</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full p-2 border border-slate-200 bg-white rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Venue / Online Meet Link</label>
              <input
                type="text"
                value={venueOrLink}
                onChange={(e) => setVenueOrLink(e.target.value)}
                placeholder="e.g. Placement Block Lab 2 or WebRTC Room #104"
                className="w-full p-2 border border-slate-200 bg-white rounded-lg text-xs"
              />
            </div>
          </div>
        </div>

        {/* Interview Feedback & Evaluator Remarks */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
            Interview Feedback & Evaluator Remarks (Visible in candidate portal)
          </label>
          <textarea
            rows="2"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Feedback on problem solving, coding proficiency, domain depth, communication, or next steps..."
            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
          />
        </div>

        {/* Modal Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer text-xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className={`inline-flex items-center gap-1.5 px-5 py-2 text-white font-bold rounded-xl shadow-md transition-all text-xs ${
              saving
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 cursor-pointer shadow-blue-500/20 active:scale-95'
            }`}
          >
            {saving ? 'Saving...' : 'Save & Notify Student'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
