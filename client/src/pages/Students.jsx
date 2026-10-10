import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Search, Filter, Eye, GraduationCap, Award, BookOpen } from 'lucide-react';

export function Students() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [departmentFilter, statusFilter, search]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (departmentFilter !== 'ALL') params.department = departmentFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (search) params.search = search;

      const res = await apiClient.get('/students', { params });
      setStudents(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudent = async (studentId) => {
    setModalLoading(true);
    setSelectedStudent({ loading: true });
    try {
      const res = await apiClient.get(`/students/${studentId}`);
      setSelectedStudent(res.data);
    } catch (err) {
      console.error('Failed to fetch student details:', err);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Student Placement Master Roster</h1>
          <p className="text-xs text-slate-500">Central student identities linked to isolated department academic databases.</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, reg number, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Department Filter (Only for TPO/Admin/Management) */}
          {user?.roleName !== 'FACULTY_COORDINATOR' && (
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-none font-medium text-slate-700"
            >
              <option value="ALL">All Departments</option>
              <option value="CSE">CSE (Computer Science)</option>
              <option value="ECE">ECE (Electronics)</option>
              <option value="EEE">EEE (Electrical)</option>
              <option value="MECH">MECH (Mechanical)</option>
              <option value="CIVIL">CIVIL (Civil)</option>
              <option value="IT">IT (Information Tech)</option>
            </select>
          )}

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-none font-medium text-slate-700"
          >
            <option value="ALL">All Placement Statuses</option>
            <option value="REGISTERED">Registered</option>
            <option value="PLACED">Placed</option>
            <option value="MULTIPLE_OFFERS">Multiple Offers</option>
            <option value="OPTED_OUT">Opted Out</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Retrieving student records from institutional database..." />
        ) : students.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">No students match the selected criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Register No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">CGPA</th>
                  <th className="py-3 px-4">Active Backlogs</th>
                  <th className="py-3 px-4">Technical Skills</th>
                  <th className="py-3 px-4">Placement Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s) => {
                  let skillsList = [];
                  try {
                    skillsList = typeof s.skills === 'string' ? JSON.parse(s.skills) : (s.skills || []);
                  } catch (e) {}

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">{s.register_number}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{s.first_name} {s.last_name}</div>
                        <div className="text-[11px] text-slate-400">{s.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {s.department_code}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-blue-600">{s.cgpa}</td>
                      <td className="py-3 px-4">
                        {s.active_backlogs > 0 ? (
                          <span className="text-rose-600 font-semibold">{s.active_backlogs} active</span>
                        ) : (
                          <span className="text-emerald-600 font-medium">0 (Clear)</span>
                        )}
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate">
                        <div className="flex gap-1 flex-wrap">
                          {skillsList.slice(0, 3).map((sk, idx) => (
                            <span key={idx} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              {sk}
                            </span>
                          ))}
                          {skillsList.length > 3 && (
                            <span className="text-[10px] text-slate-400">+{skillsList.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={s.placement_status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleViewStudent(s.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Academic DB
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Showing Department-Specific Isolated Academic Details */}
      <Modal
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        title={selectedStudent?.student ? `${selectedStudent.student.first_name} ${selectedStudent.student.last_name} - Academic & Placement File` : 'Loading...'}
        maxWidth="max-w-2xl"
      >
        {modalLoading || !selectedStudent?.student ? (
          <LoadingSpinner text="Querying department database..." />
        ) : (
          <div className="space-y-5 text-xs text-slate-700">
            {/* Top Identity Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 font-medium">Register No:</span>
                <p className="font-bold text-slate-900">{selectedStudent.student.register_number}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Department:</span>
                <p className="font-bold text-slate-900">{selectedStudent.student.department_code}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Cumulative CGPA:</span>
                <p className="font-bold text-blue-600 text-sm">{selectedStudent.student.cgpa}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Placement Status:</span>
                <div className="mt-0.5"><StatusBadge status={selectedStudent.student.placement_status} /></div>
              </div>
            </div>

            {/* Department-Specific Isolated Database Record */}
            <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-blue-900">
                    Department Database Record (`lms_{selectedStudent.student.department_code?.toLowerCase()}`)
                  </span>
                </div>
                <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                  Isolated SQL Storage
                </span>
              </div>

              {selectedStudent.departmentAcademicData ? (
                <>
                  <div className="grid grid-cols-4 gap-2 text-center bg-white p-3 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-400">Sem 1</span>
                      <p className="font-semibold text-slate-800">{selectedStudent.departmentAcademicData.sem1_gpa || '-'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Sem 2</span>
                      <p className="font-semibold text-slate-800">{selectedStudent.departmentAcademicData.sem2_gpa || '-'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Sem 3</span>
                      <p className="font-semibold text-slate-800">{selectedStudent.departmentAcademicData.sem3_gpa || '-'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Sem 4</span>
                      <p className="font-semibold text-slate-800">{selectedStudent.departmentAcademicData.sem4_gpa || '-'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Sem 5</span>
                      <p className="font-semibold text-slate-800">{selectedStudent.departmentAcademicData.sem5_gpa || '-'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Sem 6</span>
                      <p className="font-semibold text-slate-800">{selectedStudent.departmentAcademicData.sem6_gpa || '-'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Dept Rank</span>
                      <p className="font-bold text-emerald-600">#{selectedStudent.departmentAcademicData.department_rank || '1'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Status</span>
                      <p className="font-semibold text-slate-800">{selectedStudent.departmentAcademicData.verification_status}</p>
                    </div>
                  </div>

                  {selectedStudent.departmentAcademicData.mentor_remarks && (
                    <div className="text-xs bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="font-semibold text-slate-700">Faculty Mentor Remarks ({selectedStudent.departmentAcademicData.faculty_mentor_name}):</span>
                      <p className="text-slate-600 mt-0.5">{selectedStudent.departmentAcademicData.mentor_remarks}</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-slate-500 text-xs">No isolated academic semester row found for this register number.</p>
              )}
            </div>

            {/* Applications History */}
            <div>
              <h4 className="font-semibold text-slate-800 mb-2">Recruitment Applications</h4>
              {selectedStudent.applications?.length === 0 ? (
                <p className="text-xs text-slate-400">No applications on record.</p>
              ) : (
                <div className="space-y-2">
                  {selectedStudent.applications.map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <div>
                        <span className="font-bold text-slate-800">{app.company_name}</span>
                        <span className="text-slate-500 ml-2">({app.job_title})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-emerald-600">₹{app.ctc_lpa} LPA</span>
                        <StatusBadge status={app.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
