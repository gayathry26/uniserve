import React, { useState } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Sparkles, FileText, CheckCircle2, AlertTriangle, ArrowRight, BrainCircuit, MessageSquare, Lightbulb } from 'lucide-react';

export function AIAssistant() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('resume'); // 'resume' | 'match' | 'interview'
  
  // Resume state
  const [resumeText, setResumeText] = useState(
    `B.Tech Computer Science student experienced in full-stack development.
Proficient in Python, React, Node.js, Express, Docker, and MySQL.
Built scalable microservices architecture for university event portal reducing response latency by 40%.
Completed 3-month summer internship designing automated CI/CD pipelines and REST APIs.`
  );
  const [resumeResult, setResumeResult] = useState(null);
  const [analyzingResume, setAnalyzingResume] = useState(false);

  // Job matching state
  const [matchingJob, setMatchingJob] = useState(false);
  const [matchResult, setMatchResult] = useState(null);

  // Mock interview state
  const [interviewQuestion, setInterviewQuestion] = useState('Explain how you diagnosed and resolved a high-latency query in MySQL.');
  const [interviewAnswer, setInterviewAnswer] = useState(
    `When working on our university event registration portal, we observed database queries spiking to 1200ms under 500 concurrent users.
I investigated using MySQL EXPLAIN ANALYZE and identified that a table scan was occurring because the student_id foreign key lacked a compound index with registration_status.
I designed and executed a migration to add a composite index on (student_id, status), and introduced Redis caching for read-heavy public event listings.
As a result, query latency dropped from 1200ms to 45ms, and the system handled our campus drive registration spike with zero downtime.`
  );
  const [interviewResult, setInterviewResult] = useState(null);
  const [evaluatingInterview, setEvaluatingInterview] = useState(false);

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">AI-Powered Placement Assistance & Coaching</h1>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
              <Sparkles className="w-3 h-3 text-purple-600" /> Human-in-the-Loop AI
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Intelligent ATS resume evaluation, semantic job matching, and STAR framework interview coach.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('resume')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'resume' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
            }`}
          >
            ATS Resume Analyzer
          </button>
          <button
            onClick={() => setActiveTab('match')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'match' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Job Semantic Fit
          </button>
          <button
            onClick={() => setActiveTab('interview')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'interview' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Mock Interview Coach
          </button>
        </div>
      </div>

      {/* Human Oversight Governance Banner */}
      <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-xl text-xs text-purple-900 flex items-start gap-2.5">
        <BrainCircuit className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold">Institutional AI Governance:</strong> AI tools assist student preparation and discovery. In strict compliance with placement policy, AI models do not automatically reject students or make final hiring decisions.
        </div>
      </div>

      {/* Tab 1: Resume ATS Analyzer */}
      {activeTab === 'resume' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Resume Plain Text & Keyword Parser</h3>
            <textarea
              rows="12"
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-lg text-xs font-mono leading-relaxed focus:ring-2 focus:ring-purple-500/20"
              placeholder="Paste student resume text here..."
            ></textarea>
            <button
              onClick={handleAnalyzeResume}
              disabled={analyzingResume}
              className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
            >
              {analyzingResume ? 'Analyzing via Python AI Engine...' : 'Run ATS Evaluation & Skill Extraction'}
            </button>
          </div>

          <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800">ATS Score & Extracted Keywords</h3>
            {resumeResult ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-purple-700 font-semibold uppercase">Overall ATS Compatibility</span>
                    <div className="text-3xl font-extrabold text-purple-900 mt-0.5">{resumeResult.overallScore}/100</div>
                  </div>
                  <span className="font-bold text-xs bg-white text-purple-800 px-3 py-1.5 rounded-lg border border-purple-200 shadow-2xs">
                    {resumeResult.atsCompatibility}
                  </span>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-700 mb-1.5">Extracted Technical Skills:</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {resumeResult.extractedSkills?.map((sk, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded bg-slate-100 text-slate-800 font-semibold text-[11px]">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                {resumeResult.suggestions && (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <span className="font-bold text-slate-800 block">AI Resume Improvement Suggestions:</span>
                    <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                      {resumeResult.suggestions.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-slate-400">
                Click "Run ATS Evaluation" to analyze skills and get recommendations.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Job Semantic Fit */}
      {activeTab === 'match' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Semantic Job Fit: Google SDE-1 vs Aditya Varma (CSE)</h3>
              <p className="text-xs text-slate-500">Evaluates candidate skills against company recruitment round requirements.</p>
            </div>
            <button
              onClick={handleMatchJob}
              disabled={matchingJob}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs cursor-pointer"
            >
              {matchingJob ? 'Matching...' : 'Calculate Semantic Match'}
            </button>
          </div>

          {matchResult ? (
            <div className="space-y-4 text-xs pt-4 border-t border-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <span className="text-[11px] text-emerald-800 font-medium">Match Fit Ratio</span>
                  <div className="text-2xl font-bold text-emerald-700 mt-1">{matchResult.matchPercentage}%</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <span className="text-[11px] text-blue-800 font-medium">Placement Readiness</span>
                  <div className="text-2xl font-bold text-blue-700 mt-1">{matchResult.placementReadiness}</div>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <span className="text-[11px] text-amber-800 font-medium">Missing Key Tech</span>
                  <div className="text-sm font-bold text-amber-900 mt-1">{matchResult.missingSkills?.join(', ')}</div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1.5">Personalized Candidate Action Plan:</span>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  {matchResult.actionPlan?.map((plan, i) => (
                    <li key={i}>{plan}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              Click Calculate Semantic Match to compare candidate profile with company job description.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Mock Interview Coach */}
      {activeTab === 'interview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Interview Question & Response Simulator</h3>
            <div>
              <label className="block font-semibold text-slate-700 mb-1 text-xs">Interview Question</label>
              <input
                type="text"
                value={interviewQuestion}
                onChange={(e) => setInterviewQuestion(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1 text-xs">Candidate Response (STAR Framework)</label>
              <textarea
                rows="8"
                value={interviewAnswer}
                onChange={(e) => setInterviewAnswer(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-mono leading-relaxed"
              ></textarea>
            </div>
            <button
              onClick={handleEvaluateAnswer}
              disabled={evaluatingInterview}
              className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs cursor-pointer"
            >
              {evaluatingInterview ? 'Evaluating Response...' : 'Evaluate Answer Structure & Impact'}
            </button>
          </div>

          <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
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
              <div className="py-16 text-center text-xs text-slate-400">
                Submit an answer to receive instantaneous STAR framework evaluation and coaching remarks.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
