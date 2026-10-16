import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import {
  ShieldAlert,
  Plus,
  Edit2,
  Check,
  X,
  Sliders,
  Database,
  Search,
  Sparkles,
} from 'lucide-react';

export function AdminSkillManagement({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('catalogue'); // 'catalogue' | 'requirements'
  const [skills, setSkills] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // New Skill Modal / Inputs
  const [newSkill, setNewSkill] = useState({
    id: '',
    name: '',
    category: 'Frontend',
    is_popular: false,
    description: '',
  });

  // Selected role for role requirements editing
  const [selectedRole, setSelectedRole] = useState('frontend-developer');

  // Load Admin Catalogue Data
  const loadAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/admin/skill-catalogue');
      if (res.data?.success) {
        setSkills(res.data.skills || []);
        setRequirements(res.data.requirements || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load administrator skill data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleTogglePopular = async (skill) => {
    try {
      await apiClient.put(`/admin/skill-catalogue/${skill.id}`, {
        is_popular: !skill.is_popular,
      });
      setSkills((prev) =>
        prev.map((s) => (s.id === skill.id ? { ...s, is_popular: !s.is_popular } : s))
      );
      setSuccessMsg(`Toggled popular status for ${skill.name}.`);
    } catch (err) {
      setError('Failed to update skill in catalogue.');
    }
  };

  const handleCreateSkill = async (e) => {
    e.preventDefault();
    if (!newSkill.id || !newSkill.name) {
      setError('Skill ID and Name are required.');
      return;
    }

    try {
      await apiClient.post('/admin/skill-catalogue', newSkill);
      setSuccessMsg(`Skill "${newSkill.name}" added to catalogue.`);
      setNewSkill({ id: '', name: '', category: 'Frontend', is_popular: false, description: '' });
      await loadAdminData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create skill.');
    }
  };

  const handleUpdateRequirementWeight = async (reqItem, newWeight) => {
    try {
      await apiClient.put('/admin/role-requirements', {
        roleId: reqItem.role_id,
        skillId: reqItem.skill_id,
        isRequired: reqItem.is_required,
        importanceWeight: parseFloat(newWeight),
      });
      setRequirements((prev) =>
        prev.map((r) =>
          r.id === reqItem.id ? { ...r, importance_weight: parseFloat(newWeight) } : r
        )
      );
      setSuccessMsg(`Updated weight for ${reqItem.skill_name} to ${newWeight}.`);
    } catch (err) {
      setError('Failed to update role requirement weight.');
    }
  };

  const handleToggleRequirementType = async (reqItem) => {
    const newRequired = !reqItem.is_required;
    try {
      await apiClient.put('/admin/role-requirements', {
        roleId: reqItem.role_id,
        skillId: reqItem.skill_id,
        isRequired: newRequired,
        importanceWeight: reqItem.importance_weight,
      });
      setRequirements((prev) =>
        prev.map((r) =>
          r.id === reqItem.id ? { ...r, is_required: newRequired ? 1 : 0 } : r
        )
      );
      setSuccessMsg(`Changed requirement type for ${reqItem.skill_name}.`);
    } catch (err) {
      setError('Failed to update requirement type.');
    }
  };

  const filteredRequirements = requirements.filter((r) => r.role_id === selectedRole);

  const rolesList = [
    { id: 'frontend-developer', title: 'Frontend Developer' },
    { id: 'backend-developer', title: 'Backend Developer' },
    { id: 'full-stack-developer', title: 'Full Stack Developer' },
    { id: 'data-analyst', title: 'Data Analyst' },
    { id: 'data-scientist', title: 'Data Scientist' },
    { id: 'ai-ml-engineer', title: 'AI / ML Engineer' },
    { id: 'cybersecurity-analyst', title: 'Cybersecurity Analyst' },
    { id: 'cloud-engineer', title: 'Cloud Engineer' },
    { id: 'devops-engineer', title: 'DevOps Engineer' },
    { id: 'ui-ux-designer', title: 'UI/UX Designer' },
    { id: 'software-tester', title: 'Software Tester / QA' },
    { id: 'mobile-app-developer', title: 'Mobile App Developer' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-card text-card-foreground border border-border rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Admin: Skill Catalogue & Role Requirements Governance
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Manage technologies, required vs optional skills, and deterministic scoring weights
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="p-3 border-b border-border bg-card flex items-center gap-2">
          <button
            onClick={() => setActiveTab('catalogue')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'catalogue'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            Skills Catalogue ({skills.length})
          </button>
          <button
            onClick={() => setActiveTab('requirements')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'requirements'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            Role Requirements & Weights ({requirements.length})
          </button>
        </div>

        {/* Feedback banners */}
        {error && (
          <div className="m-4 mb-0 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="m-4 mb-0 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-between">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg(null)}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {loading ? (
            <div className="text-center py-12 text-xs text-muted-foreground">
              <span className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin inline-block mr-2" />
              Loading administration data...
            </div>
          ) : activeTab === 'catalogue' ? (
            /* TAB 1: Catalogue management */
            <div className="space-y-5">
              {/* Add New Skill Form */}
              <form
                onSubmit={handleCreateSkill}
                className="p-4 rounded-xl border border-border bg-secondary/20 space-y-3"
              >
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Add New Technology to Catalogue
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">
                      Skill ID (Slug)
                    </label>
                    <input
                      type="text"
                      value={newSkill.id}
                      onChange={(e) => setNewSkill({ ...newSkill, id: e.target.value })}
                      placeholder="e.g. svelte"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-card mt-1"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={newSkill.name}
                      onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                      placeholder="e.g. Svelte.js"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-card mt-1"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">
                      Category
                    </label>
                    <select
                      value={newSkill.category}
                      onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-card mt-1"
                    >
                      <option value="Frontend">Frontend</option>
                      <option value="Backend">Backend</option>
                      <option value="Databases">Databases</option>
                      <option value="Programming Languages">Programming Languages</option>
                      <option value="DevOps & Cloud">DevOps & Cloud</option>
                      <option value="Data Science & AI">Data Science & AI</option>
                      <option value="Cybersecurity">Cybersecurity</option>
                      <option value="Testing & QA">Testing & QA</option>
                      <option value="UI/UX Design">UI/UX Design</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="inline-flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newSkill.is_popular}
                      onChange={(e) => setNewSkill({ ...newSkill, is_popular: e.target.checked })}
                      className="rounded"
                    />
                    <span>Mark as Popular (POP badge)</span>
                  </label>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Skill</span>
                  </button>
                </div>
              </form>

              {/* Skills Table */}
              <div className="border border-border rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-secondary/40 text-[10px] uppercase font-bold text-muted-foreground border-b border-border">
                    <tr>
                      <th className="py-2.5 px-3">Skill Name</th>
                      <th className="py-2.5 px-3">ID Slug</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Popular</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {skills.map((s) => (
                      <tr key={s.id} className="hover:bg-secondary/20">
                        <td className="py-2.5 px-3 font-semibold text-foreground">
                          {s.name}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-muted-foreground text-[11px]">
                          {s.id}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">
                          {s.category}
                        </td>
                        <td className="py-2.5 px-3">
                          {s.is_popular ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                              POP
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-[11px]">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => handleTogglePopular(s)}
                            className="px-2 py-1 rounded text-[11px] font-medium text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                          >
                            Toggle POP
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* TAB 2: Role requirements and weights */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Select Career Role:
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="block px-3 py-1.5 text-xs rounded-xl border border-border bg-card mt-1 font-bold text-foreground"
                  >
                    {rolesList.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title}
                      </option>
                    ))}
                  </select>
                </div>
                <span className="text-xs text-muted-foreground">
                  {filteredRequirements.length} configured requirements
                </span>
              </div>

              <div className="border border-border rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-secondary/40 text-[10px] uppercase font-bold text-muted-foreground border-b border-border">
                    <tr>
                      <th className="py-2.5 px-3">Skill</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Requirement Type</th>
                      <th className="py-2.5 px-3">Importance Weight</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredRequirements.map((req) => (
                      <tr key={req.id} className="hover:bg-secondary/20">
                        <td className="py-2.5 px-3 font-semibold text-foreground">
                          {req.skill_name}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">
                          {req.skill_category}
                        </td>
                        <td className="py-2.5 px-3">
                          <button
                            onClick={() => handleToggleRequirementType(req)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                              req.is_required
                                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                                : 'bg-secondary text-muted-foreground'
                            }`}
                          >
                            {req.is_required ? 'Core Required' : 'Optional Secondary'}
                          </button>
                        </td>
                        <td className="py-2.5 px-3">
                          <select
                            value={req.importance_weight}
                            onChange={(e) => handleUpdateRequirementWeight(req, e.target.value)}
                            className="px-2 py-1 text-xs rounded border border-border bg-card font-mono font-bold"
                          >
                            <option value="5.0">5.0 (Absolute Critical)</option>
                            <option value="4.5">4.5 (High Critical)</option>
                            <option value="4.0">4.0 (Core Essential)</option>
                            <option value="3.5">3.5 (Strong Prerequisite)</option>
                            <option value="3.0">3.0 (Standard Important)</option>
                            <option value="2.5">2.5 (Secondary)</option>
                            <option value="2.0">2.0 (Helpful Extra)</option>
                            <option value="1.0">1.0 (Bonus / Minor)</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex justify-end bg-secondary/20">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
