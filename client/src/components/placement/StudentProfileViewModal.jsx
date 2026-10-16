import React from 'react';
import { Modal } from '../Modal';
import {
  User,
  GraduationCap,
  Mail,
  Phone,
  FileText,
  Award,
  Globe,
  Code2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export function StudentProfileViewModal({ isOpen, onClose, student }) {
  if (!student) return null;

  let skills = [];
  try {
    if (typeof student.skills === 'string') {
      skills = JSON.parse(student.skills);
    } else if (Array.isArray(student.skills)) {
      skills = student.skills;
    }
  } catch (e) {
    skills = student.skills ? String(student.skills).split(',') : [];
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Student Profile: ${student.first_name} ${student.last_name}`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
        {/* Profile Header */}
        <div className="p-4 bg-neutral-100 dark:bg-neutral-900 border border-border text-foreground rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#171717] text-[#fafafa] dark:bg-[#fafafa] dark:text-[#0a0a0a] font-black text-xl flex items-center justify-center">
              {student.first_name ? student.first_name[0] : 'S'}
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">
                {student.first_name} {student.last_name}
              </h3>
              <p className="text-muted-foreground text-xs font-mono">{student.register_number}</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-sm font-black text-foreground bg-secondary px-2.5 py-1 rounded-lg border border-border">
              CGPA: {student.cgpa}
            </span>
            <span className="block text-[11px] text-muted-foreground mt-1">
              Batch: {student.academic_year || student.batch || '2026-2027'}
            </span>
          </div>
        </div>

        {/* Academic Details */}
        <div className="bg-secondary p-3.5 rounded-xl border border-border space-y-2">
          <h4 className="font-bold text-foreground text-xs flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-foreground" /> Academic Credentials
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px] pt-1">
            <div className="bg-card p-2.5 rounded-lg border border-border">
              <span className="text-muted-foreground block text-[10px]">Department</span>
              <strong className="text-foreground">{student.department_code}</strong>
            </div>

            <div className="bg-card p-2.5 rounded-lg border border-border">
              <span className="text-muted-foreground block text-[10px]">Active Backlogs</span>
              <strong className="text-foreground font-bold">
                {student.active_backlogs || 0} Backlogs
              </strong>
            </div>

            <div className="bg-card p-2.5 rounded-lg border border-border">
              <span className="text-muted-foreground block text-[10px]">10th Grade Score</span>
              <strong className="text-foreground">{student.tenth_percentage ? `${student.tenth_percentage}%` : 'N/A'}</strong>
            </div>

            <div className="bg-card p-2.5 rounded-lg border border-border">
              <span className="text-muted-foreground block text-[10px]">12th Grade Score</span>
              <strong className="text-foreground">{student.twelfth_percentage ? `${student.twelfth_percentage}%` : 'N/A'}</strong>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="p-3.5 bg-card rounded-xl border border-border space-y-2">
          <h4 className="font-bold text-foreground text-xs flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-foreground" /> Contact & Professional Profiles
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-2 text-foreground">
              <Mail className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{student.email}</span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <Phone className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{student.phone || 'Not Provided'}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
            {student.linkedin_url && (
              <a
                href={student.linkedin_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-secondary text-foreground font-semibold hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-border text-[11px]"
              >
                <ExternalLink className="w-3.5 h-3.5 text-foreground" /> LinkedIn Profile
              </a>
            )}
            {student.github_url && (
              <a
                href={student.github_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-secondary text-foreground font-semibold hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-border text-[11px]"
              >
                <Code2 className="w-3.5 h-3.5 text-foreground" /> GitHub Repositories
              </a>
            )}
          </div>
        </div>

        {/* Technical Skills */}
        {skills && skills.length > 0 && (
          <div className="p-3.5 bg-secondary rounded-xl border border-border space-y-2">
            <h4 className="font-bold text-foreground text-xs flex items-center gap-1.5">
              <Award className="w-4 h-4 text-foreground" /> Verified Skills & Competencies
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((sk, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-md bg-card border border-border text-foreground font-semibold text-[11px]"
                >
                  {typeof sk === 'object' ? sk.name || JSON.stringify(sk) : sk}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-end pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-xl text-foreground hover:bg-secondary font-semibold text-xs cursor-pointer"
          >
            Close Profile
          </button>
        </div>
      </div>
    </Modal>
  );
}
