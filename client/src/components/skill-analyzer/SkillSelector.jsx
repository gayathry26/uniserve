import React from 'react';
import { Search, X, Sparkles, Check, Cpu } from 'lucide-react';

export function SkillSelector({
  skills = [],
  selectedSkillIds = new Set(),
  onToggleSkill,
  searchQuery,
  onSearchChange,
  activeCategory,
  onCategoryChange,
  categories = [],
  loading = false,
}) {
  return (
    <div className="bg-card text-card-foreground border border-border rounded-2xl p-5 sm:p-6 shadow-xs transition-colors">
      {/* Header and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-border">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 flex items-center justify-center shrink-0 shadow-xs">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black tracking-tight uppercase text-foreground flex items-center gap-2">
              Select What You Know
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Choose the technologies, tools, and skills you are comfortable working with.
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search skills (e.g. React, MongoDB)..."
            className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-secondary/80 text-foreground border border-border/80 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-md"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="py-4 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <button
          onClick={() => onCategoryChange('All Skills')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeCategory === 'All Skills'
              ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 shadow-xs'
              : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-neutral-200 dark:hover:bg-neutral-800'
          }`}
        >
          All Skills ({skills.length})
        </button>

        {categories.map((cat) => {
          const isActive = activeCategory === cat.name;
          return (
            <button
              key={cat.name}
              onClick={() => onCategoryChange(cat.name)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 shadow-xs'
                  : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-neutral-200 dark:hover:bg-neutral-800'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Skills Grid */}
      <div className="pt-2">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-xs text-muted-foreground">
            <span className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mr-2" />
            Loading skill catalogue...
          </div>
        ) : skills.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-xl border border-dashed border-border bg-secondary/30">
            <p className="text-xs font-semibold text-foreground">No matching skills found</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Try searching for a different keyword or selecting another category.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {skills.map((skill) => {
              const isSelected = selectedSkillIds.has(skill.id);
              return (
                <button
                  key={skill.id}
                  onClick={() => onToggleSkill(skill)}
                  title={skill.description || skill.name}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs transition-all cursor-pointer select-none active:scale-95 ${
                    isSelected
                      ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 font-bold shadow-xs ring-1 ring-neutral-950 dark:ring-white'
                      : 'bg-card text-foreground border border-neutral-300/80 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-850 font-medium'
                  }`}
                >
                  {isSelected ? (
                    <Check className="w-3.5 h-3.5 shrink-0 stroke-[3]" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-600 shrink-0" />
                  )}
                  <span>{skill.name}</span>
                  {skill.isPopular && !isSelected && (
                    <span className="text-[9px] font-extrabold uppercase px-1 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 ml-0.5">
                      POP
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
