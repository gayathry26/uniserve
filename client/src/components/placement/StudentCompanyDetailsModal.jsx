import React from 'react';
import { Modal } from '../Modal';
import { StatusBadge } from '../Badge';
import {
  Building2,
  Globe,
  MapPin,
  Mail,
  Phone,
  Layers,
  CalendarDays,
  CheckCircle2,
  XCircle,
  FileCheck2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export function StudentCompanyDetailsModal({
  isOpen,
  onClose,
  company,
  user,
  onOpenApply,
  onWithdraw,
  withdrawing,
}) {
  if (!company) return null;

  const depts = Array.isArray(company.eligible_departments)
    ? company.eligible_departments
    : typeof company.eligible_departments === 'string'
    ? JSON.parse(company.eligible_departments || '[]')
    : ['CSE', 'ECE', 'IT'];

  const rounds = Array.isArray(company.selection_rounds)
    ? company.selection_rounds
    : typeof company.selection_rounds === 'string'
    ? JSON.parse(company.selection_rounds || '[]')
    : ['Resume Screening', 'Online Coding Assessment', 'Technical Interview', 'HR Discussion'];

  const isEligible = company.is_eligible !== false;
  const ineligibilityReasons = company.ineligibility_reasons || [];
  const hasApplied = company.has_applied;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Opportunity Profile: ${company.name}`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
        {/* Company Header Card */}
        <div className="p-4 bg-neutral-100 dark:bg-neutral-900 border border-border text-foreground rounded-2xl flex items-start justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#171717] text-[#fafafa] dark:bg-[#fafafa] dark:text-[#0a0a0a] font-black text-xl flex items-center justify-center">
              {company.name[0]}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-foreground">{company.name}</h3>
              <p className="text-muted-foreground text-xs font-medium">{company.industry}</p>
              <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
                {company.headquarters && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-muted-foreground" /> {company.headquarters}
                  </span>
                )}
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-foreground hover:underline"
                  >
                    <Globe className="w-3 h-3" /> Website
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className="text-sm font-black text-foreground bg-secondary px-2.5 py-1 rounded-lg border border-border">
              ₹{company.package_ctc || '12.00'} LPA
            </span>
            <StatusBadge status={company.tier} />
          </div>
        </div>

        {/* Ineligibility Warning Callout (if ineligible) */}
        {!isEligible && ineligibilityReasons.length > 0 && (
          <div className="p-3.5 bg-secondary border border-border rounded-xl text-foreground space-y-1">
            <div className="flex items-center gap-2 font-bold text-xs">
              <ShieldAlert className="w-4 h-4 text-foreground shrink-0" />
              <span>You do not meet the minimum criteria for this company:</span>
            </div>
            <ul className="list-disc list-inside text-[11px] space-y-0.5 text-muted-foreground pl-1">
              {ineligibilityReasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Description & Overview */}
        <div>
          <h4 className="font-bold text-foreground text-xs uppercase tracking-wider mb-1.5">
            About the Company & Role
          </h4>
          <p className="text-muted-foreground text-xs leading-relaxed bg-secondary p-3 rounded-xl border border-border">
            {company.description ||
              `${company.name} is a global industry leader participating in the campus recruitment drive. Candidates will undergo a multi-tier selection process.`}
          </p>
        </div>

        {/* Eligibility Criteria Matrix */}
        <div className="bg-secondary p-3.5 rounded-xl border border-border space-y-2.5">
          <h4 className="font-bold text-foreground text-xs flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-foreground" /> Complete Eligibility Rules
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="bg-card p-2.5 rounded-lg border border-border">
              <span className="text-muted-foreground block text-[10px]">Min. CGPA Cutoff</span>
              <strong className="text-foreground font-bold">{company.min_cgpa || '6.50'}</strong>
            </div>

            <div className="bg-card p-2.5 rounded-lg border border-border">
              <span className="text-muted-foreground block text-[10px]">Academic Cohort</span>
              <strong className="text-foreground font-bold">{company.academic_year || '2026-2027'}</strong>
            </div>

            <div className="bg-card p-2.5 rounded-lg border border-border">
              <span className="text-muted-foreground block text-[10px]">Drive Capacity Quota</span>
              <strong className="text-foreground font-bold">{company.configured_eligible_quota || 60} Seats</strong>
            </div>

            <div className="bg-card p-2.5 rounded-lg border border-border">
              <span className="text-muted-foreground block text-[10px]">Drive Mode</span>
              <strong className="text-foreground font-bold">{company.drive_mode || 'ON_CAMPUS'}</strong>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
              Eligible Engineering & Sciences Branches ({depts.length}):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {depts.map((d) => {
                const isStudentBranch = user?.departmentCode === d;
                return (
                  <span
                    key={d}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                      isStudentBranch
                        ? 'bg-[#171717] text-[#fafafa] dark:bg-[#fafafa] dark:text-[#0a0a0a] shadow-xs'
                        : 'bg-card text-foreground border border-border'
                    }`}
                  >
                    {isStudentBranch && '✓ '}
                    {d}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recruitment Stages Walkthrough */}
        <div className="space-y-2">
          <h4 className="font-bold text-foreground text-xs flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-foreground" /> Drive Selection Process ({rounds.length} Stages)
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {rounds.map((rnd, idx) => {
              const roundName = typeof rnd === 'string' ? rnd : rnd.round_name || `Round ${idx + 1}`;
              return (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-card border border-border flex items-center gap-2.5 text-xs"
                >
                  <span className="w-6 h-6 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-foreground font-bold flex items-center justify-center text-[11px] shrink-0 border border-border">
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-foreground">{roundName}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Schedule & Application Deadline */}
        <div className="p-3 bg-secondary rounded-xl border border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
          <div>
            <span className="text-[10px] text-muted-foreground block font-semibold uppercase">Assessment / Drive Date</span>
            <strong className="text-foreground font-bold flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-foreground" />
              {company.drive_date?.split('T')[0] || '2026-11-25'} • {company.drive_venue || 'Main Campus Placement Block'}
            </strong>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-muted-foreground block font-semibold uppercase">Application Deadline</span>
            <span className="text-foreground font-bold flex items-center gap-1 text-[11px]">
              <Clock className="w-3.5 h-3.5 text-foreground" />
              {company.application_deadline ? new Date(company.application_deadline).toLocaleString() : '20-11-2026 23:59'}
            </span>
          </div>
        </div>

        {/* Modal Action Bar */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-xl text-foreground hover:bg-secondary font-semibold cursor-pointer text-xs"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {hasApplied ? (
              <>
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-secondary text-foreground rounded-xl font-bold border border-border text-xs">
                  <CheckCircle2 className="w-4 h-4 text-foreground" />
                  Application Active ({company.application_status || 'Applied'})
                </span>
                <button
                  type="button"
                  onClick={() => onWithdraw(company.id, company.name)}
                  disabled={withdrawing}
                  className="px-3 py-1.5 bg-card hover:bg-neutral-200 dark:hover:bg-neutral-800 text-foreground font-semibold rounded-xl border border-border text-xs transition-colors cursor-pointer"
                >
                  {withdrawing ? 'Withdrawing...' : 'Withdraw'}
                </button>
              </>
            ) : isEligible ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenApply(company);
                }}
                className="inline-flex items-center gap-2 px-5 py-2 bg-[#171717] hover:bg-[#262626] text-[#fafafa] dark:bg-[#fafafa] dark:hover:bg-[#e5e5e5] dark:text-[#0a0a0a] rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>Apply for Placement Drive</span>
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="px-5 py-2 bg-neutral-200 dark:bg-neutral-800 text-muted-foreground rounded-xl font-bold text-xs cursor-not-allowed border border-border"
              >
                Ineligible to Apply
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
