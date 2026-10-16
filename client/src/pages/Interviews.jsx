import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Clock, Video, User, Star, Sparkles, ArrowRight } from 'lucide-react';

export function Interviews() {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);

  const role = user?.roleName || user?.role_name;

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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Technical & HR Interview Schedules
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Panel slot coordination, virtual meeting links, and candidate rating evaluations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/videocall/interview"
            className="px-4 py-2.5 bg-primary text-primary-foreground hover:opacity-90 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-transform active:scale-95"
          >
            <Video className="w-4 h-4" />
            <span>Launch Mock Interview Room</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* WebRTC Video Call Feature Banner */}
      <div className="p-5 bg-card border border-border rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-secondary text-foreground border border-border flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <span>WebRTC & Socket.io Live Interview Meet System Active</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary text-foreground border border-border">
                P2P Ready
              </span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Staff and Placement coordinators can schedule rounds, admit candidates, share coding screens, and grade candidates directly.
            </p>
          </div>
        </div>

        <Link
          to="/videocall/interview"
          className="px-4 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-xl text-xs font-bold shrink-0 transition-opacity shadow-xs"
        >
          Open Meet Console
        </Link>
      </div>

      {loading ? (
        <LoadingSpinner text="Retrieving interview schedule..." />
      ) : interviews.length === 0 ? (
        /* Empty State */
        <div className="bg-card rounded-2xl border border-border p-10 sm:p-14 text-center shadow-xs flex flex-col items-center justify-center space-y-4 max-w-2xl mx-auto my-6">
          <div className="w-14 h-14 rounded-2xl bg-secondary border border-border flex items-center justify-center text-foreground">
            <Video className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground">No Scheduled Interviews</h3>
            <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
              You currently have no scheduled technical or HR interview rounds lined up. You can practice in our live WebRTC coding and video simulation room.
            </p>
          </div>
          <Link
            to="/videocall/interview"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground hover:opacity-90 rounded-xl text-xs font-bold shadow-xs transition-transform active:scale-95"
          >
            <Video className="w-4 h-4" />
            <span>Start Mock Interview</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {interviews.map((iv) => {
            const meetingCode = iv.meeting_link_or_room || 'gen-meet-x94';
            return (
              <div key={iv.id} className="bg-card rounded-xl border border-border p-5 shadow-xs space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-foreground text-sm">{iv.job_title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {iv.company_name} • Candidate: {iv.first_name} {iv.last_name}
                    </p>
                  </div>
                  <StatusBadge status={iv.status} />
                </div>

                <div className="p-3 bg-secondary rounded-lg text-xs space-y-1.5 border border-border">
                  <div className="flex items-center gap-2 text-foreground">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Slot: <strong className="font-mono">{iv.scheduled_slot}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <Video className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Meeting Room: <strong className="font-mono">{meetingCode}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Panel: {iv.interviewer_name}</span>
                  </div>
                </div>

                {iv.feedback && (
                  <div className="p-2.5 bg-secondary rounded border border-border text-xs">
                    <div className="flex items-center justify-between text-foreground font-bold mb-1">
                      <span>Evaluator Feedback:</span>
                      <span className="flex items-center gap-1 text-foreground">
                        <Star className="w-3 h-3 fill-current" /> {iv.rating}/5.0
                      </span>
                    </div>
                    <p className="text-muted-foreground italic">"{iv.feedback}"</p>
                    <div className="mt-1 font-semibold text-[11px] text-foreground">Decision: {iv.decision}</div>
                  </div>
                )}

                {/* Actions: Join Call & Evaluate */}
                <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                  <Link
                    to={`/interview/room/${meetingCode}`}
                    className="px-3.5 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-opacity shadow-xs"
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
                      className="px-3.5 py-2 bg-secondary text-foreground hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-border rounded-lg text-xs font-semibold cursor-pointer transition-colors"
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
            <label className="block font-semibold text-foreground mb-1">Technical Rating (1.0 to 5.0)</label>
            <input
              type="number"
              step="0.1"
              min="1"
              max="5"
              required
              value={feedback.rating}
              onChange={(e) => setFeedback({ ...feedback, rating: e.target.value })}
              className="w-full p-2.5 border border-border rounded-lg bg-background text-foreground"
            />
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Recommendation Decision</label>
            <select
              value={feedback.decision}
              onChange={(e) => setFeedback({ ...feedback, decision: e.target.value })}
              className="w-full p-2.5 border border-border rounded-lg bg-background text-foreground font-medium"
            >
              <option value="RECOMMENDED">RECOMMENDED (Advance to next round/offer)</option>
              <option value="ON_HOLD">ON HOLD (Waitlist)</option>
              <option value="NOT_RECOMMENDED">NOT RECOMMENDED (Reject)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Detailed Panel Remarks & Feedback</label>
            <textarea
              rows="3"
              required
              placeholder="Candidate demonstrated strong knowledge of system design..."
              value={feedback.feedback}
              onChange={(e) => setFeedback({ ...feedback, feedback: e.target.value })}
              className="w-full p-2.5 border border-border rounded-lg bg-background text-foreground"
            ></textarea>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => setEvalModalOpen(false)}
              className="px-4 py-2 border border-border rounded-lg bg-secondary text-foreground font-medium hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground hover:opacity-90 font-semibold rounded-lg transition-opacity"
            >
              Submit Score
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
