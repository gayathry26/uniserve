import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { StatusBadge } from '../components/Badge';
import { User, Mail, Phone, BookOpen, Award, FileText, Upload, Save, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';

export function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    skills: '',
    linkedin_url: '',
    github_url: '',
    portfolio_url: '',
    phone: '',
  });

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user?.studentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.get(`/students/${user.studentId}`);
      const st = res.data.student || {};
      setProfile(st);

      let skillsStr = '';
      try {
        const parsed = typeof st.skills === 'string' ? JSON.parse(st.skills) : st.skills;
        skillsStr = Array.isArray(parsed) ? parsed.join(', ') : '';
      } catch (e) {}

      setForm({
        skills: skillsStr,
        linkedin_url: st.linkedin_url || '',
        github_url: st.github_url || '',
        portfolio_url: st.portfolio_url || '',
        phone: st.phone || '',
      });
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user?.studentId) return;

    setSaving(true);
    try {
      const skillsArray = form.skills.split(',').map(s => s.trim()).filter(Boolean);
      await apiClient.put(`/students/${user.studentId}/profile`, {
        ...form,
        skills: skillsArray,
      });
      alert('Profile details updated successfully!');
      fetchProfile();
    } catch (err) {
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner text="Retrieving student profile and verified records..." />;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-foreground">Student Placement Profile & Credentials</h1>
        <p className="text-xs text-muted-foreground">Official student identity, verified semester marks, and verified technical skill portfolio.</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 shadow-xs space-y-6">
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-border gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#171717] text-[#fafafa] dark:bg-[#fafafa] dark:text-[#0a0a0a] font-bold text-xl flex items-center justify-center shadow-xs">
              {user?.firstName?.[0] || 'S'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{user?.firstName} {user?.lastName}</h2>
              <p className="text-xs text-muted-foreground font-mono">Reg No: {user?.registerNumber} • Department: {user?.departmentCode}</p>
            </div>
          </div>
          <div>
            <StatusBadge status={profile?.placement_status || 'REGISTERED'} />
          </div>
        </div>

        {/* Readonly Academic Data from Master DB */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-secondary rounded-xl border border-border text-xs">
          <div>
            <span className="text-muted-foreground font-medium">Programme & Batch:</span>
            <p className="font-bold text-foreground">{profile?.programme || 'B.Tech'} ({profile?.batch || '2023-2027'})</p>
          </div>
          <div>
            <span className="text-muted-foreground font-medium">Cumulative CGPA:</span>
            <p className="font-extrabold text-foreground text-sm">{profile?.cgpa || '8.50'}</p>
          </div>
          <div>
            <span className="text-muted-foreground font-medium">Active Backlogs:</span>
            <p className="font-bold text-foreground">
              {profile?.active_backlogs || 0} (No History)
            </p>
          </div>
          <div>
            <span className="text-muted-foreground font-medium">AI Readiness Score:</span>
            <p className="font-extrabold text-foreground">{profile?.placement_readiness_score || 80}/100</p>
          </div>
        </div>

        {/* Skill Analyzer Integration Card */}
        <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-foreground text-xs">Skill Analyzer & Career Fitment</p>
              <p className="text-[11px] text-muted-foreground">Select interactive technologies, take 3-minute quizzes, and discover matching IT career roles with personalized roadmaps.</p>
            </div>
          </div>
          <Link
            to="/skill-analyzer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shrink-0 shadow-xs transition-transform active:scale-95"
          >
            <span>Open Skill Analyzer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Editable Student Details Form */}
        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-foreground mb-1">Technical Skills (Comma separated)</label>
            <input
              type="text"
              value={form.skills}
              onChange={(e) => setForm({ ...form, skills: e.target.value })}
              className="w-full p-2.5 border border-border bg-background text-foreground rounded-lg"
              placeholder="e.g. React, Node.js, Python, SQL, Docker, Machine Learning"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-foreground mb-1">LinkedIn Profile URL</label>
              <input
                type="url"
                value={form.linkedin_url}
                onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
                className="w-full p-2.5 border border-border bg-background text-foreground rounded-lg"
                placeholder="https://linkedin.com/in/username"
              />
            </div>
            <div>
              <label className="block font-semibold text-foreground mb-1">GitHub Profile URL</label>
              <input
                type="url"
                value={form.github_url}
                onChange={(e) => setForm({ ...form, github_url: e.target.value })}
                className="w-full p-2.5 border border-border bg-background text-foreground rounded-lg"
                placeholder="https://github.com/username"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-foreground mb-1">Portfolio / Personal Website</label>
              <input
                type="url"
                value={form.portfolio_url}
                onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })}
                className="w-full p-2.5 border border-border bg-background text-foreground rounded-lg"
                placeholder="https://myportfolio.dev"
              />
            </div>
            <div>
              <label className="block font-semibold text-foreground mb-1">Contact Phone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full p-2.5 border border-border bg-background text-foreground rounded-lg"
                placeholder="+91 9876543210"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#171717] hover:bg-[#262626] text-[#fafafa] dark:bg-[#fafafa] dark:hover:bg-[#e5e5e5] dark:text-[#0a0a0a] font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving Profile...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
