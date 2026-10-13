import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { CompanyManagementModal } from '../components/placement/CompanyManagementModal';
import {
  CalendarDays,
  MapPin,
  Users,
  CheckCircle2,
  ChevronRight,
  Plus,
  Building2,
  FileCheck2,
  Award,
  Layers,
  ArrowRight,
} from 'lucide-react';

export function Drives() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isStudent = user?.roleName === 'STUDENT';
  const isAdminOrTpo = ['SUPER_ADMIN', 'TPO_OFFICER', 'ADMIN', 'RECRUITER'].includes(user?.roleName);

  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedManageCompanyId, setSelectedManageCompanyId] = useState(null);

  useEffect(() => {
    fetchDrives();
  }, []);

  const fetchDrives = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/drives');
      setDrives(res.data.data || []);
    } catch (err) {
      console.error('Failed to load drives:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStage = async (driveId, newStage) => {
    try {
      await apiClient.put(`/drives/${driveId}/stage`, { current_stage: newStage });
      fetchDrives();
    } catch (err) {
      alert('Failed to update stage');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Placement Drive Schedules & Stages</h1>
          <p className="text-xs text-slate-500">
            Multi-stage recruitment coordination, live selection round progression, and candidate pipeline tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/companies"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Building2 className="w-3.5 h-3.5" /> Placement Companies Directory
          </Link>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Retrieving campus drive schedules..." />
      ) : drives.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-xs text-slate-400">
          No placement drives scheduled.
        </div>
      ) : (
        <div className="space-y-4">
          {drives.map((d) => {
            const hasApplied = d.has_applied;
            const studentApp = d.student_application;

            return (
              <div key={d.id} className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4 hover:border-blue-300 transition-colors">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-slate-900">{d.drive_title}</h3>
                      <StatusBadge status={d.status} />
                      <StatusBadge status={d.company_tier || 'REGULAR'} />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Company: <strong className="text-slate-800">{d.company_name}</strong> • Role: {d.job_title} (₹{d.ctc_lpa} LPA)
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="flex items-center gap-1 text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                      <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
                      {d.drive_date?.split('T')[0] || d.drive_date}
                    </span>
                    <span className="flex items-center gap-1 text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      {d.venue}
                    </span>
                  </div>
                </div>

                {/* Recruitment Round Progression Stepper */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px] mb-2">
                    <span className="font-semibold text-slate-500 uppercase tracking-wider">
                      Drive Selection Stages ({d.rounds?.length || 4} Configured Rounds)
                    </span>
                    {isAdminOrTpo && (
                      <span className="text-slate-600 font-semibold">
                        Registered: <strong className="text-blue-700">{d.total_applicants || 0}</strong> • Shortlisted: <strong className="text-purple-700">{d.shortlisted_count || 0}</strong> • Selected: <strong className="text-emerald-700">{d.selected_count || 0}</strong>
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    {d.rounds?.map((rnd, i) => (
                      <div
                        key={rnd.id || i}
                        className={`p-3 rounded-xl border text-xs ${
                          rnd.round_number === 1
                            ? 'bg-blue-50/70 border-blue-200 text-blue-900 font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span>Round {rnd.round_number}</span>
                          <StatusBadge status={rnd.status} />
                        </div>
                        <div className="font-bold mt-1 text-slate-800 truncate">{rnd.round_name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{rnd.round_type}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Student Registration Status Bar (if student) */}
                {isStudent && (
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    {hasApplied ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold text-emerald-900">
                          You are registered for this drive (App ID: #{studentApp?.id} • Round {studentApp?.current_round_number || 1} • Status: {studentApp?.status})
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-500 text-xs">
                        Open recruitment drive for eligible candidates.
                      </span>
                    )}

                    <div className="flex items-center gap-2">
                      {hasApplied ? (
                        <button
                          onClick={() => navigate('/applications')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs cursor-pointer"
                        >
                          Track in My Applications &rarr;
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate('/companies')}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs cursor-pointer"
                        >
                          View & Apply in Companies &rarr;
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Placement Officer Action Bar */}
                {isAdminOrTpo && (
                  <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 text-xs gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500">
                        Current Active Stage: <strong className="text-blue-600">{d.current_stage}</strong>
                      </span>
                      <select
                        onChange={(e) => handleUpdateStage(d.id, e.target.value)}
                        defaultValue={d.current_stage}
                        className="px-2.5 py-1 border border-slate-200 rounded-lg text-xs bg-slate-50 text-slate-700 font-medium"
                      >
                        <option value="Online Assessment">Stage: Online Assessment</option>
                        <option value="Technical Interviews">Stage: Technical Interviews</option>
                        <option value="HR Discussion">Stage: HR Discussion</option>
                        <option value="Offers Released">Stage: Offers Released</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedManageCompanyId(d.company_id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5" /> Manage Drive & Applicants
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TPO Company & Drive Management Modal */}
      {selectedManageCompanyId && (
        <CompanyManagementModal
          isOpen={!!selectedManageCompanyId}
          onClose={() => setSelectedManageCompanyId(null)}
          companyId={selectedManageCompanyId}
          onCompanyUpdated={fetchDrives}
        />
      )}
    </div>
  );
}
