import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  GitCompare,
  Plus,
  ArrowLeft,
  Compass,
  Sparkles,
  Layers,
  Search,
} from 'lucide-react';
import { IT_ROLES, getRoleById } from '../data/itRoles';
import { CompareRolePicker } from '../components/compare/CompareRolePicker';
import { CompareHeaderCards } from '../components/compare/CompareHeaderCards';
import { CompareMatrix } from '../components/compare/CompareMatrix';
import { RoleDetail } from '../components/career/RoleDetail';

export function CompareRoles() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Parse and validate roles from URL query parameter
  const parseRolesFromUrl = () => {
    const rolesParam = searchParams.get('roles');
    if (!rolesParam) {
      // Fallback to localStorage if URL has no roles param
      try {
        const saved = localStorage.getItem('campuscorp_compare_roles');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed
              .map((id) => getRoleById(id))
              .filter(Boolean)
              .slice(0, 4)
              .map((r) => r.id);
          }
        }
      } catch (e) {}
      return [];
    }

    const ids = rolesParam.split(',').map((s) => s.trim().toLowerCase());
    // Validate IDs against dataset and enforce max 4 distinct roles
    const validIds = [];
    for (const id of ids) {
      if (validIds.length >= 4) break;
      const found = getRoleById(id);
      if (found && !validIds.includes(found.id)) {
        validIds.push(found.id);
      }
    }
    return validIds;
  };

  const [selectedRoleIds, setSelectedRoleIds] = useState(parseRolesFromUrl);

  // Detail modal state
  const [detailRole, setDetailRole] = useState(null);

  // Sync selectedRoleIds when searchParams changes (e.g. browser back/forward)
  useEffect(() => {
    const urlIds = parseRolesFromUrl();
    setSelectedRoleIds(urlIds);
  }, [searchParams]);

  // Synchronize state with URL query param and localStorage
  const updateSelectedRoles = (newIds) => {
    const limitedIds = newIds.slice(0, 4);
    setSelectedRoleIds(limitedIds);

    // Sync to URL
    const newParams = new URLSearchParams(searchParams);
    if (limitedIds.length > 0) {
      newParams.set('roles', limitedIds.join(','));
    } else {
      newParams.delete('roles');
    }
    setSearchParams(newParams, { replace: true });

    // Sync to localStorage
    try {
      localStorage.setItem('campuscorp_compare_roles', JSON.stringify(limitedIds));
    } catch (e) {}
  };

  // Handlers
  const handleAddRole = (roleId) => {
    if (!roleId || selectedRoleIds.includes(roleId) || selectedRoleIds.length >= 4) {
      return;
    }
    updateSelectedRoles([...selectedRoleIds, roleId]);
  };

  const handleRemoveRole = (roleId) => {
    updateSelectedRoles(selectedRoleIds.filter((id) => id !== roleId));
  };

  const handleClearAll = () => {
    updateSelectedRoles([]);
  };

  const handleApplyPreset = (presetRoleIds) => {
    updateSelectedRoles(presetRoleIds);
  };

  // Convert IDs into full role objects
  const selectedRoles = useMemo(() => {
    return selectedRoleIds
      .map((id) => getRoleById(id))
      .filter(Boolean);
  }, [selectedRoleIds]);

  return (
    <div className="space-y-8 pb-20">
      {/* Header Banner */}
      <div className="bg-card rounded-3xl border border-border p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-foreground">
                <GitCompare className="w-4 h-4" />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Side-by-Side Career Intelligence
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Compare Career Roles
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Compare skills, tools, learning paths, and career opportunities to find the right direction for you.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/domains"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-border bg-card hover:bg-secondary text-foreground transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Compass className="w-4 h-4" />
              <span>Explore All Domains</span>
            </Link>
          </div>
        </div>

        {/* Role Selector Controls */}
        <div className="mt-6 pt-6 border-t border-border/80">
          <CompareRolePicker
            selectedRoleIds={selectedRoleIds}
            onAddRole={handleAddRole}
            onApplyPreset={handleApplyPreset}
            maxRoles={4}
          />
        </div>
      </div>

      {/* Main Content Area */}
      {selectedRoles.length === 0 ? (
        /* Empty State */
        <div className="bg-card rounded-3xl border border-border p-12 sm:p-16 text-center space-y-6 max-w-2xl mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto border border-border text-muted-foreground">
            <GitCompare className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-foreground">
              Select Careers to Compare
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Choose up to 4 different IT career paths to analyze their differences in daily responsibilities, technical stacks, average salaries, project milestones, and learning curves.
            </p>
          </div>

          {/* Quick preset comparisons */}
          <div className="pt-2 border-t border-border/60">
            <p className="text-xs font-semibold text-foreground mb-3 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Or choose a popular career comparison:</span>
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => handleApplyPreset(['frontend-developer', 'backend-developer'])}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-secondary hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-border text-foreground transition-all cursor-pointer active:scale-95"
              >
                Frontend vs Backend Developer
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(['data-analyst', 'data-scientist'])}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-secondary hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-border text-foreground transition-all cursor-pointer active:scale-95"
              >
                Data Analyst vs Data Scientist
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(['cybersecurity-analyst', 'cloud-engineer'])}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-secondary hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-border text-foreground transition-all cursor-pointer active:scale-95"
              >
                Cybersecurity vs Cloud Engineer
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(['ui-ux-designer', 'frontend-developer'])}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-secondary hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-border text-foreground transition-all cursor-pointer active:scale-95"
              >
                UI/UX Designer vs Frontend
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Populated Comparison View */
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Overview Cards */}
          <CompareHeaderCards
            roles={selectedRoles}
            onRemoveRole={handleRemoveRole}
            onClearAll={handleClearAll}
            onViewDetails={(role) => setDetailRole(role)}
          />

          {/* 14-Dimension Comparison Matrix */}
          <CompareMatrix roles={selectedRoles} />
        </div>
      )}

      {/* Role Detail Modal when clicked from comparison cards */}
      {detailRole && (
        <RoleDetail
          role={detailRole}
          onClose={() => setDetailRole(null)}
          onToggleCompare={(role) => {
            if (selectedRoleIds.includes(role.id)) {
              handleRemoveRole(role.id);
            } else {
              handleAddRole(role.id);
            }
          }}
          isCompared={selectedRoleIds.includes(detailRole.id)}
          canAddCompare={selectedRoleIds.length < 4}
        />
      )}
    </div>
  );
}
