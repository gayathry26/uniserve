import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, Badge } from '../components/Badge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { BookOpen, Users, Clock, CheckCircle2, Award, Plus } from 'lucide-react';

export function Training() {
  const { user } = useAuth();
  const [trainings, setTrainings] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('programs'); // 'programs' | 'attendance'

  useEffect(() => {
    fetchTrainingData();
  }, [user]);

  const fetchTrainingData = async () => {
    setLoading(true);
    try {
      const tRes = await apiClient.get('/training');
      setTrainings(tRes.data.data || []);

      const dept = user?.departmentCode || 'CSE';
      const attRes = await apiClient.get(`/training/department/${dept}`);
      setAttendanceRecords(attRes.data.data || []);
    } catch (err) {
      console.error('Failed to load training data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Training & Skill Readiness Accelerator</h1>
          <p className="text-xs text-slate-500">DSA bootcamps, aptitude preparation, and department-wise attendance tracking.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('programs')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'programs' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Curriculum Programs
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'attendance' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Dept Attendance DB
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Retrieving training programs and department logs..." />
      ) : activeTab === 'programs' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {trainings.map((tr) => (
            <div key={tr.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                    {tr.category}
                  </span>
                  <StatusBadge status={tr.status} />
                </div>

                <h3 className="font-bold text-base text-slate-900 mt-2.5">{tr.title}</h3>
                <p className="text-xs text-slate-500 mt-1">Trainer: <strong className="text-slate-700">{tr.trainer_name}</strong></p>

                <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-1 text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Duration: <strong>{tr.duration_hours} Hours Intensive</strong></span>
                  </div>
                  <div>Schedule: {tr.start_date} to {tr.end_date}</div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
                <span>Mandatory &gt; 75% Attendance</span>
                <span className="text-emerald-600 font-bold">Active Cohort</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Attendance Records from Department DB */
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-slate-800">
              Department Attendance Logs (Isolated Database: `lms_{user?.departmentCode?.toLowerCase() || 'cse'}`)
            </h3>
            <span className="text-xs text-blue-600 font-semibold">Live SQL Table: `dept_training_attendance`</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Register No</th>
                  <th className="py-2.5 px-3">Sessions Attended</th>
                  <th className="py-2.5 px-3">Attendance %</th>
                  <th className="py-2.5 px-3">Pre-Assessment Score</th>
                  <th className="py-2.5 px-3">Post-Assessment Score</th>
                  <th className="py-2.5 px-3">Readiness Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendanceRecords.map((att, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-mono font-semibold text-slate-800">{att.register_number}</td>
                    <td className="py-3 px-3">{att.sessions_attended} / {att.total_sessions}</td>
                    <td className="py-3 px-3 font-bold text-blue-600">{att.attendance_percentage}%</td>
                    <td className="py-3 px-3">{att.pre_assessment_score} pts</td>
                    <td className="py-3 px-3 font-bold text-emerald-600">{att.post_assessment_score} pts</td>
                    <td className="py-3 px-3"><StatusBadge status={att.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
