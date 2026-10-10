import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { CalendarDays, MapPin, Users, CheckCircle2, ChevronRight, Plus } from 'lucide-react';

export function Drives() {
  const { user } = useAuth();
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Placement Drive Schedules & Stages</h1>
          <p className="text-xs text-slate-500">Multi-stage recruitment coordination and selection round progression.</p>
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
          {drives.map((d) => (
            <div key={d.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900">{d.drive_title}</h3>
                    <StatusBadge status={d.status} />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Company: <strong className="text-slate-700">{d.company_name}</strong> • Role: {d.job_title} (₹{d.ctc_lpa} LPA)
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                    <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
                    {d.drive_date?.split('T')[0] || d.drive_date}
                  </span>
                  <span className="flex items-center gap-1 text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    {d.venue}
                  </span>
                </div>
              </div>

              {/* Recruitment Round Progression Stepper */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Drive Selection Stages ({d.rounds?.length || 4} Rounds)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  {d.rounds?.map((rnd, i) => (
                    <div
                      key={rnd.id || i}
                      className={`p-3 rounded-lg border text-xs ${
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

              {/* Action Bar */}
              {['TPO_OFFICER', 'ADMIN', 'RECRUITER'].includes(user?.roleName) && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500">
                    Current Active Stage: <strong className="text-blue-600">{d.current_stage}</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <select
                      onChange={(e) => handleUpdateStage(d.id, e.target.value)}
                      defaultValue={d.current_stage}
                      className="px-2.5 py-1 border border-slate-200 rounded text-xs bg-slate-50"
                    >
                      <option value="Online Assessment">Stage: Online Assessment</option>
                      <option value="Technical Interviews">Stage: Technical Interviews</option>
                      <option value="HR Discussion">Stage: HR Discussion</option>
                      <option value="Offers Released">Stage: Offers Released</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
