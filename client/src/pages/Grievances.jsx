import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AlertCircle, CheckCircle2, MessageSquare, Plus } from 'lucide-react';

export function Grievances() {
  const { user } = useAuth();
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [ticketForm, setTicketForm] = useState({
    category: 'ELIGIBILITY',
    subject: '',
    description: '',
  });

  useEffect(() => {
    fetchGrievances();
  }, [user]);

  const fetchGrievances = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/grievances');
      setGrievances(res.data.data || []);
    } catch (err) {
      console.error('Failed to load grievances:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/grievances/file', ticketForm);
      setIsModalOpen(false);
      fetchGrievances();
      alert('Grievance ticket submitted to placement committee.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to file ticket.');
    }
  };

  const handleResolveTicket = async (ticketId) => {
    const notes = prompt('Enter resolution notes / committee action taken:');
    if (!notes) return;
    try {
      await apiClient.put(`/grievances/${ticketId}/resolve`, {
        status: 'RESOLVED',
        resolution_notes: notes,
      });
      fetchGrievances();
      alert('Grievance ticket marked resolved.');
    } catch (err) {
      alert('Failed to resolve ticket');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Placement Grievances & Support Desk</h1>
          <p className="text-xs text-slate-500">Confidential dispute resolution, policy clarification appeals, and assessment support.</p>
        </div>

        {user?.roleName === 'STUDENT' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> File Placement Grievance Ticket
          </button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner text="Retrieving placement grievances..." />
      ) : grievances.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-xs text-slate-400">
          No grievance tickets recorded. All operations nominal.
        </div>
      ) : (
        <div className="space-y-4">
          {grievances.map((g) => (
            <div key={g.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-600">{g.ticket_number}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {g.category}
                    </span>
                    <StatusBadge status={g.status} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{g.subject}</h3>
                  <p className="text-xs text-slate-400">Filed by: {g.first_name} {g.last_name} ({g.register_number}) • {g.created_at?.split('T')[0]}</p>
                </div>

                {['TPO_OFFICER', 'ADMIN'].includes(user?.roleName) && g.status === 'OPEN' && (
                  <button
                    onClick={() => handleResolveTicket(g.id)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Resolve Ticket
                  </button>
                )}
              </div>

              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                {g.description}
              </p>

              {g.resolution_notes && (
                <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-100 text-xs">
                  <span className="font-bold text-emerald-900 block mb-0.5">Placement Committee Resolution:</span>
                  <p className="text-emerald-800 italic">{g.resolution_notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* File Ticket Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="File Placement Support / Grievance Ticket">
        <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Dispute / Inquiry Category</label>
            <select
              value={ticketForm.category}
              onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded bg-white"
            >
              <option value="ELIGIBILITY">Eligibility Calculation Discrepancy</option>
              <option value="INTERVIEW_DISPUTE">Interview Slot Conflict / Technical Glitch</option>
              <option value="OFFER_CONFLICT">Multiple Offer Policy Clarification</option>
              <option value="ASSESSMENT_ISSUE">Online Coding Assessment Platform Dispute</option>
              <option value="GENERAL">General Career Guidance Request</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Subject</label>
            <input
              type="text"
              required
              placeholder="e.g. Backlog cleared but drive status marked ineligible"
              value={ticketForm.subject}
              onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Comprehensive Description</label>
            <textarea
              rows="4"
              required
              placeholder="Provide complete context, job posting title, and reference dates..."
              value={ticketForm.description}
              onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded"
            ></textarea>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-rose-600 text-white font-semibold rounded hover:bg-rose-700">Submit Ticket</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
