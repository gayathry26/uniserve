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
        <h1 className="text-xl font-bold text-foreground">Internship & Industrial Training Records</h1>
        <p className="text-xs text-muted-foreground">Corporate internships, stipends, faculty mentorship, and Pre-Placement Offer (PPO) tracking.</p>
      </div>

      {loading ? (
        <LoadingSpinner text="Retrieving internship records..." />
      ) : internships.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-border text-xs text-muted-foreground">
          No industrial internships recorded yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {internships.map((intern) => (
            <div key={intern.id} className="bg-white rounded-xl border border-border p-5 shadow-xs space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-foreground text-base">{intern.company_name}</h3>
                  <p className="text-xs text-muted-foreground">{intern.role_title} • Reg: {intern.register_number}</p>
                </div>
                <StatusBadge status={intern.status} />
              </div>

              <div className="p-3 bg-secondary rounded-lg text-xs space-y-1 text-muted-foreground border border-border">
                <div>Stipend: <strong className="text-foreground">₹{intern.stipend_monthly}/month</strong></div>
                <div>Duration: {intern.start_date} to {intern.end_date}</div>
                <div>Department: <strong className="text-foreground">{intern.department_code}</strong></div>
              </div>

              {intern.ppo_offered ? (
                <div className="p-2.5 bg-secondary text-foreground rounded-lg border border-border text-xs font-semibold flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-foreground" />
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
