import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../context/PermissionContext';
import {
  Palette,
  Check,
  Sparkles,
  Sliders,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Database,
  Monitor,
  Bell,
  CheckCircle2,
  XCircle,
  Layers,
  ArrowRight,
  RefreshCw,
  Lock,
  Eye,
  CheckSquare,
  Square,
  Users,
  Search,
  Sun,
  Moon,
} from 'lucide-react';

export function Settings() {
  const { currentTheme, setTheme, themes, isDark, setDarkMode } = useTheme();
  const { user, switchRole } = useAuth();
  const {
    allPages,
    userRoles,
    rolePermissions,
    backendSynced,
    togglePermission,
    setAllPermissionsForRole,
    resetToDefaults,
  } = usePermissions();

  const [activeTab, setActiveTab] = useState('permissions'); // Default to permissions tab as requested!
  const [selectedRole, setSelectedRole] = useState(user?.roleName || 'STUDENT');
  const [pageSearch, setPageSearch] = useState('');
  const [compactMode, setCompactMode] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [soundEffects, setSoundEffects] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const isSuperAdmin = user?.roleName === 'SUPER_ADMIN';

  const handleSelectTheme = (themeId) => {
    setTheme(themeId);
    showNotice();
  };

  const showNotice = () => {
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
    }, 2000);
  };

  const handleCheckboxToggle = (pagePath) => {
    if (selectedRole === 'SUPER_ADMIN') return;
    togglePermission(selectedRole, pagePath);
    showNotice();
  };

  const currentRoleObj = userRoles.find((r) => r.id === selectedRole) || userRoles[0];
  const allowedForSelectedRole =
    selectedRole === 'SUPER_ADMIN'
      ? allPages.map((p) => p.path)
      : rolePermissions[selectedRole] || [];

  const filteredPages = allPages.filter(
    (p) =>
      p.label.toLowerCase().includes(pageSearch.toLowerCase()) ||
      p.path.toLowerCase().includes(pageSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(pageSearch.toLowerCase())
  );

  // Group pages by category
  const categories = Array.from(new Set(allPages.map((p) => p.category)));

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Top Banner / Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-border shadow-xs relative overflow-hidden">
        <div
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: currentTheme.glow }}
        />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: currentTheme.primaryLight,
                  color: currentTheme.primaryText,
                }}
              >
                <ShieldCheck className="w-3 h-3" />
                Institutional Administration & Settings
              </span>
              {isSuperAdmin && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-secondary text-foreground text-[10px] font-extrabold border border-border">
                  <ShieldAlert className="w-3 h-3 text-foreground" />
                  SUPER ADMIN CONSOLE
                </span>
              )}
              {savedNotice && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-foreground text-[10px] font-bold border border-border animate-fade-in">
                  <Check className="w-3 h-3" />
                  Live Sync Active!
                </span>
              )}
              {backendSynced && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-foreground text-[10px] font-bold border border-border">
                  <Database className="w-3 h-3" />
                  MySQL Backend Connected
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              CampusCorp Settings & Access Control
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
              Configure role-based page visibility checkboxes, switch visual themes, toggle dark/light mode, and manage institutional preferences.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-secondary border border-border text-right">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Active Role
              </span>
              <span
                className="text-xs font-bold"
                style={{ color: currentTheme.primary }}
              >
                {user?.roleName || 'STUDENT'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-border text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-3.5 py-2 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'permissions'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Role Page Access (Checkboxes)</span>
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            className={`px-3.5 py-2 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'appearance'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Appearance & Themes ({themes.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`px-3.5 py-2 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'preferences'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Preferences & Density</span>
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`px-3.5 py-2 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'system'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>System & Architecture</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ROLE PAGE ACCESS CONTROL (CHECKBOXES PER USER TYPE)                */}
      {/* ========================================================================= */}
      {activeTab === 'permissions' && (
        <div className="space-y-6">
          {/* Super Admin Notice Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-secondary border border-border text-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-secondary border border-border flex items-center justify-center text-foreground shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2">
                  <span>Super Admin Page Access Authority</span>
                  <span className="px-2 py-0.5 rounded-full bg-secondary text-foreground text-foreground text-[10px] font-extrabold uppercase">
                    Root Unrestricted
                  </span>
                </h3>
                <p className="text-[11px] sm:text-xs text-foreground mt-0.5 leading-relaxed">
                  <strong>Super Admin will always have full access to all 20 pages.</strong> For every other user type, <strong>only the ticked checkbox pages below will be shown</strong> in their sidebar navigation and portal routes.
                </p>
              </div>
            </div>
            {user?.roleName !== 'SUPER_ADMIN' && (
              <button
                onClick={() => switchRole('SUPER_ADMIN')}
                className="px-3 py-1.5 rounded-xl bg-neutral-800 text-white dark:bg-neutral-200 dark:text-black hover:bg-primary text-primary-foreground font-bold text-xs shrink-0 cursor-pointer shadow-xs transition-colors"
              >
                Switch to Super Admin
              </button>
            )}
          </div>

          {/* User Role Selector Pills */}
          <div className="bg-white rounded-2xl p-5 border border-border shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                Select User Type to Configure Permissions
              </span>
              <span className="text-[11px] font-semibold text-muted-foreground">
                {userRoles.length} Defined Roles
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {userRoles.map((r) => {
                const isSelected = r.id === selectedRole;
                const isSuper = r.id === 'SUPER_ADMIN';
                const count =
                  r.id === 'SUPER_ADMIN'
                    ? allPages.length
                    : (rolePermissions[r.id] || []).length;

                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRole(r.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
                      isSelected
                        ? isSuper
                          ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-black text-slate-950 border-border shadow-xs font-black'
                          : 'text-white border-transparent shadow-xs'
                        : isSuper
                        ? 'bg-secondary text-foreground border-border hover:bg-secondary'
                        : 'bg-secondary text-foreground border-border hover:bg-secondary hover:text-foreground'
                    }`}
                    style={
                      isSelected && !isSuper
                        ? { backgroundColor: currentTheme.primary }
                        : undefined
                    }
                  >
                    <span>{r.label}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                        isSelected
                          ? isSuper
                            ? 'bg-slate-950 text-muted-foreground'
                            : 'bg-white/20 text-white'
                          : 'bg-slate-200 text-muted-foreground'
                      }`}
                    >
                      {count}/{allPages.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Role Header & Actions */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-border shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-border">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-extrabold text-foreground">
                    Permissions for: {currentRoleObj.label}
                  </h3>
                  {selectedRole === 'SUPER_ADMIN' ? (
                    <span className="px-2.5 py-0.5 rounded-md bg-secondary text-foreground text-[10px] font-extrabold border border-border">
                      Locked All On (Root)
                    </span>
                  ) : (
                    <span
                      className="px-2.5 py-0.5 rounded-md text-[10px] font-bold border"
                      style={{
                        backgroundColor: currentTheme.primaryLight,
                        color: currentTheme.primaryText,
                        borderColor: currentTheme.primaryBorder,
                      }}
                    >
                      {allowedForSelectedRole.length} of {allPages.length} Pages Visible
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {currentRoleObj.desc}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {selectedRole !== 'SUPER_ADMIN' && (
                  <>
                    <button
                      onClick={() => {
                        setAllPermissionsForRole(selectedRole, true);
                        showNotice();
                      }}
                      className="px-3 py-1.5 rounded-lg border border-border hover:border-border bg-secondary hover:bg-secondary text-foreground text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-foreground" />
                      <span>Tick All</span>
                    </button>
                    <button
                      onClick={() => {
                        setAllPermissionsForRole(selectedRole, false);
                        showNotice();
                      }}
                      className="px-3 py-1.5 rounded-lg border border-border hover:border-border bg-secondary hover:bg-secondary text-foreground text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Square className="w-3.5 h-3.5 text-foreground" />
                      <span>Untick All</span>
                    </button>
                    <button
                      onClick={() => {
                        resetToDefaults();
                        showNotice();
                      }}
                      className="px-3 py-1.5 rounded-lg border border-border hover:border-border bg-secondary hover:bg-secondary text-foreground text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Reset Defaults</span>
                    </button>
                  </>
                )}

                {/* Switch to this role button to preview */}
                <button
                  onClick={() => switchRole(selectedRole)}
                  className="px-3 py-1.5 rounded-lg text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  style={{ backgroundColor: currentTheme.primary }}
                  title="Switch session to this role to see the exact sidebar appearance"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview as {currentRoleObj.label}</span>
                </button>
              </div>
            </div>

            {/* Filter Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
              <input
                type="text"
                value={pageSearch}
                onChange={(e) => setPageSearch(e.target.value)}
                placeholder="Filter pages by name, route (/students), or category..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-border text-xs font-medium text-foreground placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-secondary hover:bg-white transition-all"
              />
            </div>

            {/* Checkbox Pages by Category */}
            <div className="space-y-6 pt-2">
              {categories.map((category) => {
                const categoryPages = filteredPages.filter(
                  (p) => p.category === category
                );
                if (categoryPages.length === 0) return null;

                const categoryCheckedCount = categoryPages.filter((p) =>
                  allowedForSelectedRole.includes(p.path)
                ).length;

                return (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center justify-between pb-1 border-b border-border">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: currentTheme.primary }}
                        />
                        <span>{category}</span>
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {categoryCheckedCount} / {categoryPages.length} active
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {categoryPages.map((page) => {
                        const isTicked = allowedForSelectedRole.includes(page.path);
                        const isLockedSuperAdmin = selectedRole === 'SUPER_ADMIN';

                        return (
                          <div
                            key={page.path}
                            onClick={() => {
                              if (!isLockedSuperAdmin) {
                                handleCheckboxToggle(page.path);
                              }
                            }}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer ${
                              isTicked
                                ? 'bg-secondary border-border/90 shadow-2xs'
                                : 'bg-white border-border opacity-60 hover:opacity-100 hover:border-border'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {/* The Interactive Checkbox */}
                              <div className="relative flex items-center justify-center">
                                <input
                                  type="checkbox"
                                  checked={isTicked}
                                  disabled={isLockedSuperAdmin}
                                  onChange={() => {
                                    if (!isLockedSuperAdmin) {
                                      handleCheckboxToggle(page.path);
                                    }
                                  }}
                                  className="w-4 h-4 rounded text-foreground focus:ring-neutral-400 cursor-pointer disabled:cursor-not-allowed"
                                  style={{
                                    accentColor: isLockedSuperAdmin
                                      ? '#737373'
                                      : '#171717',
                                  }}
                                />
                              </div>

                              {/* Page Title & Route */}
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-foreground truncate">
                                  {page.label}
                                </p>
                                <p className="text-[11px] font-mono text-muted-foreground">
                                  {page.path}
                                </p>
                              </div>
                            </div>

                            {/* Status Badge */}
                            <div className="shrink-0">
                              {isLockedSuperAdmin ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-foreground text-[10px] font-extrabold border border-border">
                                  <Lock className="w-2.5 h-2.5" />
                                  <span>Super Admin Full Access</span>
                                </span>
                              ) : isTicked ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-foreground text-[10px] font-bold border border-border">
                                  <Check className="w-2.5 h-2.5" />
                                  <span>Ticked & Visible</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-muted-foreground text-[10px] font-semibold border border-border">
                                  <span>Unticked (Hidden)</span>
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: APPEARANCE & THEMES (AT LEAST 6 COMPLETE THEMES)                    */}
      {/* ========================================================================= */}
      {activeTab === 'appearance' && (
        <div className="space-y-6">
          <div className="bg-card text-card-foreground rounded-2xl p-6 border border-border shadow-sm">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2 mb-1">
              <span>Display Theme Mode</span>
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              Select your preferred appearance mode. Changes update immediately across the entire platform.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setDarkMode(false)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3.5 ${
                  !isDark
                    ? 'border-border bg-secondary/80 shadow-xs'
                    : 'border-border bg-card hover:bg-secondary/40'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-border text-foreground flex items-center justify-center shadow-xs">
                  <Sun className="w-5 h-5 text-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-foreground">Light Mode</p>
                    {!isDark && <Check className="w-4 h-4 text-foreground stroke-[3]" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Pure white cards with high contrast neutral surfaces</p>
                </div>
              </div>

              <div
                onClick={() => setDarkMode(true)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3.5 ${
                  isDark
                    ? 'border-border bg-secondary/80 shadow-xs'
                    : 'border-border bg-card hover:bg-secondary/40'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 text-white flex items-center justify-center shadow-xs">
                  <Moon className="w-5 h-5 text-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-foreground">Dark Mode</p>
                    {isDark && <Check className="w-4 h-4 text-foreground stroke-[3]" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Deep charcoal surfaces (#0a0a0a & #171717) with refined contrast</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <span>Accent Color Palette</span>
                <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-[10px] font-bold border border-border">
                  {themes.length} Palettes Available
                </span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Click any palette below to instantly recolor CampusCorp navigation, buttons, highlights, and cards.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {themes.map((t) => {
              const isSelected = t.id === currentTheme.id;
              return (
                <div
                  key={t.id}
                  onClick={() => handleSelectTheme(t.id)}
                  className={`group relative rounded-2xl p-5 border text-left transition-all cursor-pointer hover:shadow-md ${
                    isSelected
                      ? 'bg-white border-2 shadow-sm'
                      : 'bg-white/90 border-border hover:border-border'
                  }`}
                  style={{
                    borderColor: isSelected ? t.primary : undefined,
                  }}
                >
                  {isSelected && (
                    <div
                      className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center text-white shadow-xs"
                      style={{ backgroundColor: t.primary }}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-3.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {t.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {t.swatches.map((color, idx) => (
                        <span
                          key={idx}
                          className="w-3.5 h-3.5 rounded-full border border-white shadow-xs"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="mb-2">
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      {t.name}
                    </h3>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">
                      {t.tagline}
                    </p>
                  </div>

                  <div
                    className="h-2 w-full rounded-full mb-4"
                    style={{
                      background: `linear-gradient(90deg, ${t.gradientFrom}, ${t.primary}, ${t.accent})`,
                    }}
                  />

                  <div className="p-3 rounded-xl bg-secondary border border-border space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground font-medium">Preview UI:</span>
                      <span
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                        style={{
                          backgroundColor: t.primaryLight,
                          color: t.primaryText,
                          borderColor: t.primaryBorder,
                        }}
                      >
                        Active Pill
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        className="flex-1 py-1.5 px-2.5 rounded-lg text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow-2xs"
                        style={{ backgroundColor: t.primary }}
                      >
                        <span>Apply Theme</span>
                      </button>
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{
                          backgroundColor: t.primaryLight,
                          color: t.primaryText,
                        }}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PREFERENCES & DENSITY                                              */}
      {/* ========================================================================= */}
      {activeTab === 'preferences' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-border shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-foreground">
              Workspace & Interface Preferences
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Customize how tables, cards, and system notifications render on your screen.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-secondary transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-foreground">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">
                    Compact Table Density
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Reduces vertical padding across student rosters and application lists.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={compactMode}
                onChange={() => setCompactMode(!compactMode)}
                className="w-4 h-4 rounded text-foreground focus:ring-neutral-400 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-secondary transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-foreground">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">
                    Real-Time Placement Alerts
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Receive instant notifications when new corporate drives or assessment slots open.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={() => setEmailAlerts(!emailAlerts)}
                className="w-4 h-4 rounded text-foreground focus:ring-neutral-400 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SYSTEM & ARCHITECTURE                                              */}
      {/* ========================================================================= */}
      {activeTab === 'system' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-border shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-foreground">
              CampusCorp System Diagnostics
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live status of the multi-database cluster and session permissions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-border bg-secondary/50 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Application Core
              </span>
              <p className="text-xs font-semibold text-foreground">CampusCorp IT Career Hub Edition</p>
              <p className="text-[11px] text-muted-foreground">Version 2.4.0 (Production Stable)</p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-secondary space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Central Database
              </span>
              <p className="text-xs font-semibold text-foreground">MySQL / XAMPP Multi-Tenant</p>
              <p className="text-[11px] text-foreground font-medium">● 6 Department DBs Synchronized</p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-secondary space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Authenticated User
              </span>
              <p className="text-xs font-semibold text-foreground">
                {user ? `${user.firstName} ${user.lastName}` : 'Guest User'}
              </p>
              <p className="text-[11px] text-muted-foreground">{user?.email || 'N/A'}</p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-secondary space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Role Authority
              </span>
              <p className="text-xs font-semibold text-foreground">{user?.roleName || 'STUDENT'}</p>
              <p className="text-[11px] text-muted-foreground">
                {user?.roleName === 'SUPER_ADMIN'
                  ? 'Master Root Control (Access to All Pages)'
                  : `Department: ${user?.departmentCode || 'Institutional'}`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
