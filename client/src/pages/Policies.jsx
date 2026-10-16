import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { FileText, ShieldAlert, Award, CheckCircle2, Plus } from 'lucide-react';

export function Policies() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState([]);
  const [overrides, setOverrides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [waiverModalOpen, setWaiverModalOpen] = useState(false);

  const [waiverForm, setWaiverForm] = useState({
    register_number: '2023MECH001',
    job_id: 4,
    override_type: 'BACKLOG_WAIVER',
    reason: 'Cleared backlog in special revaluation; achieved 90% attendance in remedial bootcamp.',
  });

  useEffect(() => {
    fetchPoliciesAndOverrides();
  }, [user]);

  const fetchPoliciesAndOverrides = async () => {
    setLoading(true);
    try {
      const dept = user?.departmentCode || 'CSE';
      const [polRes, ovRes] = await Promise.all([
        apiClient.get('/policies'),
        apiClient.get(`/policies/overrides/${dept}`).catch(() => ({ data: { data: [] } })),
      ]);
      setPolicies(polRes.data.data || []);
      setOverrides(ovRes.data.data || []);
    } catch (err) {
      console.error('Failed to load policies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGrantWaiver = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/policies/grant-override', waiverForm);
      setWaiverModalOpen(false);
      fetchPoliciesAndOverrides();
      alert('Coordinator exception waiver recorded into Department Database!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to grant waiver.');
    }
  };

  const activePolicy = policies[0] || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Institutional Placement Policies & Rule Engine</h1>
          <p className="text-xs text-muted-foreground">Academic year regulations, offer limitations, and authorized department coordinator exceptions.</p>
        </div>

        {['FACULTY_COORDINATOR', 'TPO_OFFICER', 'ADMIN'].includes(user?.roleName) && (
          <button
            onClick={() => setWaiverModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#171717] hover:bg-[#262626] text-[#fafafa] dark:bg-[#fafafa] dark:hover:bg-[#e5e5e5] dark:text-[#0a0a0a] rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Grant Department Coordinator Waiver
          </button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner text="Retrieving placement policies and department waivers..." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Policy Rules Box */}
          <div className="lg:col-span-1 bg-white rounded-xl border border-border p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-foreground" />
              <h3 className="font-bold text-sm text-foreground">Institutional Policy Rules</h3>
            </div>

            <div className="space-y-3 text-xs text-muted-foreground">
              <div className="p-3 bg-secondary rounded-lg border border-border">
                <span className="font-semibold text-foreground block mb-0.5">Max Placement Offers Allowed</span>
                <span className="text-sm font-extrabold text-foreground">{activePolicy.max_offers_allowed || 2} Offers</span>
                <p className="text-[11px] text-muted-foreground mt-1">Students holding 2 regular offers may only apply for Dream or Super Dream drives.</p>
              </div>

              <div className="p-3 bg-secondary rounded-lg border border-border">
                <span className="font-semibold text-foreground block mb-0.5">Dream Role Package Threshold</span>
                <span className="text-sm font-extrabold text-foreground">₹{activePolicy.dream_offer_threshold_lpa || '10.00'} LPA</span>
                <p className="text-[11px] text-muted-foreground mt-1">Packages equal to or above this value qualify for institutional dream exemptions.</p>
              </div>

              <div className="p-3 bg-secondary rounded-lg border border-border">
                <span className="font-semibold text-foreground block mb-0.5">Mandatory Training Attendance</span>
                <span className="text-sm font-extrabold text-foreground">{activePolicy.attendance_mandate_percent || 75}%</span>
                <p className="text-[11px] text-muted-foreground mt-1">Students below attendance threshold require remedial completion before sitting for drives.</p>
              </div>
            </div>
          </div>

          {/* Department Overrides List */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-border p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-foreground">
                  Authorized Department Exceptions (`lms_{user?.departmentCode?.toLowerCase() || 'cse'}`)
                </h3>
                <p className="text-xs text-muted-foreground">Live overrides evaluated in real-time by the eligibility engine</p>
              </div>
              <span className="text-xs font-semibold bg-secondary text-foreground px-2.5 py-1 rounded-md border border-border">
                Department Isolation Active
              </span>
            </div>

            {overrides.length === 0 ? (
              <p className="text-xs text-muted-foreground py-8 text-center">No active exceptions granted in this department database.</p>
            ) : (
              <div className="space-y-3">
                {overrides.map((ov) => (
                  <div key={ov.id} className="p-3.5 bg-secondary rounded-xl border border-border text-xs space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-foreground font-mono">{ov.register_number}</span>
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-secondary text-foreground">
                        {ov.override_type}
                      </span>
                    </div>
                    <div className="text-muted-foreground font-medium">Job: {ov.job_title || `Job ID #${ov.job_id}`} ({ov.company_name || 'Campus Recruiter'})</div>
                    <p className="text-muted-foreground italic">"Reason: {ov.reason}"</p>
                    <div className="text-[10px] text-muted-foreground pt-1 border-t border-border">
                      Approved by: {ov.approved_by} • {ov.approved_at}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grant Waiver Modal */}
      <Modal isOpen={waiverModalOpen} onClose={() => setWaiverModalOpen(false)} title="Grant Department Coordinator Exception">
        <form onSubmit={handleGrantWaiver} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-foreground mb-1">Student Register Number</label>
            <input
              type="text"
              required
              value={waiverForm.register_number}
              onChange={(e) => setWaiverForm({ ...waiverForm, register_number: e.target.value })}
              className="w-full p-2 border border-border rounded font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Target Job Drive</label>
            <select
              value={waiverForm.job_id}
              onChange={(e) => setWaiverForm({ ...waiverForm, job_id: e.target.value })}
              className="w-full p-2 border border-border rounded bg-white"
            >
              <option value="1">Google India - Software Development Engineer</option>
              <option value="2">Microsoft India - Cloud Systems Engineer</option>
              <option value="3">TCS - Digital Systems Innovator</option>
              <option value="4">Larsen & Toubro - Core Graduate Trainee</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Exception / Waiver Type</label>
            <select
              value={waiverForm.override_type}
              onChange={(e) => setWaiverForm({ ...waiverForm, override_type: e.target.value })}
              className="w-full p-2 border border-border rounded bg-white"
            >
              <option value="BACKLOG_WAIVER">Backlog Waiver (Cleared in revaluation or special permission)</option>
              <option value="CGPA_WAIVER">CGPA Threshold Waiver (Marginal waiver with project distinction)</option>
              <option value="SPECIAL_PERMISSION">Special Institutional Discretion Permission</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Official Justification / Reason</label>
            <textarea
              rows="3"
              required
              value={waiverForm.reason}
              onChange={(e) => setWaiverForm({ ...waiverForm, reason: e.target.value })}
              className="w-full p-2 border border-border rounded"
              placeholder="State the academic justification for this exception..."
            ></textarea>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button type="button" onClick={() => setWaiverModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-[#171717] text-[#fafafa] dark:bg-[#fafafa] dark:text-[#0a0a0a] text-white font-bold rounded hover:bg-[#171717] text-[#fafafa] dark:bg-[#fafafa] dark:text-[#0a0a0a]">Persist Exception into Department DB</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
