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
          <h1 className="text-xl font-bold text-foreground">Placement Offers & Joining Outcomes</h1>
          <p className="text-xs text-muted-foreground">Official offers, accepted appointments, and verified joining outcomes.</p>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Retrieving verified offer letters..." />
      ) : offers.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-border text-xs text-muted-foreground">
          No placement offers on record yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {offers.map((offer) => {
            const isStudent = user?.roleName === 'STUDENT';
            const isPending = offer.status === 'OFFERED';

            return (
              <div key={offer.id} className="bg-white rounded-xl border border-border p-5 shadow-xs flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{offer.company_name}</span>
                      <h3 className="text-base font-bold text-foreground mt-0.5">{offer.job_title}</h3>
                      <p className="text-xs text-muted-foreground">Candidate: {offer.first_name} {offer.last_name} ({offer.register_number})</p>
                    </div>
                    <StatusBadge status={offer.status} />
                  </div>

                  <div className="mt-4 p-3 rounded-lg bg-secondary border border-border flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-foreground font-medium uppercase">Offered Annual CTC</span>
                      <div className="text-xl font-extrabold text-foreground">₹{offer.offered_ctc_lpa} LPA</div>
                    </div>
                    <Award className="w-8 h-8 text-foreground opacity-80" />
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                    <div>Issue Date: <strong className="text-foreground">{offer.issue_date}</strong></div>
                    <div>Department: <strong className="text-foreground">{offer.department_code}</strong></div>
                  </div>
                </div>

                {/* Student Decision Action */}
                {isStudent && isPending && (
                  <div className="pt-3 border-t border-border flex gap-2">
                    <button
                      onClick={() => handleRespondOffer(offer.id, 'ACCEPTED')}
                      className="flex-1 py-2 bg-[#171717] hover:bg-[#262626] text-[#fafafa] dark:bg-[#fafafa] dark:hover:bg-[#e5e5e5] dark:text-[#0a0a0a] font-bold rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      Accept Offer Letter
                    </button>
                    <button
                      onClick={() => handleRespondOffer(offer.id, 'REJECTED')}
                      className="px-4 py-2 border border-border hover:bg-secondary text-foreground font-semibold rounded-lg text-xs transition-colors cursor-pointer"
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
