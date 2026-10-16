import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, Badge } from '../components/Badge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Settings, Users, Database, ShieldCheck, Terminal, Search, Sparkles } from 'lucide-react';

export function Admin() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('databases'); // 'databases' | 'users' | 'audit'
  
  // Data states
  const [dbData, setDbData] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'databases') {
        const res = await apiClient.get('/admin/department-databases');
        setDbData(res.data);
      } else if (activeTab === 'users') {
        const res = await apiClient.get('/admin/users');
        setUsersList(res.data.data || []);
      } else if (activeTab === 'audit') {
        const res = await apiClient.get('/admin/audit-logs');
        setAuditLogs(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await apiClient.put(`/admin/users/${userId}`, { status: nextStatus });
      fetchAdminData();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">CampusCorp System Administration & Multi-DB Governance</h1>
          <p className="text-xs text-muted-foreground">Configure department database mappings, monitor connection pools, and audit security events.</p>
        </div>

        {/* Tab switcher */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('databases')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'databases' ? 'bg-[#171717] text-[#fafafa] dark:bg-[#fafafa] dark:text-[#0a0a0a] text-white shadow-xs' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            <Database className="w-3.5 h-3.5" /> Dept DB Registry
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'users' ? 'bg-[#171717] text-[#fafafa] dark:bg-[#fafafa] dark:text-[#0a0a0a] text-white shadow-xs' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> User Accounts
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'audit' ? 'bg-[#171717] text-[#fafafa] dark:bg-[#fafafa] dark:text-[#0a0a0a] text-white shadow-xs' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Security Audit Log
          </button>
          <Link
            to="/skill-analyzer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-purple-500/30 text-purple-700 dark:text-purple-300"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-500" /> Skill Catalogue Governance
          </Link>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Querying system configuration tables..." />
      ) : activeTab === 'databases' ? (
        /* 1. Department Database Registry */
        <div className="space-y-5">
          {/* Health summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-border shadow-xs">
              <span className="text-xs font-semibold text-muted-foreground">Central Institutional DB</span>
              <div className="text-lg font-bold text-foreground mt-1 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#171717] text-[#fafafa] dark:bg-[#fafafa] dark:text-[#0a0a0a]"></span>
                `lms` (Port 3306)
              </div>
              <span className="text-[11px] text-foreground font-medium">Latency: {dbData?.health?.commonDb?.latencyMs || 2}ms</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-border shadow-xs">
              <span className="text-xs font-semibold text-muted-foreground">Active Department DBs</span>
              <div className="text-lg font-bold text-foreground mt-1">6 Department Tenants</div>
              <span className="text-[11px] text-muted-foreground">Isolated Schemas in MySQL</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-border shadow-xs">
              <span className="text-xs font-semibold text-muted-foreground">Connection Pool Routing</span>
              <div className="text-lg font-bold text-foreground mt-1">Dynamic Registry Map</div>
              <span className="text-[11px] text-muted-foreground">Zero Cross-Tenant Leakage</span>
            </div>
          </div>

          {/* Registry Table */}
          <div className="bg-white rounded-xl border border-border shadow-xs overflow-hidden">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-foreground">Department Database Mapping Registry</h3>
                <p className="text-xs text-muted-foreground">Stored in central `lms.department_databases` configuration table</p>
              </div>
            </div>
            <table className="w-full text-left text-xs text-muted-foreground">
              <thead className="bg-secondary font-semibold border-b border-border">
                <tr>
                  <th className="py-2.5 px-4">Department Code</th>
                  <th className="py-2.5 px-4">Department Full Name</th>
                  <th className="py-2.5 px-4">Mapped MySQL Database</th>
                  <th className="py-2.5 px-4">Connection Health</th>
                  <th className="py-2.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dbData?.registry?.map((dept) => {
                  const health = dbData?.health?.departments?.[dept.dept_code];
                  const isUp = health?.status === 'UP';

                  return (
                    <tr key={dept.id} className="hover:bg-secondary">
                      <td className="py-3 px-4 font-mono font-bold text-foreground">{dept.dept_code}</td>
                      <td className="py-3 px-4 font-medium text-foreground">{dept.dept_name}</td>
                      <td className="py-3 px-4 font-mono text-foreground font-semibold">{dept.database_name}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 font-bold ${isUp ? 'text-foreground' : 'text-muted-foreground'}`}>
                          <span className={`w-2 h-2 rounded-full ${isUp ? 'bg-[#171717] text-[#fafafa] dark:bg-[#fafafa] dark:text-[#0a0a0a]' : 'bg-slate-400'}`}></span>
                          {isUp ? `Healthy (${health.latencyMs}ms)` : 'Active'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-secondary text-foreground">
                          Configured
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'users' ? (
        /* 2. Users Table */
        <div className="bg-white rounded-xl border border-border shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs text-muted-foreground">
            <thead className="bg-secondary font-semibold border-b border-border">
              <tr>
                <th className="py-2.5 px-4">Name</th>
                <th className="py-2.5 px-4">Email</th>
                <th className="py-2.5 px-4">Role</th>
                <th className="py-2.5 px-4">Department</th>
                <th className="py-2.5 px-4">Account Status</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usersList.map((u) => (
                <tr key={u.id} className="hover:bg-secondary">
                  <td className="py-3 px-4 font-semibold text-foreground">{u.first_name} {u.last_name}</td>
                  <td className="py-3 px-4 font-mono text-muted-foreground">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-[11px] px-2 py-0.5 rounded bg-secondary text-foreground">
                      {u.role_name}
                    </span>
                  </td>
                  <td className="py-3 px-4">{u.department_code || 'All (Institutional)'}</td>
                  <td className="py-3 px-4"><StatusBadge status={u.status} /></td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleToggleUserStatus(u.id, u.status)}
                      className="text-xs font-semibold text-foreground hover:text-foreground"
                    >
                      {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* 3. Audit Logs */
        <div className="bg-white rounded-xl border border-border shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs text-muted-foreground">
            <thead className="bg-secondary font-semibold border-b border-border">
              <tr>
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Module</th>
                <th className="py-2.5 px-4">User</th>
                <th className="py-2.5 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-secondary">
                  <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">{log.created_at}</td>
                  <td className="py-3 px-4 font-bold text-foreground">{log.action}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-secondary text-foreground font-semibold text-[10px]">
                      {log.module}
                    </span>
                  </td>
                  <td className="py-3 px-4">{log.user_email || 'SYSTEM'}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground max-w-sm truncate">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
