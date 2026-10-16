import React from 'react';
import {
  Sparkles,
  Trash2,
  X,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  Award,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

export function SelectedSkillsPanel({
  selectedSkills = [],
  onRemoveSkill,
  onClearAll,
  onOpenProficiencyModal,
  onAnalyze,
  analyzing = false,
  onOpenAssessmentModal,
}) {
  const count = selectedSkills.length;

  return (
    <div className="bg-card text-card-foreground border border-border rounded-2xl p-5 sm:p-6 shadow-xs transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-foreground">
            Your Skill Profile
          </h3>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
            {count} selected
          </span>
        </div>

        {count > 0 && (
          <button
            onClick={onClearAll}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-red-500 transition-colors cursor-pointer px-2.5 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {/* Selected Chips Area */}
      <div className="py-4">
        {count === 0 ? (
          <div className="text-center py-8 px-4 rounded-xl border border-dashed border-border/80 bg-secondary/20">
            <p className="text-xs font-semibold text-foreground">No skills selected yet</p>
            <p className="text-[11px] text-muted-foreground mt-1 max-w-md mx-auto">
              Click any technology chip above to add it to your skill profile. Your selections will be analyzed against all placement roles.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedSkills.map((skill) => {
              const proficiency = skill.proficiencyLevel || 'INTERMEDIATE';
              const isVerified = Boolean(skill.isVerified);
              const evidenceType = skill.evidenceType || 'NONE';

              return (
                <div
                  key={skill.skillId}
                  className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full text-xs bg-secondary/80 border border-border text-foreground hover:border-purple-500/50 hover:bg-secondary transition-all group"
                >
                  <button
                    onClick={() => onOpenProficiencyModal(skill)}
                    className="flex items-center gap-1.5 text-left cursor-pointer hover:text-purple-600 dark:hover:text-purple-400"
                    title={`Proficiency: ${proficiency} • Click to edit level & evidence`}
                  >
                    <span className="font-semibold">{skill.name}</span>

                    {/* Evidence & Verification Badges */}
                    {isVerified ? (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                        <ShieldCheck className="w-2.5 h-2.5" />
                        Verified
                      </span>
                    ) : evidenceType === 'PROJECT' ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        Project
                      </span>
                    ) : evidenceType === 'GITHUB' ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                        GitHub
                      </span>
                    ) : evidenceType === 'CERTIFICATION' ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                        Cert
                      </span>
                    ) : null}

                    {/* Proficiency indicator abbreviation */}
                    <span className="text-[10px] text-muted-foreground font-mono">
                      ({proficiency.charAt(0)})
                    </span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveSkill(skill.skillId);
                    }}
                    className="w-4 h-4 rounded-full flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors ml-0.5"
                    title={`Remove ${skill.name}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <button
            onClick={onOpenAssessmentModal}
            className="inline-flex items-center gap-1.5 text-purple-600 dark:text-purple-400 hover:underline font-semibold cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Take 3-min Skill Assessment</span>
          </button>
          <span className="text-border">•</span>
          <span className="text-[11px]">Click any chip to edit proficiency</span>
        </div>

        <button
          onClick={onAnalyze}
          disabled={count === 0 || analyzing}
          className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 cursor-pointer ${
            count === 0 || analyzing
              ? 'bg-neutral-300 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500 cursor-not-allowed shadow-none'
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-500/20'
          }`}
        >
          {analyzing ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Analyzing Match Matrices...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Analyze My Skills</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
