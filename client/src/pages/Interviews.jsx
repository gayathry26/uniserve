import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { CalendarCheck, Clock, Video, User, Star, Plus, Sparkles, ArrowRight } from 'lucide-react';

export function Interviews() {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);

  const role = user?.roleName || user?.role_name;
  const canCreateMock = ['TPO_OFFICER', 'ADMIN', 'SUPER_ADMIN', 'FACULTY_COORDINATOR', 'STAFF'].includes(role);

  const [feedback, setFeedback] = useState({
    rating: 4.0,
    feedback: '',
    decision: 'RECOMMENDED',
  });

  useEffect(() => {
    fetchInterviews();
  }, [user]);

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/interviews');
      setInterviews(res.data.data || []);
    } catch (err) {
      console.error('Failed to load interviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEvaluation = async (e) => {
    e.preventDefault();
    if (!selectedInterview) return;

    try {
      await apiClient.put(`/interviews/${selectedInterview.id}/feedback`, feedback);
      setEvalModalOpen(false);
      fetchInterviews();
      alert('Interview evaluation submitted successfully!');
    } catch (err) {
      alert('Failed to submit evaluation');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Technical & HR Interview Schedules</h1>
          <p className="text-xs text-slate-500">Panel slot coordination, virtual meeting links, and candidate rating evaluations.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/videocall/interview"
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer transition-transform active:scale-95"
          >
            <Video className="w-4 h-4" />
            <span>Launch Mock Interview Room</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* WebRTC Video Call Feature Banner */}
      <div className="p-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl text-white border border-blue-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0">
            <Sparkles className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <span>WebRTC & Socket.io Live Interview Meet System Active</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                P2P Ready
              </span>
            </h3>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Staff and Placement coordinators can schedule rounds, admit candidates, share coding screens, and grade candidates directly.
            </p>
          </div>
        </div>

        <Link
          to="/videocall/interview"
          className="px-3.5 py-1.5 bg-blue-500 hover:bg-blue-400 text-slate-950 rounded-xl text-xs font-bold shrink-0 transition-colors"
        >
          Open Meet Console
        </Link>
      </div>

      {loading ? (
        <LoadingSpinner text="Retrieving interview schedule..." />
      ) : interviews.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-xs text-slate-400 space-y-3">
          <p>No scheduled company interviews found.</p>
          <Link
            to="/videocall/interview"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700"
          >
            <Video className="w-4 h-4" /> Start Mock Interview
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {interviews.map((iv) => {
            const meetingCode = iv.meeting_link_or_room || 'gen-meet-x94';
            return (
              <div key={iv.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{iv.job_title}</h3>
                    <p className="text-xs text-slate-500">{iv.company_name} • Candidate: {iv.first_name} {iv.last_name}</p>
                  </div>
                  <StatusBadge status={iv.status} />
                </div>

                <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1.5 border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Slot: <strong className="font-mono">{iv.scheduled_slot}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Video className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Meeting Room: <strong className="font-mono text-emerald-700">{meetingCode}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <User className="w-3.5 h-3.5 text-purple-600" />
                    <span>Panel: {iv.interviewer_name}</span>
                  </div>
                </div>

                {iv.feedback && (
                  <div className="p-2.5 bg-blue-50/60 rounded border border-blue-100 text-xs">
                    <div className="flex items-center justify-between text-blue-900 font-bold mb-1">
                      <span>Evaluator Feedback:</span>
                      <span className="flex items-center gap-1 text-amber-600">
                        <Star className="w-3 h-3 fill-current" /> {iv.rating}/5.0
                      </span>
                    </div>
                    <p className="text-slate-600 italic">"{iv.feedback}"</p>
                    <div className="mt-1 font-semibold text-[11px] text-blue-700">Decision: {iv.decision}</div>
                  </div>
                )}

                {/* Actions: Join Call & Evaluate */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Link
                    to={`/interview/room/${meetingCode}`}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Join Video Call</span>
                  </Link>

                  {['TPO_OFFICER', 'ADMIN', 'SUPER_ADMIN', 'FACULTY_COORDINATOR', 'STAFF', 'RECRUITER'].includes(role) && iv.status !== 'COMPLETED' && (
                    <button
                      onClick={() => {
                        setSelectedInterview(iv);
                        setEvalModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 cursor-pointer"
                    >
                      Submit Evaluation
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Evaluation Modal */}
      <Modal isOpen={evalModalOpen} onClose={() => setEvalModalOpen(false)} title="Candidate Interview Evaluation Form">
        <form onSubmit={handleSubmitEvaluation} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Technical Rating (1.0 to 5.0)</label>
            <input
              type="number"
              step="0.1"
              min="1"
              max="5"
              required
              value={feedback.rating}
              onChange={(e) => setFeedback({ ...feedback, rating: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Recommendation Decision</label>
            <select
              value={feedback.decision}
              onChange={(e) => setFeedback({ ...feedback, decision: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded bg-white"
            >
              <option value="RECOMMENDED">RECOMMENDED (Advance to next round/offer)</option>
              <option value="ON_HOLD">ON HOLD (Waitlist)</option>
              <option value="NOT_RECOMMENDED">NOT RECOMMENDED (Reject)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Detailed Panel Remarks & Feedback</label>
            <textarea
              rows="3"
              required
              placeholder="Candidate demonstrated strong knowledge of system design..."
              value={feedback.feedback}
              onChange={(e) => setFeedback({ ...feedback, feedback: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded"
            ></textarea>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setEvalModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700">Submit Score</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
