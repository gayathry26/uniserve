import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import Modal from '../components/Modal';
import { apiFetch, getSessionUser, clearSession } from '../services/api';

const AttentionGraph = ({ history }) => {
    if (!history || history.length === 0) return (
        <div className="h-24 flex items-center justify-center border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs italic">
            No attention data available for this session.
        </div>
    );
    const maxScore = 100;
    const width = 600;
    const height = 120;
    const points = history.map((h, i) => {
        const x = (i / (history.length - 1 || 1)) * width;
        const y = height - (h.score / maxScore) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-6">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Attention Flow Analysis</h4>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#171717] text-[#fafafa] dark:bg-[#fafafa] dark:text-[#0a0a0a]"></div>
                        <span className="text-[10px] font-bold text-slate-500">Score %</span>
                    </div>
                </div>
            </div>
            <div className="relative w-full h-[120px]">
                <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
                    <defs>
                        <linearGradient id="grad-admin" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style={{ stopColor: '#171717', stopOpacity: 0.15 }} />
                            <stop offset="100%" style={{ stopColor: '#171717', stopOpacity: 0 }} />
                        </linearGradient>
                    </defs>
                    <path d={`M 0 ${height} L ${points} L ${width} ${height} Z`} fill="url(#grad-admin)" />
                    <polyline fill="none" stroke="#171717" strokeWidth="2.5" points={points} strokeLinejoin="round" strokeLinecap="round" />
                    <circle cx="0" cy={height - (history[0].score / maxScore) * height} r="4" fill="#171717" stroke="white" strokeWidth="2" />
                    <circle cx={width} cy={height - (history[history.length - 1].score / maxScore) * height} r="4" fill="#171717" stroke="white" strokeWidth="2" />
                </svg>
            </div>
            <div className="flex justify-between mt-4">
                <span className="text-[10px] font-black text-slate-400 uppercase">Session Start</span>
                <span className="text-[10px] font-black text-slate-400 uppercase">Submission</span>
            </div>
        </div>
    );
};

const AttemptDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = getSessionUser();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [qMap, setQMap] = useState({});

    const loadDetail = async () => {
        try {
            setLoading(true);
            const result = await apiFetch(`/api/admin/analytics/attempts/${id}/details`);
            setData(result);
            
            // If the remote backend hasn't been updated and returns raw answers_json, fetch missing questions
            if ((!result?.answers || result.answers.length === 0) && result?.attempt?.answers_json) {
                try {
                    const qRes = await apiFetch('/api/admin/questions?limit=5000');
                    if (qRes && qRes.items) {
                        const map = {};
                        qRes.items.forEach(q => { map[q.id] = q; });
                        setQMap(map);
                    }
                } catch (fallbackErr) {
                    console.warn('Failed to fetch fallback questions dictionary:', fallbackErr);
                }
            }
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/admin/login');
            return;
        }
        loadDetail();
    }, [id]);

    useEffect(() => {
        if (data?.attempt) {
            document.title = `${data.attempt.name} - Evaluation Report`;
        }
        return () => {
            document.title = 'Palette Production LMS';
        };
    }, [data?.attempt]);

    const logout = () => {
        clearSession();
        navigate('/admin/login');
    };

    if (loading) return (
        <AppShell title="Loading Detail..." user={user} onLogout={logout} items={[]}>
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
            </div>
        </AppShell>
    );

    if (error) return (
        <AppShell title="Error" user={user} onLogout={logout} items={[]}>
            <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                <p className="font-bold">Failed to load attempt details</p>
                <p>{error}</p>
                <button onClick={() => navigate('/admin/dashboard/results')} className="mt-4 text-sm font-bold underline">Go Back</button>
            </div>
        </AppShell>
    );

    const attempt = data?.attempt;
    const logs = data?.logs || [];
    const net = attempt?.network_stats ? (typeof attempt.network_stats === 'string' ? JSON.parse(attempt.network_stats) : attempt.network_stats) : {};

    // Check if backend returned full answers joined with questions
    const baseAnswers = (data?.answers && data.answers.length > 0)
        ? data.answers.map(ans => ({
            questionId: ans.question_id,
            question: ans.question,
            optionA: ans.option_a,
            optionB: ans.option_b,
            optionC: ans.option_c,
            optionD: ans.option_d,
            selectedOption: ans.selected_option,
            codingResponse: ans.coding_response,
            correctOption: ans.correct_option,
            isCorrect: !!ans.is_correct,
            questionType: ans.question_type,
            subject: ans.subject
        }))
        : (attempt?.answers_json ? (typeof attempt.answers_json === 'string' ? JSON.parse(attempt.answers_json) : attempt.answers_json) : []);

    // Enrich legacy answers with qMap if the question text is missing
    const answers = baseAnswers.map(ans => {
        if (!ans.question && qMap[ans.questionId]) {
            const q = qMap[ans.questionId];
            return {
                ...ans,
                question: q.question,
                subject: ans.subject || q.subject,
                questionType: ans.questionType || q.question_type,
                optionA: ans.optionA || q.option_a,
                optionB: ans.optionB || q.option_b,
                optionC: ans.optionC || q.option_c,
                optionD: ans.optionD || q.option_d,
                correctOption: ans.correctOption || q.correct_option
            };
        }
        return ans;
    });

    return (
        <AppShell
            title={`Results: ${attempt?.name || 'Loading'}`}
            user={user}
            onLogout={logout}
            items={[
                { to: '/admin/dashboard/questions', label: 'Question Bank' },
                { to: '/admin/dashboard/results', label: 'Results' },
                { to: '/admin/dashboard/analytics', label: 'Analytics' },
                { to: '/admin/exam-simulator', label: 'Test Simulator 🚀' }
            ]}
        >
            <div className="max-w-6xl mx-auto space-y-6 pb-12 print:hidden">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate('/admin/dashboard/results')}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        ← Back to Results
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowAnalysis(true)}
                            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-100"
                        >
                            Open Answer Analysis
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all"
                        >
                            Print Report
                        </button>
                    </div>
                </div>

                {/* Student Stats Card */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 text-2xl font-black">
                                        {(attempt?.name || 'ST').substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900">{attempt?.name}</h2>
                                        <p className="text-slate-500 font-medium">Roll Number: {attempt?.roll_number} • {attempt?.department}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">IP Address</p>
                                    <p className="text-sm font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">{attempt?.ip_address || 'Unavailable'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Score</p>
                                    <p className="text-xl font-black text-brand-600">{attempt?.score} / 42</p>
                                </div>
                                <div className={`p-4 rounded-xl border ${(attempt?.attention_score || 0) >= 90 ? 'bg-secondary text-foreground border-border' : (attempt?.attention_score || 0) >= 70 ? 'bg-brand-900 border-brand-800' : 'bg-red-900 border-red-800'} text-white`}>
                                    <p className="text-xs font-bold opacity-70 uppercase tracking-wider mb-1">Attention Score</p>
                                    <p className="text-xl font-black">{Number(attempt?.attention_score || 0).toFixed(2)}%</p>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Violations</p>
                                    <p className={`text-xl font-black ${attempt?.violations > 3 ? 'text-red-600' : 'text-slate-800'}`}>{attempt?.violations}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                                    <p className={`text-sm font-black uppercase ${attempt?.status === 'submitted' ? 'text-foreground' : 'text-foreground'}`}>{attempt?.status}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-4">Network Analysis</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Avg. Latency (RTT)</span>
                                    <span className="text-lg font-bold text-slate-700">{net?.rtt || 0} ms</span>
                                    <div className="w-full h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                        <div className="h-full bg-[#171717] text-[#fafafa] dark:bg-[#fafafa] dark:text-[#0a0a0a]" style={{ width: `${Math.max(10, 100 - (net?.rtt / 10))}%` }}></div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Downlink Speed</span>
                                    <span className="text-lg font-bold text-slate-700">{net?.downlink || 0} Mbps</span>
                                    <div className="w-full h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                        <div className="h-full bg-[#171717] text-[#fafafa] dark:bg-[#fafafa] dark:text-[#0a0a0a]" style={{ width: `${Math.min(100, (net?.downlink * 10))}%` }}></div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Network Quality</span>
                                    <span className={`text-lg font-bold uppercase ${net?.effectiveType === '4g' ? 'text-foreground' : 'text-foreground'}`}>
                                        {net?.effectiveType || 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-4">Focus & Engagement Timeline</h3>
                            <AttentionGraph history={attempt?.attention_history ? (typeof attempt.attention_history === 'string' ? JSON.parse(attempt.attention_history) : attempt.attention_history) : []} />
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800">Proctoring Timeline</h3>
                                <span className="text-xs font-bold text-slate-500">Live Audit Log</span>
                            </div>
                            <div className="p-4 max-h-[400px] overflow-y-auto">
                                {logs.length > 0 ? (
                                    <div className="space-y-3">
                                        {logs.map((log, i) => (
                                            <div key={i} className={`p-3 rounded-xl border transition-all ${log.event_type.toLowerCase().includes('violation') ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className={`text-[10px] font-black uppercase ${log.event_type.toLowerCase().includes('violation') ? 'text-red-700' : 'text-slate-500'}`}>
                                                        {log.event_type}
                                                    </span>
                                                    <span className="text-[10px] font-mono text-slate-400">{log.event_time}</span>
                                                </div>
                                                <p className="text-xs text-slate-700 leading-relaxed">{log.event_detail}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-slate-400 text-sm italic">No proctor logs found.</div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#171717] text-[#fafafa] dark:bg-[#fafafa] dark:text-[#0a0a0a] animate-pulse"></span>
                                Session Information
                            </h4>
                            <div className="space-y-4 text-sm">
                                <div className="flex justify-between border-b border-slate-50 pb-2">
                                    <span className="text-slate-500 font-bold uppercase text-[10px]">Subject</span>
                                    <span className="font-bold text-slate-800">{attempt?.subject}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-50 pb-2">
                                    <span className="text-slate-500 font-bold uppercase text-[10px]">Started At</span>
                                    <span className="font-bold text-slate-800">{attempt?.started_at ? new Date(attempt.started_at).toLocaleTimeString() : '-'}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-50 pb-2">
                                    <span className="text-slate-500 font-bold uppercase text-[10px]">Submitted At</span>
                                    <span className="font-bold text-slate-800">{attempt?.submitted_at ? new Date(attempt.submitted_at).toLocaleTimeString() : '-'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 font-bold uppercase text-[10px]">Total Duration</span>
                                    <span className="px-3 py-1 bg-brand-50 text-brand-700 rounded-lg font-black text-sm border border-brand-100">
                                        {(() => {
                                            if (!attempt?.started_at || !attempt?.submitted_at) return 'N/A';
                                            const diff = new Date(attempt.submitted_at) - new Date(attempt.started_at);
                                            const mins = Math.floor(diff / 60000);
                                            const secs = Math.floor((diff % 60000) / 1000);
                                            if (mins === 0) return `${secs} secs`;
                                            return `${mins}m ${secs}s`;
                                        })()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <h4 className="font-bold text-slate-800 mb-4">Security Overview</h4>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary text-foreground">
                                    <div className="w-2 h-2 rounded-full bg-[#171717] text-[#fafafa] dark:bg-[#fafafa] dark:text-[#0a0a0a]"></div>
                                    <span className="text-xs font-bold">Lockdown Mode Active</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary text-foreground">
                                    <div className="w-2 h-2 rounded-full bg-[#171717] text-[#fafafa] dark:bg-[#fafafa] dark:text-[#0a0a0a]"></div>
                                    <span className="text-xs font-bold">Single Monitor Verified</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 text-slate-500">
                                    <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                                    <span className="text-xs font-bold">Encrypted Session Data</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <Modal open={showAnalysis} title="In-depth Answer Analysis" onClose={() => setShowAnalysis(false)} size="4xl">
                    <div className="space-y-6 pr-2">
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 flex items-center justify-between flex-wrap gap-4">
                            <div>
                                <p className="text-sm text-slate-600 font-medium">Reviewing evaluation details for <strong className="text-slate-900">{attempt?.name}</strong>.</p>
                                <p className="text-xs text-slate-400 mt-0.5">Roll Number: {attempt?.roll_number} • Department: {attempt?.department}</p>
                            </div>
                            <div className="flex gap-2 text-xs font-bold text-slate-700">
                                <span className="px-3 py-1 bg-white border border-slate-200 rounded-full shadow-sm">Score: {attempt?.score} / 42</span>
                                <span className={`px-3 py-1 rounded-full text-white shadow-sm ${(attempt?.attention_score || 0) >= 70 ? 'bg-brand-600' : 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-black'}`}>Attention: {Number(attempt?.attention_score || 0).toFixed(1)}%</span>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {answers.length > 0 ? answers.map((ans, i) => {
                                const subj = (ans.subject || '').toLowerCase();
                                const hasCode = ans.codingResponse && String(ans.codingResponse).trim().length > 0;
                                const isCoding = ans.questionType === 'coding' ||
                                    (subj && (subj.includes('vlsi') || subj.includes('iot') || subj.includes('python') || subj.includes('java') || subj.includes('c programming') || subj.includes('cpp') || subj.includes('c++'))) ||
                                    hasCode;
                                const isMCQ = !isCoding;
                                const isSkipped = isMCQ && !ans.selectedOption;

                                return (
                                    <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm transition-all hover:shadow-md">
                                        {/* Header Info */}
                                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-black px-2.5 py-1 bg-slate-900 text-white rounded-lg uppercase tracking-wide">Q{i + 1}</span>
                                                {ans.subject && (
                                                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-full uppercase tracking-wider">
                                                        {ans.subject}
                                                    </span>
                                                )}
                                                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 border rounded-full uppercase tracking-wider ${isCoding
                                                        ? 'bg-secondary text-foreground border-border'
                                                        : 'bg-secondary text-foreground border-border'
                                                    }`}>
                                                    {isCoding ? 'Technical / Concept' : 'MCQ Option'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {isMCQ && (
                                                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${ans.isCorrect
                                                            ? 'bg-secondary text-foreground border-border'
                                                            : isSkipped
                                                                ? 'bg-secondary text-foreground border-border'
                                                                : 'bg-secondary text-foreground border-border'
                                                        }`}>
                                                        {ans.isCorrect ? '✓ Correct' : isSkipped ? '⚠ Skipped' : '✗ Incorrect'}
                                                    </span>
                                                )}
                                                {isCoding && (
                                                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-slate-50 text-slate-500 border border-slate-200">
                                                        Submitted Answer
                                                    </span>
                                                )}
                                                <span className="text-[10px] font-bold text-slate-400">ID: {ans.questionId}</span>
                                            </div>
                                        </div>

                                        {/* Question Text */}
                                        <div className="mb-4">
                                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Question Description</h4>
                                            <p className="text-slate-800 font-semibold text-sm leading-relaxed whitespace-pre-wrap">{ans.question || 'No question text available.'}</p>
                                        </div>

                                        {/* MCQ Options or Coding Window */}
                                        {isMCQ ? (
                                            <div className="mt-4">
                                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Options & Student Evaluation</h4>
                                                {ans.optionA || ans.optionB || ans.optionC || ans.optionD ? (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {[
                                                            { key: 'A', text: ans.optionA },
                                                            { key: 'B', text: ans.optionB },
                                                            { key: 'C', text: ans.optionC },
                                                            { key: 'D', text: ans.optionD }
                                                        ].map((opt) => {
                                                            const isSelected = ans.selectedOption === opt.key;
                                                            const isCorrectOpt = ans.correctOption === opt.key;

                                                            let cardStyle = 'border-slate-100 bg-slate-50 text-slate-700';
                                                            let icon = null;

                                                            if (isCorrectOpt) {
                                                                cardStyle = 'border-border bg-secondary text-foreground font-bold';
                                                                icon = (
                                                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#171717] text-[#fafafa] dark:bg-[#fafafa] dark:text-[#0a0a0a] text-white text-xs mr-2 flex-shrink-0">✓</span>
                                                                );
                                                            } else if (isSelected && !ans.isCorrect) {
                                                                cardStyle = 'border-border bg-secondary text-foreground font-bold';
                                                                icon = (
                                                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-neutral-800 text-white dark:bg-neutral-200 dark:text-black text-white text-xs mr-2 flex-shrink-0">✗</span>
                                                                );
                                                            }

                                                            return (
                                                                <div key={opt.key} className={`flex items-center p-3.5 rounded-xl border text-xs transition-all ${cardStyle}`}>
                                                                    {icon || (
                                                                        <span className={`flex items-center justify-center w-5 h-5 rounded-lg text-[10px] font-black mr-2 flex-shrink-0 border ${isSelected
                                                                                ? 'bg-slate-800 border-slate-800 text-white'
                                                                                : 'bg-white border-slate-200 text-slate-400'
                                                                            }`}>
                                                                            {opt.key}
                                                                        </span>
                                                                    )}
                                                                    <span className="flex-1 leading-relaxed">{opt.text || 'Empty option text'}</span>
                                                                    {isSelected && (
                                                                        <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700 ml-2">Selected</span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    /* Simple Fallback option design */
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className={`p-3 rounded-xl border ${ans.isCorrect ? 'bg-secondary border-border' : 'bg-secondary border-border'}`}>
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Student Option</p>
                                                            <p className={`font-bold text-sm ${ans.isCorrect ? 'text-foreground' : 'text-foreground'}`}>{ans.selectedOption || 'Skipped'}</p>
                                                        </div>
                                                        <div className="p-3 rounded-xl border border-slate-100 bg-white">
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Correct Option</p>
                                                            <p className="font-bold text-sm text-slate-700">{ans.correctOption}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            /* Technical / Coding response display */
                                            <div className="mt-4">
                                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2.5">Student Submission Answer</h4>
                                                {(() => {
                                                    const examSubj = (attempt?.subject || '').toLowerCase();
                                                    const checkStr = subj || examSubj;
                                                    const isNotepad = checkStr.includes('vlsi') || checkStr.includes('iot');
                                                    
                                                    const displaySubj = ans.subject || (attempt?.subject && attempt.subject.toLowerCase() !== 'aptitude' ? attempt.subject : 'Technical');

                                                    if (!isNotepad) {
                                                        return (
                                                            /* Code Editor Look */
                                                            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-inner font-mono text-xs">
                                                                <div className="flex justify-between items-center px-4 py-2.5 bg-slate-950 border-b border-slate-800">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <div className="w-2.5 h-2.5 rounded-full bg-neutral-800 text-white dark:bg-neutral-200 dark:text-black"></div>
                                                                        <div className="w-2.5 h-2.5 rounded-full bg-neutral-800 text-white dark:bg-neutral-200 dark:text-black"></div>
                                                                        <div className="w-2.5 h-2.5 rounded-full bg-[#171717] text-[#fafafa] dark:bg-[#fafafa] dark:text-[#0a0a0a]"></div>
                                                                        <span className="text-[10px] text-slate-400 ml-2 font-bold uppercase tracking-wider">{displaySubj} Compiler Submission</span>
                                                                    </div>
                                                                    <span className="text-[9px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded uppercase">{displaySubj}</span>
                                                                </div>
                                                                <pre className="p-4 overflow-x-auto text-slate-200 leading-relaxed max-h-[300px] overflow-y-auto whitespace-pre-wrap">
                                                                    <code>{ans.codingResponse || '# No code was submitted for this question.'}</code>
                                                                </pre>
                                                            </div>
                                                        );
                                                    } else {
                                                        return (
                                                            /* Notepad look for IoT/VLSI */
                                                            <div className="bg-secondary rounded-xl border border-border overflow-hidden shadow-inner font-sans text-sm">
                                                                <div className="flex justify-between items-center px-4 py-2.5 bg-secondary border-b border-border">
                                                                    <span className="text-[10px] text-foreground font-bold uppercase tracking-wider">Concept Notepad Explanation</span>
                                                                    <span className="text-[9px] font-bold text-foreground bg-secondary px-2 py-0.5 rounded uppercase">{displaySubj}</span>
                                                                </div>
                                                                <p className="p-4 text-slate-800 whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto font-medium">
                                                                    {ans.codingResponse || 'No notepad explanation was submitted.'}
                                                                </p>
                                                            </div>
                                                        );
                                                    }
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                );
                            }) : (
                                <div className="p-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl italic">No answers recorded for this attempt.</div>
                            )}
                        </div>
                    </div>
                </Modal>
            </div>

            {/* --- PROFESSIONAL PRINTABLE REPORT FORMAT --- */}
            <div className="hidden print:block bg-white text-black p-8 w-full">
                <style>
                    {`
                    @media print {
                        @page {
                            margin: 0; /* Removes default browser headers and footers */
                        }
                        body {
                            padding-top: 1cm;
                            padding-bottom: 1cm;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                    }
                    `}
                </style>
                <div className="border-b-4 border-slate-900 pb-4 mb-8">
                        <h1 className="text-3xl font-black uppercase tracking-tight">Palette Production Student Evaluation Report</h1>
                        <p className="text-slate-500 font-bold mt-1">Official Technical Analysis & Proctoring Audit</p>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <h2 className="text-xs font-black uppercase text-slate-400 mb-2">Candidate Details</h2>
                            <p className="text-xl font-bold">{attempt?.name}</p>
                            <p className="text-slate-600">Roll No: {attempt?.roll_number}</p>
                            <p className="text-slate-600">Department: {attempt?.department}</p>
                            <p className="text-slate-600 mt-2 text-xs">IP Address: {attempt?.ip_address}</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-xs font-black uppercase text-slate-400 mb-2">Evaluation Summary</h2>
                            <p className="text-2xl font-black text-slate-900">Score: {attempt?.score} / 42</p>
                            <p className="text-slate-600">Attention Score: {Number(attempt?.attention_score || 0).toFixed(2)}%</p>
                            <p className="text-slate-600">Duration: {attempt?.started_at && attempt?.submitted_at ? `${Math.floor((new Date(attempt.submitted_at) - new Date(attempt.started_at)) / 60000)} minutes` : 'N/A'}</p>
                        </div>
                    </div>

                    <h3 className="text-lg font-black bg-slate-100 py-2 px-4 uppercase tracking-widest mb-6 border-l-4 border-slate-900">Complete Answer Analysis</h3>

                    <div className="space-y-8">
                        {answers.length > 0 ? answers.map((ans, i) => {
                            const subj = (ans.subject || '').toLowerCase();
                            const hasCode = ans.codingResponse && String(ans.codingResponse).trim().length > 0;
                            const isCoding = ans.questionType === 'coding' ||
                                (subj && (subj.includes('vlsi') || subj.includes('iot') || subj.includes('python') || subj.includes('java') || subj.includes('c programming') || subj.includes('cpp') || subj.includes('c++'))) ||
                                hasCode;
                            const isMCQ = !isCoding;
                            const isSkipped = isMCQ && !ans.selectedOption;
                            
                            const examSubj = (attempt?.subject || '').toLowerCase();
                            const checkStr = subj || examSubj;
                            const isNotepad = checkStr.includes('vlsi') || checkStr.includes('iot');
                            const displaySubj = ans.subject || (attempt?.subject && attempt.subject.toLowerCase() !== 'aptitude' ? attempt.subject : 'Technical');

                            return (
                                <div key={i} className="pb-6 border-b border-slate-200" style={{ pageBreakInside: 'avoid' }}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-bold text-slate-800">
                                            <span className="inline-block bg-slate-900 text-white px-2 py-0.5 rounded text-xs mr-2 uppercase">Q{i + 1}</span>
                                            <span className="text-xs uppercase tracking-wider text-slate-500">{isCoding ? `${displaySubj} Submission` : 'MCQ Option'}</span>
                                        </div>
                                        {isMCQ && (
                                            <div className={`text-xs font-bold uppercase ${ans.isCorrect ? 'text-foreground' : isSkipped ? 'text-foreground' : 'text-foreground'}`}>
                                                {ans.isCorrect ? 'Correct' : isSkipped ? 'Skipped' : 'Incorrect'}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <p className="text-sm text-slate-900 font-semibold mb-4 whitespace-pre-wrap">{ans.question || 'No question text available.'}</p>

                                    {isMCQ ? (
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="block text-[10px] font-bold text-slate-400 uppercase">Student Option</span>
                                                <span className={`font-bold ${ans.isCorrect ? 'text-foreground' : 'text-foreground'}`}>{ans.selectedOption || 'Skipped'}</span>
                                            </div>
                                            <div>
                                                <span className="block text-[10px] font-bold text-slate-400 uppercase">Correct Option</span>
                                                <span className="font-bold text-slate-800">{ans.correctOption}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-2">
                                            <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Student {isNotepad ? 'Explanation' : 'Code'}</span>
                                            <div className={`p-4 rounded-lg font-mono text-xs overflow-hidden ${isNotepad ? 'bg-slate-50 border border-slate-200 text-slate-800' : 'bg-slate-900 text-slate-200'}`}>
                                                <pre className="whitespace-pre-wrap"><code>{ans.codingResponse || 'No submission provided.'}</code></pre>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        }) : (
                            <p className="italic text-slate-500">No answers recorded.</p>
                        )}
                    </div>
                </div>
        </AppShell>
    );
};

export default AttemptDetail;
