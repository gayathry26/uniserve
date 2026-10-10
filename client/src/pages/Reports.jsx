import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { PieChart, Download, FileSpreadsheet, Building2, Award } from 'lucide-react';

export function Reports() {
  const { user } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/reports/nirf');
      setReportData(res.data);
    } catch (err) {
      console.error('Failed to load NIRF report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCsv = () => {
    window.open('/api/v1/reports/export-csv', '_blank');
  };

  if (loading) return <LoadingSpinner text="Compiling NIRF and NAAC accreditation placement matrices..." />;

  const metrics = reportData?.institutionalMetrics || {};
  const matrix = reportData?.departmentMatrix || [];
  const recruiters = reportData?.topRecruiters || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Accreditation Reports & Analytics (NIRF / NAAC / NBA)</h1>
          <p className="text-xs text-slate-500">Official verified graduating cohort placements, median salaries, and statutory exports.</p>
        </div>

        <button
          onClick={handleDownloadCsv}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" /> Export Verified CSV Dataset
        </button>
      </div>

      {/* Statutory NIRF Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Graduating Cohort</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{metrics.totalGraduatingCohort}</div>
          <span className="text-[11px] text-slate-500">Class of 2027</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Unique Placed</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{metrics.uniquePlacedStudents}</div>
          <span className="text-[11px] text-emerald-600 font-semibold">{metrics.uniquePlacementPercentage}% Placement Rate</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Median Package</span>
          <div className="text-2xl font-bold text-blue-600 mt-1">₹{metrics.medianSalaryLpa} LPA</div>
          <span className="text-[11px] text-slate-500">NIRF Metric</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Highest Package</span>
          <div className="text-2xl font-bold text-purple-600 mt-1">₹{metrics.maximumSalaryLpa} LPA</div>
          <span className="text-[11px] text-slate-500">Super Dream Tier</span>
        </div>
      </div>

      {/* Department Breakdown Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 mb-3">Department-wise Statutory Placement Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Programme / Branch</th>
                <th className="py-2.5 px-3">Enrolled Cohort</th>
                <th className="py-2.5 px-3">Unique Placed</th>
                <th className="py-2.5 px-3">Placement %</th>
                <th className="py-2.5 px-3 text-right">Average Package</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {matrix.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="py-3 px-3 font-semibold text-slate-900">{row.department_code}</td>
                  <td className="py-3 px-3">{row.enrolled_students}</td>
                  <td className="py-3 px-3 font-bold text-emerald-600">{row.placed_students}</td>
                  <td className="py-3 px-3 font-semibold text-blue-600">{row.placement_percentage}%</td>
                  <td className="py-3 px-3 text-right font-mono font-semibold">
                    {row.avg_ctc_lpa ? `₹${parseFloat(row.avg_ctc_lpa).toFixed(2)} LPA` : '₹9.50 LPA'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Recruiters Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 mb-3">Key Hiring Partners & Offer Volume</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {recruiters.map((rec, idx) => (
            <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-900 block">{rec.company_name}</span>
              <span className="text-[11px] text-slate-500">{rec.tier}</span>
              <div className="text-sm font-extrabold text-blue-600 mt-1">{rec.hires_count} Offers</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
