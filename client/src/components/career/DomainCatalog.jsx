import React, { useState } from 'react';
import { RoleCard } from './RoleCard';
import { SearchX, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';

export function DomainCatalog({
  roles = [],
  activeCategory = 'All Domains',
  onViewDetails,
  onToggleCompare,
  comparedRoleIds = [],
  canAddCompare = true,
  onResetFilters,
}) {
  // Set of role IDs that are currently expanded inline
  const [expandedRoleIds, setExpandedRoleIds] = useState(() => new Set());

  const handleToggleExpand = (roleId) => {
    setExpandedRoleIds((prev) => {
      const next = new Set(prev);
      if (next.has(roleId)) {
        next.delete(roleId);
      } else {
        next.add(roleId);
      }
      return next;
    });
  };

  const handleToggleAll = () => {
    if (expandedRoleIds.size === roles.length) {
      setExpandedRoleIds(new Set());
    } else {
      setExpandedRoleIds(new Set(roles.map((r) => r.id)));
    }
  };

  if (roles.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border p-10 sm:p-14 text-center space-y-4 max-w-lg mx-auto my-6 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto border border-border text-muted-foreground">
          <SearchX className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-foreground">
            No Career Roles Found
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            We couldn't find any career paths matching your active search keywords or filter criteria.
          </p>
        </div>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-foreground text-background hover:opacity-90 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        )}
      </div>
    );
  }

  const allExpanded = roles.length > 0 && expandedRoleIds.size === roles.length;

  return (
    <div className="space-y-3">
      {/* List Header & Quick Actions */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-foreground" />
          <h2 className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wider">
            {activeCategory === 'All Domains' ? 'All Career Roles' : activeCategory}
          </h2>
          <span className="text-[11px] font-semibold text-muted-foreground px-2 py-0.5 rounded-md bg-secondary border border-border/60">
            {roles.length} {roles.length === 1 ? 'role' : 'roles'}
          </span>
        </div>

        <button
          type="button"
          onClick={handleToggleAll}
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 cursor-pointer py-1 px-2 rounded-lg hover:bg-secondary/60"
        >
          {allExpanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Collapse All</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Expand All</span>
            </>
          )}
        </button>
      </div>

      {/* Compact List of Career Roles */}
      <div className="bg-card rounded-2xl border border-border shadow-xs divide-y divide-border/60 overflow-hidden">
        {roles.map((role) => (
          <RoleCard
            key={role.id}
            role={role}
            onViewDetails={onViewDetails}
            onToggleCompare={onToggleCompare}
            isCompared={comparedRoleIds.includes(role.id)}
            canAddCompare={canAddCompare}
            isExpanded={expandedRoleIds.has(role.id)}
            onToggleExpand={handleToggleExpand}
          />
        ))}
      </div>
    </div>
  );
}
