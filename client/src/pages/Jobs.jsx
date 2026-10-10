import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Briefcase, Building2, MapPin, IndianRupee, Clock, CheckCircle2, AlertTriangle, Plus, Send } from 'lucide-react';

export function Jobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleTypeFilter, setRoleTypeFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // New Job Modal state for TPO / Recruiters
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newJob, setNewJob] = useState({
    company_id: 1,
    title: '',
    role_type: 'FULL_TIME',
    ctc_lpa: '',
    stipend_monthly: '',
    min_cgpa: '7.00',
    max_backlogs: '0',
    locations: 'Bengaluru / Hyderabad',
    vacancies: '5',
    deadline_date: '2026-12-31 23:59:59',
    job_description: '',
  });

  useEffect(() => {
    fetchJobs();
  }, [roleTypeFilter, search, user]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (roleTypeFilter !== 'ALL') params.roleType = roleTypeFilter;
      if (search) params.search = search;

      const res = await apiClient.get('/jobs', { params });
      setJobs(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (jobId) => {
    setApplyingJobId(jobId);
    setFeedbackMsg(null);
    try {
      const res = await apiClient.post('/applications/apply', { job_id: jobId });
      setFeedbackMsg({ type: 'success', text: res.data.message });
      fetchJobs();
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to apply.',
        reasons: err.response?.data?.ineligibilityReasons,
      });
    } finally {
      setApplyingJobId(null);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/jobs', newJob);
      setIsModalOpen(false);
      fetchJobs();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create job.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Career & Placement Opportunities</h1>
          <p className="text-xs text-slate-500">
            Automated eligibility verification against CGPA, Backlogs, Department, and Policies.
          </p>
        </div>

        {['TPO_OFFICER', 'ADMIN', 'RECRUITER'].includes(user?.roleName) && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Post New Job Opening
          </button>
        )}
      </div>

      {/* Global Feedback Banner */}
      {feedbackMsg && (
        <div className={`p-4 rounded-xl border text-xs ${
          feedbackMsg.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="font-semibold">{feedbackMsg.text}</div>
          {feedbackMsg.reasons && (
            <ul className="list-disc list-inside mt-1.5 space-y-0.5">
              {feedbackMsg.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Filter Row */}
      <div className="flex flex-wrap gap-3 items-center justify-between bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <input
          type="text"
          placeholder="Search by job title, company name, or city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 max-w-sm w-full"
        />

        <div className="flex items-center gap-2">
          <select
            value={roleTypeFilter}
            onChange={(e) => setRoleTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-700"
          >
            <option value="ALL">All Employment Types</option>
            <option value="FULL_TIME">Full Time</option>
            <option value="INTERNSHIP">Internship</option>
          </select>
        </div>
      </div>

      {/* Jobs Grid */}
      {loading ? (
        <LoadingSpinner text="Evaluating live eligibility rules and retrieving job postings..." />
      ) : jobs.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-xs text-slate-400">
          No job openings found matching the criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {jobs.map((job) => {
            const isStudent = user?.roleName === 'STUDENT';
            const isApplied = !!job.applicationStatus;
            const isEligible = job.eligibility?.eligible;
            const hasWaiver = job.eligibility?.hasCoordinatorWaiver;

            return (
              <div
                key={job.id}
                className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top: Company & CTC */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{job.company_name}</span>
                      <h3 className="text-base font-bold text-slate-900 mt-0.5">{job.title}</h3>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-base font-extrabold text-blue-600">₹{job.ctc_lpa} LPA</div>
                      <span className="text-[10px] text-slate-400 font-medium">{job.role_type}</span>
                    </div>
                  </div>

                  {/* Badges: Tier, Location, Vacancies */}
                  <div className="flex flex-wrap gap-2 mt-3 text-[11px]">
                    <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-semibold border border-purple-100">
                      {job.company_tier}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" /> {job.locations}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      {job.vacancies} Openings
                    </span>
                  </div>

                  {/* Description Snippet */}
                  <p className="mt-3 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {job.job_description}
                  </p>

                  {/* Requirements bar */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap gap-3 text-[11px] text-slate-500">
                    <span>Min CGPA: <strong className="text-slate-800">{job.min_cgpa}</strong></span>
                    <span>Max Backlogs: <strong className="text-slate-800">{job.max_backlogs}</strong></span>
                    <span>Deadline: <strong className="text-slate-800">{job.deadline_date?.split('T')[0] || job.deadline_date?.split(' ')[0]}</strong></span>
                  </div>

                  {/* Personalized Student Eligibility Breakdown */}
                  {isStudent && (
                    <div className="mt-3.5 p-3 rounded-lg border text-xs bg-slate-50/70 border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">Eligibility Status:</span>
                        {isEligible ? (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Eligible to Apply
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-rose-600">
                            <AlertTriangle className="w-3.5 h-3.5" /> Ineligible
                          </span>
                        )}
                      </div>

                      {hasWaiver && (
                        <div className="mt-1.5 text-[11px] text-amber-700 font-medium bg-amber-50 p-1.5 rounded border border-amber-200">
                          ⚡ Department Coordinator Waiver Approved for your account
                        </div>
                      )}

                      {!isEligible && job.eligibility?.reasons && (
                        <ul className="mt-1.5 space-y-0.5 text-[11px] text-rose-600 list-disc list-inside">
                          {job.eligibility.reasons.map((r, idx) => (
                            <li key={idx}>{r}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Action Button */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {job.total_applications || 0} applicants so far
                  </span>

                  {isStudent && (
                    <div>
                      {isApplied ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Applied ({job.applicationStatus})
                        </span>
                      ) : (
                        <button
                          onClick={() => handleApply(job.id)}
                          disabled={!isEligible || applyingJobId === job.id}
                          className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer ${
                            isEligible
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <Send className="w-3.5 h-3.5" />
                          {applyingJobId === job.id ? 'Submitting...' : '1-Click Apply'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Post New Job Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Publish New Placement Opportunity" maxWidth="max-w-xl">
        <form onSubmit={handleCreateJob} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Hiring Company</label>
            <select
              value={newJob.company_id}
              onChange={(e) => setNewJob({ ...newJob, company_id: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg bg-white"
            >
              <option value="1">Google India</option>
              <option value="2">Microsoft India</option>
              <option value="3">Tata Consultancy Services (TCS)</option>
              <option value="4">Larsen & Toubro (L&T)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Job Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Associate Software Engineer - Campus 2027"
              value={newJob.title}
              onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">CTC (in LPA)</label>
              <input
                type="number"
                step="0.1"
                required
                placeholder="e.g. 14.50"
                value={newJob.ctc_lpa}
                onChange={(e) => setNewJob({ ...newJob, ctc_lpa: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Min CGPA Required</label>
              <input
                type="number"
                step="0.1"
                value={newJob.min_cgpa}
                onChange={(e) => setNewJob({ ...newJob, min_cgpa: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Job Description & Responsibilities</label>
            <textarea
              rows="3"
              required
              placeholder="Describe candidate requirements and tech stack..."
              value={newJob.job_description}
              onChange={(e) => setNewJob({ ...newJob, job_description: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg"
            ></textarea>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
            >
              Publish Opportunity
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
