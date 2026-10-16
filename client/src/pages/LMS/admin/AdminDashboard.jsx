import React, { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import AppShell from '../components/AppShell';
import Modal from '../components/Modal';
import { apiFetch, clearSession, getSessionUser } from '../services/api';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

const emptyForm = {
  subject: '',
  question: '',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct_option: 'A',
  difficulty: 'medium',
  tags: '',
  question_type: 'mcq',
  test_cases: '[]'
};

const AdminDashboard = ({ section = 'questions' }) => {
  const navigate = useNavigate();
  const user = getSessionUser();
  const [globalCollegeId, setGlobalCollegeId] = useState('All');
  const [form, setForm] = useState(emptyForm);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState({ search: '', subject: '', difficulty: '', page: 1, bank_key: '' });
  const [editing, setEditing] = useState(null);
  const [bulkFile, setBulkFile] = useState(null);
  const [importBankName, setImportBankName] = useState('');
  const [analytics, setAnalytics] = useState({ totals: {}, subjectStats: [], departmentStats: [] });
  const [allAttempts, setAllAttempts] = useState([]);
  const [deptConfigs, setDeptConfigs] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [editingStudent, setEditingStudent] = useState(null);
  const [newStudent, setNewStudent] = useState({ roll_number: '', name: '', department: '', password: 'paletteproduction@2027', year: '1', college_id: '' });
  const [colleges, setColleges] = useState([]);
  const [showCollegeModal, setShowCollegeModal] = useState(false);
  const [editingCollege, setEditingCollege] = useState(null);
  const [newCollege, setNewCollege] = useState({ name: '', status: 'active' });
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [tests, setTests] = useState([]);
  const [showAddTestModal, setShowAddTestModal] = useState(false);
  const [newTest, setNewTest] = useState({
    test_name: '',
    student_year: 'All',
    departments: 'All',
    question_banks: '',
    duration_minutes: 90,
    aptitude_duration: 90,
    technical_duration: 0,
    status: 'active',
    phase1_name: 'Phase 1: Aptitude',
    phase2_name: ''
  });
  // Dynamic phases for the test modal: [{name, duration}]
  const [testPhases, setTestPhases] = useState([{ name: 'Phase 1: Aptitude', duration: 90 }]);
  const [editingTest, setEditingTest] = useState(null);
  const [newSubject, setNewSubject] = useState('');
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedTest, setSelectedTest] = useState('All');
  const [selectedStudentYear, setSelectedStudentYear] = useState(null);
  const [selectedResultYear, setSelectedResultYear] = useState(null);
  const [selectedResultTestId, setSelectedResultTestId] = useState(null);
  const [attemptToDelete, setAttemptToDelete] = useState(null);
  const [siteStatus, setSiteStatus] = useState('on');

  const [assignments, setAssignments] = useState([]);
  const [newAssignment, setNewAssignment] = useState({
    department: '',
    subject: 'Aptitude',
    phase1_name: 'Phase 1: Aptitude',
    phase1_question_count: 40,
    phase2_name: 'Phase 2: Technical',
    phase2_subjects: '',
    phase2_selection_mode: 'all',
    phase2_limit: 10
  });
  const [showAddAssignmentModal, setShowAddAssignmentModal] = useState(false);

  const [questionBanks, setQuestionBanks] = useState([]);
  const [renamingBank, setRenamingBank] = useState(null);
  const [renameBankName, setRenameBankName] = useState('');

  const loadQuestions = async () => {
    const paramsObj = { ...query, limit: '10' };
    if (globalCollegeId !== 'All') paramsObj.college_id = globalCollegeId;
    const params = new URLSearchParams(paramsObj);
    const data = await apiFetch(`/api/admin/questions?${params.toString()}`);
    setRows(data.items);
    setTotal(data.total);
  };

  const loadStudents = async (searchVal = studentSearch) => {
    const paramsObj = searchVal ? { search: searchVal } : {};
    if (globalCollegeId !== 'All') paramsObj.college_id = globalCollegeId;
    const params = new URLSearchParams(paramsObj);
    const data = await apiFetch(`/api/admin/users?${params.toString()}`);
    setStudents(data);
  };

  const loadColleges = async () => {
    const data = await apiFetch('/api/admin/colleges');
    setColleges(data);
  };

  const handleCreateCollege = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/api/admin/colleges', {
        method: 'POST',
        body: JSON.stringify(newCollege)
      });
      setMessage(`College "${newCollege.name}" created successfully`);
      setShowCollegeModal(false);
      setNewCollege({ name: '', status: 'active' });
      loadColleges();
    } catch (err) {
      setMessage(`Error creating college: ${err.message}`);
    }
  };

  const handleUpdateCollege = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/admin/colleges/${editingCollege.id}`, {
        method: 'PUT',
        body: JSON.stringify(editingCollege)
      });
      setMessage(`College updated successfully`);
      setEditingCollege(null);
      loadColleges();
    } catch (err) {
      setMessage(`Error updating college: ${err.message}`);
    }
  };

  const handleDeleteCollege = async (id) => {
    if (window.confirm('Are you sure you want to delete this college?')) {
      try {
        await apiFetch(`/api/admin/colleges/${id}`, { method: 'DELETE' });
        setMessage('College deleted successfully');
        loadColleges();
      } catch (err) {
        setMessage(`Error deleting college: ${err.message}`);
      }
    }
  };

  const loadTests = async () => {
    const params = new URLSearchParams();
    if (globalCollegeId !== 'All') params.append('college_id', globalCollegeId);
    const data = await apiFetch(`/api/admin/config/tests?${params.toString()}`);
    setTests(data);
  };

  const loadQuestionBanks = async () => {
    try {
      const params = new URLSearchParams();
      if (globalCollegeId !== 'All') params.append('college_id', globalCollegeId);
      const data = await apiFetch(`/api/admin/config/question-banks?${params.toString()}`);
      setQuestionBanks(data);
    } catch (e) {
      console.warn('Failed to load question banks:', e);
    }
  };

  const handleRenameBank = async (bankKey) => {
    if (!renameBankName.trim()) return;
    try {
      await apiFetch(`/api/admin/config/question-banks/${bankKey}`, {
        method: 'PUT',
        body: JSON.stringify({ display_name: renameBankName.trim(), college_id: globalCollegeId === 'All' ? null : globalCollegeId })
      });
      setMessage(`Question bank renamed to "${renameBankName.trim()}"`);
      setRenamingBank(null);
      setRenameBankName('');
      loadQuestionBanks();
    } catch (err) {
      setMessage(`Error renaming bank: ${err.message}`);
    }
  };

  const loadAnalytics = async () => {
    const params = new URLSearchParams();
    if (globalCollegeId !== 'All') params.append('college_id', globalCollegeId);
    const data = await apiFetch(`/api/admin/analytics/summary?${params.toString()}`);
    setAnalytics(data);
  };

  const loadAllAttempts = async () => {
    console.log('Loading attempts from: /api/admin/analytics/attempts');
    const params = new URLSearchParams();
    if (globalCollegeId !== 'All') params.append('college_id', globalCollegeId);
    const data = await apiFetch(`/api/admin/analytics/attempts?${params.toString()}`);
    setAllAttempts(data);
  };

  const loadDeptConfigs = async () => {
    const params = new URLSearchParams();
    if (globalCollegeId !== 'All') params.append('college_id', globalCollegeId);
    const data = await apiFetch(`/api/admin/config?${params.toString()}`);
    setDeptConfigs(data);
  };

  const loadSubjects = async () => {
    const data = await apiFetch('/api/admin/config/subjects');
    setSubjects(data);
  };

  const loadSiteStatus = async () => {
    try {
      const data = await apiFetch('/api/admin/config/site-status');
      if (data && data.success) {
        setSiteStatus(data.status);
      }
    } catch (e) {
      console.warn('Failed to load site status:', e);
    }
  };

  const toggleSiteStatus = async (newVal) => {
    try {
      const data = await apiFetch('/api/admin/config/site-status', {
        method: 'POST',
        body: JSON.stringify({ status: newVal })
      });
      if (data && data.success) {
        setSiteStatus(newVal);
        setMessage(`Site is now turned ${newVal === 'on' ? 'ON' : 'OFF'}`);
      } else {
        setMessage(data.message || 'Failed to update site status');
      }
    } catch (err) {
      setMessage(`Error updating site status: ${err.message}`);
    }
  };

  const handleUpdateConfig = async (dept, selectedArr, durationMinutes, aptDuration, techDuration) => {
    const subjectsStr = selectedArr.join(',');
    await apiFetch('/api/admin/config', {
      method: 'POST',
      body: JSON.stringify({
        department: dept,
        technical_subject: subjectsStr,
        duration_minutes: durationMinutes,
        aptitude_duration: aptDuration,
        technical_duration: techDuration,
        college_id: globalCollegeId === 'All' ? null : globalCollegeId
      })
    });
    setMessage(`Updated ${dept} configuration`);
    loadDeptConfigs();
  };

  const requestDeleteAttempt = (attempt) => {
    setAttemptToDelete(attempt);
  };

  const confirmDeleteAttempt = async () => {
    if (!attemptToDelete) return;
    try {
      const result = await apiFetch(`/api/admin/analytics/attempts/${attemptToDelete.id}`, { method: 'DELETE' });
      setMessage(result.message || 'Attempt deleted successfully');
      setAttemptToDelete(null);
      const data = await apiFetch('/api/admin/analytics/attempts');
      setAllAttempts(data);
    } catch (err) {
      setMessage(`Error deleting attempt: ${err.message}`);
      setAttemptToDelete(null);
    }
  };

  const handleViewAttempt = (id) => {
    navigate(`/admin/dashboard/results/${id}`);
  };

  const handleExportExcel = () => {
    let dataToExport = allAttempts;
    if (selectedDept !== 'All') dataToExport = dataToExport.filter(a => a.department === selectedDept);
    if (selectedTest !== 'All') dataToExport = dataToExport.filter(a => a.subject === selectedTest);

    if (dataToExport.length === 0) {
      setMessage("No results available to export");
      return;
    }

    const excelData = dataToExport.map(a => ({
      "Student": a.name || '',
      "Roll No": a.roll_number || '',
      "Dept": a.department || '',
      "Score": `${a.score}/42`,
      "Attention": `${Number(a.attention_score || 0).toFixed(2)}%`,
      "Status": a.status || '',
      "Date": a.submitted_at ? new Date(a.submitted_at).toLocaleString() : '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Auto-fit columns
    const colWidths = [
      { wch: 25 }, // Student
      { wch: 15 }, // Roll No
      { wch: 10 }, // Dept
      { wch: 10 }, // Score
      { wch: 15 }, // Attention
      { wch: 15 }, // Status
      { wch: 25 }, // Date
    ];
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Results");

    const fileName = `Student_Results_${selectedTest === 'All' ? 'All_Tests' : selectedTest.replace(/\s+/g, '_')}_${selectedDept === 'All' ? 'All_Depts' : selectedDept}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') navigate('/admin/login');
    loadColleges().catch((e) => console.warn('Failed to load colleges:', e.message));
  }, [navigate, user]);

  useEffect(() => {
    loadQuestions().catch((e) => setMessage(e.message));
    loadQuestionBanks().catch((e) => console.warn(e));
  }, [query.page, section, globalCollegeId]); // Reload questions when section changes to questions or page changes

  const saveQuestion = async (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (globalCollegeId !== 'All') payload.college_id = globalCollegeId;
    
    if (editing) {
      await apiFetch(`/api/admin/questions/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      setMessage('Question updated');
    } else {
      await apiFetch('/api/admin/questions', { method: 'POST', body: JSON.stringify(payload) });
      setMessage('Question created');
    }
    setForm(emptyForm);
    setEditing(null);
    setShowModal(false);
    loadQuestions();
  };

  const handleDelete = async (id) => {
    await apiFetch(`/api/admin/questions/${id}`, { method: 'DELETE' });
    setMessage('Question deleted');
    loadQuestions();
  };

  const handleSearch = async () => {
    setQuery((p) => ({ ...p, page: 1 }));
    await loadQuestions();
  };

  const handleImport = async () => {
    if (!bulkFile) return;
    const fd = new FormData();
    fd.append('file', bulkFile);
    if (importBankName) {
      fd.append('bank_name', importBankName);
    }
    if (globalCollegeId !== 'All') {
      fd.append('college_id', globalCollegeId);
    }
    await apiFetch('/api/admin/questions/import', { method: 'POST', body: fd });
    setMessage('CSV imported successfully');
    loadQuestions();
    loadQuestionBanks();
  };

  const handleExport = async () => {
    const csvText = await apiFetch('/api/admin/questions/export/csv');
    const blob = new Blob([csvText], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'question_bank.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const logout = () => {
    clearSession();
    navigate('/admin/login');
  };

  useEffect(() => {
    if (section === 'students') {
      loadStudents().catch((e) => setMessage(e.message));
    }
    if (section === 'colleges') {
      loadColleges().catch((e) => setMessage(e.message));
    }
    if (section === 'analytics') {
      loadAnalytics().catch((e) => setMessage(e.message));
    }
    if (section === 'results') {
      loadAllAttempts().catch((e) => setMessage(e.message));
    }
    if (section === 'config') {
      loadTests().catch((e) => setMessage(e.message));
      loadSubjects().catch((e) => setMessage(e.message));
      loadSiteStatus().catch((e) => setMessage(e.message));
      loadQuestionBanks().catch((e) => setMessage(e.message));
    }
  }, [section, globalCollegeId]);

  const headerExtraContent = (
    <div className="flex items-center gap-2">
      <label className="text-sm font-bold text-slate-600">College:</label>
      <select
        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-brand-500 outline-none min-w-[200px]"
        value={globalCollegeId}
        onChange={(e) => setGlobalCollegeId(e.target.value)}
      >
        <option value="All">All Colleges</option>
        {colleges.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </div>
  );

  return (
    <AppShell
      title="Admin Panel"
      user={user}
      headerExtra={headerExtraContent}
      onLogout={logout}
      items={[
        { to: '/student/dashboard/overview', label: 'Access Student Portal' },
        { to: '/admin/dashboard/students', label: 'Student Details' },
        { to: '/admin/dashboard/colleges', label: 'Colleges' },
        { to: '/admin/dashboard/questions', label: 'Question Bank' },
        { to: '/admin/dashboard/results', label: 'Results' },
        { to: '/admin/dashboard/analytics', label: 'Analytics' },
        { to: '/admin/dashboard/config', label: 'Test Config' }
      ]}
    >
      {message && <p className="mb-4 rounded bg-secondary px-3 py-2 text-sm text-foreground">{message}</p>}

      {section === 'students' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-800">Student Profiles & Accounts</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-sm font-black text-brand-700 border border-brand-200">
                  {students.length} students
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">Manage student enrollment, search details, and update or reset passwords.</p>
              {students.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.entries(
                    students.reduce((acc, s) => {
                      const dept = s.department || 'Unknown';
                      acc[dept] = (acc[dept] || 0) + 1;
                      return acc;
                    }, {})
                  ).sort((a, b) => b[1] - a[1]).map(([dept, count]) => (
                    <span key={dept} className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600 border border-slate-200">
                      {dept}: {count}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setNewStudent({ roll_number: '', name: '', department: '', password: 'paletteproduction@2027', year: '1', college_id: globalCollegeId === 'All' ? '' : globalCollegeId });
                setShowAddStudentModal(true);
              }}
              className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-700 transition-all self-start sm:self-auto"
            >
              + Add Student
            </button>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
            {selectedStudentYear === null ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {['1', '2', '3', '4'].map(year => {
                  const count = students.filter(s => (s.year || '1') === year).length;
                  return (
                    <div
                      key={year}
                      onClick={() => setSelectedStudentYear(year)}
                      className="cursor-pointer border border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-brand-300 transition-all bg-slate-50 flex flex-col items-center justify-center gap-2"
                    >
                      <h3 className="text-xl font-bold text-slate-800">{`${year}${year === '1' ? 'st' : year === '2' ? 'nd' : year === '3' ? 'rd' : 'th'} Year`}</h3>
                      <span className="text-3xl font-black text-brand-600">{count}</span>
                      <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Students</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <>
                {/* Search Bar & Back Button */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedStudentYear(null)}
                    className="flex-shrink-0 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    ← Back to Years
                  </button>
                  <div className="relative flex-1 max-w-md">
                    <input
                      className="w-full rounded-lg border border-slate-200 pl-10 pr-4 py-2 text-sm focus:border-brand-500 outline-none"
                      placeholder="Search by Roll Number, Name or Department..."
                      value={studentSearch}
                      onChange={(e) => {
                        setStudentSearch(e.target.value);
                        loadStudents(e.target.value);
                      }}
                    />
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></span>
                  </div>
                </div>

                {/* Student Table */}
                <div className="overflow-x-auto">
                  <div className="overflow-x-auto w-full max-w-[90vw] md:max-w-none"><div className="overflow-x-auto w-full max-w-[90vw] md:max-w-none"><table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-left border-b">
                        <th className="p-3 font-bold text-slate-600">Roll Number</th>
                        <th className="p-3 font-bold text-slate-600">Name</th>
                        <th className="p-3 font-bold text-slate-600">College</th>
                        <th className="p-3 font-bold text-slate-600">Department</th>
                        <th className="p-3 font-bold text-slate-600">Year</th>
                        <th className="p-3 font-bold text-slate-600">Password</th>
                        <th className="p-3 font-bold text-slate-600 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const filtered = students.filter(s => (s.year || '1') === selectedStudentYear);
                        if (filtered.length === 0) {
                          return <tr><td colSpan="7" className="p-8 text-center text-slate-400 italic">No students in this category.</td></tr>;
                        }
                        return filtered.map((student) => (
                          <tr key={student.id} className="border-b hover:bg-slate-50 transition-colors">
                            <td className="p-3 font-bold text-slate-900">{student.roll_number}</td>
                            <td className="p-3 font-semibold text-slate-700">{student.name || <span className="text-slate-400 italic">N/A</span>}</td>
                            <td className="p-3 font-semibold text-slate-700">
                              {student.college_name || <span className="text-slate-400 italic">N/A</span>}
                            </td>
                            <td className="p-3">
                              <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-foreground">
                                {student.department || 'N/A'}
                              </span>
                            </td>
                            <td className="p-3 font-semibold text-slate-700">
                              {student.year || 'All'}
                            </td>
                            <td className="p-3">
                              <code className="rounded bg-slate-100 px-2 py-1 text-xs font-mono font-bold text-slate-800">
                                {student.password}
                              </code>
                            </td>
                            <td className="p-3 text-right space-x-2">
                              <button
                                onClick={() => setEditingStudent(student)}
                                className="rounded bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-all"
                              >
                                Edit details & password
                              </button>
                              <button
                                onClick={async () => {
                                  if (window.confirm(`Are you sure you want to delete student "${student.name || student.roll_number}"?`)) {
                                    try {
                                      await apiFetch(`/api/admin/users/${student.id}`, { method: 'DELETE' });
                                      setMessage(`Deleted student "${student.roll_number}"`);
                                      loadStudents();
                                    } catch (err) {
                                      setMessage(`Error deleting student: ${err.message}`);
                                    }
                                  }
                                }}
                                className="rounded bg-secondary px-2.5 py-1 text-xs font-bold text-foreground hover:bg-secondary transition-all"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table></div></div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {section === 'colleges' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-black text-slate-800">Manage Colleges</h2>
            <button
              onClick={() => setShowCollegeModal(true)}
              className="rounded-xl bg-brand-600 px-4 py-2 font-bold text-white shadow-lg hover:bg-brand-700 transition-all flex items-center gap-2"
            >
              Add College
            </button>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-3 font-bold">ID</th>
                    <th className="p-3 font-bold">Name</th>
                    <th className="p-3 font-bold">Status</th>
                    <th className="p-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {colleges.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-4 text-center text-slate-500">No colleges found.</td>
                    </tr>
                  ) : (
                    colleges.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3">{c.id}</td>
                        <td className="p-3 font-semibold text-slate-800">{c.name}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${c.status === 'active' ? 'bg-secondary text-foreground' : 'bg-slate-100 text-slate-600'}`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => setEditingCollege(c)}
                            className="rounded bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-all"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCollege(c.id)}
                            className="rounded bg-secondary px-2.5 py-1 text-xs font-bold text-foreground hover:bg-secondary transition-all"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {section === 'questions' && (
        <div className="space-y-4">
          {/* Question Banks Overview */}
          {questionBanks.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800">Question Banks</h3>
                <span className="text-xs font-semibold text-slate-500 uppercase">
                  {questionBanks.reduce((sum, b) => sum + b.question_count, 0)} total questions
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {questionBanks.map((bank) => (
                  <div 
                    key={bank.bank_key} 
                    className="cursor-pointer rounded-lg border border-slate-200 bg-neutral-100 dark:bg-neutral-900 border border-border text-foreground p-4 hover:shadow-md transition-all"
                    onClick={(e) => {
                      if (e.target.closest('button') || e.target.closest('input')) return;
                      setQuery((prev) => ({ ...prev, bank_key: bank.bank_key, page: 1 }));
                      document.getElementById('questions-table')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    {renamingBank === bank.bank_key ? (
                      <div className="space-y-2">
                        <input
                          className="w-full rounded-lg border border-brand-300 px-3 py-1.5 text-sm font-bold focus:border-brand-500 outline-none bg-white"
                          value={renameBankName}
                          onChange={(e) => setRenameBankName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleRenameBank(bank.bank_key); if (e.key === 'Escape') setRenamingBank(null); }}
                          autoFocus
                          placeholder="Enter new name..."
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleRenameBank(bank.bank_key)} className="rounded bg-brand-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-brand-700 transition-all">Save</button>
                          <button onClick={() => setRenamingBank(null)} className="rounded bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200 transition-all">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm">{bank.display_name}</h4>
                            {bank.description && (
                              <p className="text-[11px] text-slate-400 mt-0.5">{bank.description}</p>
                            )}
                          </div>
                          {bank.bank_key !== 'untagged' && (
                            <button
                              onClick={() => { setRenamingBank(bank.bank_key); setRenameBankName(bank.display_name); }}
                              className="text-[10px] font-bold text-brand-600 hover:text-brand-800 px-1.5 py-0.5 rounded hover:bg-brand-50 transition-all"
                            >
                              Rename
                            </button>
                          )}
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-black text-brand-700 border border-brand-200">
                            {bank.question_count} questions
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between" id="questions-table">
            <h2 className="text-xl font-bold text-slate-800 flex items-center">
              Question Bank
              {query.bank_key && (
                <span className="ml-3 flex items-center text-sm text-brand-600 font-medium">
                  (Filtered by: {questionBanks.find(b => b.bank_key === query.bank_key)?.display_name || query.bank_key})
                  <button 
                    onClick={() => setQuery((prev) => ({ ...prev, bank_key: '', page: 1 }))} 
                    className="ml-2 text-foreground hover:underline text-xs"
                  >
                    Clear Filter
                  </button>
                </span>
              )}
            </h2>
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Question Bank Name (e.g. question-bank-2024)"
                value={importBankName}
                onChange={(e) => setImportBankName(e.target.value)}
                className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 outline-none"
              />
              <input
                type="file"
                accept=".csv"
                id="csv-upload"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setBulkFile(file);
                    // Trigger upload immediately after selection for a smoother UX
                  }
                }}
              />
              <label
                htmlFor="csv-upload"
                className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
              >
                {bulkFile ? bulkFile.name : 'Select CSV'}
              </label>
              {bulkFile && (
                <button onClick={handleImport} className="rounded-lg bg-[#171717] text-[#fafafa] dark:bg-[#fafafa] dark:text-[#0a0a0a] px-3 py-2 text-sm font-semibold text-white hover:bg-[#171717] text-[#fafafa] dark:bg-[#fafafa] dark:text-[#0a0a0a] transition-all">
                  Import
                </button>
              )}
              <button onClick={handleExport} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all">
                Export CSV
              </button>
              <button
                onClick={() => { setEditing(null); setForm(emptyForm); setShowModal(true); }}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-brand-700 transition-all"
              >
                + Create Question
              </button>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
              <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none" placeholder="Search question/tag" value={query.search} onChange={(e) => setQuery({ ...query, search: e.target.value })} />
              <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none" placeholder="Subject" value={query.subject} onChange={(e) => setQuery({ ...query, subject: e.target.value })} />
              <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none" value={query.difficulty} onChange={(e) => setQuery({ ...query, difficulty: e.target.value })}>
                <option value="">All Difficulty</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
              </select>
              <button className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-bold text-white hover:bg-slate-900" onClick={handleSearch}>Apply Filter</button>
            </div>

            <div className="overflow-x-auto">
              <div className="overflow-x-auto w-full max-w-[90vw] md:max-w-none"><div className="overflow-x-auto w-full max-w-[90vw] md:max-w-none"><table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left border-b">
                    <th className="p-3 font-bold text-slate-600">Subject</th>
                    <th className="p-3 font-bold text-slate-600">Question</th>
                    <th className="p-3 font-bold text-slate-600">Type</th>
                    <th className="p-3 font-bold text-slate-600">Difficulty</th>
                    <th className="p-3 font-bold text-slate-600">Correct</th>
                    <th className="p-3 font-bold text-slate-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length > 0 ? (
                    rows.map((r) => (
                      <tr key={r.id} className="border-b hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-medium text-slate-700">{r.subject}</td>
                        <td className="p-3 text-slate-600 max-w-md truncate">{r.question}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${r.question_type === 'coding' ? 'bg-secondary text-foreground' : 'bg-slate-100 text-slate-700'}`}>
                            {r.question_type}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${r.difficulty === 'hard' ? 'bg-red-100 text-red-700' : r.difficulty === 'medium' ? 'bg-secondary text-foreground' : 'bg-secondary text-foreground'}`}>
                            {r.difficulty}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-brand-700">{r.correct_option}</td>
                        <td className="p-3 text-right space-x-2">
                          <button className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 border border-slate-200 hover:bg-white hover:border-slate-300" onClick={() => { setEditing(r); setForm(r); setShowModal(true); }}>Edit</button>
                          <button className="rounded-lg px-3 py-1.5 text-xs font-bold text-red-600 border border-red-100 hover:bg-red-50" onClick={() => handleDelete(r.id)}>Delete</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-slate-400 italic">
                        No questions found in the question bank. Technical questions (Python, Java, VLSI, IOT) have been removed.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table></div></div>
            </div>
            <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-sm text-slate-500">Showing <b>{rows.length}</b> of <b>{total}</b> questions</span>
              <div className="flex gap-2">
                <button className="rounded-lg border border-slate-200 px-4 py-1.5 text-xs font-bold disabled:opacity-50" disabled={query.page <= 1} onClick={() => setQuery((p) => ({ ...p, page: p.page - 1 }))}>Previous</button>
                <button className="rounded-lg border border-slate-200 px-4 py-1.5 text-xs font-bold" onClick={() => setQuery((p) => ({ ...p, page: p.page + 1 }))}>Next</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Create/Edit */}
      <Modal open={showModal} title={editing ? 'Edit Question' : 'Create New Question'} onClose={() => { setShowModal(false); setEditing(null); }}>
        <form onSubmit={saveQuestion} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Subject</label>
              <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none" placeholder="e.g. Aptitude" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Difficulty</label>
              <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Type</label>
              <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none" value={form.question_type} onChange={(e) => setForm({ ...form, question_type: e.target.value })}>
                <option value="mcq">MCQ</option><option value="coding">Coding</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Question Text</label>
            <textarea className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none min-h-[100px]" placeholder="Type the question content here..." value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none" placeholder="Option A" value={form.option_a} onChange={(e) => setForm({ ...form, option_a: e.target.value })} />
            <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none" placeholder="Option B" value={form.option_b} onChange={(e) => setForm({ ...form, option_b: e.target.value })} />
            <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none" placeholder="Option C" value={form.option_c} onChange={(e) => setForm({ ...form, option_c: e.target.value })} />
            <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none" placeholder="Option D" value={form.option_d} onChange={(e) => setForm({ ...form, option_d: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Correct Answer</label>
              <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none" value={form.correct_option} onChange={(e) => setForm({ ...form, correct_option: e.target.value })}>
                <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Tags</label>
              <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none" placeholder="math, logic..." value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
            </div>
          </div>
          {form.question_type === 'coding' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Test Cases (JSON format)</label>
              <textarea
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-monospace focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none min-h-[80px]"
                placeholder='[{"input": "5", "output": "120"}]'
                value={form.test_cases}
                onChange={(e) => setForm({ ...form, test_cases: e.target.value })}
              />
              <p className="text-[10px] text-slate-400">Array of objects with "input" and "output" keys.</p>
            </div>
          )}
          <div className="pt-2">
            <button className="w-full rounded-xl bg-brand-600 py-3 font-bold text-white shadow-lg hover:bg-brand-700 transition-all">
              {editing ? 'Update Question' : 'Save Question'}
            </button>
          </div>
        </form>
      </Modal>

      {section === 'results' && (
        <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
          {selectedResultYear === null ? (
            // Level 1: Year Selection
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4">Select Year for Results</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                {['3', '4'].map(year => {
                  const count = allAttempts.filter(a => String(a.year) === year).length;
                  return (
                    <div
                      key={year}
                      onClick={() => setSelectedResultYear(year)}
                      className="cursor-pointer border border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-brand-300 transition-all bg-slate-50 flex flex-col items-center justify-center gap-2"
                    >
                      <h3 className="text-xl font-bold text-slate-800">{`${year}${year === '3' ? 'rd' : 'th'} Year`}</h3>
                      <span className="text-3xl font-black text-brand-600">{count}</span>
                      <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Recorded Attempts</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : selectedResultTestId === null ? (
            // Level 2: Test Selection
            <div>
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => setSelectedResultYear(null)}
                  className="flex-shrink-0 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  ← Back to Years
                </button>
                <h3 className="text-lg font-bold text-slate-800">
                  Select Test for Year {selectedResultYear}
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(() => {
                  const yearAttempts = allAttempts.filter(a => String(a.year) === String(selectedResultYear));
                  const uniqueTests = Array.from(new Set(yearAttempts.map(a => a.subject))).filter(Boolean);

                  if (uniqueTests.length === 0) {
                    return <div className="col-span-full p-8 text-center text-slate-400 italic border border-dashed border-slate-200 rounded-xl">No test attempts recorded for this year yet.</div>;
                  }

                  return uniqueTests.map(testName => {
                    const count = yearAttempts.filter(a => a.subject === testName).length;
                    return (
                      <div
                        key={testName}
                        onClick={() => setSelectedResultTestId(testName)}
                        className="cursor-pointer border border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-brand-300 transition-all bg-white flex flex-col gap-2"
                      >
                        <h3 className="text-lg font-bold text-slate-800 break-words">{testName}</h3>
                        <div className="mt-auto pt-2 flex items-center justify-between">
                          <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-black text-brand-700 border border-brand-200">
                            {count} Attempts
                          </span>
                          <span className="text-sm font-bold text-brand-600 group-hover:underline">View Results →</span>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          ) : (
            // Level 3: Results Table
            <div>
              <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedResultTestId(null)}
                    className="flex-shrink-0 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    ← Back to Tests
                  </button>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{selectedResultTestId} Results</h3>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {`Year ${selectedResultYear}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleExportExcel}
                    className="rounded-lg bg-[#171717] text-[#fafafa] dark:bg-[#fafafa] dark:text-[#0a0a0a] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#171717] text-[#fafafa] dark:bg-[#fafafa] dark:text-[#0a0a0a] transition-all"
                  >
                    Export Excel
                  </button>
                  <span className="text-xs font-bold text-slate-500 uppercase ml-2">Dept:</span>
                  <select
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 outline-none min-w-[150px]"
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                  >
                    <option value="All">All Departments</option>
                    {Array.from(new Set(allAttempts.filter(a => a.subject === selectedResultTestId && String(a.year) === String(selectedResultYear)).map(a => a.department))).filter(Boolean).map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <div className="overflow-x-auto w-full max-w-[90vw] md:max-w-none"><div className="overflow-x-auto w-full max-w-[90vw] md:max-w-none"><table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left border-b">
                      <th className="p-3 font-bold text-slate-600">Student</th>
                      <th className="p-3 font-bold text-slate-600">Roll No</th>
                      <th className="p-3 font-bold text-slate-600">Dept</th>
                      <th className="p-3 font-bold text-slate-600">Score</th>
                      <th className="p-3 font-bold text-slate-600">Attention</th>
                      <th className="p-3 font-bold text-slate-600">Status</th>
                      <th className="p-3 font-bold text-slate-600">Date</th>
                      <th className="p-3 font-bold text-slate-600 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      let filtered = allAttempts.filter(a => String(a.year) === String(selectedResultYear) && a.subject === selectedResultTestId);
                      if (selectedDept !== 'All') filtered = filtered.filter(a => a.department === selectedDept);

                      if (filtered.length > 0) {
                        return filtered.map((a) => (
                          <tr key={a.id} className="border-b hover:bg-slate-50 transition-colors">
                            <td className="p-3 font-bold text-slate-900">{a.name}</td>
                            <td className="p-3 font-semibold text-slate-700">{a.roll_number}</td>
                            <td className="p-3">
                              <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-foreground">
                                {a.department || 'N/A'}
                              </span>
                            </td>
                            <td className="p-3 font-black text-brand-700">{a.score}/{a.total_questions ?? 'N/A'}</td>
                            <td className="p-3">
                              <div className="flex flex-col">
                                <span className={`text-sm font-black ${(a.attention_score || 0) < 70 ? 'text-foreground' : 'text-foreground'}`}>
                                  {Number(a.attention_score || 0).toFixed(2)}%
                                </span>
                                <div className="w-16 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                  <div
                                    className={`h-full ${(a.attention_score || 0) < 70 ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-black' : 'bg-[#171717] text-[#fafafa] dark:bg-[#fafafa] dark:text-[#0a0a0a]'}`}
                                    style={{ width: `${a.attention_score || 0}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${a.status === 'submitted' ? 'bg-secondary text-foreground' : 'bg-secondary text-foreground'}`}>
                                {a.status}
                              </span>
                            </td>
                            <td className="p-3 text-slate-500 font-medium">{a.submitted_at ? new Date(a.submitted_at).toLocaleString() : '-'}</td>
                            <td className="p-3 text-right space-x-2 flex justify-end">
                              <button onClick={() => handleViewAttempt(a.id)} className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
                                View
                              </button>
                              <button onClick={() => requestDeleteAttempt(a)} className="rounded-md bg-secondary px-2.5 py-1 text-xs font-bold text-foreground hover:bg-secondary transition-colors">
                                Reset
                              </button>
                            </td>
                          </tr>
                        ));
                      }
                      return (
                        <tr>
                          <td colSpan="8" className="p-8 text-center text-slate-400 italic">
                            No results found for department: {selectedDept}
                          </td>
                        </tr>
                      );
                    })()}
                  </tbody>
                </table></div></div>
              </div>
            </div>
          )}
        </div>
      )}

      {section === 'analytics' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="rounded-xl border bg-white p-4"><p className="text-xs text-slate-500">Students</p><p className="text-2xl font-bold">{analytics.totals.total_students || 0}</p></div>
            <div className="rounded-xl border bg-white p-4"><p className="text-xs text-slate-500">Questions</p><p className="text-2xl font-bold">{analytics.totals.total_questions || 0}</p></div>
            <div className="rounded-xl border bg-white p-4"><p className="text-xs text-slate-500">Attempts</p><p className="text-2xl font-bold">{analytics.totals.total_attempts || 0}</p></div>
            <div className="rounded-xl border bg-white p-4"><p className="text-xs text-slate-500">Average %</p><p className="text-2xl font-bold">{analytics.totals.avg_percentage || 0}%</p></div>
            <div className="rounded-xl border bg-white p-4"><p className="text-xs text-slate-500">Avg. Attention</p><p className="text-2xl font-bold text-foreground">{analytics.totals.avg_attention || 0}%</p></div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-6 font-extrabold text-slate-800 text-lg tracking-tight">Subject Performance</h3>
            <div className="space-y-6">
              {analytics.subjectStats?.length > 0 ? (
                analytics.subjectStats.map((stat, idx) => (
                  <div key={idx} className="relative">
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <p className="font-bold text-slate-700 text-sm">{stat.subject}</p>
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{stat.attempts} Attempts</p>
                      </div>
                      <span className={`font-black text-lg ${stat.avg_percentage >= 70 ? 'text-foreground' : stat.avg_percentage >= 40 ? 'text-foreground' : 'text-foreground'}`}>
                        {stat.avg_percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200/50">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${stat.avg_percentage >= 70 ? 'bg-[#171717] text-[#fafafa] dark:bg-[#fafafa] dark:text-[#0a0a0a]' : stat.avg_percentage >= 40 ? 'bg-secondary text-foreground' : 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-black'}`}
                        style={{ width: `${stat.avg_percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-32 items-center justify-center text-sm font-medium text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No performance data available yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {section === 'config' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Test Configuration</h2>
              <p className="text-sm text-slate-500">Configure exams dynamically for specific student years, departments, and question banks.</p>
            </div>
            <button
              onClick={() => {
                setEditingTest(null);
                setTestPhases([{ name: 'Phase 1: Aptitude', duration: 90 }]);
                setNewTest({
                  test_name: '',
                  student_year: 'All',
                  departments: 'All',
                  question_banks: '',
                  duration_minutes: 90,
                  aptitude_duration: 90,
                  technical_duration: 0,
                  status: 'active',
                  phase1_name: 'Phase 1: Aptitude',
                  phase2_name: ''
                });
                setShowAddTestModal(true);
              }}
              className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-700 transition-all self-start sm:self-auto"
            >
              + Create New Test
            </button>
          </div>

          {/* Site Status Control Switcher */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${siteStatus === 'on' ? 'bg-[#171717] text-[#fafafa] dark:bg-[#fafafa] dark:text-[#0a0a0a] animate-pulse' : 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-black'}`}></span>
                Site Accessibility Status
              </h3>
              <p className="text-sm text-slate-500">
                {siteStatus === 'on'
                  ? 'The portal is currently live and open for students to log in and take examinations.'
                  : 'The portal is turned off. All non-admin requests will be redirected to the maintenance page.'}
              </p>
            </div>
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-lg border">
              <button
                onClick={() => toggleSiteStatus('on')}
                className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${siteStatus === 'on' ? 'bg-[#171717] text-[#fafafa] dark:bg-[#fafafa] dark:text-[#0a0a0a] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
              >
                LIVE (ON)
              </button>
              <button
                onClick={() => toggleSiteStatus('off')}
                className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${siteStatus === 'off' ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-black text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
              >
                OFFLINE
              </button>
            </div>
          </div>

          {/* Tests List */}
          <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Active & Past Tests</h3>
            <div className="overflow-x-auto">
              <div className="overflow-x-auto w-full max-w-[90vw] md:max-w-none"><div className="overflow-x-auto w-full max-w-[90vw] md:max-w-none"><table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left border-b border-slate-100">
                    <th className="p-3 font-bold text-slate-600">Test Name</th>
                    <th className="p-3 font-bold text-slate-600">Target Year</th>
                    <th className="p-3 font-bold text-slate-600">Departments</th>
                    <th className="p-3 font-bold text-slate-600">Question Banks</th>
                    <th className="p-3 font-bold text-slate-600">Durations (m)</th>
                    <th className="p-3 font-bold text-slate-600">Status</th>
                    <th className="p-3 font-bold text-slate-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tests.length > 0 ? (
                    tests.map((t) => (
                      <tr key={t.id} className="border-b border-slate-100/80 hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-bold text-brand-700">{t.test_name}</td>
                        <td className="p-3 font-semibold text-slate-700">{t.student_year}</td>
                        <td className="p-3 text-slate-600 truncate max-w-[150px]">{t.departments}</td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {(t.question_banks || '').split(',').filter(Boolean).map(b => (
                              <span key={b} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                {b}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3 text-slate-600 text-xs">
                           <span className="font-bold">{t.duration_minutes} min total</span><br />
                           {t.phase1_name && <span className="text-slate-400">{t.phase1_name}: {t.aptitude_duration}m</span>}
                           {t.phase2_name && <><br /><span className="text-slate-400">{t.phase2_name}: {t.technical_duration}m</span></>}
                         </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${t.status === 'active' ? 'bg-secondary text-foreground' : 'bg-slate-100 text-slate-500'}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => {
                            setEditingTest(t);
                            setNewTest(t);
                            // Rebuild phases from saved data
                            const phases = [];
                            if (t.phase1_name || t.aptitude_duration > 0) phases.push({ name: t.phase1_name || 'Phase 1', duration: t.aptitude_duration || 0 });
                            if (t.phase2_name || t.technical_duration > 0) phases.push({ name: t.phase2_name || 'Phase 2', duration: t.technical_duration || 0 });
                            setTestPhases(phases.length > 0 ? phases : [{ name: 'Phase 1', duration: t.duration_minutes || 90 }]);
                            setShowAddTestModal(true);
                          }}
                            className="rounded bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-all"
                          >
                            Edit
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm(`Are you sure you want to delete test "${t.test_name}"?`)) {
                                try {
                                  await apiFetch(`/api/admin/config/tests/${t.id}`, { method: 'DELETE' });
                                  setMessage(`Deleted test "${t.test_name}"`);
                                  loadTests();
                                } catch (err) {
                                  setMessage(`Error: ${err.message}`);
                                }
                              }
                            }}
                            className="rounded bg-secondary px-2.5 py-1 text-xs font-bold text-foreground hover:bg-secondary transition-all"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-400 italic">
                        No tests configured yet. Create a test to start conducting exams.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table></div></div>
            </div>
          </div>
        </div>
      )}

      <Modal open={!!editing} title="Editing Question" onClose={() => setEditing(null)}>
        <p className="text-sm text-slate-600">You are editing a question in the form above. Update fields and click "Update Question".</p>
      </Modal>

      <Modal open={showAddTestModal} title={editingTest ? 'Edit Test' : 'Create New Test'} onClose={() => setShowAddTestModal(false)}>
        <form onSubmit={async (e) => {
          e.preventDefault();
          // Build payload from dynamic phases
          const totalDuration = testPhases.reduce((sum, p) => sum + (parseInt(p.duration) || 0), 0);
          const payload = {
            ...newTest,
            duration_minutes: totalDuration,
            phase1_name: testPhases[0]?.name || '',
            aptitude_duration: testPhases[0]?.duration || 0,
            phase2_name: testPhases[1]?.name || '',
            technical_duration: testPhases[1]?.duration || 0,
            college_id: globalCollegeId === 'All' ? null : globalCollegeId
          };
          try {
            if (editingTest) {
              await apiFetch(`/api/admin/config/tests/${editingTest.id}`, { method: 'PUT', body: JSON.stringify(payload) });
              setMessage(`Test "${payload.test_name}" updated successfully`);
            } else {
              await apiFetch('/api/admin/config/tests', { method: 'POST', body: JSON.stringify(payload) });
              setMessage(`Test "${payload.test_name}" created successfully`);
            }
            setShowAddTestModal(false);
            loadTests();
          } catch (err) {
            setMessage(`Error: ${err.message}`);
          }
        }} className="space-y-4">

          {/* Test Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Test Name</label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 outline-none"
              placeholder="e.g. MCQS1"
              value={newTest.test_name}
              onChange={(e) => setNewTest({ ...newTest, test_name: e.target.value })}
              required
            />
          </div>

          {/* Year & Departments */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Student Year</label>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 outline-none"
                value={newTest.student_year}
                onChange={(e) => setNewTest({ ...newTest, student_year: e.target.value })}
              >
                <option value="All">All Years</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Departments</label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 outline-none"
                placeholder="All, CSE, ECE, etc."
                value={newTest.departments}
                onChange={(e) => setNewTest({ ...newTest, departments: e.target.value })}
              />
            </div>
          </div>

          {/* Question Banks */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Question Banks</label>
            <div className="max-h-32 overflow-y-auto rounded-lg border border-slate-200 p-2 space-y-2">
              {questionBanks.length > 0 ? questionBanks.map((qb) => {
                const currentBanks = newTest.question_banks ? newTest.question_banks.split(',').map(b => b.trim()) : [];
                const isSelected = currentBanks.includes(qb.bank_key);
                return (
                  <label key={qb.bank_key} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewTest({ ...newTest, question_banks: [...currentBanks, qb.bank_key].join(',') });
                        } else {
                          setNewTest({ ...newTest, question_banks: currentBanks.filter(b => b !== qb.bank_key).join(',') });
                        }
                      }}
                    />
                    <span>{qb.display_name || qb.bank_key} <span className="text-xs text-slate-400">({qb.question_count} Qs)</span></span>
                  </label>
                );
              }) : (
                <p className="text-sm text-slate-400 italic p-2">No question banks found.</p>
              )}
            </div>
            <p className="text-[10px] text-slate-400">Select which question banks this test will draw questions from.</p>
          </div>

          {/* Dynamic Phases */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-500 uppercase">Phases</label>
              <span className="text-xs font-semibold text-slate-400">
                Total: {testPhases.reduce((s, p) => s + (parseInt(p.duration) || 0), 0)} min
              </span>
            </div>
            <div className="space-y-2">
              {testPhases.map((phase, idx) => (
                <div key={idx} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase w-6 flex-shrink-0">P{idx + 1}</span>
                  <input
                    className="flex-1 rounded border border-slate-200 bg-white px-2 py-1.5 text-sm focus:border-brand-500 outline-none"
                    placeholder={`Phase ${idx + 1} name`}
                    value={phase.name}
                    onChange={(e) => {
                      const updated = [...testPhases];
                      updated[idx] = { ...updated[idx], name: e.target.value };
                      setTestPhases(updated);
                    }}
                  />
                  <input
                    type="number"
                    className="w-20 rounded border border-slate-200 bg-white px-2 py-1.5 text-sm text-center focus:border-brand-500 outline-none"
                    placeholder="min"
                    value={phase.duration}
                    min="0"
                    onChange={(e) => {
                      const updated = [...testPhases];
                      updated[idx] = { ...updated[idx], duration: parseInt(e.target.value) || 0 };
                      setTestPhases(updated);
                    }}
                  />
                  <span className="text-[10px] text-slate-400 flex-shrink-0">min</span>
                  {testPhases.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setTestPhases(testPhases.filter((_, i) => i !== idx))}
                      className="flex-shrink-0 rounded bg-secondary px-2 py-1 text-xs font-bold text-foreground hover:bg-secondary transition-all"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            {testPhases.length < 4 && (
              <button
                type="button"
                onClick={() => setTestPhases([...testPhases, { name: `Phase ${testPhases.length + 1}`, duration: 0 }])}
                className="w-full rounded-lg border border-dashed border-brand-300 py-2 text-sm font-bold text-brand-600 hover:bg-brand-50 transition-all"
              >
                + Add Phase
              </button>
            )}
          </div>

          {/* Status */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 outline-none"
              value={newTest.status}
              onChange={(e) => setNewTest({ ...newTest, status: e.target.value })}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <button className="w-full rounded-xl bg-brand-600 py-3 font-bold text-white shadow-lg hover:bg-brand-700 transition-all">
            {editingTest ? 'Update Test' : 'Create Test'}
          </button>
        </form>
      </Modal>

      <Modal open={!!attemptToDelete} title="Confirm Reset Attempt" onClose={() => setAttemptToDelete(null)}>
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete the attempt for <strong>{attemptToDelete?.name}</strong> ({attemptToDelete?.roll_number})?
            <br /><br />
            This action cannot be undone. The student will be able to retake the test.
          </p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setAttemptToDelete(null)}
              className="flex-1 rounded-xl border border-slate-200 bg-white py-3 font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={confirmDeleteAttempt}
              className="flex-1 rounded-xl bg-red-600 py-3 font-bold text-white shadow-lg hover:bg-red-700 transition-all"
            >
              Yes, Reset Attempt
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={showAddStudentModal} title="Add New Student" onClose={() => setShowAddStudentModal(false)}>
        <form onSubmit={async (e) => {
          e.preventDefault();
          try {
            await apiFetch('/api/admin/users', {
              method: 'POST',
              body: JSON.stringify(newStudent)
            });
            setMessage(`Student "${newStudent.roll_number}" created successfully`);
            setShowAddStudentModal(false);
            loadStudents();
          } catch (err) {
            setMessage(`Error adding student: ${err.message}`);
          }
        }} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Roll Number</label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 outline-none"
              placeholder="e.g. 711623243001"
              value={newStudent.roll_number}
              onChange={(e) => setNewStudent({ ...newStudent, roll_number: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Name</label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 outline-none"
              placeholder="e.g. Abdul Malik S"
              value={newStudent.name}
              onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Department</label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 outline-none"
                placeholder="e.g. AI&DS, CSE, ECE"
                value={newStudent.department}
                onChange={(e) => setNewStudent({ ...newStudent, department: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Year</label>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 outline-none"
                value={newStudent.year}
                onChange={(e) => setNewStudent({ ...newStudent, year: e.target.value })}
              >
                <option value="All">All Years</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Password</label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 outline-none"
              placeholder="Default: paletteproduction@2027"
              value={newStudent.password}
              onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
            />
          </div>
          <button className="w-full rounded-xl bg-brand-600 py-3 font-bold text-white shadow-lg hover:bg-brand-700 transition-all">
            Create Student
          </button>
        </form>
      </Modal>

      <Modal open={!!editingStudent} title="Edit Student Profile" onClose={() => setEditingStudent(null)}>
        {editingStudent && (
          <form onSubmit={async (e) => {
            e.preventDefault();
            try {
              await apiFetch(`/api/admin/users/${editingStudent.id}`, {
                method: 'PUT',
                body: JSON.stringify(editingStudent)
              });
              setMessage(`Student "${editingStudent.roll_number}" updated successfully`);
              setEditingStudent(null);
              loadStudents();
            } catch (err) {
              setMessage(`Error updating student: ${err.message}`);
            }
          }} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Roll Number</label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 outline-none"
                value={editingStudent.roll_number}
                onChange={(e) => setEditingStudent({ ...editingStudent, roll_number: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Name</label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 outline-none"
                value={editingStudent.name}
                onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Department</label>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 outline-none"
                  value={editingStudent.department}
                  onChange={(e) => setEditingStudent({ ...editingStudent, department: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Year</label>
                <select
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 outline-none"
                  value={editingStudent.year || 'All'}
                  onChange={(e) => setEditingStudent({ ...editingStudent, year: e.target.value })}
                >
                  <option value="All">All Years</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Password</label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 outline-none"
                placeholder="Leave blank to keep current password"
                value={editingStudent.password}
                onChange={(e) => setEditingStudent({ ...editingStudent, password: e.target.value })}
              />
            </div>
            <button className="w-full rounded-xl bg-brand-600 py-3 font-bold text-white shadow-lg hover:bg-brand-700 transition-all">
              Save Changes
            </button>
          </form>
        )}
      </Modal>

      <Modal open={showCollegeModal} title="Add College" onClose={() => setShowCollegeModal(false)}>
        <form onSubmit={handleCreateCollege} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">College Name</label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 outline-none"
              value={newCollege.name}
              onChange={(e) => setNewCollege({ ...newCollege, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 outline-none"
              value={newCollege.status}
              onChange={(e) => setNewCollege({ ...newCollege, status: e.target.value })}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <button className="w-full rounded-xl bg-brand-600 py-3 font-bold text-white shadow-lg hover:bg-brand-700 transition-all">
            Create College
          </button>
        </form>
      </Modal>

      <Modal open={!!editingCollege} title="Edit College" onClose={() => setEditingCollege(null)}>
        {editingCollege && (
          <form onSubmit={handleUpdateCollege} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">College Name</label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 outline-none"
                value={editingCollege.name}
                onChange={(e) => setEditingCollege({ ...editingCollege, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 outline-none"
                value={editingCollege.status}
                onChange={(e) => setEditingCollege({ ...editingCollege, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <button className="w-full rounded-xl bg-brand-600 py-3 font-bold text-white shadow-lg hover:bg-brand-700 transition-all">
              Save Changes
            </button>
          </form>
        )}
      </Modal>

    </AppShell>
  );
};

export default AdminDashboard;
