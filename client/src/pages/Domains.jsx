import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Compass,
  ArrowRight,
  GitCompare,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import {
  IT_ROLES,
  DOMAIN_CATEGORIES,
  filterRoles,
  getRoleById,
} from '../data/itRoles';
import { DomainTabs } from '../components/career/DomainTabs';
import { CareerSearchFilters } from '../components/career/CareerSearchFilters';
import { DomainCatalog } from '../components/career/DomainCatalog';
import { RoleDetail } from '../components/career/RoleDetail';

export function Domains() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Active filters
  const [activeCategory, setActiveCategory] = useState(
    searchParams.get('category') || 'All Domains'
  );
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedTags, setSelectedTags] = useState(() => {
    const tagsParam = searchParams.get('tags');
    return tagsParam ? tagsParam.split(',').filter(Boolean) : [];
  });

  // Selected role for detail modal
  const [activeRole, setActiveRole] = useState(() => {
    const roleId = searchParams.get('role');
    return roleId ? getRoleById(roleId) : null;
  });

  // Roles currently selected for comparison
  const [comparedRoleIds, setComparedRoleIds] = useState(() => {
    try {
      const saved = localStorage.getItem('campuscorp_compare_roles');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.slice(0, 4);
      }
    } catch (e) {}
    return [];
  });

  // Toast notification for user confirmation
  const [confirmationToast, setConfirmationToast] = useState(null);

  // Synchronize compare list to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        'campuscorp_compare_roles',
        JSON.stringify(comparedRoleIds)
      );
    } catch (e) {}
  }, [comparedRoleIds]);

  // Auto-dismiss confirmation toast after 3 seconds
  useEffect(() => {
    if (!confirmationToast) return;
    const timer = setTimeout(() => {
      setConfirmationToast(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [confirmationToast]);

  // Synchronize deep-link modal role query
  useEffect(() => {
    const roleId = searchParams.get('role');
    if (roleId) {
      const found = getRoleById(roleId);
      if (found) setActiveRole(found);
    }
  }, [searchParams]);

  // Filtered roles calculation with useMemo
  const filteredRoles = useMemo(() => {
    return filterRoles({
      query: searchQuery,
      category: activeCategory,
      tags: selectedTags,
    });
  }, [searchQuery, activeCategory, selectedTags]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = { 'All Domains': IT_ROLES.length };
    IT_ROLES.forEach((r) => {
      counts[r.category] = (counts[r.category] || 0) + 1;
    });
    return counts;
  }, []);

  // Filter handlers
  const handleSelectCategory = (cat) => {
    setActiveCategory(cat);
    const newParams = new URLSearchParams(searchParams);
    if (cat === 'All Domains') {
      newParams.delete('category');
    } else {
      newParams.set('category', cat);
    }
    setSearchParams(newParams);
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    const newParams = new URLSearchParams(searchParams);
    if (query) {
      newParams.set('q', query);
    } else {
      newParams.delete('q');
    }
    setSearchParams(newParams);
  };

  const handleToggleTag = (tag) => {
    setSelectedTags((prev) => {
      const next = prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag];

      const newParams = new URLSearchParams(searchParams);
      if (next.length > 0) {
        newParams.set('tags', next.join(','));
      } else {
        newParams.delete('tags');
      }
      setSearchParams(newParams);
      return next;
    });
  };

  const handleClearFilters = () => {
    setActiveCategory('All Domains');
    setSearchQuery('');
    setSelectedTags([]);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('category');
    newParams.delete('q');
    newParams.delete('tags');
    setSearchParams(newParams);
  };

  // Compare toggles with clear feedback
  const handleToggleCompare = (role) => {
    if (!role) return;
    setComparedRoleIds((prev) => {
      if (prev.includes(role.id)) {
        setConfirmationToast({
          type: 'removed',
          message: `${role.title} removed from comparison`,
        });
        return prev.filter((id) => id !== role.id);
      }
      if (prev.length >= 4) {
        setConfirmationToast({
          type: 'warning',
          message: 'Comparison limit reached (maximum 4 roles)',
        });
        return prev;
      }
      setConfirmationToast({
        type: 'added',
        message: `${role.title} added to comparison (${prev.length + 1} of 4)`,
      });
      return [...prev, role.id];
    });
  };

  // Open role detail modal & update URL
  const handleOpenDetails = (role) => {
    setActiveRole(role);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('role', role.id);
    setSearchParams(newParams);
  };

  // Close role detail modal & update URL
  const handleCloseDetails = () => {
    setActiveRole(null);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('role');
    setSearchParams(newParams);
  };

  // Navigate to compare page with selected roles
  const handleGoToCompare = (optionalRole) => {
    let ids = [...comparedRoleIds];
    if (optionalRole && !ids.includes(optionalRole.id) && ids.length < 4) {
      ids.push(optionalRole.id);
    }
    const param = ids.join(',');
    navigate(`/compare${param ? `?roles=${param}` : ''}`);
  };

  const hasActiveFilters =
    activeCategory !== 'All Domains' ||
    searchQuery.trim().length > 0 ||
    selectedTags.length > 0;

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Confirmation Alert */}
      {confirmationToast && (
        <div className="fixed top-20 right-6 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="bg-foreground text-background px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold border border-background/20 backdrop-blur-md">
            {confirmationToast.type === 'warning' ? (
              <AlertCircle className="w-4 h-4 text-amber-400 stroke-[2.5]" />
            ) : (
              <Check className="w-4 h-4 stroke-[2.5]" />
            )}
            <span>{confirmationToast.message}</span>
            <button
              type="button"
              onClick={() => setConfirmationToast(null)}
              className="ml-1 opacity-70 hover:opacity-100 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Compact Header: Title, Short Description, and Compare Roles Button neatly aligned */}
      <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-secondary text-foreground">
                <Compass className="w-3.5 h-3.5" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                CampusCorp Career Explorer
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              Explore IT Domains & Specializations
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
              Explore high-growth IT engineering domains, understand job responsibilities, master required skills, and inspect 4-stage progressive learning roadmaps.
            </p>
          </div>

          <div className="shrink-0 self-start sm:self-center">
            <Link
              to={`/compare${comparedRoleIds.length > 0 ? `?roles=${comparedRoleIds.join(',')}` : ''}`}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border border-border bg-card hover:bg-secondary text-foreground transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <GitCompare className="w-4 h-4" />
              <span>Compare Roles</span>
              {comparedRoleIds.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center text-[10px] font-black">
                  {comparedRoleIds.length}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Domain Categories: Horizontally Scrollable Chips */}
      <DomainTabs
        categories={DOMAIN_CATEGORIES}
        activeCategory={activeCategory}
        onSelectCategory={handleSelectCategory}
        counts={categoryCounts}
      />

      {/* Combined Compact Search & Filters Toolbar */}
      <CareerSearchFilters
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        selectedTags={selectedTags}
        onToggleTag={handleToggleTag}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
        totalResults={filteredRoles.length}
        totalRoles={IT_ROLES.length}
      />

      {/* Responsive Career Cards Grid (3 cols desktop, 2 cols tablet, 1 col mobile) */}
      <DomainCatalog
        roles={filteredRoles}
        activeCategory={activeCategory}
        onViewDetails={handleOpenDetails}
        onToggleCompare={handleToggleCompare}
        comparedRoleIds={comparedRoleIds}
        canAddCompare={comparedRoleIds.length < 4}
        onResetFilters={handleClearFilters}
      />

      {/* Detailed Career Path Modal (Roadmap, Skills, Tools, Projects, Certifications) */}
      {activeRole && (
        <RoleDetail
          role={activeRole}
          onClose={handleCloseDetails}
          onToggleCompare={handleToggleCompare}
          isCompared={comparedRoleIds.includes(activeRole.id)}
          canAddCompare={comparedRoleIds.length < 4}
          onGoToCompare={handleGoToCompare}
        />
      )}

      {/* Floating Compare Tray (Sticky Bottom Dock when roles are selected) */}
      {comparedRoleIds.length > 0 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 max-w-md w-[calc(100%-2rem)] animate-in slide-in-from-bottom-5 duration-200">
          <div className="bg-foreground text-background rounded-2xl p-3 shadow-2xl border border-background/20 flex items-center justify-between gap-3 backdrop-blur-md">
            <div className="flex items-center gap-2.5 pl-1 truncate">
              <span className="w-5 h-5 rounded-md bg-background text-foreground flex items-center justify-center text-xs font-black shrink-0">
                {comparedRoleIds.length}
              </span>
              <div className="truncate">
                <p className="text-xs font-bold leading-tight truncate">
                  {comparedRoleIds.length === 1 ? '1 role selected' : `${comparedRoleIds.length} roles selected`}
                </p>
                <p className="text-[10px] opacity-75 truncate">
                  Up to 4 roles comparison
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setComparedRoleIds([])}
                className="text-[11px] font-semibold opacity-75 hover:opacity-100 px-2 py-1 transition-opacity cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleGoToCompare()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-background text-foreground hover:opacity-90 transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <span>Compare Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
