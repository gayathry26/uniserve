import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Modal } from '../components/Modal';
import { HeartHandshake, Building2, Briefcase, Calendar, Globe, Send } from 'lucide-react';

export function Alumni() {
  const { user } = useAuth();
  const [alumniList, setAlumniList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlumni, setSelectedAlumni] = useState(null);

  const [bookingForm, setBookingForm] = useState({
    topic: 'System Design Interview Advice & Resume Review',
    message: 'Looking for guidance regarding cloud architectures and behavioral interview preparation.',
    proposed_date: '2026-10-25',
  });

  useEffect(() => {
    fetchAlumni();
  }, []);

  const fetchAlumni = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/alumni');
      setAlumniList(res.data.data || []);
    } catch (err) {
      console.error('Failed to load alumni:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookSession = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/alumni/book-mentorship', {
        alumni_id: selectedAlumni.id,
        ...bookingForm,
      });
      setSelectedAlumni(null);
      alert(`Mentorship booking request sent to ${selectedAlumni.first_name}! A calendar invitation will follow.`);
    } catch (err) {
      alert('Failed to request mentorship');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Alumni Career Mentorship & Referral Network</h1>
        <p className="text-xs text-muted-foreground">Connect with distinguished graduates working at tier-1 multinationals for guidance and referrals.</p>
      </div>

      {loading ? (
        <LoadingSpinner text="Retrieving alumni directory..." />
      ) : alumniList.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-border text-xs text-muted-foreground">
          No alumni profiles listed currently.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {alumniList.map((al) => (
            <div key={al.id} className="bg-white rounded-xl border border-border p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-full bg-secondary text-foreground font-bold flex items-center justify-center text-sm">
                    {al.first_name[0]}
                  </div>
                  <span className="text-[10px] font-bold bg-secondary text-foreground px-2 py-0.5 rounded border border-border">
                    Class of {al.graduation_year} ({al.department_code})
                  </span>
                </div>

                <h3 className="font-bold text-base text-foreground mt-3">{al.first_name} {al.last_name}</h3>
                <p className="text-xs text-muted-foreground font-medium">{al.job_role}</p>
                <div className="text-xs font-semibold text-foreground mt-0.5">{al.current_company}</div>

                <div className="mt-3.5 space-y-1.5 text-[11px] text-muted-foreground pt-3 border-t border-border">
                  <div>Experience: <strong className="text-foreground">{al.experience_years} Years</strong></div>
                  <div>Mentorship Status: <strong className="text-foreground">Available for 1:1 Slots</strong></div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                {al.linkedin_url ? (
                  <a
                    href={al.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors p-1"
                  >
                    <Globe className="w-4 h-4" />
                  </a>
                ) : <div></div>}

                <button
                  onClick={() => setSelectedAlumni(al)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#171717] hover:bg-[#262626] text-[#fafafa] dark:bg-[#fafafa] dark:hover:bg-[#e5e5e5] dark:text-[#0a0a0a] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> Book Guidance Session
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Book Mentorship Modal */}
      <Modal isOpen={!!selectedAlumni} onClose={() => setSelectedAlumni(null)} title={`Request Mentorship with ${selectedAlumni?.first_name} ${selectedAlumni?.last_name}`}>
        <form onSubmit={handleBookSession} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-foreground mb-1">Session Topic</label>
            <input
              type="text"
              required
              value={bookingForm.topic}
              onChange={(e) => setBookingForm({ ...bookingForm, topic: e.target.value })}
              className="w-full p-2 border border-border rounded"
            />
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Proposed Discussion Date</label>
            <input
              type="date"
              required
              value={bookingForm.proposed_date}
              onChange={(e) => setBookingForm({ ...bookingForm, proposed_date: e.target.value })}
              className="w-full p-2 border border-border rounded"
            />
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Note to Alumni Mentor</label>
            <textarea
              rows="3"
              required
              value={bookingForm.message}
              onChange={(e) => setBookingForm({ ...bookingForm, message: e.target.value })}
              className="w-full p-2 border border-border rounded"
            ></textarea>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button type="button" onClick={() => setSelectedAlumni(null)} className="px-4 py-2 border rounded">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-[#171717] text-[#fafafa] dark:bg-[#fafafa] dark:text-[#0a0a0a] text-white font-semibold rounded hover:bg-[#171717] text-[#fafafa] dark:bg-[#fafafa] dark:text-[#0a0a0a]">Submit Booking Request</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
