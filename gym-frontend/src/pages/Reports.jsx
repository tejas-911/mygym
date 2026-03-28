import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import {
  BarChart3, Users, DollarSign, Calendar, AlertTriangle, TrendingUp,
  Award, ShoppingBag, Dumbbell, Loader2, RefreshCw, ScrollText,
  Zap, Shield, Clock, ChevronDown, Eye, Cog, FunctionSquare
} from 'lucide-react';

const API = 'http://localhost:5000/api/reports';

function getHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-iron-text-secondary text-[10px] uppercase tracking-widest font-bold">{label}</p>
      <p className="text-iron-lime font-space font-bold text-lg">${parseFloat(payload[0].value).toFixed(2)}</p>
    </div>
  );
};

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(API, { headers: getHeaders(), params: { month, year } });
      setData(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [month, year]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 gap-3 text-iron-text-secondary">
        <Loader2 size={20} className="animate-spin text-iron-lime" />
        <span className="font-space uppercase tracking-widest text-xs">Generating Report...</span>
      </div>
    );
  }

  if (!data) return <div className="text-iron-text-secondary text-center py-20">Error loading reports.</div>;

  const membership = data.membership || {};
  const attendance = data.attendance || {};
  const hasAudit = data.auditLog && data.auditLog.length > 0;
  const hasEquipHealth = data.equipmentHealth && data.equipmentHealth.length > 0;

  return (
    <div className="space-y-6 pb-12 font-manrope">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-space font-bold tracking-tighter text-white mb-2">Analytics & Reports</h1>
          <p className="text-iron-text-secondary font-medium italic text-sm">
            Powered by stored procedures, views & functions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select value={month} onChange={e => setMonth(parseInt(e.target.value))}
            className="bg-surface border border-border rounded-xl px-4 py-2.5 text-xs text-white font-space outline-none focus:border-iron-lime/40">
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2000, i).toLocaleString('en', { month: 'long' })}
              </option>
            ))}
          </select>
          <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value))}
            className="bg-surface border border-border rounded-xl px-4 py-2.5 text-xs text-white font-space outline-none focus:border-iron-lime/40 w-24" />
          <button onClick={fetchReports}
            className="flex items-center gap-2 px-5 py-2.5 bg-iron-lime text-dark rounded-xl font-space font-bold text-xs uppercase tracking-widest hover:shadow-[0_0_20px_rgba(223,255,0,0.3)] transition-all">
            <RefreshCw size={13} /> Generate
          </button>
        </div>
      </div>

      {/* DB Feature badges */}
      <div className="flex flex-wrap gap-2">
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 text-[9px] font-black uppercase tracking-widest">
          <Cog size={10} /> sp_gym_performance_report
        </span>
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400 text-[9px] font-black uppercase tracking-widest">
          <Eye size={10} /> vw_monthly_revenue
        </span>
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-[9px] font-black uppercase tracking-widest">
          <Eye size={10} /> vw_equipment_health
        </span>
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[9px] font-black uppercase tracking-widest">
          <Zap size={10} /> Audit Log (Triggers)
        </span>
      </div>

      {/* ── MEMBERSHIP STATS (from stored procedure) ────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-start justify-between mb-4">
            <p className="text-[10px] font-space font-bold uppercase tracking-[0.2em] text-iron-text-secondary">Total Members</p>
            <div className="w-9 h-9 rounded-lg bg-iron-lime/10 flex items-center justify-center text-iron-lime"><Users size={16} /></div>
          </div>
          <p className="text-4xl font-space font-black text-white">{membership.total_members ?? '—'}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-start justify-between mb-4">
            <p className="text-[10px] font-space font-bold uppercase tracking-[0.2em] text-iron-text-secondary">Active</p>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400"><Users size={16} /></div>
          </div>
          <p className="text-4xl font-space font-black text-emerald-400">{membership.active_members ?? '—'}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-start justify-between mb-4">
            <p className="text-[10px] font-space font-bold uppercase tracking-[0.2em] text-iron-text-secondary">Absent 7d</p>
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400"><Calendar size={16} /></div>
          </div>
          <p className="text-4xl font-space font-black text-amber-400">{data.absentMembers ?? '—'}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-start justify-between mb-4">
            <p className="text-[10px] font-space font-bold uppercase tracking-[0.2em] text-iron-text-secondary">New This Month</p>
            <div className="w-9 h-9 rounded-lg bg-iron-blue/10 flex items-center justify-center text-iron-blue"><TrendingUp size={16} /></div>
          </div>
          <p className="text-4xl font-space font-black text-white">{membership.new_this_month ?? '—'}</p>
        </div>
      </div>

      {/* ── ATTENDANCE (from stored procedure) ──────────────────── */}
      {attendance && (
        <div className="grid grid-cols-3 gap-4">
          <div className="stat-card">
            <p className="text-[10px] font-space font-bold uppercase tracking-[0.2em] text-iron-text-secondary mb-3">Unique Visitors</p>
            <p className="text-3xl font-space font-black text-white">{attendance.unique_visitors ?? '—'}</p>
          </div>
          <div className="stat-card">
            <p className="text-[10px] font-space font-bold uppercase tracking-[0.2em] text-iron-text-secondary mb-3">Total Check-Ins</p>
            <p className="text-3xl font-space font-black text-white">{attendance.total_check_ins ?? '—'}</p>
          </div>
          <div className="stat-card">
            <p className="text-[10px] font-space font-bold uppercase tracking-[0.2em] text-iron-text-secondary mb-3">Avg Session</p>
            <div className="flex items-baseline gap-1">
              <p className="text-3xl font-space font-black text-white">{attendance.avg_session_minutes ?? '—'}</p>
              <span className="text-iron-text-secondary text-sm font-bold">min</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Two Column: Revenue Chart + Top Performers ──────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">

        {/* Revenue Chart (from vw_monthly_revenue VIEW) */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-white font-space font-bold text-sm uppercase tracking-widest">Monthly Revenue</h3>
              <p className="text-iron-text-secondary text-xs italic mt-0.5">Source: vw_monthly_revenue view</p>
            </div>
            <span className="px-2 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded text-[9px] font-black uppercase tracking-widest">View</span>
          </div>
          {data.monthlyRevenue && data.monthlyRevenue.length > 0 ? (
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <AreaChart data={data.monthlyRevenue}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#DFFF00" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#DFFF00" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F1F26" vertical={false} />
                  <XAxis dataKey="payment_month" axisLine={false} tickLine={false} tick={{ fill: '#71717A', fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717A', fontSize: 10 }} tickFormatter={v => `$${v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="total_revenue" stroke="#DFFF00" strokeWidth={2} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-iron-text-secondary text-sm italic text-center py-12">No revenue data for this period.</p>
          )}
        </div>

        {/* Top Performers */}
        <div className="space-y-4">
          {/* Top Members (from stored procedure) */}
          {data.topMembers && data.topMembers.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Award size={14} className="text-iron-lime" />
                <h4 className="text-white font-space font-bold text-xs uppercase tracking-widest">Top Active Members</h4>
                <span className="ml-auto px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[8px] font-black uppercase tracking-widest">Procedure</span>
              </div>
              <div className="space-y-3">
                {data.topMembers.map((m, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-white/[0.03] flex items-center justify-center text-[10px] font-black text-iron-lime font-space">
                        {i + 1}
                      </span>
                      <span className="text-white text-sm font-medium">{m.name}</span>
                    </div>
                    <span className="text-iron-text-secondary text-xs font-space font-bold">{m.visits} visits</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Assets */}
          <div className="card space-y-4">
            <h4 className="text-white font-space font-bold text-xs uppercase tracking-widest flex items-center gap-2">
              <TrendingUp size={13} className="text-iron-lime" /> Top Performing Assets
            </h4>
            {data.popularWorkout && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Dumbbell size={12} className="text-iron-text-secondary" />
                  <span className="text-xs text-iron-text-secondary">Top Workout</span>
                </div>
                <span className="text-white text-xs font-bold">{data.popularWorkout.plan_name} ({data.popularWorkout.count})</span>
              </div>
            )}
            {data.topTrainer && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users size={12} className="text-iron-text-secondary" />
                  <span className="text-xs text-iron-text-secondary">Top Trainer</span>
                </div>
                <span className="text-white text-xs font-bold">{data.topTrainer.name} ({data.topTrainer.count})</span>
              </div>
            )}
            {data.topSupplement && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={12} className="text-iron-text-secondary" />
                  <span className="text-xs text-iron-text-secondary">Top Supplement</span>
                </div>
                <span className="text-white text-xs font-bold">{data.topSupplement.name} ({data.topSupplement.sold} sold)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── EQUIPMENT HEALTH (from vw_equipment_health VIEW) ───── */}
      {hasEquipHealth && (
        <div className="card !p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield size={14} className="text-amber-400" />
              <div>
                <h3 className="text-white font-space font-bold text-sm uppercase tracking-widest">Equipment Health</h3>
                <p className="text-iron-text-secondary text-xs italic">Source: vw_equipment_health view</p>
              </div>
            </div>
            <span className="px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-[9px] font-black uppercase tracking-widest">View</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-3 text-[10px] font-space font-bold uppercase tracking-widest text-iron-text-secondary">Equipment</th>
                  <th className="px-6 py-3 text-[10px] font-space font-bold uppercase tracking-widest text-iron-text-secondary">Condition</th>
                  <th className="px-6 py-3 text-[10px] font-space font-bold uppercase tracking-widest text-iron-text-secondary">Location</th>
                  <th className="px-6 py-3 text-[10px] font-space font-bold uppercase tracking-widest text-iron-text-secondary">Last Service</th>
                  <th className="px-6 py-3 text-[10px] font-space font-bold uppercase tracking-widest text-iron-text-secondary">Days Since</th>
                  <th className="px-6 py-3 text-[10px] font-space font-bold uppercase tracking-widest text-iron-text-secondary">Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {data.equipmentHealth.map(eq => (
                  <tr key={eq.equipment_id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-3 text-white text-sm font-medium">{eq.equipment_name}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs font-bold ${
                        eq.condition_status === 'New' || eq.condition_status === 'Good' ? 'text-emerald-400' :
                        eq.condition_status === 'Needs Repair' ? 'text-amber-400' : 'text-red-400'
                      }`}>{eq.condition_status}</span>
                    </td>
                    <td className="px-6 py-3 text-iron-text-secondary text-xs">{eq.location || '—'}</td>
                    <td className="px-6 py-3 text-iron-text-secondary text-xs">
                      {eq.last_service_date ? new Date(eq.last_service_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-6 py-3 text-white text-xs font-space font-bold">{eq.days_since_service ?? '—'}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest ${
                        eq.maintenance_flag === 'Overdue' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        eq.maintenance_flag === 'Due Soon' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>{eq.maintenance_flag}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── EQUIPMENT ALERTS (from stored procedure) ──────────── */}
      {data.equipmentAlerts && data.equipmentAlerts.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={14} className="text-red-400" />
            <h3 className="text-white font-space font-bold text-xs uppercase tracking-widest">Equipment Alerts</h3>
            <span className="ml-auto px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[8px] font-black uppercase tracking-widest">Procedure</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.equipmentAlerts.map((eq, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
                <span className="text-white text-sm font-medium">{eq.equipment_name}</span>
                <span className="text-red-400 text-[10px] font-black uppercase tracking-widest">{eq.condition_status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── AUDIT LOG (populated by TRIGGERS) ──────────────────── */}
      <div className="card !p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ScrollText size={14} className="text-red-400" />
            <div>
              <h3 className="text-white font-space font-bold text-sm uppercase tracking-widest">Audit Log</h3>
              <p className="text-iron-text-secondary text-xs italic">Auto-populated by AFTER INSERT/UPDATE triggers</p>
            </div>
          </div>
          <span className="px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-[9px] font-black uppercase tracking-widest">Triggers</span>
        </div>

        {hasAudit ? (
          <div className="overflow-x-auto" style={{ maxHeight: '350px' }}>
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-surface z-10">
                <tr className="border-b border-border">
                  <th className="px-6 py-3 text-[10px] font-space font-bold uppercase tracking-widest text-iron-text-secondary">ID</th>
                  <th className="px-6 py-3 text-[10px] font-space font-bold uppercase tracking-widest text-iron-text-secondary">Table</th>
                  <th className="px-6 py-3 text-[10px] font-space font-bold uppercase tracking-widest text-iron-text-secondary">Action</th>
                  <th className="px-6 py-3 text-[10px] font-space font-bold uppercase tracking-widest text-iron-text-secondary">Record ID</th>
                  <th className="px-6 py-3 text-[10px] font-space font-bold uppercase tracking-widest text-iron-text-secondary">New Values</th>
                  <th className="px-6 py-3 text-[10px] font-space font-bold uppercase tracking-widest text-iron-text-secondary">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {data.auditLog.map(log => (
                  <tr key={log.log_id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-3 text-iron-text-secondary text-xs font-space">#{log.log_id}</td>
                    <td className="px-6 py-3">
                      <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] font-black uppercase tracking-widest text-white">{log.table_name}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${
                        log.action_type === 'INSERT' ? 'text-emerald-400' :
                        log.action_type === 'UPDATE' ? 'text-amber-400' : 'text-red-400'
                      }`}>{log.action_type}</span>
                    </td>
                    <td className="px-6 py-3 text-white text-xs font-space font-bold">{log.record_id}</td>
                    <td className="px-6 py-3">
                      <pre className="text-[10px] text-iron-lime/70 font-mono max-w-[300px] truncate">
                        {typeof log.new_values === 'string' ? log.new_values : JSON.stringify(log.new_values)}
                      </pre>
                    </td>
                    <td className="px-6 py-3 text-iron-text-secondary text-xs">
                      {log.changed_at ? new Date(log.changed_at).toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-iron-text-secondary text-sm italic">
            No audit entries yet. Triggers will populate this table when payments are made or member statuses change.
          </div>
        )}
      </div>
    </div>
  );
}
