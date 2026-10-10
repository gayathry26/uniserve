import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Sparkles,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  MessageSquare,
  Lightbulb,
  Database,
  Cpu,
  Send,
  Copy,
  Check,
  Briefcase,
  Award,
  BookOpen,
  Calendar,
  Layers,
  HelpCircle,
} from 'lucide-react';

export function AIAssistant() {
  const { user } = useAuth();
  const { currentTheme } = useTheme();

  // Active Tab: 'chat' (DB Q&A) | 'resume' | 'match' | 'interview'
  const [activeTab, setActiveTab] = useState('chat');

  // AI Service & Model status
  const [aiStatus, setAiStatus] = useState({
    online: true,
    modelName: 'Mistral-7B-Instruct-v0.1',
    quantization: 'Q4_K_M',
  });

  useEffect(() => {
    apiClient.get('/ai/status')
      .then((res) => {
        if (res.data?.success) {
          setAiStatus(res.data);
        }
      })
      .catch(() => {});
  }, []);

  // ── 1. DB-BASED AI CAREER CHAT STATE ──
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    {
      id: 1,
      question: 'What are the top paying companies and active jobs right now?',
      answer: 'Based on our verified placement database records, the highest paying active campus recruiters are Google India (₹32.50 LPA, Super Dream Tier) and Microsoft India (₹28.00 LPA, Super Dream Tier) for Software Development Engineer roles. Minimum eligibility requires a CGPA of 7.5+ with 0 active backlogs.',
      model: 'Mistral-7B-Instruct-v0.1-Q4_K_M',
      source: 'MISTRAL_7B_LOCAL_GGUF',
      sourcesSummary: { database: 'MySQL (lms)', contextFactsCount: 14 },
      timestamp: 'Just now',
    },
  ]);
  const [copiedId, setCopiedId] = useState(null);

  const sampleQuestions = [
    'What are the top paying companies and active jobs right now?',
    'What are our institutional placement policy rules for Dream offers?',
    'What recruitment drives are scheduled in the upcoming weeks?',
    'What is the placed student percentage and average CGPA in our batch?',
    'Give me preparation tips for DSA and system design technical interviews.',
  ];

  const handleSendChat = async (qText) => {
    const query = (qText || chatQuestion).trim();
    if (!query) return;

    setChatLoading(true);
    setChatQuestion('');

    try {
      const res = await apiClient.post('/ai/ask', { question: query });
      const newEntry = {
        id: Date.now(),
        question: query,
        answer: res.data?.answer || 'No response generated.',
        model: res.data?.model || 'Mistral-7B-Instruct-v0.1-Q4_K_M',
        source: res.data?.source || 'MISTRAL_7B_LOCAL_GGUF',
        sourcesSummary: res.data?.sourcesSummary,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatHistory((prev) => [newEntry, ...prev]);
    } catch (err) {
      const errorEntry = {
        id: Date.now(),
        question: query,
        answer: 'Failed to contact AI Career Engine. Please verify the backend service is running on port 8000.',
        model: 'Mistral-7B (Error)',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatHistory((prev) => [errorEntry, ...prev]);
    } finally {
      setChatLoading(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ── 2. RESUME STATE ──
  const [resumeText, setResumeText] = useState(
    `B.Tech Computer Science student experienced in full-stack development.
Proficient in Python, React, Node.js, Express, Docker, and MySQL.
Built scalable microservices architecture for university event portal reducing response latency by 40%.
Completed 3-month summer internship designing automated CI/CD pipelines and REST APIs.`
  );
  const [resumeResult, setResumeResult] = useState(null);
  const [analyzingResume, setAnalyzingResume] = useState(false);

  const handleAnalyzeResume = async () => {
    setAnalyzingResume(true);
    try {
      const res = await apiClient.post('/ai/parse-resume', { resumeText });
      setResumeResult(res.data);
    } catch (err) {
      alert('Failed to analyze resume');
    } finally {
      setAnalyzingResume(false);
    }
  };

  // ── 3. JOB MATCHING STATE ──
  const [matchingJob, setMatchingJob] = useState(false);
  const [matchResult, setMatchResult] = useState(null);

  const handleMatchJob = async () => {
    setMatchingJob(true);
    try {
      const res = await apiClient.post('/ai/match-job', { jobId: 1 });
      setMatchResult(res.data);
    } catch (err) {
      alert('Failed to evaluate job match');
    } finally {
      setMatchingJob(false);
    }
  };

  // ── 4. MOCK INTERVIEW STATE ──
  const [interviewQuestion, setInterviewQuestion] = useState('Explain how you diagnosed and resolved a high-latency query in MySQL.');
  const [interviewAnswer, setInterviewAnswer] = useState(
    `When working on our university event registration portal, we observed database queries spiking to 1200ms under 500 concurrent users.
I investigated using MySQL EXPLAIN ANALYZE and identified that a table scan was occurring because the student_id foreign key lacked a compound index with registration_status.
I designed and executed a migration to add a composite index on (student_id, status), and introduced Redis caching for read-heavy public event listings.
As a result, query latency dropped from 1200ms to 45ms, and the system handled our campus drive registration spike with zero downtime.`
  );
  const [interviewResult, setInterviewResult] = useState(null);
  const [evaluatingInterview, setEvaluatingInterview] = useState(false);

  const handleEvaluateAnswer = async () => {
    setEvaluatingInterview(true);
    try {
      const res = await apiClient.post('/ai/interview-feedback', {
        question: interviewQuestion,
        answer: interviewAnswer,
      });
      setInterviewResult(res.data);
    } catch (err) {
      alert('Failed to evaluate interview answer');
    } finally {
      setEvaluatingInterview(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner / Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: currentTheme.glow }}
        />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: currentTheme.primaryLight,
                  color: currentTheme.primaryText,
                }}
              >
                <Cpu className="w-3 h-3" />
                Mistral 7B Instruct GGUF Core
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Active Model: {aiStatus.modelName || 'Mistral-7B-Instruct-v0.1'} ({aiStatus.quantization || 'Q4_K_M'})</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                <Database className="w-3 h-3" />
                <span>MySQL RAG Context</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              AI Career Assistant & Knowledge Engine
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Locally hosted Mistral 7B neural network grounded in live campus placement database records, ATS screening, and STAR interview coaching.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/60 text-xs font-bold">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'chat'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-blue-600" />
              <span>DB Career Q&A</span>
            </button>
            <button
              onClick={() => setActiveTab('resume')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'resume'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-purple-600" />
              <span>ATS Resume</span>
            </button>
            <button
              onClick={() => setActiveTab('match')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'match'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-amber-600" />
              <span>Job Fit</span>
            </button>
            <button
              onClick={() => setActiveTab('interview')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'interview'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>Interview Coach</span>
            </button>
          </div>
        </div>
      </div>

      {/* Governance Banner */}
      <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-xl text-xs text-purple-900 flex items-start gap-2.5">
        <BrainCircuit className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold">Neural Engine Governance:</strong> Powered directly by{' '}
          <strong className="font-mono text-purple-950">mistral-7b-instruct-v0.1.Q4_K_M.gguf</strong> on local infrastructure with verified MySQL institutional context injection. Zero external telemetry or private data leakage.
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DB-BASED AI CAREER CHAT & ANSWERING SYSTEM                          */}
      {/* ========================================================================= */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Ask Input & Suggestions */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">Ask the Database Assistant</h3>
                    <p className="text-[11px] text-slate-500">Grounded in live MySQL placement data</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                  Mistral 7B Live
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Your Placement Question
                </label>
                <textarea
                  rows="4"
                  value={chatQuestion}
                  onChange={(e) => setChatQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendChat();
                    }
                  }}
                  placeholder="e.g., What are the highest paying companies active right now? What are the placement policies for Dream offers?"
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50 hover:bg-white transition-all leading-relaxed"
                ></textarea>
              </div>

              <button
                onClick={() => handleSendChat()}
                disabled={chatLoading || !chatQuestion.trim()}
                className="w-full py-2.5 px-4 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
                style={{ backgroundColor: currentTheme.primary }}
              >
                {chatLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Querying Database & Generating (Mistral 7B)...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Ask AI Assistant Grounded in DB</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Sample Questions Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>Instant Database Prompts</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Click any prompt below to query live database context with Mistral 7B:
              </p>

              <div className="space-y-2">
                {sampleQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendChat(q)}
                    disabled={chatLoading}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-200/70 hover:border-blue-300 hover:bg-blue-50/40 text-[11px] font-medium text-slate-700 transition-all cursor-pointer flex items-center justify-between gap-2 group"
                  >
                    <span className="group-hover:text-blue-700 leading-snug">{q}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: AI Response Feed */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4 min-h-[420px]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Responses from Mistral 7B Neural Engine
                  </h3>
                </div>
                <span className="text-[10px] font-semibold text-slate-400">
                  {chatHistory.length} query record(s)
                </span>
              </div>

              {chatLoading && (
                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 animate-pulse space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-800">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                    <span>Consulting MySQL database & generating Mistral 7B response...</span>
                  </div>
                  <div className="h-2.5 bg-blue-200/60 rounded-full w-3/4"></div>
                  <div className="h-2.5 bg-blue-200/40 rounded-full w-5/6"></div>
                  <div className="h-2.5 bg-blue-200/30 rounded-full w-1/2"></div>
                </div>
              )}

              {chatHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 bg-slate-50/50 space-y-3 transition-all hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[10px] font-extrabold shrink-0 mt-0.5">
                        Q
                      </div>
                      <p className="text-xs font-bold text-slate-900 leading-snug">
                        {item.question}
                      </p>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 shrink-0">
                      {item.timestamp}
                    </span>
                  </div>

                  <div className="pl-8 space-y-2.5">
                    <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-normal">
                      {item.answer}
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-[10px]">
                      <div className="flex flex-wrap items-center gap-2 text-slate-500 font-semibold">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-mono font-bold border border-purple-200">
                          <Cpu className="w-2.5 h-2.5" />
                          {item.model}
                        </span>
                        {item.sourcesSummary && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                            <Database className="w-2.5 h-2.5" />
                            <span>{item.sourcesSummary.database} Ground-Truth</span>
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => copyToClipboard(item.answer, item.id)}
                        className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 font-bold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Answer</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ATS RESUME ANALYZER                                                */}
      {/* ========================================================================= */}
      {activeTab === 'resume' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Resume Plain Text & Keyword Parser</h3>
            <textarea
              rows="12"
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl text-xs font-mono leading-relaxed focus:ring-2 focus:ring-purple-500/20 bg-slate-50/50"
              placeholder="Paste student resume text here..."
            ></textarea>
            <button
              onClick={handleAnalyzeResume}
              disabled={analyzingResume}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              {analyzingResume ? 'Analyzing via Mistral 7B GGUF Core...' : 'Run ATS Evaluation & Skill Extraction'}
            </button>
          </div>

          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800">ATS Score & Extracted Keywords</h3>
            {resumeResult ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-purple-50/80 rounded-xl border border-purple-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-purple-800 font-semibold uppercase">Overall ATS Score</span>
                    <div className="text-3xl font-extrabold text-purple-700 mt-0.5">{resumeResult.overallScore}/100</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-purple-800 font-semibold uppercase">Compatibility</span>
                    <div className="text-base font-bold text-purple-900 mt-0.5">{resumeResult.atsCompatibility}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-700 mb-2">Identified Core Competencies</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {resumeResult.extractedSkills?.map((s, idx) => (
                      <span key={idx} className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-[11px] font-bold border border-slate-200">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-semibold text-slate-800">Actionable ATS Polish Recommendations</h4>
                  <ul className="space-y-1.5 text-slate-600 text-xs">
                    {resumeResult.suggestions?.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-xs text-slate-400">
                Paste student resume text and click analyze to view real-time ATS keyword matching.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: JOB SEMANTIC FIT                                                   */}
      {/* ========================================================================= */}
      {activeTab === 'match' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Target Campus Opening</h3>
            <div className="p-4 border border-slate-200 rounded-xl space-y-2 bg-slate-50 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900 text-sm">Google India — Software Development Engineer</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-[10px]">Super Dream (₹32.5 LPA)</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-xs">
                Requires strong problem solving in Data Structures, Algorithms, distributed architectures, Docker containers, system design, and relational databases.
              </p>
            </div>

            <button
              onClick={handleMatchJob}
              disabled={matchingJob}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              {matchingJob ? 'Evaluating Semantic Vectors via Mistral 7B...' : 'Evaluate Match against Student Profile'}
            </button>
          </div>

          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Readiness & Skill Gap Synthesis</h3>
            {matchResult ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-amber-50/80 rounded-xl border border-amber-200 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-amber-800 font-semibold uppercase">Profile Match Fitness</span>
                    <div className="text-3xl font-extrabold text-amber-800 mt-0.5">{matchResult.matchPercentage}%</div>
                  </div>
                  <span className="font-bold text-xs bg-white text-amber-800 px-3 py-1.5 rounded-lg border border-amber-200">
                    {matchResult.placementReadiness}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Matched Competencies:</span>
                    <span className="text-emerald-700">{matchResult.matchedSkills?.join(', ')}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Missing Prerequisites:</span>
                    <span className="text-rose-600">{matchResult.missingSkills?.join(', ')}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-semibold text-slate-800">Targeted Action Plan (Mistral 7B)</h4>
                  <ul className="space-y-1.5 text-slate-600 text-xs">
                    {matchResult.actionPlan?.map((plan, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <ArrowRight className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>{plan}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-xs text-slate-400">
                Click evaluate to compute semantic fitness scores against corporate job descriptions.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MOCK INTERVIEW COACH                                               */}
      {/* ========================================================================= */}
      {activeTab === 'interview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800">STAR Methodology Behavioral Simulator</h3>
            <div>
              <label className="block font-semibold text-slate-700 mb-1 text-xs">Interview Question</label>
              <input
                type="text"
                value={interviewQuestion}
                onChange={(e) => setInterviewQuestion(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50/50"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1 text-xs">Candidate Response (STAR Framework)</label>
              <textarea
                rows="8"
                value={interviewAnswer}
                onChange={(e) => setInterviewAnswer(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-mono leading-relaxed bg-slate-50/50"
              ></textarea>
            </div>
            <button
              onClick={handleEvaluateAnswer}
              disabled={evaluatingInterview}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              {evaluatingInterview ? 'Evaluating Response via Mistral 7B...' : 'Evaluate Answer Structure & Impact'}
            </button>
          </div>

          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800">AI Scoring & Communication Feedback</h3>
            {interviewResult ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-emerald-800 font-semibold uppercase">Response Score</span>
                    <div className="text-3xl font-extrabold text-emerald-700 mt-0.5">{interviewResult.score}/10.0</div>
                  </div>
                  <span className="font-bold text-xs bg-white text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-200">
                    High Confidence
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-slate-700">
                  <div><strong>Structure:</strong> {interviewResult.feedback?.structure}</div>
                  <div><strong>Technical Depth:</strong> {interviewResult.feedback?.technicalDepth}</div>
                  <div><strong>Pacing:</strong> {interviewResult.feedback?.communicationPacing}</div>
                  <div className="text-amber-800 pt-2 border-t border-slate-200">
                    <strong>Recommended Polish:</strong> {interviewResult.feedback?.improvements}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-xs text-slate-400">
                Submit an answer to receive instantaneous STAR framework evaluation and coaching remarks.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
