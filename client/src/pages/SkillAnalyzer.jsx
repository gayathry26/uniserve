import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import {
  Sparkles,
  Compass,
  Cpu,
  Layers,
  GitCompare,
  ShieldCheck,
  RotateCcw,
  Sliders,
  Settings,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { SkillSelector } from '../components/skill-analyzer/SkillSelector';
import { SelectedSkillsPanel } from '../components/skill-analyzer/SelectedSkillsPanel';
import { ProficiencyModal } from '../components/skill-analyzer/ProficiencyModal';
import { SkillAssessmentModal } from '../components/skill-analyzer/SkillAssessmentModal';
import { AnalysisResults } from '../components/skill-analyzer/AnalysisResults';
import { AdminSkillManagement } from '../components/skill-analyzer/AdminSkillManagement';

export function SkillAnalyzer() {
  const { user } = useAuth();
  const isAdminOrTpo =
    user?.roleName === 'SUPER_ADMIN' ||
    user?.roleName === 'ADMIN' ||
    user?.roleName === 'TPO_OFFICER';

  // 1. Skill Catalogue & Categories State
  const [catalogue, setCatalogue] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingCatalogue, setLoadingCatalogue] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All Skills');

  // 2. Student Selected Skills State
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [loadingStudentSkills, setLoadingStudentSkills] = useState(true);
  const [savingSkills, setSavingSkills] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null); // 'SAVED' | 'SAVING' | 'ERROR'

  // 3. Modals State
  const [activeProficiencySkill, setActiveProficiencySkill] = useState(null);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // 4. Analysis Results State
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);

  // Selected skill IDs set for O(1) fast lookup
  const selectedSkillIds = useMemo(() => {
    return new Set(selectedSkills.map((s) => s.skillId));
  }, [selectedSkills]);

  // Load Skills Catalogue & Categories from backend
  const fetchCatalogue = useCallback(async () => {
    try {
      const [skillsRes, catsRes] = await Promise.all([
        apiClient.get('/skills'),
        apiClient.get('/skills/categories'),
      ]);

      if (skillsRes.data?.success) {
        setCatalogue(skillsRes.data.data || []);
      }
      if (catsRes.data?.success) {
        setCategories(catsRes.data.data?.categories || []);
      }
    } catch (err) {
      console.warn('Error fetching skill catalogue:', err.message);
    } finally {
      setLoadingCatalogue(false);
    }
  }, []);

  // Load Student's Saved Skills from backend
  const fetchStudentSkills = useCallback(async () => {
    try {
      const res = await apiClient.get('/student/skills');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setSelectedSkills(res.data.data);
        setSyncStatus('SAVED');
      }
    } catch (err) {
      console.warn('Error fetching student saved skills:', err.message);
    } finally {
      setLoadingStudentSkills(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalogue();
    fetchStudentSkills();
  }, [fetchCatalogue, fetchStudentSkills]);

  // Save selected skills to backend with debounce
  const persistSkillsToBackend = async (updatedSkills) => {
    setSavingSkills(true);
    setSyncStatus('SAVING');
    try {
      const res = await apiClient.put('/student/skills', { skills: updatedSkills });
      if (res.data?.success) {
        setSyncStatus('SAVED');
      }
    } catch (err) {
      console.warn('Failed to sync skills to account:', err.message);
      setSyncStatus('ERROR');
    } finally {
      setSavingSkills(false);
    }
  };

  // Toggle skill selection
  const handleToggleSkill = (skill) => {
    const isAlreadySelected = selectedSkillIds.has(skill.id);
    let updated;

    if (isAlreadySelected) {
      updated = selectedSkills.filter((s) => s.skillId !== skill.id);
    } else {
      updated = [
        ...selectedSkills,
        {
          skillId: skill.id,
          name: skill.name,
          category: skill.category,
          isPopular: skill.isPopular,
          description: skill.description,
          proficiencyLevel: 'INTERMEDIATE',
          evidenceType: 'NONE',
          evidenceUrl: '',
          isVerified: false,
        },
      ];
    }

    setSelectedSkills(updated);
    persistSkillsToBackend(updated);
  };

  // Remove individual skill
  const handleRemoveSkill = (skillId) => {
    const updated = selectedSkills.filter((s) => s.skillId !== skillId);
    setSelectedSkills(updated);
    persistSkillsToBackend(updated);
  };

  // Clear all selected skills
  const handleClearAll = () => {
    setSelectedSkills([]);
    setAnalysis(null);
    persistSkillsToBackend([]);
  };

  // Update proficiency & evidence from modal
  const handleSaveProficiency = (updatedSkill) => {
    const updated = selectedSkills.map((s) =>
      s.skillId === updatedSkill.skillId ? updatedSkill : s
    );
    setSelectedSkills(updated);
    persistSkillsToBackend(updated);

    // If analysis was already run, re-run analysis dynamically
    if (analysis) {
      handleAnalyzeSkills(updated, analysis.targetRole?.roleId);
    }
  };

  // Run Skill Analysis
  const handleAnalyzeSkills = async (customSkills = null, targetRoleId = null) => {
    const skillsToAnalyze = customSkills || selectedSkills;
    if (skillsToAnalyze.length === 0) return;

    setAnalyzing(true);
    setAnalysisError(null);
    try {
      const res = await apiClient.post('/skill-analyzer/analyze', {
        selectedSkills: skillsToAnalyze,
        targetRoleId,
      });

      if (res.data?.success) {
        setAnalysis(res.data);
        // Smooth scroll to analysis results
        setTimeout(() => {
          const el = document.getElementById('analysis-results-section');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }, 150);
      }
    } catch (err) {
      setAnalysisError(
        err.response?.data?.message || 'Failed to complete skill analysis.'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  // Handle roadmap task completion checkbox
  const handleTaskToggle = async (roleId, taskId, isCompleted) => {
    try {
      await apiClient.patch('/skill-analyzer/roadmap/progress', {
        roleId,
        taskId,
        isCompleted,
      });

      // Update local analysis state
      setAnalysis((prev) => {
        if (!prev || !prev.roadmap) return prev;
        const updatedStages = prev.roadmap.stages.map((stage) => {
          const updatedTasks = stage.tasks.map((t) =>
            t.id === taskId ? { ...t, completed: isCompleted } : t
          );
          const completedCount = updatedTasks.filter((t) => t.completed).length;
          return {
            ...stage,
            tasks: updatedTasks,
            progressPercentage: Math.round((completedCount / updatedTasks.length) * 100),
            isCompleted: completedCount === updatedTasks.length,
          };
        });

        let totalT = 0;
        let compT = 0;
        updatedStages.forEach((s) => {
          totalT += s.tasks.length;
          compT += s.tasks.filter((t) => t.completed).length;
        });

        return {
          ...prev,
          roadmap: {
            ...prev.roadmap,
            stages: updatedStages,
            totalTasks: totalT,
            completedTasksCount: compT,
            overallProgress: totalT > 0 ? Math.round((compT / totalT) * 100) : 0,
          },
        };
      });
    } catch (err) {
      console.warn('Failed to update roadmap task progress:', err);
    }
  };

  // Handle assessment quiz completion
  const handleAssessmentCompleted = (result) => {
    fetchStudentSkills();
    if (analysis) {
      handleAnalyzeSkills();
    }
  };

  // Filter skills by category & search query
  const filteredSkills = useMemo(() => {
    return catalogue.filter((s) => {
      // Category filter
      if (activeCategory !== 'All Skills' && s.category !== activeCategory) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = s.name.toLowerCase().includes(q);
        const matchDesc = (s.description || '').toLowerCase().includes(q);
        const matchCat = s.category.toLowerCase().includes(q);
        return matchName || matchDesc || matchCat;
      }
      return true;
    });
  }, [catalogue, activeCategory, searchQuery]);

  return (
    <div id="skill-selector-top" className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              Placement Preparation
            </span>
            <span className="text-xs text-muted-foreground">• Career Explorer Module</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Discover Your Skills. Find Your Career Path.
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
            Select your technical stack, evaluate proficiency with verified credentials, and generate a deterministic role match with a personalized 5-stage placement roadmap.
          </p>
        </div>

        {/* Top Actions: Admin & Assessment Shortcuts */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsAssessmentModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 transition-all cursor-pointer shadow-2xs"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Take Skill Quiz</span>
          </button>

          {isAdminOrTpo && (
            <button
              onClick={() => setIsAdminModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-border bg-card text-foreground hover:bg-secondary transition-colors cursor-pointer"
              title="Admin: Manage catalogue & role weights"
            >
              <Settings className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="hidden md:inline">Admin Governance</span>
            </button>
          )}
        </div>
      </div>

      {/* Sync / Autosave status pill */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <div className="flex items-center gap-2">
          {syncStatus === 'SAVING' ? (
            <span className="inline-flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
              <span className="w-2.5 h-2.5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
              <span>Saving selections to your account...</span>
            </span>
          ) : syncStatus === 'SAVED' ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Selections saved to your student profile</span>
            </span>
          ) : syncStatus === 'ERROR' ? (
            <span className="inline-flex items-center gap-1.5 text-rose-500 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Failed to save. Changes saved locally.</span>
            </span>
          ) : null}
        </div>

        <div className="text-[11px] text-muted-foreground">
          {catalogue.length} technologies in catalogue
        </div>
      </div>

      {/* Section 1: Searchable Skill Selector */}
      <SkillSelector
        skills={filteredSkills}
        selectedSkillIds={selectedSkillIds}
        onToggleSkill={handleToggleSkill}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        categories={categories}
        loading={loadingCatalogue}
      />

      {/* Section 2: Selected Skills Profile Panel */}
      <SelectedSkillsPanel
        selectedSkills={selectedSkills}
        onRemoveSkill={handleRemoveSkill}
        onClearAll={handleClearAll}
        onOpenProficiencyModal={(skill) => setActiveProficiencySkill(skill)}
        onAnalyze={() => handleAnalyzeSkills()}
        analyzing={analyzing}
        onOpenAssessmentModal={() => setIsAssessmentModalOpen(true)}
      />

      {/* Section 3: Analysis Results */}
      <div id="analysis-results-section">
        {analysisError && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{analysisError}</span>
          </div>
        )}

        {analysis && (
          <AnalysisResults
            analysis={analysis}
            onSelectTargetRole={(roleId) => handleAnalyzeSkills(null, roleId)}
            onTaskToggle={handleTaskToggle}
          />
        )}
      </div>

      {/* Modals */}
      <ProficiencyModal
        isOpen={Boolean(activeProficiencySkill)}
        skill={activeProficiencySkill}
        onClose={() => setActiveProficiencySkill(null)}
        onSave={handleSaveProficiency}
      />

      <SkillAssessmentModal
        isOpen={isAssessmentModalOpen}
        onClose={() => setIsAssessmentModalOpen(false)}
        onAssessmentCompleted={handleAssessmentCompleted}
      />

      <AdminSkillManagement
        isOpen={isAdminModalOpen}
        onClose={() => {
          setIsAdminModalOpen(false);
          fetchCatalogue();
        }}
      />
    </div>
  );
}
