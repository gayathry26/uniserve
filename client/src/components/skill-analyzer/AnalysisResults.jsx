import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../../api/client';
import {
  Sparkles,
  Award,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Compass,
  GitCompare,
  BookOpen,
  CheckSquare,
  Square,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
  Layers,
  BarChart3,
  ListTodo,
  Info,
} from 'lucide-react';

export function AnalysisResults({
  analysis,
  onSelectTargetRole,
  onTaskToggle,
}) {
  if (!analysis || !analysis.hasSkills) return null;

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('recommendations'); // 'recommendations' | 'profile' | 'roadmap' | 'actions'

  const targetRole = analysis.targetRole;
  const recommendations = analysis.recommendations || [];
  const skillProfile = analysis.skillProfile || {};
  const roadmap = analysis.roadmap || {};
  const nextActions = analysis.nextActions || [];

  // Match score ring color
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-500 stroke-emerald-500';
    if (score >= 65) return 'text-purple-500 stroke-purple-500';
    if (score >= 45) return 'text-amber-500 stroke-amber-500';
    return 'text-rose-500 stroke-rose-500';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
    if (score >= 65) return 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30';
    if (score >= 45) return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30';
    return 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30';
  };

  // Open Compare Roles with recommended roles pre-selected
  const handleOpenCompare = (rolesToCompare) => {
    const ids = rolesToCompare && rolesToCompare.length > 0
      ? rolesToCompare.join(',')
      : recommendations.slice(0, 3).map(r => r.roleId).join(',');
    navigate(`/compare?roles=${ids}`);
  };

  return (
    <div className="space-y-6 mt-8 animate-in fade-in duration-300">
      {/* Top Hero Banner: Target Role & Readiness */}
      <div className="bg-card text-card-foreground border border-border rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        {/* Subtle decorative purple glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -z-0 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Skill Analysis Complete</span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex flex-wrap items-center gap-3">
                <span>Top Recommended:</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 dark:from-purple-400 dark:to-indigo-300">
                  {targetRole?.title}
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                {targetRole?.shortDescription}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getScoreBg(targetRole?.matchPercentage || 0)}`}>
                {targetRole?.matchGrade} ({targetRole?.matchPercentage}% Fitment)
              </span>
              <span className="text-xs text-muted-foreground">
                • {targetRole?.matchedSkillsCount} Matched Skills
              </span>
              <span className="text-xs text-muted-foreground">
                • {targetRole?.missingRequiredSkills?.length || 0} Critical Core Gaps
              </span>
            </div>
          </div>

          {/* Match Score Circular Gauge */}
          <div className="flex items-center gap-5 shrink-0 self-stretch sm:self-auto justify-between sm:justify-start p-4 rounded-2xl bg-secondary/40 border border-border">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-neutral-200 dark:text-neutral-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={getScoreColor(targetRole?.matchPercentage || 0)}
                  strokeDasharray={`${targetRole?.matchPercentage || 0}, 100`}
                  strokeLinecap="round"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-foreground leading-none">
                  {targetRole?.matchPercentage}%
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">
                  Match
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleOpenCompare([targetRole?.roleId, recommendations[1]?.roleId].filter(Boolean))}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 shadow-xs cursor-pointer active:scale-95 transition-all"
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>Compare Roles</span>
              </button>
              <Link
                to={`/domains?role=${targetRole?.roleId}`}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-card border border-border text-foreground hover:bg-secondary cursor-pointer transition-colors"
              >
                <Compass className="w-3.5 h-3.5 text-purple-500" />
                <span>Explore Role Roadmap</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="mt-8 pt-4 border-t border-border flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'recommendations', label: 'Role Recommendations', icon: Compass, count: recommendations.length },
            { id: 'profile', label: 'Skill Profile & Gap Analysis', icon: BarChart3 },
            { id: 'roadmap', label: 'Personalized Roadmap', icon: ListTodo, count: `${roadmap.overallProgress || 0}%` },
            { id: 'actions', label: 'Next 3 Actions', icon: Zap, count: nextActions.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 shadow-xs'
                    : 'bg-secondary/70 text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                    isActive
                      ? 'bg-neutral-800 text-neutral-200 dark:bg-neutral-200 dark:text-neutral-900'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-muted-foreground'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: Role Recommendations */}
      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Evaluated Career Opportunities ({recommendations.length} Roles)
            </h3>
            <span className="text-xs text-muted-foreground">
              Ranked deterministically by required skill weights & verified proficiency
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((role) => {
              const isTarget = targetRole?.roleId === role.roleId;
              return (
                <div
                  key={role.roleId}
                  className={`bg-card text-card-foreground border rounded-2xl p-5 shadow-xs transition-all relative flex flex-col justify-between ${
                    isTarget
                      ? 'border-purple-500/60 ring-2 ring-purple-500/20'
                      : 'border-border hover:border-neutral-400 dark:hover:border-neutral-700'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                          {role.category}
                        </span>
                        <h4 className="text-base font-bold text-foreground">
                          {role.title}
                        </h4>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-black border ${getScoreBg(role.matchPercentage)}`}>
                        {role.matchPercentage}% Match
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {role.shortDescription}
                    </p>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            role.matchPercentage >= 75
                              ? 'bg-emerald-500'
                              : role.matchPercentage >= 50
                              ? 'bg-purple-600'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${role.matchPercentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                        <span>{role.matchedSkillsCount} matched</span>
                        <span>{role.missingRequiredSkills?.length || 0} core gaps</span>
                      </div>
                    </div>

                    {/* Matched Skills Preview */}
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Matched Skills:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {role.matchedSkills.length > 0 ? (
                          role.matchedSkills.slice(0, 5).map((s) => (
                            <span
                              key={s.skillId}
                              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-medium"
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>{s.name}</span>
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground italic">None currently selected</span>
                        )}
                        {role.matchedSkills.length > 5 && (
                          <span className="text-[10px] text-muted-foreground font-medium self-center">
                            +{role.matchedSkills.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Missing Required Skills Preview */}
                    {role.missingRequiredSkills?.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Critical Missing Core Requirements:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {role.missingRequiredSkills.slice(0, 4).map((s) => (
                            <span
                              key={s.skillId}
                              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 font-medium"
                            >
                              <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                              <span>{s.name}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Deterministic Explanation Box */}
                    <div className="p-3 rounded-xl bg-secondary/50 border border-border/80 text-[11px] text-muted-foreground leading-relaxed flex items-start gap-2">
                      <Info className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
                      <span>{role.scoreExplanation}</span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="pt-4 mt-3 border-t border-border flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenCompare([role.roleId, targetRole?.roleId].filter(Boolean))}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                        title="Compare with other roles"
                      >
                        <GitCompare className="w-3.5 h-3.5" />
                        <span>Compare</span>
                      </button>
                      <Link
                        to={`/domains?role=${role.roleId}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        <span>Explore</span>
                      </Link>
                    </div>

                    {!isTarget && (
                      <button
                        onClick={() => onSelectTargetRole(role.roleId)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-secondary text-foreground hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                      >
                        <span>Target Role</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Skill Profile & Gap Analysis */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Distribution Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-card border border-border">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Total Selected Skills
              </span>
              <p className="text-2xl font-black text-foreground mt-1">
                {skillProfile.totalSelected || 0}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Across active stack</p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Advanced Mastery
              </span>
              <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
                {skillProfile.proficiencyDistribution?.ADVANCED || 0}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Full weight multiplier</p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Intermediate Skills
              </span>
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                {skillProfile.proficiencyDistribution?.INTERMEDIATE || 0}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Standard production tier</p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Verified Credentials
              </span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {(skillProfile.evidenceDistribution?.VERIFIED || 0) + (skillProfile.evidenceDistribution?.PROJECT || 0)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">With assessment or project proof</p>
            </div>
          </div>

          {/* Foundational Essentials Health Check */}
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-xs">
            <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>Foundational Placement Prerequisites Audit</span>
            </h4>
            <p className="text-xs text-muted-foreground mb-4">
              Universities and corporate recruiters test these foundational skills regardless of your specific framework.
            </p>

            {skillProfile.missingFoundationalSkills?.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Excellent! All universal foundational placement requirements (Git, SQL, Problem Solving) are accounted for.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {skillProfile.missingFoundationalSkills?.map((f) => (
                  <div
                    key={f.id}
                    className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-bold text-foreground">{f.name}:</span>{' '}
                      <span className="text-muted-foreground">{f.reason}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 shrink-0 self-start sm:self-auto">
                      Foundational Gap
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Deep Gap Matrix for Target Role */}
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-xs">
            <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-1">
              Detailed Skill Gap Matrix: {targetRole?.title}
            </h4>
            <p className="text-xs text-muted-foreground mb-4">
              Comparison between your verified/self-reported skills and the institutional requirements for this role.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-secondary/30">
                    <th className="py-2.5 px-3">Skill Requirement</th>
                    <th className="py-2.5 px-3">Requirement Tier</th>
                    <th className="py-2.5 px-3">Your Status</th>
                    <th className="py-2.5 px-3">Proficiency / Evidence</th>
                    <th className="py-2.5 px-3 text-right">Points Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {/* Matched Skills */}
                  {targetRole?.matchedSkills?.map((s) => (
                    <tr key={s.skillId} className="hover:bg-secondary/20">
                      <td className="py-2.5 px-3 font-semibold text-foreground">
                        {s.name}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.isRequired
                            ? 'bg-neutral-200 dark:bg-neutral-800 text-foreground'
                            : 'bg-secondary text-muted-foreground'
                        }`}>
                          {s.isRequired ? 'Core Required' : 'Secondary'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Acquired</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">
                        {s.proficiencyLevel} {s.isVerified ? '• Verified' : s.evidenceType !== 'NONE' ? `• ${s.evidenceType}` : '• Self-reported'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                        +{s.earnedPoints} pts
                      </td>
                    </tr>
                  ))}

                  {/* Missing Required Skills */}
                  {targetRole?.missingRequiredSkills?.map((s) => (
                    <tr key={s.skillId} className="bg-rose-500/5 hover:bg-rose-500/10">
                      <td className="py-2.5 px-3 font-semibold text-foreground">
                        {s.name}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          Critical Required
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Not Yet Learned</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground italic">
                        Missing prerequisite
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                        -{Math.round(s.weight * 3)} pts
                      </td>
                    </tr>
                  ))}

                  {/* Missing Optional Skills */}
                  {targetRole?.missingOptionalSkills?.map((s) => (
                    <tr key={s.skillId} className="hover:bg-secondary/20">
                      <td className="py-2.5 px-3 font-medium text-foreground">
                        {s.name}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-secondary text-muted-foreground">
                          Optional Bonus
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">
                        Recommended
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground italic">
                        Not acquired
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                        0 pts
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Personalized Learning Roadmap */}
      {activeTab === 'roadmap' && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Actionable Curriculum
              </span>
              <h4 className="text-base sm:text-lg font-bold text-foreground">
                5-Stage Learning Roadmap: {targetRole?.title}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Check off completed tasks to track your progress and placement readiness.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <span className="text-xs font-bold text-foreground">{roadmap.overallProgress || 0}% Complete</span>
                <p className="text-[10px] text-muted-foreground">{roadmap.completedTasksCount || 0} of {roadmap.totalTasks || 0} tasks</p>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-secondary border-t-purple-600 flex items-center justify-center font-bold text-xs">
                {roadmap.overallProgress || 0}%
              </div>
            </div>
          </div>

          {/* 5 Stages Accordion / Cards */}
          <div className="space-y-4">
            {roadmap.stages?.map((stage) => (
              <div
                key={stage.stageNumber}
                className="bg-card border border-border rounded-2xl p-5 shadow-xs transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center text-xs font-bold shrink-0">
                      {stage.stageNumber}
                    </span>
                    <div>
                      <h5 className="text-sm font-bold text-foreground">
                        {stage.title}
                      </h5>
                      <p className="text-xs text-muted-foreground">
                        {stage.description}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 self-end sm:self-auto">
                    {stage.progressPercentage || 0}% Stage Complete
                  </span>
                </div>

                {/* Learning Objectives */}
                <div className="py-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Stage Objectives:
                  </p>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {stage.learningObjectives?.map((obj, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-purple-500 font-bold">•</span>
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Practical Checklist Tasks */}
                <div className="py-3 border-t border-border/60">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Actionable Tasks (Click to check complete):
                  </p>
                  <div className="space-y-2">
                    {stage.tasks?.map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => onTaskToggle(targetRole.roleId, task.id, !task.completed)}
                        className={`w-full p-2.5 rounded-xl border text-left text-xs flex items-center justify-between gap-3 transition-all cursor-pointer ${
                          task.completed
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200 line-through'
                            : 'bg-secondary/40 border-border text-foreground hover:bg-secondary'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {task.completed ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-muted-foreground shrink-0" />
                          )}
                          <span>{task.title}</span>
                        </div>
                        {task.completed && (
                          <span className="text-[10px] font-bold uppercase text-emerald-600 shrink-0">
                            Done
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resources */}
                {stage.resources?.length > 0 && (
                  <div className="pt-3 border-t border-border/60 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold text-muted-foreground mr-1">
                      Curated Resources:
                    </span>
                    {stage.resources.map((res, i) => (
                      <a
                        key={i}
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] bg-secondary text-foreground hover:text-purple-600 transition-colors border border-border"
                      >
                        <BookOpen className="w-3 h-3 text-purple-500" />
                        <span>{res.name}</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Recommended Next Actions */}
      {activeTab === 'actions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Prioritized Next 3 Actions
            </h3>
            <span className="text-xs text-muted-foreground">
              Highest-ROI concrete steps to maximize your placement interview cutoffs
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {nextActions.map((act) => (
              <div
                key={act.priority}
                className="bg-card text-card-foreground border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 relative overflow-hidden"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-black">
                      {act.priority}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                      {act.category}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-foreground leading-snug">
                    {act.title}
                  </h4>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {act.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-border">
                  {act.actionUrl.startsWith('/') ? (
                    <Link
                      to={act.actionUrl}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition-all shadow-xs"
                    >
                      <span>{act.ctaText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <button
                      onClick={() => {
                        const el = document.getElementById('skill-selector-top');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-xs cursor-pointer"
                    >
                      <span>{act.ctaText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
