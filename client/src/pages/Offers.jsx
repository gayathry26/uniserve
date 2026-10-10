import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, Badge } from '../components/Badge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Award, CheckCircle2, XCircle, FileText, Calendar, Building2 } from 'lucide-react';

export function Offers() {
  const { user } = useAuth();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOffers();
  }, [user]);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/offers');
      setOffers(res.data.data || []);
    } catch (err) {
      console.error('Failed to load offers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRespondOffer = async (offerId, decision) => {
    try {
      await apiClient.post(`/offers/${offerId}/respond`, { decision });
      fetchOffers();
      alert(`Offer ${decision.toLowerCase()} successfully!`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update offer response.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Placement Offers & Joining Outcomes</h1>
          <p className="text-xs text-slate-500">Official offers, accepted appointments, and verified joining outcomes.</p>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Retrieving verified offer letters..." />
      ) : offers.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-xs text-slate-400">
          No placement offers on record yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {offers.map((offer) => {
            const isStudent = user?.roleName === 'STUDENT';
            const isPending = offer.status === 'OFFERED';

            return (
              <div key={offer.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{offer.company_name}</span>
                      <h3 className="text-base font-bold text-slate-900 mt-0.5">{offer.job_title}</h3>
                      <p className="text-xs text-slate-500">Candidate: {offer.first_name} {offer.last_name} ({offer.register_number})</p>
                    </div>
                    <StatusBadge status={offer.status} />
                  </div>

                  <div className="mt-4 p-3 rounded-lg bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-emerald-800 font-medium uppercase">Offered Annual CTC</span>
                      <div className="text-xl font-extrabold text-emerald-700">₹{offer.offered_ctc_lpa} LPA</div>
                    </div>
                    <Award className="w-8 h-8 text-emerald-500 opacity-80" />
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-slate-500">
                    <div>Issue Date: <strong className="text-slate-700">{offer.issue_date}</strong></div>
                    <div>Department: <strong className="text-slate-700">{offer.department_code}</strong></div>
                  </div>
                </div>

                {/* Student Decision Action */}
                {isStudent && isPending && (
                  <div className="pt-3 border-t border-slate-100 flex gap-2">
                    <button
                      onClick={() => handleRespondOffer(offer.id, 'ACCEPTED')}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      Accept Offer Letter
                    </button>
                    <button
                      onClick={() => handleRespondOffer(offer.id, 'REJECTED')}
                      className="px-4 py-2 border border-slate-200 hover:bg-rose-50 text-rose-600 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
