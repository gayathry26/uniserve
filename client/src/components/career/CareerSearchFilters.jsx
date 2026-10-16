import React from 'react';
import { Search, X, Filter, RotateCcw, Check } from 'lucide-react';
import { ROLE_TAGS } from '../../data/itRoles';

export function CareerSearchFilters({
  searchQuery,
  onSearchChange,
  selectedTags = [],
  onToggleTag,
  onClearFilters,
  hasActiveFilters,
  totalResults = 0,
  totalRoles = 0,
}) {
  return (
    <div className="bg-card rounded-2xl border border-border p-3 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Compact Search Bar */}
        <div className="relative w-full lg:max-w-sm shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search roles, skills, or domains..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-secondary/70 border border-border text-foreground placeholder:text-muted-foreground text-xs sm:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-foreground focus:border-foreground transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Role Type Filter Chips & Counter / Reset */}
        <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2.5 w-full">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mr-0.5">
              <Filter className="w-3 h-3" />
              <span>Role:</span>
            </span>

            {ROLE_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onToggleTag(tag)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer select-none active:scale-95 ${
                    isSelected
                      ? 'bg-foreground text-background border-foreground font-semibold shadow-2xs'
                      : 'bg-card text-foreground border-border hover:bg-secondary hover:border-neutral-400 dark:hover:border-neutral-600'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                  <span>{tag}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 pl-2 border-l border-border/60 shrink-0">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              <strong className="text-foreground font-semibold">{totalResults}</strong> of {totalRoles} roles
            </span>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={onClearFilters}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground bg-secondary hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Reset filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
