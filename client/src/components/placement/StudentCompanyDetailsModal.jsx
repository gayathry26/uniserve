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
        <div className="p-4 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl flex items-start justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-black text-2xl flex items-center justify-center shadow-inner">
              {company.name[0]}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">{company.name}</h3>
              <p className="text-indigo-200 text-xs font-medium">{company.industry}</p>
              <div className="flex items-center gap-2 mt-1.5 text-[11px] text-indigo-300">
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
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className="text-sm font-black text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-400/30">
              ₹{company.package_ctc || '12.00'} LPA
            </span>
            <StatusBadge status={company.tier} />
          </div>
        </div>

        {/* Ineligibility Warning Callout (if ineligible) */}
        {!isEligible && ineligibilityReasons.length > 0 && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-1">
            <div className="flex items-center gap-2 font-bold text-xs text-rose-800">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>You do not meet the minimum criteria for this company:</span>
            </div>
            <ul className="list-disc list-inside text-[11px] space-y-0.5 text-rose-700 pl-1">
              {ineligibilityReasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Description & Overview */}
        <div>
          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-1.5">
            About the Company & Role
          </h4>
          <p className="text-slate-600 text-xs leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
            {company.description ||
              `${company.name} is a global industry leader participating in the campus recruitment drive. Candidates will undergo a multi-tier selection process.`}
          </p>
        </div>

        {/* Eligibility Criteria Matrix */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
          <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-blue-600" /> Complete Eligibility Rules
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-slate-400 block text-[10px]">Min. CGPA Cutoff</span>
              <strong className="text-slate-900 font-bold">{company.min_cgpa || '6.50'}</strong>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-slate-400 block text-[10px]">Academic Cohort</span>
              <strong className="text-slate-900 font-bold">{company.academic_year || '2026-2027'}</strong>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-slate-400 block text-[10px]">Drive Capacity Quota</span>
              <strong className="text-slate-900 font-bold">{company.configured_eligible_quota || 60} Seats</strong>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-slate-400 block text-[10px]">Drive Mode</span>
              <strong className="text-slate-900 font-bold">{company.drive_mode || 'ON_CAMPUS'}</strong>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-600 block mb-1">
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
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200'
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
          <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-600" /> Drive Selection Process ({rounds.length} Stages)
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {rounds.map((rnd, idx) => {
              const roundName = typeof rnd === 'string' ? rnd : rnd.round_name || `Round ${idx + 1}`;
              return (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-purple-50/50 border border-purple-100 flex items-center gap-2.5 text-xs"
                >
                  <span className="w-6 h-6 rounded-lg bg-purple-600 text-white font-bold flex items-center justify-center text-[11px] shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-slate-800">{roundName}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Schedule & Application Deadline */}
        <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">Assessment / Drive Date</span>
            <strong className="text-blue-900 font-bold flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
              {company.drive_date?.split('T')[0] || '2026-11-25'} • {company.drive_venue || 'Main Campus Placement Block'}
            </strong>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">Application Deadline</span>
            <span className="text-slate-800 font-bold flex items-center gap-1 text-[11px]">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              {company.application_deadline ? new Date(company.application_deadline).toLocaleString() : '20-11-2026 23:59'}
            </span>
          </div>
        </div>

        {/* Modal Action Bar */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer text-xs"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {hasApplied ? (
              <>
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl font-bold border border-emerald-300 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Application Active ({company.application_status || 'Applied'})
                </span>
                <button
                  type="button"
                  onClick={() => onWithdraw(company.id, company.name)}
                  disabled={withdrawing}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl border border-rose-200 text-xs transition-colors cursor-pointer"
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
                className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>Apply for Placement Drive</span>
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="px-5 py-2 bg-slate-200 text-slate-400 rounded-xl font-bold text-xs cursor-not-allowed"
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
