import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Building2, Globe, MapPin, Mail, Plus, Star } from 'lucide-react';

export function Companies() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tierFilter, setTierFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newCompany, setNewCompany] = useState({
    name: '',
    industry: 'Information Technology',
    tier: 'REGULAR',
    website: '',
    headquarters: '',
    contact_email: '',
    description: '',
  });

  useEffect(() => {
    fetchCompanies();
  }, [tierFilter, search]);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const params = {};
      if (tierFilter !== 'ALL') params.tier = tierFilter;
      if (search) params.search = search;

      const res = await apiClient.get('/companies', { params });
      setCompanies(res.data.data || []);
    } catch (err) {
      console.error('Failed to load companies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/companies', newCompany);
      setIsModalOpen(false);
      fetchCompanies();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create company.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Corporate Hiring Partners</h1>
          <p className="text-xs text-slate-500">Verified company accounts, recruitment tiers, and historical relations.</p>
        </div>

        {['TPO_OFFICER', 'ADMIN'].includes(user?.roleName) && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Register New Recruiter
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        <input
          type="text"
          placeholder="Search companies by name, industry, or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 max-w-sm w-full"
        />

        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-700"
        >
          <option value="ALL">All Hiring Tiers</option>
          <option value="SUPER_DREAM">Super Dream (&gt; 20 LPA)</option>
          <option value="DREAM">Dream (10 - 20 LPA)</option>
          <option value="REGULAR">Regular (&lt; 10 LPA)</option>
        </select>
      </div>

      {/* Company Cards Grid */}
      {loading ? (
        <LoadingSpinner text="Loading corporate recruitment profiles..." />
      ) : companies.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-xs text-slate-400">
          No corporate partners found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {companies.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-sm">
                    {c.name[0]}
                  </div>
                  <StatusBadge status={c.tier} />
                </div>

                <h3 className="font-bold text-base text-slate-900 mt-3">{c.name}</h3>
                <p className="text-xs text-slate-500 font-medium">{c.industry}</p>

                <p className="mt-3 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {c.description || 'Global industry leader participating in campus placement drives.'}
                </p>

                <div className="mt-4 space-y-1.5 text-[11px] text-slate-500">
                  {c.headquarters && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {c.headquarters}
                    </div>
                  )}
                  {c.website && (
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      <a href={c.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate">
                        {c.website}
                      </a>
                    </div>
                  )}
                  {c.contact_email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> {c.contact_email}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">{c.active_jobs_count || 0} Openings</span>
                <span className="flex items-center gap-1 text-amber-600 font-bold">
                  <Star className="w-3.5 h-3.5 fill-current" /> {c.rating || '4.5'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Company Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register New Corporate Hiring Partner">
        <form onSubmit={handleCreateCompany} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Company Name</label>
            <input
              type="text"
              required
              value={newCompany.name}
              onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg"
              placeholder="e.g. Amazon Web Services"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Industry</label>
              <input
                type="text"
                required
                value={newCompany.industry}
                onChange={(e) => setNewCompany({ ...newCompany, industry: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Recruitment Tier</label>
              <select
                value={newCompany.tier}
                onChange={(e) => setNewCompany({ ...newCompany, tier: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg bg-white"
              >
                <option value="SUPER_DREAM">Super Dream (&gt; 20 LPA)</option>
                <option value="DREAM">Dream (10 - 20 LPA)</option>
                <option value="REGULAR">Regular (&lt; 10 LPA)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Website URL</label>
              <input
                type="url"
                value={newCompany.website}
                onChange={(e) => setNewCompany({ ...newCompany, website: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg"
                placeholder="https://company.com"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Recruiter Email</label>
              <input
                type="email"
                value={newCompany.contact_email}
                onChange={(e) => setNewCompany({ ...newCompany, contact_email: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg"
                placeholder="recruiting@company.com"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Company Overview</label>
            <textarea
              rows="3"
              value={newCompany.description}
              onChange={(e) => setNewCompany({ ...newCompany, description: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg"
            ></textarea>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-slate-600">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">Save Company</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
