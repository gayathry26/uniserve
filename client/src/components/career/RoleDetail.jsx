import React from 'react';
import {
  X,
  Plus,
  Check,
  TrendingUp,
  DollarSign,
  Briefcase,
  Layers,
  ArrowRight,
  ExternalLink,
  Award,
  Sparkles,
  BookOpen,
  Code2,
  FolderGit2,
  Compass,
  Building2,
  Share2,
} from 'lucide-react';
import { Badge } from '../Badge';
import { CareerRoadmap } from './CareerRoadmap';

export function RoleDetail({
  role,
  onClose,
  onToggleCompare,
  isCompared = false,
  canAddCompare = true,
  onGoToCompare,
}) {
  if (!role) return null;

  const {
    id,
    title,
    category,
    tags = [],
    shortDescription,
    responsibilities = [],
    scope,
    technicalSkills = [],
    softSkills = [],
    tools = [],
    stats = {},
    projects = { beginner: [], intermediate: [], advanced: [] },
    certifications = [],
    roadmap = [],
    industry = [],
  } = role;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-card text-card-foreground w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl border border-border flex flex-col overflow-hidden">
        {/* Modal Top Header */}
        <div className="px-6 py-5 border-b border-border bg-card sticky top-0 z-20 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {category}
              </span>
              <span className="text-muted-foreground">•</span>
              <div className="flex items-center gap-1">
                {tags.map((t) => (
                  <Badge key={t} variant={t.toLowerCase()} size="sm">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              {title}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Compare CTA */}
            <button
              type="button"
              onClick={() => onToggleCompare(role)}
              disabled={!isCompared && !canAddCompare}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isCompared
                  ? 'bg-foreground text-background border-foreground shadow-2xs'
                  : !canAddCompare
                  ? 'opacity-40 cursor-not-allowed bg-card border-border text-muted-foreground'
                  : 'bg-card text-foreground border-border hover:bg-secondary'
              }`}
            >
              {isCompared ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Added to Compare</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Compare This Role</span>
                </>
              )}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
              aria-label="Close details"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-secondary/60 rounded-2xl p-4 border border-border/80">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                <DollarSign className="w-3.5 h-3.5" />
                <span>Average Compensation</span>
              </div>
              <p className="text-base sm:text-lg font-black text-foreground">
                {stats.averageSalary || 'Data unavailable'}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Indian & Global market benchmarks
              </p>
            </div>

            <div className="bg-secondary/60 rounded-2xl p-4 border border-border/80">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Job Market Demand</span>
              </div>
              <p className="text-base sm:text-lg font-black text-foreground">
                {stats.jobOpenings || 'Data unavailable'}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Campus & corporate openings
              </p>
            </div>

            <div className="bg-secondary/60 rounded-2xl p-4 border border-border/80">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Industry Growth Rate</span>
              </div>
              <p className="text-base sm:text-lg font-black text-foreground">
                {stats.growthRate || 'Data unavailable'}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Projected multi-year trend
              </p>
            </div>
          </div>

          {/* 1. Career Overview */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/60">
              <Compass className="w-4 h-4 text-foreground" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                1. Career Overview & Core Responsibilities
              </h3>
            </div>

            <p className="text-sm text-foreground/90 leading-relaxed font-normal">
              {shortDescription}
            </p>

            {scope && (
              <div className="p-3.5 rounded-xl bg-secondary/40 border border-border text-xs text-muted-foreground">
                <strong className="text-foreground font-semibold">Domain Scope: </strong>
                {scope}
              </div>
            )}

            {responsibilities.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-bold text-foreground">
                  Day-to-Day Responsibilities:
                </p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                  {responsibilities.map((resp, i) => (
                    <li
                      key={i}
                      className="p-3 rounded-xl bg-card border border-border/80 flex items-start gap-2.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-foreground shrink-0 mt-2" />
                      <span className="leading-relaxed text-foreground/80">{resp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Relevant Hiring Industries */}
            {industry.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Key Hiring Industries:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {industry.map((ind) => (
                    <span
                      key={ind}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-foreground border border-neutral-300 dark:border-neutral-700"
                    >
                      {ind}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* 2. Skills Required & Platforms */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/60">
              <Code2 className="w-4 h-4 text-foreground" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                2. Skills Required & Tool Ecosystem
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Technical Skills */}
              <div className="bg-card rounded-2xl border border-border p-4 space-y-2.5">
                <p className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>Technical Skills</span>
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {technicalSkills.length}
                  </span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {technicalSkills.map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-secondary text-foreground border border-border/80"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Soft Skills */}
              <div className="bg-card rounded-2xl border border-border p-4 space-y-2.5">
                <p className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>Essential Soft Skills</span>
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {softSkills.length}
                  </span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {softSkills.map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-secondary text-foreground border border-border/80"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Recommended Tools & Platforms */}
              <div className="bg-card rounded-2xl border border-border p-4 space-y-2.5">
                <p className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>Tools & Platforms</span>
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {tools.length}
                  </span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {tools.map((t) => (
                    <span
                      key={t}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-foreground border border-neutral-300 dark:border-neutral-700"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 3. Learning Roadmap */}
          <section className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-foreground" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  3. Structured Learning Roadmap (4 Progressive Stages)
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground hidden sm:inline">
                Beginner to Placement Ready
              </span>
            </div>

            <CareerRoadmap roadmap={roadmap} />
          </section>

          {/* 4. Project Recommendations */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/60">
              <FolderGit2 className="w-4 h-4 text-foreground" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                4. Practical Project Recommendations
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Beginner */}
              <div className="bg-card rounded-2xl border border-border p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <span className="font-bold text-foreground">Beginner Projects</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-secondary text-muted-foreground">
                    Foundational
                  </span>
                </div>
                <ul className="space-y-2 text-muted-foreground">
                  {(projects.beginner || []).map((p, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-foreground shrink-0 mt-1.5" />
                      <span className="leading-relaxed">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Intermediate */}
              <div className="bg-card rounded-2xl border border-border p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <span className="font-bold text-foreground">Intermediate Projects</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-secondary text-foreground">
                    Full-Feature
                  </span>
                </div>
                <ul className="space-y-2 text-muted-foreground">
                  {(projects.intermediate || []).map((p, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-foreground shrink-0 mt-1.5" />
                      <span className="leading-relaxed">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Advanced */}
              <div className="bg-card rounded-2xl border border-border p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <span className="font-bold text-foreground">Advanced Projects</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-foreground text-background">
                    Capstone & Scale
                  </span>
                </div>
                <ul className="space-y-2 text-muted-foreground">
                  {(projects.advanced || []).map((p, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-foreground shrink-0 mt-1.5" />
                      <span className="leading-relaxed text-foreground font-medium">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* 5. Certifications */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/60">
              <Award className="w-4 h-4 text-foreground" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                5. Industry Recognized Certifications
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {certifications.map((cert, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-card border border-border flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-foreground">{cert.name}</p>
                    {cert.provider && (
                      <p className="text-[11px] text-muted-foreground">Issued by {cert.provider}</p>
                    )}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider shrink-0 ${
                      cert.type === 'FREE'
                        ? 'bg-neutral-100 dark:bg-neutral-800 text-foreground border-neutral-300 dark:border-neutral-700'
                        : 'bg-neutral-200 dark:bg-neutral-800 text-foreground border-neutral-400 dark:border-neutral-600'
                    }`}
                  >
                    {cert.type}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Bottom Action Footer */}
          <div className="p-6 rounded-2xl bg-secondary/80 border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-foreground">
                Ready to evaluate this role side-by-side?
              </h4>
              <p className="text-xs text-muted-foreground">
                Compare {title} with up to 3 other career directions in the Career Comparison Matrix.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => onToggleCompare(role)}
                disabled={!isCompared && !canAddCompare}
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  isCompared
                    ? 'bg-foreground text-background border-foreground shadow-2xs'
                    : !canAddCompare
                    ? 'opacity-40 cursor-not-allowed bg-card border-border text-muted-foreground'
                    : 'bg-card text-foreground border-border hover:bg-secondary'
                }`}
              >
                {isCompared ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Plus className="w-4 h-4" />}
                <span>{isCompared ? 'Added to Compare' : 'Add to Compare'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!isCompared && canAddCompare) {
                    onToggleCompare(role);
                  }
                  if (onGoToCompare) onGoToCompare(role);
                }}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-foreground text-background hover:opacity-90 transition-all cursor-pointer shadow-xs"
              >
                <span>Open Comparison Matrix</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
