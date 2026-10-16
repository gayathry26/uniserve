import React, { useState } from 'react';
import { Modal } from '../Modal';
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  CalendarDays,
  Award,
  ArrowRight,
  FileCheck2,
  XCircle,
} from 'lucide-react';

export function StudentApplyConfirmModal({
  isOpen,
  onClose,
  company,
  user,
  onConfirmApply,
  applying,
}) {
  const [agreeTerms, setAgreeTerms] = useState(true);

  if (!company) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Confirm Application: ${company.name}`}
      maxWidth="max-w-xl"
    >
      <div className="space-y-4 text-xs">
        {/* Company Opportunity Header */}
        <div className="p-3.5 bg-secondary rounded-xl border border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#171717] text-[#fafafa] dark:bg-[#fafafa] dark:text-[#0a0a0a] font-black text-lg flex items-center justify-center shadow-xs">
              {company.name[0]}
            </div>
            <div>
              <h4 className="font-bold text-foreground text-sm">{company.name}</h4>
              <p className="text-muted-foreground text-[11px] font-medium">
                {company.job_title || `${company.name} Campus Drive`}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-black text-foreground bg-card px-2 py-0.5 rounded border border-border">
              ₹{company.package_ctc || '12.00'} LPA
            </span>
            <span className="block text-[10px] text-muted-foreground mt-1 uppercase font-semibold">
              {company.tier}
            </span>
          </div>
        </div>

        {/* Student Profile Snapshot */}
        <div className="bg-secondary rounded-xl p-3.5 border border-border space-y-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-border text-foreground font-bold text-[11px]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-foreground" />
              Verified Academic Profile (Shared with Recruiter)
            </span>
            <span className="text-foreground bg-card px-2 py-0.5 rounded text-[10px] border border-border">
              Eligible
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-[11px]">
            <div>
              <span className="text-muted-foreground block text-[10px]">Student Name</span>
              <strong className="text-foreground">
                {user.firstName} {user.lastName}
              </strong>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">Register Number</span>
              <strong className="font-mono text-foreground">{user.registerNumber}</strong>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">Department</span>
              <strong className="text-foreground">{user.departmentCode}</strong>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">Recorded CGPA</span>
              <strong className="text-foreground font-bold">{user.cgpa || '8.50'}</strong>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">Active Backlogs</span>
              <strong className="text-foreground">0 Active</strong>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">Academic Batch</span>
              <strong className="text-foreground">{user.academicYear || '2026-2027'}</strong>
            </div>
          </div>
        </div>

        {/* Drive Info Highlights */}
        <div className="p-3 bg-secondary border border-border rounded-xl text-[11px] text-foreground flex items-start gap-2.5">
          <CalendarDays className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Placement Drive Schedule: </span>
            <span>
              {company.drive_date?.split('T')[0] || '2026-11-25'} at{' '}
              {company.drive_venue || 'Main Campus Placement Block'} ({company.drive_mode || 'ON_CAMPUS'}).
            </span>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Deadline: {company.application_deadline ? new Date(company.application_deadline).toLocaleString() : 'Open until slots fill'}
            </p>
          </div>
        </div>

        {/* Agreement Checkbox */}
        <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-secondary cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            className="rounded accent-black dark:accent-white mt-0.5"
          />
          <span className="text-[11px] text-muted-foreground leading-snug">
            I confirm that my institutional academic profile details and primary resume are accurate. I understand that duplicate submissions will be rejected, and withdrawing after shortlisting is subject to institutional policy.
          </span>
        </label>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={applying}
            className="px-4 py-2 border border-border rounded-xl text-foreground hover:bg-secondary font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!agreeTerms || applying}
            onClick={() => onConfirmApply(company.id, company.name)}
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-[#fafafa] dark:text-[#0a0a0a] font-bold shadow-xs transition-all ${
              !agreeTerms || applying
                ? 'bg-neutral-400 cursor-not-allowed'
                : 'bg-[#171717] hover:bg-[#262626] dark:bg-[#fafafa] dark:hover:bg-[#e5e5e5] cursor-pointer'
            }`}
          >
            {applying ? (
              <span>Submitting Application...</span>
            ) : (
              <>
                <FileCheck2 className="w-4 h-4" />
                <span>Confirm & Apply Now</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
