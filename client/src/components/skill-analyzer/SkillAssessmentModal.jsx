import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Award,
  ArrowRight,
  RotateCcw,
  Code2,
  Database,
  BrainCircuit,
  Cpu,
} from 'lucide-react';

export function SkillAssessmentModal({
  isOpen,
  onClose,
  onAssessmentCompleted,
}) {
  if (!isOpen) return null;

  const [activeTopic, setActiveTopic] = useState('programming');
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const topics = [
    {
      id: 'programming',
      title: 'Programming & Logic',
      desc: 'JavaScript & Python fundamentals, closures, Big-O complexity, immutability',
      icon: Code2,
    },
    {
      id: 'sql',
      title: 'SQL & Database Queries',
      desc: 'Relational joins, WHERE vs HAVING, indexing, ACID transactions',
      icon: Database,
    },
    {
      id: 'aptitude',
      title: 'Technical Aptitude',
      desc: 'Quantitative problem solving, work & time, series, percentages',
      icon: BrainCircuit,
    },
    {
      id: 'technical-fundamentals',
      title: 'Technical Fundamentals',
      desc: 'HTTP status codes, REST idempotency, CORS security, Git branching',
      icon: Cpu,
    },
  ];

  // Fetch questions for active topic
  const loadQuiz = async (topicId) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setAnswers({});
    setCurrentIdx(0);
    try {
      const res = await apiClient.get(`/skill-analyzer/assessment/quiz/${topicId}`);
      if (res.data?.success) {
        setQuestions(res.data.questions || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load assessment questions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuiz(activeTopic);
  }, [activeTopic]);

  const handleSelectOption = (questionId, optionIdx) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiClient.post('/skill-analyzer/assessment/submit', {
        topic: activeTopic,
        answers,
      });
      if (res.data?.success) {
        setResult(res.data);
        if (onAssessmentCompleted) {
          onAssessmentCompleted(res.data);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit assessment answers.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentQ = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;
  const isComplete = questions.length > 0 && answeredCount === questions.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-card text-card-foreground border border-border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                CampusCorp Technical Skill Assessment
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Earn an official verified credential badge by completing a short 3-minute quiz
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Topic Selector Tabs */}
        {!result && (
          <div className="p-3 border-b border-border bg-card flex gap-2 overflow-x-auto no-scrollbar">
            {topics.map((t) => {
              const Icon = t.icon;
              const isActive = activeTopic === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTopic(t.id)}
                  disabled={loading || submitting}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                      : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-neutral-200 dark:hover:bg-neutral-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.title}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-16 text-xs text-muted-foreground">
              <span className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin inline-block mb-2" />
              <p>Loading assessment challenge...</p>
            </div>
          ) : result ? (
            /* Results Screen */
            <div className="space-y-5 animate-in fade-in duration-200">
              <div
                className={`p-6 rounded-2xl border text-center ${
                  result.passed
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-amber-500/10 border-amber-500/30'
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-3 ${
                    result.passed
                      ? 'bg-emerald-500 text-white'
                      : 'bg-amber-500 text-white'
                  }`}
                >
                  {result.passed ? (
                    <Award className="w-8 h-8" />
                  ) : (
                    <RotateCcw className="w-8 h-8" />
                  )}
                </div>
                <h4 className="text-base font-bold text-foreground">
                  {result.passed ? 'Skill Verification Earned!' : 'Assessment Incomplete'}
                </h4>
                <p className="text-2xl font-black text-foreground mt-1">
                  {result.score} / {result.maxScore} ({result.percentage}%)
                </p>
                <p className="text-xs text-muted-foreground max-w-md mx-auto mt-2 leading-relaxed">
                  {result.message}
                </p>
              </div>

              {/* Review of Questions */}
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Question Review & Explanations
                </h5>
                <div className="space-y-3">
                  {result.review?.map((rev, i) => (
                    <div
                      key={rev.id}
                      className={`p-3.5 rounded-xl border text-xs ${
                        rev.isCorrect
                          ? 'border-emerald-500/30 bg-emerald-500/5'
                          : 'border-red-500/30 bg-red-500/5'
                      }`}
                    >
                      <div className="flex items-start gap-2 mb-1">
                        {rev.isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        )}
                        <span className="font-semibold text-foreground">
                          {i + 1}. {rev.question}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground pl-6 mt-1 leading-relaxed">
                        <strong className="text-foreground">Explanation:</strong> {rev.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : currentQ ? (
            /* Active Question Screen */
            <div className="space-y-5">
              {/* Progress Bar & Counter */}
              <div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5 font-medium">
                  <span>Question {currentIdx + 1} of {questions.length}</span>
                  <span>{answeredCount} of {questions.length} Answered</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-purple-600 transition-all duration-300"
                    style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Problem Prompt */}
              <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block mb-1">
                  Topic: {activeTopic.toUpperCase()}
                </span>
                <p className="text-sm font-bold text-foreground leading-relaxed">
                  {currentQ.question}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-2">
                {currentQ.options?.map((opt, idx) => {
                  const isSelected = answers[currentQ.id] === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectOption(currentQ.id, idx)}
                      className={`w-full p-3 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-purple-500 bg-purple-50/60 dark:bg-purple-950/30 text-purple-950 dark:text-purple-200 font-semibold ring-1 ring-purple-500'
                          : 'border-border bg-card text-foreground hover:bg-secondary/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-5 h-5 rounded-full border text-[11px] flex items-center justify-center font-bold ${
                            isSelected
                              ? 'border-purple-600 bg-purple-600 text-white'
                              : 'border-muted-foreground text-muted-foreground'
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{opt}</span>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-xs text-muted-foreground">
              No questions found for this topic.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between bg-secondary/20">
          {result ? (
            <div className="w-full flex items-center justify-end gap-2">
              <button
                onClick={() => loadQuiz(activeTopic)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                Retake Quiz
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition-all shadow-xs"
              >
                Return to Skill Analyzer
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                disabled={currentIdx === 0}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  currentIdx === 0 ? 'text-muted-foreground/40 cursor-not-allowed' : 'text-foreground hover:bg-secondary'
                }`}
              >
                Previous
              </button>

              <div className="flex items-center gap-2">
                {currentIdx < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-secondary text-foreground hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                  >
                    Next Question
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!isComplete || submitting}
                    className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all ${
                      !isComplete || submitting
                        ? 'bg-neutral-300 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-500 text-white active:scale-95'
                    }`}
                  >
                    {submitting ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Grading...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Submit for Verification</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
