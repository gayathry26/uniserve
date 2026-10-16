import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Search,
  Check,
  X,
  AlertCircle,
  Sparkles,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { IT_ROLES } from '../../data/itRoles';

const COMPARISON_PRESETS = [
  {
    label: 'Frontend vs Backend',
    roles: ['frontend-developer', 'backend-developer'],
  },
  {
    label: 'Data Analyst vs Data Scientist',
    roles: ['data-analyst', 'data-scientist'],
  },
  {
    label: 'Cybersecurity vs Cloud Engineer',
    roles: ['cybersecurity-analyst', 'cloud-engineer'],
  },
  {
    label: 'DevOps vs Cloud Engineer',
    roles: ['devops-engineer', 'cloud-engineer'],
  },
  {
    label: 'UI/UX vs Frontend',
    roles: ['ui-ux-designer', 'frontend-developer'],
  },
  {
    label: 'QA vs Full Stack',
    roles: ['software-tester', 'full-stack-developer'],
  },
];

export function CompareRolePicker({
  selectedRoleIds = [],
  onAddRole,
  onApplyPreset,
  maxRoles = 4,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);

  const isFull = selectedRoleIds.length >= maxRoles;

  // Filter available roles
  const filteredRoles = IT_ROLES.filter((role) => {
    const isAlreadySelected = selectedRoleIds.includes(role.id);
    if (isAlreadySelected) return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      role.title.toLowerCase().includes(q) ||
      role.category.toLowerCase().includes(q) ||
      role.technicalSkills.some((s) => s.toLowerCase().includes(q))
    );
  });

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Selector Dropdown Container */}
        <div className="relative inline-block" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => !isFull && setIsOpen(!isOpen)}
            disabled={isFull}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              isFull
                ? 'opacity-60 cursor-not-allowed bg-secondary text-muted-foreground border-border'
                : 'bg-foreground text-background border-foreground hover:opacity-90 shadow-xs active:scale-95'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Role to Compare</span>
            <ChevronDown className="w-3.5 h-3.5 ml-0.5 opacity-80" />
          </button>

          {/* Role Selection Dropdown Menu */}
          {isOpen && !isFull && (
            <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-card text-card-foreground rounded-2xl shadow-xl border border-border p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* Search box inside dropdown */}
              <div className="relative mb-2.5">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search role or skill to add..."
                  autoFocus
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-secondary/80 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                />
              </div>

              {/* Roles List */}
              <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                {filteredRoles.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-3 text-center">
                    {search ? 'No matching roles found' : 'All available roles already added'}
                  </p>
                ) : (
                  filteredRoles.map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => {
                        onAddRole(role.id);
                        setSearch('');
                        if (selectedRoleIds.length + 1 >= maxRoles) {
                          setIsOpen(false);
                        }
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-secondary flex items-start justify-between gap-2 text-xs transition-colors cursor-pointer group"
                    >
                      <div className="space-y-0.5">
                        <p className="font-bold text-foreground group-hover:text-foreground">
                          {role.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {role.category}
                        </p>
                      </div>
                      <span className="text-[10px] font-semibold text-muted-foreground px-2 py-0.5 rounded bg-secondary shrink-0">
                        {role.tags[0] || 'IT'}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Roles Capacity Counter Badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">
            Comparing <strong className="text-foreground">{selectedRoleIds.length}</strong> of {maxRoles} roles
          </span>
          {isFull && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-neutral-200 dark:bg-neutral-800 text-foreground border border-neutral-300 dark:border-neutral-700">
              Max Limit Reached
            </span>
          )}
        </div>
      </div>

      {/* Quick 1-Click Comparison Presets (Helpful starter templates!) */}
      {selectedRoleIds.length < 2 && (
        <div className="pt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mr-1">
            <Sparkles className="w-3 h-3 text-foreground" />
            Quick Comparisons:
          </span>
          {COMPARISON_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => onApplyPreset(preset.roles)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-secondary text-foreground hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-border transition-colors cursor-pointer active:scale-95"
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
