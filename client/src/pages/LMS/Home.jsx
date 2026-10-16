import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { apiFetch, clearSession, getSessionUser } from '../services/api';

const Home = ({ section = 'overview' }) => {
  const user = getSessionUser();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [index, setIndex] = useState(0);
  const [timer, setTimer] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user || (user.role !== 'student' && user.role !== 'admin')) navigate('/login');
  }, [navigate, user]);

  const loadDashboard = async () => {
    const data = await apiFetch('/api/student/quiz/subjects');
    setSubjects(data);
  };

  useEffect(() => {
    loadDashboard().catch((e) => setMessage(e.message));
  }, []);

  useEffect(() => {
    if (!timer || !attempt) return undefined;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer, attempt]);

  useEffect(() => {
    if (timer === 0 && attempt) {
      submitQuiz();
    }
  }, [timer]);

  const startQuiz = async (subject) => {
    const data = await apiFetch('/api/student/quiz/attempts/start', {
      method: 'POST',
      body: JSON.stringify({ subject, duration_minutes: 20 })
    });
    setAttempt(data);
    setAnswers({});
    setIndex(0);
    setTimer(data.durationMinutes * 60);
    navigate('/student/dashboard/test');
  };

  const saveProgress = async () => {
    if (!attempt) return;
    const payload = Object.entries(answers).map(([questionId, selectedOption]) => ({ questionId: Number(questionId), selectedOption }));
    await apiFetch('/api/student/quiz/attempts/save', {
      method: 'POST',
      body: JSON.stringify({ attemptId: attempt.attemptId, answers: payload })
    });
  };

  const submitQuiz = async () => {
    if (!attempt) return;
    const payload = attempt.questions.map((q) => ({ questionId: q.id, selectedOption: answers[q.id] || '' }));
    await apiFetch('/api/student/quiz/attempts/submit', {
      method: 'POST',
      body: JSON.stringify({ attemptId: attempt.attemptId, answers: payload })
    });
    setAttempt(null);
    setTimer(0);
    loadDashboard();
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const logout = () => {
    clearSession();
    navigate('/login');
  };

  return (
    <AppShell
      title="Student Quiz Portal"
      user={user}
      onLogout={logout}
      items={[
        { to: '/student/dashboard/overview', label: 'Dashboard' },
        { to: '/student/dashboard/profile', label: 'Profile' }
      ]}
    >
      {message && <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>}

      {section === 'overview' && (
        <div className="space-y-6">
          {/* Proctored Exam Card */}
          {subjects.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <h3 className="text-xl font-bold text-slate-500">No Exams Available</h3>
              <p className="mt-2 text-slate-400">There are currently no active exams assigned to you.</p>
            </div>
          ) : (
            subjects.map((subject, idx) => (
              <div key={idx} className="rounded-2xl border-2 border-brand-600 bg-neutral-100 dark:bg-neutral-900 border border-border text-foreground p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-black text-brand-700">{subject.test_name || 'ONLINE ASSESSMENT'}</h3>
                    <p className="mt-2 text-slate-600 font-medium">
                      {subject.technical_subjects 
                        ? `Aptitude & Technical (${subject.technical_subjects})` 
                        : 'Aptitude Assessment'} • {subject.duration_minutes || 90} Minutes
                    </p>
                    <div className="mt-3 flex gap-2">
                      <span className="px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-bold uppercase tracking-wider">{subject.phase1_name || 'Phase 1: Aptitude'}</span>
                      {subject.technical_subjects && (
                        <span className="px-3 py-1 rounded-full bg-secondary text-foreground text-xs font-bold uppercase tracking-wider">{subject.phase2_name || 'Phase 2: Technical'}</span>
                      )}
                      {subject.attempt_status === 'submitted' && (
                        <span className="px-3 py-1 rounded-full bg-secondary text-foreground text-xs font-bold uppercase tracking-wider">Completed</span>
                      )}
                    </div>
                  </div>
                  {subject.attempt_status === 'submitted' ? (
                    <div className="text-right">
                      <p className="text-foreground font-black text-lg">TEST OVER</p>
                      <p className="text-slate-400 text-xs font-medium">Results are under review.</p>
                    </div>
                  ) : (
                    <button
                      className="rounded-2xl bg-brand-600 px-8 py-4 text-base font-black text-white shadow-lg hover:bg-brand-700 hover:shadow-xl transition-all active:scale-95"
                      onClick={() => navigate('/student/exam', { state: { test_id: subject.test_id } })}
                    >
                      Start Exam
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {section === 'test' && (
        <div className="rounded-xl border bg-white p-4">
          {!attempt ? (
            <p className="text-sm text-slate-500">Start a quiz from Dashboard first.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded bg-slate-50 p-3">
                <p className="font-semibold">Time left: {formatTime(timer)}</p>
                <div className="space-x-2">
                  <button className="rounded border px-3 py-1" onClick={saveProgress}>Save</button>
                  <button className="rounded bg-brand-600 px-3 py-1 text-white" onClick={submitQuiz}>Submit</button>
                </div>
              </div>
              <div className="rounded border p-3">
                <p className="font-semibold">Q{index + 1}. {attempt.questions[index].question}</p>
                <div className="mt-3 space-y-2">
                  {['A', 'B', 'C', 'D'].map((o) => (
                    <label key={o} className="flex items-center gap-2 rounded border px-3 py-2">
                      <input type="radio" checked={answers[attempt.questions[index].id] === o} onChange={() => setAnswers((p) => ({ ...p, [attempt.questions[index].id]: o }))} />
                      <span>{o}. {attempt.questions[index][`option_${o.toLowerCase()}`]}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <button className="rounded border px-3 py-2" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>Previous</button>
                <div className="flex gap-1">
                  {attempt.questions.map((q, i) => (
                    <button key={q.id} className={`h-8 w-8 rounded text-xs ${answers[q.id] ? 'bg-secondary text-foreground' : 'bg-slate-200'}`} onClick={() => setIndex(i)}>{i + 1}</button>
                  ))}
                </div>
                <button className="rounded border px-3 py-2" disabled={index === attempt.questions.length - 1} onClick={() => setIndex((i) => i + 1)}>Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
};

export default Home;
