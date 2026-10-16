import React from 'react';
import {
  Compass,
  CheckCircle2,
  Sparkles,
  Award,
  Wrench,
  BookOpen,
  FolderGit2,
  ChevronRight,
} from 'lucide-react';

const STAGE_CONFIG = {
  BEGINNER: {
    label: 'Stage 1 • Beginner',
    stepNumber: '01',
    accent: 'bg-neutral-100 dark:bg-neutral-800 text-foreground border-neutral-300 dark:border-neutral-700',
    dot: 'bg-neutral-400 dark:bg-neutral-500',
  },
  INTERMEDIATE: {
    label: 'Stage 2 • Intermediate',
    stepNumber: '02',
    accent: 'bg-neutral-100 dark:bg-neutral-800 text-foreground border-neutral-300 dark:border-neutral-700',
    dot: 'bg-neutral-500 dark:bg-neutral-400',
  },
  ADVANCED: {
    label: 'Stage 3 • Advanced',
    stepNumber: '03',
    accent: 'bg-neutral-100 dark:bg-neutral-800 text-foreground border-neutral-300 dark:border-neutral-700',
    dot: 'bg-neutral-700 dark:bg-neutral-300',
  },
  'JOB READY': {
    label: 'Stage 4 • Job Ready',
    stepNumber: '04',
    accent: 'bg-foreground text-background border-foreground',
    dot: 'bg-foreground dark:bg-background',
  },
};

export function CareerRoadmap({ roadmap = [] }) {
  if (!roadmap || roadmap.length === 0) {
    return (
      <div className="p-8 text-center bg-secondary/50 rounded-2xl border border-border text-xs text-muted-foreground">
        Learning roadmap data currently being updated for this domain.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-[15px] sm:before:left-[19px] before:top-3 before:bottom-3 before:w-0.5 before:bg-border">
        {roadmap.map((level, idx) => {
          const config = STAGE_CONFIG[level.stage] || {
            label: level.stage,
            stepNumber: `0${idx + 1}`,
            accent: 'bg-secondary text-foreground',
            dot: 'bg-foreground',
          };

          const isLast = idx === roadmap.length - 1;

          return (
            <div key={level.stage || idx} className="relative group">
              {/* Stepper node dot */}
              <div
                className={`absolute -left-[27px] sm:-left-[31px] top-1.5 w-6 h-6 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-bold shadow-xs transition-transform group-hover:scale-110 ${
                  isLast
                    ? 'bg-foreground text-background'
                    : 'bg-secondary text-foreground border-border'
                }`}
              >
                {config.stepNumber}
              </div>

              {/* Card content */}
              <div className="bg-card rounded-2xl border border-border hover:border-neutral-400 dark:hover:border-neutral-600 p-5 sm:p-6 shadow-xs transition-all space-y-4">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/60">
                  <div className="space-y-0.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${config.accent}`}
                    >
                      {config.label}
                    </span>
                    <h4 className="text-base font-bold text-foreground">
                      {level.title}
                    </h4>
                  </div>
                  {level.description && (
                    <p className="text-xs text-muted-foreground max-w-md">
                      {level.description}
                    </p>
                  )}
                </div>

                {/* Grid Sections: Skills, Tools, Activities & Projects */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Skills to Learn */}
                  {level.skills && level.skills.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Key Skills to Acquire</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {level.skills.map((skill) => (
                          <span
                            key={skill}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-secondary text-foreground border border-border/80"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tools to Practice */}
                  {level.tools && level.tools.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-foreground">
                        <Wrench className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Tools & Environments</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {level.tools.map((t) => (
                          <span
                            key={t}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-foreground border border-neutral-300 dark:border-neutral-700"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Learning Activities */}
                  {level.learningActivities && level.learningActivities.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-foreground">
                        <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Suggested Learning Activities</span>
                      </div>
                      <ul className="space-y-1.5 text-muted-foreground">
                        {level.learningActivities.map((act, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-foreground shrink-0 mt-1.5" />
                            <span className="leading-relaxed">{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Practical Projects */}
                  {level.projects && level.projects.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-foreground">
                        <FolderGit2 className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Hands-On Milestone Projects</span>
                      </div>
                      <ul className="space-y-1.5 text-muted-foreground">
                        {level.projects.map((proj, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <ChevronRight className="w-3.5 h-3.5 text-foreground shrink-0 mt-0.5" />
                            <span className="font-medium text-foreground leading-relaxed">
                              {proj}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
