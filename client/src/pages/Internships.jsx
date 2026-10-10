import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, Badge } from '../components/Badge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { GraduationCap, Building2, Calendar, Award } from 'lucide-react';

export function Internships() {
  const { user } = useAuth();
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInternships();
  }, [user]);

  const fetchInternships = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/internships');
      setInternships(res.data.data || []);
    } catch (err) {
      console.error('Failed to load internships:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Internship & Industrial Training Records</h1>
        <p className="text-xs text-slate-500">Corporate internships, stipends, faculty mentorship, and Pre-Placement Offer (PPO) tracking.</p>
      </div>

      {loading ? (
        <LoadingSpinner text="Retrieving internship records..." />
      ) : internships.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-xs text-slate-400">
          No industrial internships recorded yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {internships.map((intern) => (
            <div key={intern.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{intern.company_name}</h3>
                  <p className="text-xs text-slate-500">{intern.role_title} • Reg: {intern.register_number}</p>
                </div>
                <StatusBadge status={intern.status} />
              </div>

              <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1 text-slate-600 border border-slate-100">
                <div>Stipend: <strong className="text-emerald-700">₹{intern.stipend_monthly}/month</strong></div>
                <div>Duration: {intern.start_date} to {intern.end_date}</div>
                <div>Department: <strong className="text-slate-800">{intern.department_code}</strong></div>
              </div>

              {intern.ppo_offered ? (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 text-xs font-semibold flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-600" />
                  Pre-Placement Offer (PPO) Granted by Employer
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
