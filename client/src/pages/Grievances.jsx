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
          <h1 className="text-xl font-bold text-foreground">Placement Grievances & Support Desk</h1>
          <p className="text-xs text-muted-foreground">Confidential dispute resolution, policy clarification appeals, and assessment support.</p>
        </div>

        {user?.roleName === 'STUDENT' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-neutral-800 text-white dark:bg-neutral-200 dark:text-black hover:bg-primary text-primary-foreground rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> File Placement Grievance Ticket
          </button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner text="Retrieving placement grievances..." />
      ) : grievances.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-border text-xs text-muted-foreground">
          No grievance tickets recorded. All operations nominal.
        </div>
      ) : (
        <div className="space-y-4">
          {grievances.map((g) => (
            <div key={g.id} className="bg-white rounded-xl border border-border p-5 shadow-xs space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-foreground">{g.ticket_number}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-secondary text-foreground">
                      {g.category}
                    </span>
                    <StatusBadge status={g.status} />
                  </div>
                  <h3 className="text-base font-bold text-foreground mt-1">{g.subject}</h3>
                  <p className="text-xs text-muted-foreground">Filed by: {g.first_name} {g.last_name} ({g.register_number}) • {g.created_at?.split('T')[0]}</p>
                </div>

                {['TPO_OFFICER', 'ADMIN'].includes(user?.roleName) && g.status === 'OPEN' && (
                  <button
                    onClick={() => handleResolveTicket(g.id)}
                    className="px-3 py-1.5 bg-[#171717] hover:bg-[#262626] text-[#fafafa] dark:bg-[#fafafa] dark:hover:bg-[#e5e5e5] dark:text-[#0a0a0a] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Resolve Ticket
                  </button>
                )}
              </div>

              <p className="text-xs text-muted-foreground bg-secondary p-3 rounded-lg border border-border leading-relaxed">
                {g.description}
              </p>

              {g.resolution_notes && (
                <div className="p-3 bg-secondary rounded-lg border border-border text-xs">
                  <span className="font-bold text-foreground block mb-0.5">Placement Committee Resolution:</span>
                  <p className="text-foreground italic">{g.resolution_notes}</p>
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
            <label className="block font-semibold text-foreground mb-1">Dispute / Inquiry Category</label>
            <select
              value={ticketForm.category}
              onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
              className="w-full p-2 border border-border rounded bg-white"
            >
              <option value="ELIGIBILITY">Eligibility Calculation Discrepancy</option>
              <option value="INTERVIEW_DISPUTE">Interview Slot Conflict / Technical Glitch</option>
              <option value="OFFER_CONFLICT">Multiple Offer Policy Clarification</option>
              <option value="ASSESSMENT_ISSUE">Online Coding Assessment Platform Dispute</option>
              <option value="GENERAL">General Career Guidance Request</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Subject</label>
            <input
              type="text"
              required
              placeholder="e.g. Backlog cleared but drive status marked ineligible"
              value={ticketForm.subject}
              onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
              className="w-full p-2 border border-border rounded"
            />
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Comprehensive Description</label>
            <textarea
              rows="4"
              required
              placeholder="Provide complete context, job posting title, and reference dates..."
              value={ticketForm.description}
              onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
              className="w-full p-2 border border-border rounded"
            ></textarea>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded hover:bg-neutral-800 text-white dark:bg-neutral-200 dark:text-black">Submit Ticket</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
