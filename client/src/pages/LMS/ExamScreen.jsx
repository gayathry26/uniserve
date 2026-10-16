import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiFetch, getSessionUser } from '../services/api';
import { useProctor, ProctorHUD } from '../components/ExamProctor';
import CodeEditor, { extractCodeFromQuestion } from '../components/CodeEditor';
import ExamRules from './ExamRules';

const ExamScreen = ({
  initialPhase,
  autoStart = false,
  onExit,
  selectedTestId: propTestId
}) => {
  const { user: authUser } = useAuth();
  const sessionUser = getSessionUser();
  const user = authUser ? {
    ...authUser,
    id: authUser.id || 1,
    name: `${authUser.firstName || ''} ${authUser.lastName || ''}`.trim() || authUser.name || 'Candidate',
    roll_number: authUser.registerNumber || authUser.rollNumber || '2023CSE001',
    department: authUser.departmentCode || 'CSE',
    role: (authUser.roleName || 'STUDENT').toLowerCase()
  } : (sessionUser || { name: 'Student Candidate', roll_number: '2023CSE001', department: 'CSE', role: 'student' });

  const navigate = useNavigate();
  const location = useLocation();
  const selectedTestId = propTestId || location.state?.test_id;
  const [phase, setPhase] = useState(autoStart || initialPhase === 'exam' ? 'exam' : 'rules'); // rules | exam | techSelect | result
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState({});
  const [index, setIndex] = useState(0);
  const [examPhase, setExamPhase] = useState('phase1'); // phase1 (Aptitude) | phase2 (Technical MCQ) | phase3 (Coding)
  const [timer, setTimer] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [redirectTimer, setRedirectTimer] = useState(3);
  const [frozenExitTimer, setFrozenExitTimer] = useState(3);
  const [showInstructions, setShowInstructions] = useState(true); // Show on first load
  const [showPhaseConfirm, setShowPhaseConfirm] = useState(false);
  const [showTechPopup, setShowTechPopup] = useState(false);
  const [chosenTechSubject, setChosenTechSubject] = useState('');
  const [codingLanguages, setCodingLanguages] = useState({}); // { [questionId]: 'python' | 'java' }
  const autoSaveRef = useRef(null);

  const submitQuizRef = useRef(null);

  const proctor = useProctor({
    onAutoSubmit: (count) => submitQuizRef.current?.(count),
    enabled: phase === 'exam'
  });

  const submitQuiz = useCallback(async (violationCount) => {
    if (submitting) return;
    setSubmitting(true);

    // 1. Immediately disarm proctoring and stop tracks so no exit strikes fire
    try {
      if (proctor?.exitFullscreen) {
        proctor.exitFullscreen();
      }
    } catch (e) {}

    // 2. Clean up local backup immediately
    if (attempt?.attemptId) {
      try {
        localStorage.removeItem(`uniserve_exam_backup_${attempt.attemptId}`);
      } catch (e) {}
    }

    // 3. Post exam submission to backend (safely, network errors will not block exit)
    try {
      const payload = (attempt?.questions || []).map((q) => ({
        questionId: q.id,
        selectedOption: answers[q.id]?.selectedOption || '',
        codingResponse: answers[q.id]?.codingResponse || ''
      }));

      await apiFetch('/api/student/quiz/attempts/submit', {
        method: 'POST',
        body: JSON.stringify({
          attemptId: attempt?.attemptId,
          answers: payload,
          violations: violationCount ?? proctor?.violations ?? 0,
          ipAddress: proctor?.ipAddress,
          networkStats: proctor?.networkStats,
          attentionScore: proctor?.attentionScore,
          attentionHistory: proctor?.attentionHistory
        })
      }).catch(() => {});

      if (proctor?.eventLog && proctor.eventLog.length > 0) {
        apiFetch('/api/student/quiz/attempts/proctor-log', {
          method: 'POST',
          body: JSON.stringify({ attemptId: attempt?.attemptId, events: proctor.eventLog, sessionId: proctor.sessionId })
        }).catch(() => {});
      }
    } catch (err) {
      console.warn('Exam submit sync notice:', err);
    }

    // 4. Force release native fullscreen
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen().catch(() => {});
      }
    } catch (e) {}

    if (window.lockdownBrowser) {
      try { window.lockdownBrowser.endExam(); } catch (e) {}
    }

    setAttempt(null);
    setTimer(0);
    setSubmitting(false);

    // 5. IMMEDIATELY EXIT THE PORTAL TO ASSESSMENT HUB
    if (onExit) {
      onExit();
    } else {
      navigate('/assessment');
    }
  }, [attempt, answers, submitting, proctor, onExit, navigate]);

  useEffect(() => {
    submitQuizRef.current = submitQuiz;
  }, [submitQuiz]);

  const handleAnswer = (qid, data) => {
    setAnswers(prev => ({
      ...prev,
      [qid]: { ...prev[qid], ...data }
    }));
  };

  useEffect(() => {
    apiFetch('/api/student/quiz/subjects')
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setSubjects(data);
        } else {
          setSubjects([
            { id: 1, test_id: 1, name: 'National Campus CodeSprint 2026-27', subject: 'DSA', question_count: 25, duration_minutes: 60 }
          ]);
        }
      })
      .catch(() => {
        setSubjects([
          { id: 1, test_id: 1, name: 'National Campus CodeSprint 2026-27', subject: 'DSA', question_count: 25, duration_minutes: 60 }
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Timer countdown — 3-phase auto-transition
  useEffect(() => {
    if (!timer || phase !== 'exam') return;
    const id = setInterval(() => setTimer((t) => {
      if (t <= 1) {
        if (examPhase === 'phase1') {
          // Phase 1 ended → show tech selection popup
          setShowPhaseConfirm(true);
          return 0;
        }
        if (examPhase === 'phase2') {
          const codeDur = attempt?.codingDuration || 60;
          if (codeDur > 0) {
            setExamPhase('phase3');
            setTimer(codeDur * 60);
            setIndex(0);
            return codeDur * 60;
          }
        }
        submitQuiz();
        return 0;
      }
      return t - 1;
    }), 1000);
    return () => clearInterval(id);
  }, [timer, phase, examPhase, attempt]);

  // Auto-redirect after completion
  useEffect(() => {
    if (phase !== 'result') return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    const id = setInterval(() => {
      setRedirectTimer(t => {
        if (t <= 1) {
          clearInterval(id);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase === 'result' && redirectTimer === 0) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      if (window.lockdownBrowser) window.lockdownBrowser.endExam();
      else if (onExit) onExit();
      else navigate('/assessment');
    }
  }, [phase, redirectTimer, onExit, navigate]);

  // Auto-exit if exam is frozen / terminated due to strikes
  useEffect(() => {
    if (!proctor.frozen) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    const id = setInterval(() => {
      setFrozenExitTimer(t => {
        if (t <= 1) {
          clearInterval(id);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [proctor.frozen]);

  useEffect(() => {
    if (proctor.frozen && frozenExitTimer === 0) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      if (onExit) onExit();
      else navigate('/assessment');
    }
  }, [proctor.frozen, frozenExitTimer, onExit, navigate]);

  // Auto-save every 30s
  useEffect(() => {
    if (phase !== 'exam' || !attempt) return;
    autoSaveRef.current = setInterval(async () => {
      const payload = Object.entries(answers).map(([qId, opt]) => ({
        questionId: Number(qId), selectedOption: opt?.selectedOption || opt, codingResponse: opt?.codingResponse || ''
      }));
      await apiFetch('/api/student/quiz/attempts/save', {
        method: 'POST',
        body: JSON.stringify({ attemptId: attempt.attemptId, answers: payload })
      }).catch(() => { });

      if (proctor.eventLog.length > 0) {
        await apiFetch('/api/student/quiz/attempts/proctor-log', {
          method: 'POST',
          body: JSON.stringify({ attemptId: attempt.attemptId, events: proctor.eventLog, sessionId: proctor.sessionId })
        }).catch(() => { });
      }
    }, 30000);
    return () => clearInterval(autoSaveRef.current);
  }, [phase, attempt, answers]);

  // Safety check: if currentQuestions is empty, auto-transition
  useEffect(() => {
    if (phase !== 'exam' || !attempt) return;
    const qs = Array.isArray(attempt.questions) ? attempt.questions : [];
    const p1 = qs.slice(0, attempt.phaseBreak || 0);
    const p2Break = attempt.phase2Break || attempt.phaseBreak || 0;
    const p2All = qs.slice(attempt.phaseBreak || 0, p2Break);
    const p2 = chosenTechSubject ? p2All.filter(q => (q.subject || '').toLowerCase() === chosenTechSubject.toLowerCase()) : p2All;
    const p3 = qs.slice(p2Break);
    const curMap = { phase1: p1, phase2: p2, phase3: p3 };
    const curQs = curMap[examPhase] || [];
    if (curQs.length === 0 && examPhase === 'phase1') {
      setShowPhaseConfirm(true);
    }
  }, [attempt, examPhase, phase]);

  const activeTest = subjects.find(s => s.test_id === selectedTestId) || subjects[0];

  const startExam = async (chosenTech) => {
    try {
      setLoading(true);
      if (window.lockdownBrowser) {
        await window.lockdownBrowser.startExam();
      }
      proctor.enterFullscreen();

      const testSubject = activeTest?.subject || 'DSA';
      let data = null;
      try {
        data = await apiFetch('/api/student/quiz/attempts/start', {
          method: 'POST',
          body: JSON.stringify({
            subject: testSubject,
            duration_minutes: 60
          })
        });
      } catch (e) {
        data = null;
      }

      if (!data || !Array.isArray(data.questions) || data.questions.length === 0) {
        data = {
          attemptId: Math.floor(Math.random() * 1000) + 1,
          aptitudeDuration: 45,
          durationMinutes: 45,
          phaseBreak: 15,
          phase2Break: 25,
          questions: [
            {
              id: 1,
              question: 'In a binary search algorithm on a sorted array of size N, what is the worst-case number of comparisons required to find an element?',
              subject: 'DSA & Algorithms',
              question_type: 'mcq',
              option_a: 'O(1)',
              option_b: 'O(log2 N)',
              option_c: 'O(N)',
              option_d: 'O(N log2 N)',
              correct_option: 'B'
            },
            {
              id: 2,
              question: 'Which of the following data structures operates on the First-In, First-Out (FIFO) principle and is optimal for Level-Order tree traversal?',
              subject: 'Data Structures',
              question_type: 'mcq',
              option_a: 'Stack',
              option_b: 'Priority Queue',
              option_c: 'Queue',
              option_d: 'Binary Heap',
              correct_option: 'C'
            },
            {
              id: 3,
              question: 'What is the auxiliary space complexity of an in-place QuickSort algorithm implemented with recursive partitioning in the average case?',
              subject: 'Algorithms',
              question_type: 'mcq',
              option_a: 'O(1)',
              option_b: 'O(log N)',
              option_c: 'O(N)',
              option_d: 'O(N^2)',
              correct_option: 'B'
            },
            {
              id: 4,
              question: 'Two Sum Target Problem:\nGiven an array of integers nums and an integer target, write a function that returns the indices of the two numbers that add up to target.\n\n```python\ndef solve(nums, target):\n    # Write your solution here\n    lookup = {}\n    for i, num in enumerate(nums):\n        if target - num in lookup:\n            return [lookup[target - num], i]\n        lookup[num] = i\n    return []\n```',
              subject: 'Live Algorithmic Coding',
              question_type: 'coding',
              sample_input: 'nums = [2, 7, 11, 15], target = 9',
              sample_output: '[0, 1]'
            },
            {
              id: 5,
              question: 'Valid Parentheses Problem:\nGiven a string s containing just the characters "(", ")", "{", "}", "[" and "]", determine if the input string is valid.\n\n```python\ndef is_valid(s):\n    stack = []\n    mapping = {")": "(", "}": "{", "]": "["}\n    for char in s:\n        if char in mapping:\n            top = stack.pop() if stack else "#"\n            if mapping[char] != top:\n                return False\n        else:\n            stack.append(char)\n    return not stack\n```',
              subject: 'Live Algorithmic Coding',
              question_type: 'coding',
              sample_input: 's = "()[]{}"',
              sample_output: 'true'
            }
          ]
        };
      }

      // Restore local cache if available
      let savedAnswers = {};
      let savedMarked = {};
      try {
        const cached = localStorage.getItem(`uniserve_exam_backup_${data.attemptId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          savedAnswers = parsed.answers || {};
          savedMarked = parsed.marked || {};
        }
      } catch (e) {}

      setAttempt(data);
      setAnswers(savedAnswers);
      setMarked(savedMarked);
      setIndex(0);
      setChosenTechSubject(chosenTech || 'Python');
      setCodingLanguages({});
      setExamPhase('phase1');
      setTimer((data.aptitudeDuration || 45) * 60);
      setPhase('exam');
      proctor.enterFullscreen();
    } catch (err) {
      console.warn('startExam error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-start trigger when launched directly with autoStart={true}
  useEffect(() => {
    if ((autoStart || initialPhase === 'exam') && !attempt) {
      startExam();
    }
  }, [autoStart, initialPhase, attempt]);

  // Local storage answer persistence backup
  useEffect(() => {
    if (attempt && phase === 'exam') {
      try {
        localStorage.setItem(`uniserve_exam_backup_${attempt.attemptId}`, JSON.stringify({
          answers,
          marked,
          index,
          examPhase,
          timer,
          updatedAt: Date.now()
        }));
      } catch (e) {}
    }
  }, [answers, marked, index, examPhase, timer, attempt, phase]);

  const handleStartExamClick = () => {
    startExam();
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const timerColor = timer < 60 ? '#ef4444' : '#1e293b';
  const answered = attempt ? (attempt.questions || []).filter(q => answers[q.id]?.selectedOption || answers[q.id]?.codingResponse).length : 0;
  const total = attempt ? (attempt.questions || []).length : 0;
  const progress = total ? (answered / total) * 100 : 0;

  const allQuestions = attempt && Array.isArray(attempt.questions) ? attempt.questions : [];
  const pb1 = attempt?.phaseBreak || 0;
  const pb2 = attempt?.phase2Break || pb1;

  const phase1Questions = allQuestions.slice(0, pb1);

  // Phase 2: Technical MCQs — filter by chosen subject (Python or Java)
  const phase2AllMcqs = allQuestions.slice(pb1, pb2);
  const phase2Questions = chosenTechSubject
    ? phase2AllMcqs.filter(q => (q.subject || '').toLowerCase() === chosenTechSubject.toLowerCase())
    : phase2AllMcqs;

  // Phase 3: Coding questions
  const phase3Questions = allQuestions.slice(pb2);

  const currentQuestions = examPhase === 'phase1' ? phase1Questions
    : examPhase === 'phase2' ? phase2Questions
    : phase3Questions;

  const q = currentQuestions[index];

  // Pre-fill starter code if it's a coding/descriptive question and codingResponse is empty
  useEffect(() => {
    if (q && (q.question_type === 'coding' || (q.subject || '').toLowerCase().includes('vlsi') || (q.subject || '').toLowerCase().includes('iot'))) {
      setAnswers(prev => {
        if (!prev[q.id]?.codingResponse) {
          const { code } = extractCodeFromQuestion(q.question || '');
          if (code) {
            return {
              ...prev,
              [q.id]: {
                ...prev[q.id],
                codingResponse: code
              }
            };
          }
        }
        return prev;
      });
    }
  }, [q?.id]);

  // ─── RULES PHASE ───
  if (phase === 'rules') {
    if (loading) {
      return (
        <div style={styles.loadingScreen}>
          <div style={styles.spinner}></div>
          <p style={{ color: '#64748b', marginTop: 16, fontWeight: 600 }}>Loading exam environment...</p>
        </div>
      );
    }
    if (error) {
      return (
        <div style={styles.loadingScreen}>
          <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 24, border: '1px solid #e2e8f0', maxWidth: 450 }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg></div>
            <h2 style={{ color: '#0f172a', fontWeight: 800, marginBottom: 8 }}>System Error</h2>
            <p style={{ color: '#ef5350', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 24 }}>{error}</p>
            <button onClick={() => window.location.reload()} style={{ ...styles.doneBtn, background: '#1e293b', marginBottom: 12 }}>Retry Application</button>
            <button onClick={() => { if (document.fullscreenElement) { document.exitFullscreen().catch(() => {}); } if (onExit) onExit(); else navigate('/assessment'); }} style={styles.backBtn}>Back to Assessment Hub</button>
          </div>
        </div>
      );
    }
    if (!subjects || subjects.length === 0) {
      return (
        <div style={styles.loadingScreen}>
          <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 24, border: '1px solid #e2e8f0', maxWidth: 400 }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg></div>
            <h2 style={{ color: '#0f172a', fontWeight: 800, marginBottom: 8 }}>No Exams Available</h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 24 }}>
              There are no active examinations assigned to your department at this time. Please check back later or contact your administrator.
            </p>
            <button onClick={() => { if (document.fullscreenElement) { document.exitFullscreen().catch(() => {}); } if (onExit) onExit(); else navigate('/assessment'); }} style={{ ...styles.doneBtn, background: '#1e293b' }}>
              Back to Assessment Hub
            </button>
          </div>
        </div>
      );
    }

    return (
      <>
        <ExamRules
          subject={activeTest?.subject || 'Aptitude'}
          totalQuestions={(activeTest?.question_count || 40) + (activeTest?.tech_question_count || 0)}
          duration={activeTest?.duration_minutes || 90}
          onStartExam={handleStartExamClick}
          onGoBack={() => { if (document.fullscreenElement) { document.exitFullscreen().catch(() => {}); } if (onExit) onExit(); else navigate('/assessment'); }}
        />
      </>
    );
  }

  // ─── RESULT PHASE ───
  if (phase === 'result') {
    return (
      <div style={styles.resultScreen}>
        <div style={styles.resultCard}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ width: 64, height: 64, background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h1 style={{ color: '#0f172a', fontSize: '1.75rem', fontWeight: 800 }}>Test Completed!</h1>
            <p style={{ color: '#64748b', fontSize: '1rem', marginTop: 12, lineHeight: 1.6 }}>
              The results have been recorded and sent to the administrator.
            </p>
            <div style={{ marginTop: 20, padding: '10px 20px', background: '#f1f5f9', borderRadius: 12, display: 'inline-block' }}>
              <p style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 700 }}>
                Redirecting to Assessment Hub in <span style={{ color: '#1e293b' }}>{redirectTimer}s</span>...
              </p>
            </div>
          </div>

          <div style={{ padding: '20px', background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0', marginBottom: 20, textAlign: 'center' }}>
            <p style={{ color: '#1e293b', fontWeight: 700, fontSize: '0.9rem' }}>Candidate: {user?.name}</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Violations</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 900, color: proctor.violations > 0 ? '#ef4444' : '#22c55e' }}>{proctor.violations}</p>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 32 }}></div>

          {window.lockdownBrowser ? (
            <button onClick={() => window.lockdownBrowser.endExam()} style={{ ...styles.doneBtn, background: '#1e293b' }}>
              Exit Secure Browser
            </button>
          ) : (
            <button onClick={() => { if (document.fullscreenElement) { document.exitFullscreen().catch(() => {}); } if (onExit) onExit(); else navigate('/assessment'); }} style={styles.doneBtn}>
              Return to Assessment Hub
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─── ERROR HANDLING (GLOBAL) ───
  if (error && phase !== 'rules') {
    return (
      <div style={styles.loadingScreen}>
        <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 24, border: '1px solid #e2e8f0', maxWidth: 450 }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg></div>
          <h2 style={{ color: '#0f172a', fontWeight: 800, marginBottom: 8 }}>An Error Occurred</h2>
          <p style={{ color: '#ef5350', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 24 }}>{error}</p>
          <button onClick={() => setError('')} style={{ ...styles.doneBtn, background: '#1e293b', marginBottom: 12 }}>Dismiss & Continue</button>
          <button onClick={() => { if (document.fullscreenElement) { document.exitFullscreen().catch(() => {}); } if (onExit) onExit(); else navigate('/assessment'); }} style={styles.backBtn}>Exit to Assessment Hub</button>
        </div>
      </div>
    );
  }

  // ─── EXAM PHASE ───
  if (!attempt) {
    if (phase === 'exam') {
      return (
        <div style={styles.loadingScreen}>
          <div style={styles.spinner}></div>
          <p style={{ color: '#64748b', marginTop: 16, fontWeight: 600 }}>Preparing your exam paper...</p>
        </div>
      );
    }
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.spinner}></div>
        <p style={{ color: '#64748b', marginTop: 16 }}>Initializing session...</p>
      </div>
    );
  }



  const EXCLUDED_DEPTS = [
    'CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'BME', 'CCE', 'AIDS', 'AIML', 'AI&DS',
    'COMPUTER SCIENCE & ENGINEERING',
    'COMPUTER SCIENCE AND ENGINEERING',
    'INFORMATION TECHNOLOGY',
    'ELECTRONICS & COMMUNICATION ENGINEERING',
    'ELECTRONICS AND COMMUNICATION ENGINEERING',
    'ELECTRICAL & ELECTRONICS ENGINEERING',
    'ELECTRICAL AND ELECTRONICS ENGINEERING',
    'MECHANICAL ENGINEERING',
    'CIVIL ENGINEERING',
    'BIOMEDICAL ENGINEERING',
    'COMPUTER & COMMUNICATION ENGINEERING',
    'COMPUTER AND COMMUNICATION ENGINEERING',
    'ARTIFICIAL INTELLIGENCE & DATA SCIENCE',
    'ARTIFICIAL INTELLIGENCE AND DATA SCIENCE',
    'ARTIFICIAL INTELLIGENCE & MACHINE LEARNING',
    'ARTIFICIAL INTELLIGENCE AND MACHINE LEARNING'
  ];
  const techList = (subjects[0]?.technical_subjects || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .filter(tech => !EXCLUDED_DEPTS.includes(tech.toUpperCase()));

  if (examPhase === 'phase2' && !chosenTechSubject) {
    return (
      <div style={{
        minHeight: '100vh', background: '#f8fafc', display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: 16
      }}>
        <div style={{
          background: '#ffffff', width: '100%', maxWidth: 480,
          borderRadius: 24, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden', padding: 32, textAlign: 'center'
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '16px',
            background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', color: '#3b82f6'
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
          </div>

          <h2 style={{ color: '#0f172a', fontWeight: 900, fontSize: '1.4rem', letterSpacing: '-0.02em', margin: '0 0 8px 0' }}>
            Choose Technical Stream
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 28 }}>
            Select the programming language for your Phase 2 Technical MCQ questions. You will answer 30 MCQs in 40 minutes.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
            {(() => {
              const JS_USERS = ['711623104054', '711623118009', '711623118001', '711623118006', '711623118021'];
              const isJsUser = JS_USERS.includes(String(user?.roll_number));
              const options = isJsUser ? ['Javascript'] : ['Python', 'Java'];
              return options.map((tech) => {
                const isSelected = chosenTechSubject === tech;
                return (
                <button
                  key={tech}
                  onClick={() => setChosenTechSubject(tech)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px', borderRadius: '16px',
                    border: `2px solid ${isSelected ? '#3b82f6' : '#e2e8f0'}`,
                    background: isSelected ? '#f0f9ff' : '#ffffff',
                    color: isSelected ? '#0369a1' : '#334155',
                    fontWeight: 700, fontSize: '0.95rem',
                    cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: 32, height: 32, borderRadius: 8,
                      background: isSelected ? 'rgba(59, 130, 246, 0.1)' : '#f1f5f9',
                      color: isSelected ? '#3b82f6' : '#64748b',
                      transition: 'all 0.2s ease'
                    }}>
                      {tech === 'Python' ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                      ) : tech === 'Java' ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                      )}
                    </div>
                    <span>{tech}</span>
                  </div>
                  {isSelected && (
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                  )}
                </button>
              );
            })})()}
          </div>

          <button
            onClick={() => {
              if (chosenTechSubject) {
                setIndex(0);
                setTimer((attempt?.technicalDuration || 40) * 60);
              }
            }}
            disabled={!chosenTechSubject}
            style={{
              width: '100%', padding: '16px', borderRadius: 14,
              background: chosenTechSubject ? '#3b82f6' : '#94a3b8',
              color: '#fff', border: 'none', fontWeight: 800,
              fontSize: '1rem', cursor: chosenTechSubject ? 'pointer' : 'not-allowed',
              boxShadow: chosenTechSubject ? '0 4px 12px rgba(59, 130, 246, 0.25)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Start Technical MCQs →
          </button>
        </div>
      </div>
    );
  }



  if (!q) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.spinner}></div>
        <p style={{ color: '#64748b', marginTop: 16, fontWeight: 600 }}>
          {currentQuestions.length === 0 ? 'No questions in this phase. Skipping...' : 'Loading question...'}
        </p>
      </div>
    );
  }

  const isLastQuestion = index === (currentQuestions.length - 1);
  const isCoding = q?.question_type === 'coding' ||
    (q?.subject || '').toLowerCase().includes('vlsi') ||
    (q?.subject || '').toLowerCase().includes('iot');
  const { text: qText, code: qCode, language: qLang } = extractCodeFromQuestion(q?.question || '');

  const watermarkTextStr = `CAMPUSSCORP PROCTORED EXAM • ${user?.roll_number || 'STUDENT'} • ${user?.name || 'CANDIDATE'} • CONFIDENTIAL`;

  return (
    <div style={styles.examContainer}>
      {/* Security Watermark Overlay */}
      <div style={styles.watermarkOverlay}>
        {Array.from({ length: 120 }).map((_, i) => (
          <div key={i} style={styles.watermarkText}>{watermarkTextStr}</div>
        ))}
      </div>

      {/* Frozen Overlay */}
      {proctor.frozen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.94)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center', padding: 24, backdropFilter: 'blur(8px)' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#dc2626' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
          </div>
          <h2 style={{ color: '#ef4444', fontSize: '1.75rem', fontWeight: 900, marginBottom: 8 }}>EXAMINATION TERMINATED</h2>
          <p style={{ color: '#e2e8f0', fontSize: '1rem', maxWidth: 460, lineHeight: 1.6, marginBottom: 20 }}>
            Maximum allowed proctoring violations reached ({proctor.violations}/{proctor.maxViolations} Strikes).<br />Your session has been locked and automatically submitted for administrative review.
          </p>
          <div style={{ padding: '10px 24px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: 12, color: '#fca5a5', fontSize: '0.85rem', fontWeight: 700, marginBottom: 16 }}>
            Automatically exiting to Assessment Portal in {frozenExitTimer}s...
          </div>
          <button
            onClick={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
              }
              if (onExit) onExit();
              else navigate('/assessment');
            }}
            style={{
              padding: '12px 28px',
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
              transition: 'all 0.2s'
            }}
          >
            Exit to Assessment Now
          </button>
        </div>
      )}

      {/* Fullscreen Lost — Force Re-entry */}
      {proctor.fullscreenLost && !proctor.frozen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.96)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center', padding: 24, backdropFilter: 'blur(10px)' }}>
          <div style={{ width: 68, height: 68, borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#d97706' }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
          </div>
          <h2 style={{ color: '#f59e0b', fontSize: '1.75rem', fontWeight: 900, marginBottom: 8 }}>FULLSCREEN REQUIRED</h2>
          <p style={{ color: '#cbd5e1', fontSize: '0.95rem', maxWidth: 480, lineHeight: 1.6, marginBottom: 24 }}>
            Mandatory fullscreen mode is enforced during examinations. Exiting fullscreen mode triggers a proctoring violation.<br />
            <strong>Current Strikes: {proctor.violations} / {proctor.maxViolations}</strong>
          </p>
          <button
            onClick={() => proctor.forceFullscreen()}
            style={{ padding: '16px 48px', borderRadius: 14, background: '#2563eb', color: '#fff', fontWeight: 800, fontSize: '1rem', border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)', transition: 'transform 0.15s ease' }}
          >
            Resume Fullscreen Examination
          </button>
        </div>
      )}

      {/* Multi-Tab Blocked Modal */}
      {proctor.multiTabBlocked && !proctor.frozen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.98)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center', padding: 24, backdropFilter: 'blur(10px)' }}>
          <h2 style={{ color: '#ef4444', fontSize: '1.6rem', fontWeight: 900, marginBottom: 8 }}>MULTIPLE SESSIONS PROHIBITED</h2>
          <p style={{ color: '#cbd5e1', fontSize: '0.95rem', maxWidth: 480, lineHeight: 1.6, marginBottom: 24 }}>
            Another active exam tab was detected for your account. Simultaneous examination sessions are prohibited to protect institutional testing integrity.
          </p>
        </div>
      )}

      {/* Ambient Warning Banner */}
      {proctor.warning && (
        <div
          style={{
            ...styles.warningBanner,
            background: proctor.warningSeverity === 'critical' ? '#dc2626' : proctor.warningSeverity === 'warning' ? '#d97706' : '#2563eb'
          }}
        >
          {proctor.warning}
        </div>
      )}

      {/* Floating AI Proctor HUD */}
      <ProctorHUD
        proctor={proctor}
        candidateName={user?.name}
        rollNumber={user?.roll_number}
      />

      {/* Top Bar */}
      <div style={styles.topBar}>
        <div style={styles.topLeft}>
          {onExit && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to exit the examination? Your progress will be preserved.')) {
                  try { proctor.exitFullscreen(); } catch (e) {}
                  if (document.fullscreenElement) { document.exitFullscreen().catch(() => {}); }
                  onExit();
                }
              }}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                background: '#0f172a',
                color: '#fff',
                fontSize: '0.78rem',
                fontWeight: 700,
                border: '1px solid #334155',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                marginRight: 6
              }}
              title="Exit Exam to Assessment Hub"
            >
              <span>← Exit Exam</span>
            </button>
          )}
          <img src="/logo-light.jpeg" alt="CampusCorp Logo" style={{ ...styles.logo, background: '#fff', objectFit: 'contain', padding: '2px', borderRadius: '8px' }} />
          <div>
            <p style={{ color: '#0f172a', fontWeight: 800, fontSize: '0.9rem' }}>CAMPUSSCORP CodeSprint LMS</p>
            <p style={{ color: '#64748b', fontSize: '0.72rem' }}>{user?.name} • {user?.department}</p>
          </div>
        </div>
        <div style={styles.topCenter}>
          <div style={{ ...styles.timerBox, borderColor: timerColor, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>{examPhase === 'phase1' ? (activeTest?.phase1_name || 'Phase 1: Aptitude') : examPhase === 'phase2' ? (activeTest?.phase2_name || 'Phase 2: Technical MCQ') : 'Phase 3: Coding'}</span>
            <span style={{ color: timerColor, fontWeight: 900, fontSize: '1.1rem', fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(timer)}
            </span>
          </div>
        </div>
        <div style={styles.topRight}>
          <div style={styles.violationBadge}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>STRIKES</span>
            <span style={{ color: proctor.violations > 0 ? '#ef4444' : '#10b981', fontWeight: 800, fontSize: '0.78rem' }}>
              {proctor.violations}/{proctor.maxViolations}
            </span>
          </div>
          {examPhase === 'phase1' && (attempt?.phase2Break || attempt?.phaseBreak || 0) > (attempt?.phaseBreak || 0) && (
            <button
              onClick={() => setShowPhaseConfirm(true)}
              style={{ ...styles.submitBtn, background: '#3b82f6' }}
            >
              Next: Technical Phase →
            </button>
          )}

          {examPhase === 'phase2' && (
            <button
              onClick={() => {
                const codeDur = attempt?.codingDuration || 60;
                setExamPhase('phase3');
                setTimer(codeDur * 60);
                setIndex(0);
              }}
              style={{ ...styles.submitBtn, background: '#8b5cf6' }}
            >
              Next: Coding Phase →
            </button>
          )}

          {/* ALWAYS PROMINENT SUBMIT EXAM BUTTON */}
          <button
            onClick={() => setShowSubmitConfirm(true)}
            disabled={submitting}
            style={{
              padding: '8px 20px',
              borderRadius: 10,
              background: '#059669',
              color: '#fff',
              fontWeight: 800,
              fontSize: '0.82rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span>✓ Submit Exam</span>
          </button>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)', padding: 16 }}>
          <div style={{ background: '#ffffff', borderRadius: 24, maxWidth: 460, width: '100%', padding: 28, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#dcfce7', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Ready to Submit Your Exam?</h2>
            <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.6, marginBottom: 20 }}>
              Please review your assessment progress before final submission. Once submitted, your answers cannot be modified and you will exit back to the portal.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, background: '#f8fafc', padding: 14, borderRadius: 16, border: '1px solid #e2e8f0', marginBottom: 20 }}>
              <div>
                <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Answered</p>
                <p style={{ fontSize: '1.2rem', fontWeight: 900, color: '#059669' }}>{answered}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Unanswered</p>
                <p style={{ fontSize: '1.2rem', fontWeight: 900, color: total - answered > 0 ? '#ef4444' : '#64748b' }}>{total - answered}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Marked</p>
                <p style={{ fontSize: '1.2rem', fontWeight: 900, color: '#d97706' }}>{Object.values(marked).filter(Boolean).length}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowSubmitConfirm(false)}
                style={{ flex: 1, padding: '12px 18px', borderRadius: 12, border: '1px solid #cbd5e1', background: '#fff', color: '#334155', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' }}
              >
                Continue Exam
              </button>
              <button
                onClick={() => {
                  setShowSubmitConfirm(false);
                  submitQuiz();
                }}
                disabled={submitting}
                style={{ flex: 1, padding: '12px 18px', borderRadius: 12, border: 'none', background: '#059669', color: '#fff', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(5, 150, 105, 0.4)' }}
              >
                {submitting ? 'Submitting & Exiting...' : '✓ Submit & Exit Portal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div style={styles.progressTrack}>
        <div style={{ ...styles.progressFill, width: `${progress}%`, background: '#334155' }}></div>
      </div>

      {/* Main Content */}
      <div style={(examPhase === 'phase2' || examPhase === 'phase3') ? styles.threeColGrid : styles.mainGrid}>
        {(examPhase === 'phase2' || examPhase === 'phase3') ? (
          <>
            {/* Column 1: Question Description (Left) */}
            <div style={styles.leftColQuestion}>
              <div style={styles.questionCard}>
                <div style={styles.questionHeader}>
                  <span style={styles.qNumber}>Question {index + 1}</span>
                  {q.subject && (
                    <span style={{ ...styles.qNumber, background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '3px 8px', borderRadius: 6 }}>
                      {q.subject}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                  <button
                    onClick={() => setMarked(p => ({ ...p, [q.id]: !p[q.id] }))}
                    style={{
                      ...styles.markBtn,
                      width: '100%',
                      background: marked[q.id] ? '#f1f5f9' : 'transparent',
                      borderColor: marked[q.id] ? '#cbd5e1' : '#e2e8f0',
                      color: marked[q.id] ? '#0f172a' : '#64748b'
                    }}
                  >
                    {marked[q.id] ? '★ Marked' : '☆ Mark for Review'}
                  </button>
                </div>
                <p style={{ ...styles.questionText, fontSize: '0.92rem', maxHeight: '55vh', overflowY: 'auto', paddingRight: 4 }}>
                  {qText}
                </p>

                {/* Navigation Buttons inside Left Column */}
                <div style={{ ...styles.navRow, marginTop: 20 }}>
                  <button
                    disabled={index === 0}
                    onClick={() => { setIndex(i => i - 1); proctor.trackNavigation(); }}
                    style={{ ...styles.navBtn, padding: '8px 14px', fontSize: '0.78rem', opacity: index === 0 ? 0.3 : 1 }}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handleAnswer(q.id, { selectedOption: '', codingResponse: '' })}
                    style={{ ...styles.clearBtn, padding: '8px 12px', fontSize: '0.78rem' }}
                  >
                    Clear
                  </button>
                  <button
                    disabled={isLastQuestion}
                    onClick={() => { setIndex(i => i + 1); proctor.trackNavigation(); }}
                    style={{
                      ...styles.navBtn,
                      padding: '8px 14px',
                      fontSize: '0.78rem',
                      background: '#1e293b',
                      color: '#fff',
                      opacity: isLastQuestion ? 0.3 : 1
                    }}
                  >
                    Next
                  </button>
                  <button
                    onClick={() => setShowSubmitConfirm(true)}
                    disabled={submitting}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 12,
                      background: '#059669',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)',
                      marginLeft: 'auto'
                    }}
                  >
                    ✓ Submit Exam
                  </button>
                </div>
              </div>
            </div>

            {/* Column 2: Answering Section (Center) */}
            <div style={styles.centerColAnswer}>
              {isCoding ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
                  {/* Compiler View for Python/Java/JS/Coding */}
                  {!((q.subject || '').toLowerCase().includes('vlsi') || (q.subject || '').toLowerCase().includes('iot')) ? (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <CodeEditor
                        language={codingLanguages[q.id] || ((q.subject || '').toLowerCase().includes('java') ? 'java' : (q.subject || '').toLowerCase().includes('javascript') ? 'javascript' : 'python')}
                        value={answers[q.id]?.codingResponse || ''}
                        onChange={(code) => handleAnswer(q.id, { codingResponse: code })}
                        placeholder={`// Write your code here...`}
                      />
                    </div>
                  ) : (
                    /* Notepad View for VLSI/IOT */
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                      <div style={{ padding: '8px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>ANSWER SPECIFICATION (NOTEPAD)</span>
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Chars: {(answers[q.id]?.codingResponse || '').length}</span>
                      </div>
                      <textarea
                        data-coding="true"
                        value={answers[q.id]?.codingResponse || ''}
                        onChange={(e) => handleAnswer(q.id, { codingResponse: e.target.value })}
                        placeholder="Provide your detailed conceptual block diagram explanation, program, register mappings, or step-by-step controller configuration here..."
                        style={{ width: '100%', flex: 1, padding: 20, border: 'none', outline: 'none', fontSize: '0.95rem', lineHeight: 1.6, resize: 'none', fontFamily: 'inherit' }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div style={styles.optionsGrid}>
                  {['A', 'B', 'C', 'D'].map((o) => {
                    const selected = answers[q.id]?.selectedOption === o;
                    return (
                      <label key={o} style={{ ...styles.optionLabel, background: selected ? '#f1f5f9' : 'transparent', borderColor: selected ? '#94a3b8' : '#e2e8f0' }}>
                        <div style={{ ...styles.radioCircle, borderColor: selected ? '#0f172a' : '#cbd5e1', background: selected ? '#0f172a' : 'transparent' }}>
                          {selected && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }}></div>}
                        </div>
                        <span style={{ ...styles.optionKey, background: selected ? '#e2e8f0' : '#f8fafc', color: selected ? '#0f172a' : '#64748b' }}>{o}</span>
                        <span style={{ color: selected ? '#0f172a' : '#334155', fontSize: '0.88rem', flex: 1 }}>{q[`option_${o.toLowerCase()}`]}</span>
                        <input type="radio" name={`q-${q.id}`} checked={selected} onChange={() => handleAnswer(q.id, { selectedOption: o })} style={{ display: 'none' }} />
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Column 3: The Data & Palette (Right) */}
            <div style={styles.rightColData}>
              {/* Compiler console if coding subject */}
              {isCoding && !((q.subject || '').toLowerCase().includes('vlsi') || (q.subject || '').toLowerCase().includes('iot')) && (
                <div style={{ background: '#0f172a', borderRadius: 12, padding: 14, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#82b1ff', textTransform: 'uppercase' }}>Console Output</span>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <select
                        value={codingLanguages[q.id] || ((q.subject || '').toLowerCase().includes('java') ? 'java' : (q.subject || '').toLowerCase().includes('javascript') ? 'javascript' : 'python')} 
                        onChange={(e) => setCodingLanguages({ ...codingLanguages, [q.id]: e.target.value })}
                        style={{
                          background: '#1e293b', color: '#fff', border: '1px solid #334155',
                          borderRadius: '6px', padding: '6px 12px', fontSize: '0.9rem', outline: 'none'
                        }}
                      >
                        {(() => {
                          const JS_USERS = ['711623104054', '711623118009', '711623118001', '711623118006', '711623118021'];
                          const isJsUser = JS_USERS.includes(String(user?.roll_number));
                          if (isJsUser) {
                            return <option value="javascript">Javascript</option>;
                          }
                          return (
                            <>
                              <option value="python">Python</option>
                              <option value="java">Java</option>
                              <option value="javascript">Javascript</option>
                            </>
                          );
                        })()}
                      </select>
                      <button
                        onClick={() => {
                          const code = answers[q.id]?.codingResponse || '';
                          if (!code) return;

                          handleAnswer(q.id, { compileStatus: 'Running...', testResults: null });

                          let tcs = [];
                          try {
                            tcs = typeof q.test_cases === 'string' ? JSON.parse(q.test_cases) : (q.test_cases || []);
                          } catch (e) {
                            console.error('Test cases parse error', e);
                          }

                          apiFetch('/api/student/compiler/run', {
                            method: 'POST',
                            body: JSON.stringify({
                              language: codingLanguages[q.id] || ((q.subject || '').toLowerCase().includes('java') ? 'java' : (q.subject || '').toLowerCase().includes('javascript') ? 'javascript' : 'python'),
                              code,
                              testCases: tcs
                            })
                        }).then(data => {
                          if (data.results) {
                            const results = data.results.map((r, i) => ({
                              name: `TC ${i + 1}`,
                              status: r.passed ? 'Passed' : 'Failed',
                              detail: r.error || (r.passed ? '' : `Input:\n${r.input}\nExpected:\n${r.expected}\nGot:\n${r.actual}`)
                            }));
                            handleAnswer(q.id, { testResults: results, compileStatus: 'Execution Finished' });
                          } else if (data.error) {
                            handleAnswer(q.id, { compileStatus: 'Error', testResults: [{ name: 'Compilation Error', status: 'Failed', detail: data.error }] });
                          } else {
                            handleAnswer(q.id, { compileStatus: 'Execution Finished', output: data.output });
                          }
                        }).catch(err => {
                          handleAnswer(q.id, { compileStatus: 'Failed', testResults: [{ name: 'Error', status: 'Failed', detail: err.message }] });
                        });
                      }}
                      style={{ padding: '4px 10px', background: '#22c55e', color: '#fff', borderRadius: 6, fontSize: '0.7rem', fontWeight: 800, border: 'none', cursor: 'pointer' }}
                    >
                      Run Code
                    </button>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace', marginBottom: 6 }}>
                    {answers[q.id]?.compileStatus || '> Ready...'}
                  </div>

                  {answers[q.id]?.output && (
                    <div style={{ marginTop: 8, padding: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 6, color: '#e2e8f0', fontSize: '0.75rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', maxHeight: '150px', overflowY: 'auto' }}>
                      {answers[q.id].output}
                    </div>
                  )}

                  {answers[q.id]?.testResults && (
                    <div style={{ display: 'grid', gap: 4, maxHeight: '120px', overflowY: 'auto' }}>
                      {answers[q.id].testResults.map((tr, i) => (
                        <div key={i} style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: 4, fontSize: '0.7rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#cbd5e1' }}>{tr.name}</span>
                            <span style={{ color: tr.status === 'Passed' ? '#22c55e' : '#ef4444', fontWeight: 800 }}>{tr.status}</span>
                          </div>
                          {tr.detail && <div style={{ color: '#ef4444', fontFamily: 'monospace', fontSize: '0.65rem', marginTop: 2, whiteSpace: 'pre-wrap' }}>{tr.detail}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Legend & Palette Sidebar */}
              <div style={styles.paletteCard}>
                <p style={{ color: '#0f172a', fontWeight: 800, fontSize: '0.85rem', marginBottom: 10 }}>Question Palette</p>
                <div style={{ paddingRight: '4px', marginBottom: 10 }}>
                  {(() => {
                    const grouped = currentQuestions.reduce((acc, q, i) => {
                      const sub = q.subject || 'General';
                      if (!acc[sub]) acc[sub] = [];
                      acc[sub].push({ ...q, localIndex: i });
                      return acc;
                    }, {});

                    return Object.entries(grouped).map(([sub, qs]) => (
                      <div key={sub} style={{ marginBottom: 10 }}>
                        <p style={{ fontSize: '0.62rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>{sub}</p>
                        <div style={{ ...styles.paletteGrid, gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                          {qs.map((item) => {
                            const isAnswered = !!(answers[item.id]?.selectedOption || answers[item.id]?.codingResponse);
                            const isMarked = marked[item.id];
                            const isCurrent = item.localIndex === index;
                            let bg = '#f8fafc';
                            let border = '#e2e8f0';
                            let color = '#64748b';
                            if (isCurrent) { bg = '#1e293b'; border = '#0f172a'; color = '#fff'; }
                            else if (isMarked && isAnswered) { bg = '#fef3c7'; border = '#f59e0b'; color = '#92400e'; }
                            else if (isMarked) { bg = '#fef9c3'; border = '#facc15'; color = '#854d0e'; }
                            else if (isAnswered) { bg = '#dcfce7'; border = '#22c55e'; color = '#166534'; }
                            return (
                              <button key={item.id} onClick={() => { setIndex(item.localIndex); proctor.trackNavigation(); }}
                                style={{ ...styles.paletteBtn, background: bg, borderColor: border, color, fontWeight: isCurrent ? 800 : 600, fontSize: '0.7rem' }}>
                                {item.localIndex + 1}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ));
                  })()}
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
                  <div style={styles.miniStat}>
                    <span style={{ color: '#64748b', fontSize: '0.72rem' }}>Answered</span>
                    <span style={{ color: '#22c55e', fontWeight: 800, fontSize: '0.72rem' }}>{answered}</span>
                  </div>
                  <div style={styles.miniStat}>
                    <span style={{ color: '#64748b', fontSize: '0.72rem' }}>Marked</span>
                    <span style={{ color: '#f59e0b', fontWeight: 800, fontSize: '0.72rem' }}>{Object.values(marked).filter(Boolean).length}</span>
                  </div>
                  <div style={styles.miniStat}>
                    <span style={{ color: '#64748b', fontSize: '0.72rem' }}>Completion</span>
                    <span style={{ color: '#0f172a', fontWeight: 800, fontSize: '0.72rem' }}>{Math.round(progress)}%</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowSubmitConfirm(true)}
                  disabled={submitting}
                  style={{
                    width: '100%',
                    marginTop: 14,
                    padding: '10px 14px',
                    borderRadius: 12,
                    background: '#059669',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  ✓ Submit Assessment
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Question Area */}
            <div style={styles.questionArea}>
              <div style={styles.questionCard}>
                <div style={styles.questionHeader}>
                  <span style={styles.qNumber}>Question {index + 1}</span>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {q.subject && <span style={{ ...styles.qNumber, background: 'rgba(130,177,255,0.1)', color: '#82b1ff' }}>{q.subject}</span>}
                    <button
                      onClick={() => setMarked(p => ({ ...p, [q.id]: !p[q.id] }))}
                      style={{
                        ...styles.markBtn,
                        background: marked[q.id] ? '#f1f5f9' : 'transparent',
                        borderColor: marked[q.id] ? '#cbd5e1' : '#e2e8f0',
                        color: marked[q.id] ? '#0f172a' : '#64748b'
                      }}
                    >
                      {marked[q.id] ? 'Marked' : 'Mark for Review'}
                    </button>
                  </div>
                </div>

                <p style={styles.questionText}>{qText}</p>

                {isCoding ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {!((q.subject || '').toLowerCase().includes('vlsi') || (q.subject || '').toLowerCase().includes('iot')) ? (
                      <>
                        <CodeEditor
                          language={codingLanguages[q.id] || ((q.subject || '').toLowerCase().includes('java') ? 'java' : (q.subject || '').toLowerCase().includes('javascript') ? 'javascript' : 'python')}
                          value={answers[q.id]?.codingResponse || ''}
                          onChange={(code) => handleAnswer(q.id, { codingResponse: code })}
                          placeholder={`// Write your code here...`}
                        />
                        <div style={{ background: '#0f172a', borderRadius: 12, padding: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#82b1ff', textTransform: 'uppercase' }}>Console & Test Cases</span>
                            
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                              <select
                                value={codingLanguages[q.id] || ((q.subject || '').toLowerCase().includes('java') ? 'java' : (q.subject || '').toLowerCase().includes('javascript') ? 'javascript' : 'python')} 
                                onChange={(e) => setCodingLanguages({ ...codingLanguages, [q.id]: e.target.value })}
                                style={{
                                  background: '#1e293b', color: '#fff', border: '1px solid #334155',
                                  borderRadius: '6px', padding: '6px 12px', fontSize: '0.9rem', outline: 'none'
                                }}
                              >
                                {(() => {
                                  const JS_USERS = ['711623104054', '711623118009', '711623118001', '711623118006', '711623118021'];
                                  const isJsUser = JS_USERS.includes(String(user?.roll_number));
                                  if (isJsUser) {
                                    return <option value="javascript">Javascript</option>;
                                  }
                                  return (
                                    <>
                                      <option value="python">Python</option>
                                      <option value="java">Java</option>
                                      <option value="javascript">Javascript</option>
                                    </>
                                  );
                                })()}
                              </select>
                              
                              <button
                                onClick={() => {
                                  const code = answers[q.id]?.codingResponse || '';
                                  if (!code) return;

                                  handleAnswer(q.id, { compileStatus: 'Running...', testResults: null });

                                  let tcs = [];
                                  try {
                                    tcs = typeof q.test_cases === 'string' ? JSON.parse(q.test_cases) : (q.test_cases || []);
                                  } catch (e) {
                                    console.error('Test cases parse error', e);
                                  }

                                  apiFetch('/api/student/compiler/run', {
                                    method: 'POST',
                                    body: JSON.stringify({
                                      language: codingLanguages[q.id] || ((q.subject || '').toLowerCase().includes('java') ? 'java' : (q.subject || '').toLowerCase().includes('javascript') ? 'javascript' : 'python'),
                                      code,
                                      testCases: tcs
                                    })
                                  }).then(data => {
                                    if (data.results) {
                                      const results = data.results.map((r, i) => ({
                                        name: `Test Case ${i + 1}`,
                                        status: r.passed ? 'Passed' : 'Failed',
                                        detail: r.error || (r.passed ? '' : `Input:\n${r.input}\nExpected:\n${r.expected}\nGot:\n${r.actual}`)
                                    }));
                                    handleAnswer(q.id, { testResults: results, compileStatus: 'Execution Finished' });
                                  } else if (data.error) {
                                    handleAnswer(q.id, { compileStatus: 'Compilation/Runtime Error', testResults: [{ name: 'Error', status: 'Failed', detail: data.error }] });
                                  } else {
                                    handleAnswer(q.id, { compileStatus: 'Execution Finished', output: data.output });
                                  }
                                }).catch(err => {
                                  handleAnswer(q.id, { compileStatus: 'Execution Failed', testResults: [{ name: 'Connection Error', status: 'Failed', detail: err.message }] });
                                });
                              }}
                              style={{ padding: '6px 16px', background: '#22c55e', color: '#fff', borderRadius: 8, fontSize: '0.75rem', fontWeight: 800, border: 'none', cursor: 'pointer' }}
                            >
                              Run Code
                            </button>
                            </div>
                          </div>

                          <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontFamily: 'monospace', marginBottom: 10 }}>
                            {answers[q.id]?.compileStatus || '> Ready to execute...'}
                          </div>

                          {answers[q.id]?.output && (
                            <div style={{ marginTop: 8, padding: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 6, color: '#e2e8f0', fontSize: '0.75rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', maxHeight: '150px', overflowY: 'auto' }}>
                              {answers[q.id].output}
                            </div>
                          )}

                          {answers[q.id]?.testResults && (
                            <div style={{ display: 'grid', gap: 6 }}>
                              {answers[q.id].testResults.map((tr, i) => (
                                <div key={i} style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#cbd5e1' }}>{tr.name}</span>
                                    <span style={{ color: tr.status === 'Passed' ? '#22c55e' : '#ef4444', fontWeight: 800 }}>{tr.status}</span>
                                  </div>
                                  {tr.detail && <div style={{ fontSize: '0.7rem', color: '#ef4444', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{tr.detail}</div>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                        <div style={{ padding: '8px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>NOTEPAD (ANSWER BOX)</span>
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Char Count: {(answers[q.id]?.codingResponse || '').length}</span>
                        </div>
                        <textarea
                          data-coding="true"
                          value={answers[q.id]?.codingResponse || ''}
                          onChange={(e) => handleAnswer(q.id, { codingResponse: e.target.value })}
                          placeholder="Type your detailed answer here..."
                          style={{ width: '100%', height: '350px', padding: 20, border: 'none', outline: 'none', fontSize: '0.95rem', lineHeight: 1.6, resize: 'none', fontFamily: 'inherit' }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={styles.optionsGrid}>
                    {['A', 'B', 'C', 'D'].map((o) => {
                      const selected = answers[q.id]?.selectedOption === o;
                      return (
                        <label key={o} style={{ ...styles.optionLabel, background: selected ? '#f1f5f9' : 'transparent', borderColor: selected ? '#94a3b8' : '#e2e8f0' }}>
                          <div style={{ ...styles.radioCircle, borderColor: selected ? '#0f172a' : '#cbd5e1', background: selected ? '#0f172a' : 'transparent' }}>
                            {selected && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }}></div>}
                          </div>
                          <span style={{ ...styles.optionKey, background: selected ? '#e2e8f0' : '#f8fafc', color: selected ? '#0f172a' : '#64748b' }}>{o}</span>
                          <span style={{ color: selected ? '#0f172a' : '#334155', fontSize: '0.88rem', flex: 1 }}>{q[`option_${o.toLowerCase()}`]}</span>
                          <input type="radio" name={`q-${q.id}`} checked={selected} onChange={() => handleAnswer(q.id, { selectedOption: o })} style={{ display: 'none' }} />
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* Nav buttons */}
                <div style={styles.navRow}>
                  <button disabled={index === 0} onClick={() => { setIndex(i => i - 1); proctor.trackNavigation(); }} style={{ ...styles.navBtn, opacity: index === 0 ? 0.3 : 1 }}>Previous</button>
                  <button onClick={() => handleAnswer(q.id, { selectedOption: '', codingResponse: '' })} style={styles.clearBtn}>Clear Answer</button>
                  <button disabled={isLastQuestion} onClick={() => { setIndex(i => i + 1); proctor.trackNavigation(); }} style={{ ...styles.navBtn, background: '#1e293b', color: '#fff', opacity: isLastQuestion ? 0.3 : 1 }}>
                    Next
                  </button>
                  <button
                    onClick={() => setShowSubmitConfirm(true)}
                    disabled={submitting}
                    style={{
                      ...styles.navBtn,
                      background: '#059669',
                      color: '#fff',
                      fontWeight: 800,
                      border: 'none',
                      marginLeft: 'auto',
                      boxShadow: '0 2px 10px rgba(5, 150, 105, 0.35)'
                    }}
                  >
                    ✓ Submit Exam
                  </button>
                </div>
              </div>
            </div>

            {/* Palette Sidebar */}
            <div style={styles.paletteSide}>
              {/* Instructions Button */}
              <button
                onClick={() => setShowInstructions(true)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 12,
                  background: '#eef2ff', border: '1px solid #c7d2fe',
                  color: '#4338ca', fontWeight: 700, fontSize: '0.82rem',
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 6
                }}
              >
                Exam Instructions
              </button>

              <div style={styles.paletteCard}>
                <p style={{ color: '#0f172a', fontWeight: 800, fontSize: '0.85rem', marginBottom: 12 }}>Question Palette</p>
                <div style={styles.legend}>
                  <span style={styles.legendItem}><span style={{ ...styles.dot, background: '#22c55e' }}></span> Answered</span>
                  <span style={styles.legendItem}><span style={{ ...styles.dot, background: '#f59e0b' }}></span> Marked for Review</span>
                  <span style={styles.legendItem}><span style={{ ...styles.dot, background: '#e2e8f0' }}></span> Not Visited</span>
                  <span style={styles.legendItem}><span style={{ ...styles.dot, background: '#1e293b' }}></span> Current</span>
                </div>
                <div style={{ paddingRight: '4px' }}>
                  {(() => {
                    const grouped = currentQuestions.reduce((acc, q, i) => {
                      const sub = q.subject || 'General';
                      if (!acc[sub]) acc[sub] = [];
                      acc[sub].push({ ...q, localIndex: i });
                      return acc;
                    }, {});

                    return Object.entries(grouped).map(([sub, qs]) => (
                      <div key={sub} style={{ marginBottom: 16 }}>
                        <p style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>{sub}</p>
                        <div style={styles.paletteGrid}>
                          {qs.map((item) => {
                            const isAnswered = !!(answers[item.id]?.selectedOption || answers[item.id]?.codingResponse);
                            const isMarked = marked[item.id];
                            const isCurrent = item.localIndex === index;
                            let bg = '#f8fafc';
                            let border = '#e2e8f0';
                            let color = '#64748b';
                            if (isCurrent) { bg = '#1e293b'; border = '#0f172a'; color = '#fff'; }
                            else if (isMarked && isAnswered) { bg = '#fef3c7'; border = '#f59e0b'; color = '#92400e'; }
                            else if (isMarked) { bg = '#fef9c3'; border = '#facc15'; color = '#854d0e'; }
                            else if (isAnswered) { bg = '#dcfce7'; border = '#22c55e'; color = '#166534'; }
                            return (
                              <button key={item.id} onClick={() => { setIndex(item.localIndex); proctor.trackNavigation(); }}
                                style={{ ...styles.paletteBtn, background: bg, borderColor: border, color, fontWeight: isCurrent ? 800 : 600 }}>
                                {item.localIndex + 1}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Stats */}
              <div style={styles.paletteCard}>
                <p style={{ color: '#0f172a', fontWeight: 800, fontSize: '0.85rem', marginBottom: 10 }}>Progress</p>
                <div style={styles.miniStat}>
                  <span style={{ color: '#64748b', fontSize: '0.78rem' }}>Answered</span>
                  <span style={{ color: '#22c55e', fontWeight: 800 }}>{answered}</span>
                </div>
                <div style={styles.miniStat}>
                  <span style={{ color: '#64748b', fontSize: '0.78rem' }}>Marked</span>
                  <span style={{ color: '#f59e0b', fontWeight: 800 }}>{Object.values(marked).filter(Boolean).length}</span>
                </div>
                <div style={styles.miniStat}>
                  <span style={{ color: '#64748b', fontSize: '0.78rem' }}>Completion</span>
                  <span style={{ color: '#0f172a', fontWeight: 800 }}>{Math.round(progress)}%</span>
                </div>

                <button
                  onClick={() => setShowSubmitConfirm(true)}
                  disabled={submitting}
                  style={{
                    width: '100%',
                    marginTop: 14,
                    padding: '12px',
                    borderRadius: 12,
                    background: '#059669',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  ✓ Submit Assessment
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Instructions Popup */}
      {showInstructions && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 16
        }}>
          <div style={{
            background: '#ffffff', width: '100%', maxWidth: 460, maxHeight: '85vh',
            borderRadius: 20, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden', animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            display: 'flex', flexDirection: 'column'
          }}>
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <h2 style={{ color: '#0f172a', fontWeight: 900, fontSize: '1.1rem', letterSpacing: '-0.02em', margin: 0 }}>Exam Instructions</h2>
              <button onClick={() => setShowInstructions(false)} style={{
                width: 32, height: 32, borderRadius: 8, border: '1px solid #e2e8f0',
                background: '#f8fafc', cursor: 'pointer', fontSize: '1rem', padding: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b'
              }}>✕</button>
            </div>
            <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
              {/* Color Legend */}
              <p style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem', marginBottom: 8, marginTop: 0 }}>Question Palette</p>
              <div style={{ display: 'grid', gap: 6, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#dcfce7', border: '1px solid #22c55e', borderRadius: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: '#22c55e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.7rem', flexShrink: 0 }}>1</div>
                  <div><p style={{ fontWeight: 700, color: '#166534', fontSize: '0.8rem', margin: 0 }}>Green — Answered</p><p style={{ color: '#4ade80', fontSize: '0.7rem', margin: 0, marginTop: 2 }}>You selected an answer</p></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#fef9c3', border: '1px solid #facc15', borderRadius: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: '#f59e0b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.7rem', flexShrink: 0 }}>2</div>
                  <div><p style={{ fontWeight: 700, color: '#92400e', fontSize: '0.8rem', margin: 0 }}>Yellow — Marked</p><p style={{ color: '#a16207', fontSize: '0.7rem', margin: 0, marginTop: 2 }}>Flagged for review</p></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: '#e2e8f0', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.7rem', flexShrink: 0 }}>3</div>
                  <div><p style={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem', margin: 0 }}>Gray — Not Visited</p><p style={{ color: '#94a3b8', fontSize: '0.7rem', margin: 0, marginTop: 2 }}>Not answered yet</p></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#1e293b', border: '1px solid #0f172a', borderRadius: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: '#fff', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.7rem', flexShrink: 0 }}>4</div>
                  <div><p style={{ fontWeight: 700, color: '#fff', fontSize: '0.8rem', margin: 0 }}>Dark — Current</p><p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', margin: 0, marginTop: 2 }}>Currently viewing</p></div>
                </div>
              </div>

              {/* Controls */}
              <p style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem', marginBottom: 8 }}>Controls</p>
              <div style={{ display: 'grid', gap: 4, marginBottom: 16, fontSize: '0.8rem', color: '#334155', lineHeight: 1.6 }}>
                <p style={{ margin: 0 }}>• <b>Previous/Next</b> — Navigate questions</p>
                <p style={{ margin: 0 }}>• <b>Mark</b> — Flag to revisit later</p>
                <p style={{ margin: 0 }}>• <b>Clear</b> — Remove selected answer</p>
                <p style={{ margin: 0 }}>• <b>Submit</b> — Finalize and submit exam</p>
              </div>

              {/* Notes */}
              <p style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem', marginBottom: 8 }}>Notes</p>
              <div style={{ display: 'grid', gap: 4, fontSize: '0.8rem', color: '#334155', lineHeight: 1.6 }}>
                <p style={{ margin: 0 }}>• Auto-saved every 30s. Auto-submit on timer end.</p>
                <p style={{ margin: 0 }}>• <b>5 violations</b> will freeze your exam.</p>
                <p style={{ margin: 0 }}>• Do not exit fullscreen or switch tabs.</p>
              </div>
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <button onClick={() => setShowInstructions(false)} style={{
                width: '100%', padding: 12, borderRadius: 12,
                background: '#1e293b', color: '#fff', fontWeight: 800,
                fontSize: '0.9rem', border: 'none', cursor: 'pointer', margin: 0
              }}>
                Got it, Start Exam →
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Phase Transition Confirm Modal */}
      {showPhaseConfirm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 20, maxWidth: 400, width: '90%', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Start Technical Phase?</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: 24, lineHeight: 1.5 }}>
              Are you sure you want to finish the Aptitude phase and start the Technical phase?
              <br /><br />
              <strong style={{ color: '#ef4444' }}>Note: You cannot go back to Aptitude questions once you proceed.</strong>
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowPhaseConfirm(false)}
                style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setExamPhase('phase2');
                  setIndex(0);
                  setShowPhaseConfirm(false);
                }}
                style={{ flex: 1, padding: '12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                Start Technical Phase
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Technical Specialization Selection Modal */}
      {showTechPopup && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, padding: 16
        }}>
          <div style={{
            background: '#ffffff', width: '90%', maxWidth: 480,
            borderRadius: 24, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden', padding: 28, textAlign: 'center'
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '16px',
              background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', color: '#3b82f6'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
            </div>

            <h2 style={{ color: '#0f172a', fontWeight: 900, fontSize: '1.35rem', letterSpacing: '-0.02em', margin: '0 0 8px 0' }}>
              Choose Technical Specialization
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: 24 }}>
              Select the technical subject you wish to be evaluated on for Phase 2 of this examination.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {(subjects[0]?.technical_subjects || '')
                .split(',')
                .map(s => s.trim())
                .filter(Boolean)
                .filter(tech => !EXCLUDED_DEPTS.includes(tech.toUpperCase()))
                .map((tech) => {
                  const isSelected = chosenTechSubject === tech;
                  return (
                    <button
                      key={tech}
                      onClick={() => setChosenTechSubject(tech)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 20px',
                        borderRadius: '16px',
                        border: `2px solid ${isSelected ? '#3b82f6' : '#e2e8f0'}`,
                        background: isSelected ? '#f0f9ff' : '#ffffff',
                        color: isSelected ? '#0369a1' : '#334155',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: isSelected ? 'rgba(59, 130, 246, 0.1)' : '#f1f5f9',
                          color: isSelected ? '#3b82f6' : '#64748b',
                          transition: 'all 0.2s ease'
                        }}>
                          {tech.toLowerCase().includes('iot') ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="2" y1="12" x2="22" y2="12"></line>
                              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                            </svg>
                          ) : tech.toLowerCase().includes('vlsi') ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                              <rect x="9" y="9" width="6" height="6"></rect>
                              <line x1="9" y1="1" x2="9" y2="4"></line>
                              <line x1="15" y1="1" x2="15" y2="4"></line>
                              <line x1="9" y1="20" x2="9" y2="23"></line>
                              <line x1="15" y1="20" x2="15" y2="23"></line>
                              <line x1="20" y1="9" x2="23" y2="9"></line>
                              <line x1="20" y1="15" x2="23" y2="15"></line>
                              <line x1="1" y1="9" x2="4" y2="9"></line>
                              <line x1="1" y1="15" x2="4" y2="15"></line>
                            </svg>
                          ) : tech.toLowerCase().includes('python') ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                            </svg>
                          ) : tech.toLowerCase().includes('java') ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                              <line x1="6" y1="1" x2="6" y2="4"></line>
                              <line x1="10" y1="1" x2="10" y2="4"></line>
                              <line x1="14" y1="1" x2="14" y2="4"></line>
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                              <line x1="8" y1="21" x2="16" y2="21"></line>
                              <line x1="12" y1="17" x2="12" y2="21"></line>
                            </svg>
                          )}
                        </div>
                        <span>{tech}</span>
                      </div>
                      {isSelected && (
                        <div style={{
                          width: 20, height: 20, borderRadius: '50%',
                          background: '#3b82f6', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', color: '#fff'
                        }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                      )}
                    </button>
                  );
                })}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowTechPopup(false)}
                style={{
                  flex: 1, padding: 12, borderRadius: 12,
                  background: '#f1f5f9', color: '#64748b',
                  border: 'none', fontWeight: 700, fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowTechPopup(false);
                  startExam(chosenTechSubject);
                }}
                disabled={!chosenTechSubject}
                style={{
                  flex: 2, padding: 12, borderRadius: 12,
                  background: chosenTechSubject ? '#3b82f6' : '#94a3b8',
                  color: '#fff', border: 'none', fontWeight: 800,
                  fontSize: '0.9rem', cursor: chosenTechSubject ? 'pointer' : 'not-allowed',
                  boxShadow: chosenTechSubject ? '0 4px 12px rgba(59, 130, 246, 0.25)' : 'none'
                }}
              >
                Confirm & Start Exam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  loadingScreen: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' },
  spinner: { width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#0f172a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  backBtn: { marginTop: 16, padding: '10px 20px', borderRadius: 10, background: '#fff', border: '1px solid #e2e8f0', color: '#0f172a', cursor: 'pointer', fontWeight: 600 },
  examContainer: { minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", position: 'relative', overflow: 'hidden' },
  watermarkOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    pointerEvents: 'none',
    zIndex: 9999,
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignContent: 'space-around',
    opacity: 0.30,
    overflow: 'hidden',
    userSelect: 'none'
  },
  watermarkText: {
    fontSize: '0.85rem',
    fontWeight: 900,
    transform: 'rotate(-25deg)',
    margin: '35px',
    whiteSpace: 'nowrap',
    color: '#090d16',
    letterSpacing: '0.08rem',
    fontFamily: 'monospace'
  },
  warningBanner: { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '10px 20px', background: '#1e293b', color: '#fff', textAlign: 'center', fontWeight: 700, fontSize: '0.85rem', animation: 'slideDown 0.3s ease' },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid #e2e8f0', background: '#ffffff', position: 'sticky', top: 0, zIndex: 50 },
  topLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  logo: { width: 36, height: 36, borderRadius: 10, background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#fff', fontSize: '0.85rem' },
  topCenter: { position: 'absolute', left: '50%', transform: 'translateX(-50%)' },
  timerBox: { padding: '8px 24px', borderRadius: 12, border: '2px solid', background: '#f8fafc' },
  topRight: { display: 'flex', alignItems: 'center', gap: 10 },
  violationBadge: { display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, background: '#f1f5f9', border: '1px solid #e2e8f0' },
  submitBtn: { padding: '8px 18px', borderRadius: 10, background: '#1e293b', color: '#fff', fontWeight: 700, fontSize: '0.82rem', border: 'none', cursor: 'pointer', boxShadow: 'none' },
  progressTrack: { height: 3, background: '#e2e8f0' },
  progressFill: { height: '100%', background: '#334155', transition: 'width 0.5s ease', borderRadius: 2 },
  mainGrid: {}, // managed by css class
  threeColGrid: {}, // managed by css class
  leftColQuestion: { display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', maxHeight: 'calc(100vh - 92px)' },
  centerColAnswer: { display: 'flex', flexDirection: 'column', gap: 16, minHeight: 'calc(100vh - 92px)' },
  rightColData: { display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', maxHeight: 'calc(100vh - 92px)' },
  questionArea: { padding: 20, overflowY: 'auto' },
  questionCard: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 18, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  questionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  qNumber: { color: '#0f172a', fontWeight: 800, fontSize: '0.85rem' },
  markBtn: { padding: '6px 14px', borderRadius: 8, border: '1px solid', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' },
  questionText: { color: '#1e293b', fontSize: '1rem', lineHeight: 1.7, marginBottom: 20, fontWeight: 500, whiteSpace: 'pre-wrap' },
  optionsGrid: { display: 'grid', gap: 10 },
  optionLabel: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14, border: '1px solid', cursor: 'pointer', transition: 'all 0.2s ease' },
  radioCircle: { width: 20, height: 20, borderRadius: '50%', border: '2px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' },
  optionKey: { width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.78rem', flexShrink: 0 },
  navRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, gap: 10 },
  navBtn: { padding: '10px 22px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' },
  clearBtn: { padding: '10px 18px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' },
  paletteSide: { borderLeft: '1px solid #e2e8f0', padding: 16, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', maxHeight: 'calc(100vh - 60px)', position: 'sticky', top: 60, background: '#f8fafc' },
  paletteCard: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 16 },
  legend: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  legendItem: { display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', color: '#64748b' },
  dot: { width: 8, height: 8, borderRadius: '50%' },
  paletteGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 },
  paletteBtn: { width: '100%', aspectRatio: '1', borderRadius: 8, border: '1px solid', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.15s' },
  miniStat: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  resultScreen: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: 20, fontFamily: "'Inter', system-ui, sans-serif" },
  resultCard: { width: '100%', maxWidth: 500, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 24, padding: 32, boxShadow: '0 4px 6px rgba(0,0,0,0.05)' },
  statBox: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: 16, textAlign: 'center' },
  statLabel: { color: '#64748b', fontSize: '0.75rem', fontWeight: 600, marginBottom: 6 },
  statValue: { color: '#0f172a', fontSize: '1.3rem', fontWeight: 900 },
  doneBtn: { width: '100%', padding: '14px', borderRadius: 14, background: '#1e293b', color: '#fff', fontWeight: 800, fontSize: '0.9rem', border: 'none', cursor: 'pointer', boxShadow: 'none' }
};

export default ExamScreen;
