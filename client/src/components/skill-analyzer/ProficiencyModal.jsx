import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Award,
  GitBranch,
  FolderGit2,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

export function ProficiencyModal({
  isOpen,
  onClose,
  skill,
  onSave,
}) {
  if (!isOpen || !skill) return null;

  const [proficiencyLevel, setProficiencyLevel] = useState(
    skill.proficiencyLevel || 'INTERMEDIATE'
  );
  const [evidenceType, setEvidenceType] = useState(
    skill.evidenceType || 'NONE'
  );
  const [evidenceUrl, setEvidenceUrl] = useState(
    skill.evidenceUrl || ''
  );

  useEffect(() => {
    if (skill) {
      setProficiencyLevel(skill.proficiencyLevel || 'INTERMEDIATE');
      setEvidenceType(skill.evidenceType || 'NONE');
      setEvidenceUrl(skill.evidenceUrl || '');
    }
  }, [skill]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...skill,
      proficiencyLevel,
      evidenceType,
      evidenceUrl: evidenceUrl.trim(),
    });
    onClose();
  };

  const proficiencyLevels = [
    {
      id: 'BEGINNER',
      title: 'Beginner',
      desc: 'Completed fundamental tutorials or academic coursework. Basic understanding of core syntax and principles.',
      multiplier: '0.5x Match Weight',
    },
    {
      id: 'INTERMEDIATE',
      title: 'Intermediate',
      desc: 'Built functional modules or mini-projects. Comfortable troubleshooting errors and writing idiomatic code.',
      multiplier: '0.8x Match Weight',
    },
    {
      id: 'ADVANCED',
      title: 'Advanced',
      desc: 'Extensive hands-on experience, architecture patterns, performance tuning, and edge-case handling.',
      multiplier: '1.0x Full Weight',
    },
  ];

  const evidenceOptions = [
    {
      id: 'NONE',
      title: 'Self-Reported',
      desc: 'Standard student assessment without external proof.',
      icon: HelpCircle,
    },
    {
      id: 'PROJECT',
      title: 'Practical Project URL',
      desc: 'Deployed live web application or demo project link.',
      icon: FolderGit2,
    },
    {
      id: 'GITHUB',
      title: 'GitHub Repository',
      desc: 'Public repository link featuring your source code.',
      icon: GitBranch,
    },
    {
      id: 'CERTIFICATION',
      title: 'Industry Certification',
      desc: 'Official credential URL or completion certificate.',
      icon: Award,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-card text-card-foreground border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              {skill.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Proficiency & Evidence: {skill.name}
              </h3>
              <p className="text-[11px] text-muted-foreground">{skill.category}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Proficiency Level Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Select Your Proficiency Level
            </label>
            <div className="space-y-2">
              {proficiencyLevels.map((lvl) => {
                const isSelected = proficiencyLevel === lvl.id;
                return (
                  <div
                    key={lvl.id}
                    onClick={() => setProficiencyLevel(lvl.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/20 ring-1 ring-purple-500'
                        : 'border-border hover:border-neutral-400 dark:hover:border-neutral-700 bg-card'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-foreground mb-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-purple-600 bg-purple-600' : 'border-muted-foreground'
                        }`}>
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                        <span>{lvl.title}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                        {lvl.multiplier}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground pl-5.5 leading-relaxed">
                      {lvl.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Supporting Evidence Option */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Supporting Proof & Evidence (Optional)
            </label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {evidenceOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = evidenceType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setEvidenceType(opt.id)}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50/40 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 font-semibold'
                        : 'border-border text-foreground hover:bg-secondary/50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      <span className="text-xs truncate">{opt.title}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2">
                      {opt.desc}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* URL Input if evidence is selected */}
            {evidenceType !== 'NONE' && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                  <span>
                    {evidenceType === 'GITHUB'
                      ? 'GitHub Repository Link'
                      : evidenceType === 'PROJECT'
                      ? 'Live Project URL'
                      : 'Certification Credential / Document URL'}
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={evidenceUrl}
                    onChange={(e) => setEvidenceUrl(e.target.value)}
                    placeholder={
                      evidenceType === 'GITHUB'
                        ? 'https://github.com/username/project'
                        : 'https://my-app.vercel.app'
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-secondary/50 text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {evidenceUrl && (
                    <a
                      href={evidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-purple-500 p-1"
                      title="Open link"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Adding verified evidence grants a +10% to +15% confidence bonus during deterministic role scoring.
                </p>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition-all shadow-xs"
            >
              Save Proficiency
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
