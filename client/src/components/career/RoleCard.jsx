import React from 'react';
import {
  ArrowRight,
  Plus,
  Check,
  TrendingUp,
  DollarSign,
  ChevronDown,
  Briefcase,
} from 'lucide-react';
import { Badge } from '../Badge';

export function RoleCard({
  role,
  onViewDetails,
  onToggleCompare,
  isCompared = false,
  canAddCompare = true,
  isExpanded = false,
  onToggleExpand,
}) {
  const {
    id,
    title,
    category,
    tags = [],
    shortDescription,
    technicalSkills = [],
    stats = {},
  } = role;

  const handleRowClick = () => {
    if (onToggleExpand) {
      onToggleExpand(id);
    }
  };

  return (
    <div className="group transition-colors">
      {/* Slim Horizontal Row */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleRowClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleRowClick();
          }
        }}
        className={`w-full px-4 sm:px-5 py-3 sm:py-3.5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer select-none ${
          isExpanded
            ? 'bg-secondary/40'
            : 'hover:bg-secondary/30'
        }`}
      >
        {/* Left Side: Domain Tag, Role Title, and Tags */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          {/* Domain / Category Pill */}
          <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-secondary text-muted-foreground border border-border/70 truncate max-w-[130px] sm:max-w-none">
            {category}
          </span>

          {/* Role Name */}
          <h3 className="text-sm sm:text-[15px] font-bold text-foreground group-hover:text-foreground transition-colors truncate">
            {title}
          </h3>

          {/* Role Badges (e.g., Coding, Creative) */}
          <div className="hidden md:flex items-center gap-1 shrink-0">
            {tags.map((t) => (
              <Badge key={t} variant={t.toLowerCase()} size="sm">
                {t}
              </Badge>
            ))}
          </div>
        </div>

        {/* Right Side: Salary Preview, Quick Compare Button, and Chevron Indicator */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Est Salary Pill */}
          <div className="hidden sm:flex items-center gap-1 text-xs font-semibold text-foreground/80 bg-secondary/50 px-2.5 py-1 rounded-lg border border-border/50">
            <DollarSign className="w-3 h-3 text-muted-foreground" />
            <span>{stats.averageSalary || 'Competitive'}</span>
          </div>

          {/* Quick Compare Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCompare(role);
            }}
            disabled={!isCompared && !canAddCompare}
            title={
              isCompared
                ? 'Remove from comparison'
                : !canAddCompare
                ? 'Comparison limit reached (max 4 roles)'
                : 'Add to comparison'
            }
            className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer active:scale-95 ${
              isCompared
                ? 'bg-foreground text-background border-foreground shadow-2xs'
                : !canAddCompare
                ? 'opacity-40 cursor-not-allowed bg-card border-border text-muted-foreground'
                : 'bg-card text-foreground border-border hover:bg-secondary hover:border-neutral-400 dark:hover:border-neutral-600'
            }`}
          >
            {isCompared ? (
              <>
                <Check className="w-3 h-3 stroke-[2.5]" />
                <span className="hidden sm:inline">Added</span>
              </>
            ) : (
              <>
                <Plus className="w-3 h-3 stroke-[2.5]" />
                <span className="hidden sm:inline">Compare</span>
              </>
            )}
          </button>

          {/* Chevron Indicator */}
          <div
            className={`p-1 text-muted-foreground group-hover:text-foreground transition-transform duration-200 ${
              isExpanded ? 'rotate-180 text-foreground' : ''
            }`}
          >
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Inline Expanded Details (Only shown when student clicks row) */}
      {isExpanded && (
        <div className="px-4 sm:px-6 py-4 bg-secondary/20 border-t border-border/60 space-y-4 animate-in fade-in-50 duration-150">
          {/* Description */}
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {shortDescription}
          </p>

          {/* Key Skills */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Required Core Competencies
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {technicalSkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-block px-2.5 py-0.5 rounded-md text-xs font-medium bg-card text-foreground border border-border/80 shadow-2xs"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Compact Metrics: Est. Salary & Market Trend */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            <div className="bg-card rounded-xl p-3 border border-border/60 shadow-2xs">
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                <DollarSign className="w-3 h-3 text-muted-foreground" />
                <span>Estimated Salary</span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-foreground">
                {stats.averageSalary || 'Competitive Market Rate'}
              </p>
            </div>

            <div className="bg-card rounded-xl p-3 border border-border/60 shadow-2xs">
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                <TrendingUp className="w-3 h-3 text-muted-foreground" />
                <span>Industry Market Trend</span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-foreground">
                {stats.growthRate || 'High Demand Growth'}
              </p>
            </div>

            <div className="bg-card rounded-xl p-3 border border-border/60 shadow-2xs hidden lg:block">
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                <Briefcase className="w-3 h-3 text-muted-foreground" />
                <span>Job Openings Benchmark</span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-foreground">
                {stats.jobOpenings || 'Active Across Top IT Employers'}
              </p>
            </div>
          </div>

          {/* Actions: View Career Path (Modal Roadmap) & Compare */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border/50">
            <p className="text-[11px] text-muted-foreground">
              Inspect complete 4-stage learning roadmap, required tools, milestone projects & certifications.
            </p>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCompare(role);
                }}
                disabled={!isCompared && !canAddCompare}
                className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer active:scale-95 ${
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
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Add to Compare</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails(role);
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold bg-foreground text-background hover:opacity-90 active:scale-98 transition-all cursor-pointer shadow-xs"
              >
                <span>View Career Path</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const RoleListItem = RoleCard;

