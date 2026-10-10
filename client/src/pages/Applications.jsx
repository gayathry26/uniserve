import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { FileCheck2, Filter, Award, XCircle, CheckCircle, ArrowRight } from 'lucide-react';

export function Applications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  // Offer release modal
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [offerCtc, setOfferCtc] = useState('');

  useEffect(() => {
    fetchApplications();
  }, [statusFilter, departmentFilter]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (departmentFilter !== 'ALL') params.department = departmentFilter;

      const res = await apiClient.get('/applications', { params });
      setApplications(res.data.data || []);
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (appId, status, nextRound = null) => {
    try {
      await apiClient.put(`/applications/${appId}/status`, {
        status,
        current_round_number: nextRound,
      });
      fetchApplications();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleReleaseOffer = async (e) => {
    e.preventDefault();
    if (!selectedApp || !offerCtc) return;

    try {
      await apiClient.post('/offers/issue', {
        application_id: selectedApp.id,
        offered_ctc_lpa: parseFloat(offerCtc),
      });
      setOfferModalOpen(false);
      fetchApplications();
      alert(`Offer letter for ₹${offerCtc} LPA issued to ${selectedApp.first_name}!`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to issue offer.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Recruitment Applications Pipeline</h1>
          <p className="text-xs text-slate-500">Track candidate progression from initial apply through shortlisting and final offers.</p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-700"
          >
            <option value="ALL">All Application Statuses</option>
            <option value="APPLIED">Applied</option>
            <option value="SHORTLISTED">Shortlisted</option>
            <option value="IN_PROCESS">In Process</option>
            <option value="OFFERED">Offered</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="REJECTED">Rejected</option>
          </select>

          {user?.roleName !== 'FACULTY_COORDINATOR' && (
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-700"
            >
              <option value="ALL">All Departments</option>
              <option value="CSE">CSE</option>
              <option value="ECE">ECE</option>
              <option value="EEE">EEE</option>
              <option value="MECH">MECH</option>
              <option value="CIVIL">CIVIL</option>
            </select>
          )}
        </div>

        <span className="text-xs text-slate-500">Showing {applications.length} candidates</span>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Loading candidate pipeline..." />
        ) : applications.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No applications match the current filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Dept & CGPA</th>
                  <th className="py-3 px-4">Company & Job</th>
                  <th className="py-3 px-4">Round</th>
                  <th className="py-3 px-4">Status</th>
                  {['TPO_OFFICER', 'ADMIN', 'RECRUITER'].includes(user?.roleName) && (
                    <th className="py-3 px-4 text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{app.first_name} {app.last_name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{app.register_number}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{app.department_code}</div>
                      <div className="text-[11px] text-blue-600 font-bold">CGPA: {app.cgpa}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{app.company_name}</div>
                      <div className="text-[11px] text-slate-500">{app.job_title} (₹{app.ctc_lpa} LPA)</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-medium">Round {app.current_round_number}</span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={app.status} />
                    </td>

                    {/* Recruiter / TPO Action buttons */}
                    {['TPO_OFFICER', 'ADMIN', 'RECRUITER'].includes(user?.roleName) && (
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {app.status === 'APPLIED' && (
                            <button
                              onClick={() => handleUpdateStatus(app.id, 'SHORTLISTED', 2)}
                              className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-[11px] cursor-pointer"
                            >
                              Shortlist
                            </button>
                          )}
                          {app.status === 'SHORTLISTED' && (
                            <button
                              onClick={() => handleUpdateStatus(app.id, 'IN_PROCESS', 3)}
                              className="px-2.5 py-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 font-semibold text-[11px] cursor-pointer"
                            >
                              Advance to Tech
                            </button>
                          )}
                          {['SHORTLISTED', 'IN_PROCESS'].includes(app.status) && (
                            <button
                              onClick={() => {
                                setSelectedApp(app);
                                setOfferCtc(app.ctc_lpa);
                                setOfferModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-[11px] cursor-pointer flex items-center gap-1"
                            >
                              <Award className="w-3 h-3" /> Offer
                            </button>
                          )}
                          {app.status !== 'REJECTED' && app.status !== 'OFFERED' && app.status !== 'ACCEPTED' && (
                            <button
                              onClick={() => handleUpdateStatus(app.id, 'REJECTED')}
                              className="px-2 py-1 rounded text-rose-600 hover:bg-rose-50 text-[11px] cursor-pointer"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Offer Release Modal */}
      <Modal isOpen={offerModalOpen} onClose={() => setOfferModalOpen(false)} title={`Issue Placement Offer to ${selectedApp?.first_name} ${selectedApp?.last_name}`}>
        <form onSubmit={handleReleaseOffer} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Company</label>
            <input type="text" readOnly value={selectedApp?.company_name || ''} className="w-full p-2 border bg-slate-50 rounded" />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Role</label>
            <input type="text" readOnly value={selectedApp?.job_title || ''} className="w-full p-2 border bg-slate-50 rounded" />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Offered CTC Package (LPA)</label>
            <input
              type="number"
              step="0.1"
              required
              value={offerCtc}
              onChange={(e) => setOfferCtc(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded font-bold text-emerald-600 text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setOfferModalOpen(false)} className="px-4 py-2 border rounded text-slate-600">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white font-bold rounded hover:bg-emerald-700">Release Offer Letter</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
