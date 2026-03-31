import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, TrendingDown, Clock, ShieldCheck, Download,
  Search, ChevronLeft, ChevronRight, MoreHorizontal,
  CreditCard, Banknote, Smartphone, Building2, Plus,
  Loader2, AlertCircle, X, CheckCircle
} from 'lucide-react';

const API = 'http://localhost:5000/api/payments';
const SUB_API = 'http://localhost:5000/api/subscriptions';

function getHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatINR(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN');
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';
}

const METHOD_ICONS = {
  UPI: <Smartphone size={13} />,
  Card: <CreditCard size={13} />,
  Cash: <Banknote size={13} />,
  'Bank Transfer': <Building2 size={13} />,
};

const STATUS_STYLES = {
  Paid:     'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Pending:  'bg-amber-500/10  text-amber-400  border-amber-500/20',
  Failed:   'bg-red-500/10    text-red-400    border-red-500/20',
  Refunded: 'bg-iron-blue/10  text-blue-400   border-blue-500/20',
};

const AVATAR_PALETTE = ['#3B82F6','#8B5CF6','#EC4899','#F59E0B','#10B981','#EF4444','#6366F1','#0EA5E9'];

function Avatar({ name, idx }) {
  const color = AVATAR_PALETTE[idx % AVATAR_PALETTE.length];
  return (
    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white flex-shrink-0"
         style={{ background: color }}>
      {getInitials(name)}
    </div>
  );
}

// Custom tooltip for chart
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#18181A] border border-border rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-iron-text-secondary text-xs uppercase tracking-widest font-space mb-1">{label}</p>
      <p className="text-iron-lime font-space font-bold text-base">{formatINR(payload[0].value)}</p>
    </div>
  );
}

const PAGE_SIZE = 8;
const initialForm = { subscription_id: '', amount: '', payment_date: new Date().toISOString().split('T')[0], payment_method: 'Card' };

export default function Payments() {
  // Stats
  const [stats, setStats] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [trendMode, setTrendMode] = useState('monthly'); // 'daily' | 'monthly'

  // Table
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loadingTable, setLoadingTable] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  const searchRef = useRef(null);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/stats`, { headers: getHeaders() });
      setStats(data);
    } catch (e) { console.error(e); }
  }, []);

  // Fetch trend
  const fetchTrend = useCallback(async (mode) => {
    try {
      const { data } = await axios.get(`${API}/trend/${mode}`, { headers: getHeaders() });
      setTrendData(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setTrendData([]);
    }
  }, []);

  // Fetch table
  const fetchTable = useCallback(async (pg, q) => {
    setLoadingTable(true);
    try {
      const { data } = await axios.get(API, {
        headers: getHeaders(),
        params: { limit: PAGE_SIZE, offset: pg * PAGE_SIZE, search: q }
      });
      // Handle both new { records, total } shape and legacy plain-array response
      if (Array.isArray(data)) {
        setRecords(data);
        setTotal(data.length);
      } else {
        setRecords(Array.isArray(data.records) ? data.records : []);
        setTotal(data.total ?? 0);
      }
    } catch (e) {
      console.error(e);
      setRecords([]);
      setTotal(0);
    } finally { setLoadingTable(false); }
  }, []);

  useEffect(() => { fetchStats(); fetchTrend('monthly'); }, []);
  useEffect(() => { fetchTable(page, search); }, [page, search]);

  const handleTrendToggle = (mode) => {
    setTrendMode(mode);
    fetchTrend(mode);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    setSearch(searchInput);
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(0);
  };

  const downloadCSV = () => {
    const headers = ['Payment ID', 'Member', 'Plan', 'Amount', 'Method', 'Date', 'Status'];
    const rows = records.map(r => [
      r.payment_id, r.member_name || 'N/A', r.plan_name || 'N/A',
      r.amount, r.payment_method, formatDate(r.payment_date), r.status
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Modal
  const openModal = async () => {
    setFormError(''); setFormSuccess(false); setFormData(initialForm);
    try {
      const { data } = await axios.get(SUB_API, { headers: getHeaders() });
      setSubscriptions(data);
    } catch (e) { console.error(e); }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setFormError('');
    try {
      await axios.post(API, formData, { headers: getHeaders() });
      setFormSuccess(true);
      fetchStats();
      fetchTable(0, search);
      setPage(0);
      setTimeout(() => { setShowModal(false); setFormSuccess(false); }, 1200);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to record payment.');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6 pb-10 font-manrope">

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-space font-bold tracking-tighter text-white mb-1">Revenue Overview</h1>
          <p className="text-iron-text-secondary text-sm italic">Real-time financial performance & transaction history</p>
        </div>
        <button onClick={openModal} className="btn flex items-center gap-2">
          <Plus size={14} /> Record Payment
        </button>
      </div>

      {/* ── Top Stats ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* This Month Revenue */}
        <div className="card relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-end pr-4 pointer-events-none select-none">
            <span className="text-[5rem] font-space font-black text-white/[0.03] leading-none tracking-tighter">REV</span>
          </div>
          <p className="text-xs font-space font-bold uppercase tracking-[0.2em] text-iron-text-secondary mb-4">
            This Month Revenue
          </p>
          <p className="text-4xl font-space font-black text-iron-lime tracking-tighter mb-3">
            {stats ? formatINR(stats.this_month_revenue) : '—'}
          </p>
          {stats?.pct_change !== null && stats?.pct_change !== undefined && (
            <div className="flex items-center gap-1.5">
              {parseFloat(stats.pct_change) >= 0
                ? <TrendingUp size={13} className="text-emerald-400" />
                : <TrendingDown size={13} className="text-red-400" />}
              <span className={`text-xs font-bold ${parseFloat(stats.pct_change) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {parseFloat(stats.pct_change) >= 0 ? '+' : ''}{stats.pct_change}%
              </span>
              <span className="text-iron-text-secondary text-xs italic">vs last month</span>
            </div>
          )}
        </div>

        {/* Pending Payments */}
        <div className="card relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-end pr-4 pointer-events-none select-none">
            <span className="text-[5rem] font-space font-black text-white/[0.03] leading-none">₹?</span>
          </div>
          <p className="text-xs font-space font-bold uppercase tracking-[0.2em] text-iron-text-secondary mb-4">
            Pending Payments
          </p>
          <p className="text-5xl font-space font-black text-amber-400 tracking-tighter mb-3">
            {stats ? String(stats.pending_count).padStart(2, '0') : '—'}
          </p>
          <div className="flex items-center gap-2">
            <AlertCircle size={13} className="text-amber-400/70" />
            <p className="text-iron-text-secondary text-xs italic">
              Action required for {stats?.expired_count ?? '—'} expired memberships
            </p>
          </div>
        </div>

        {/* Successful */}
        <div className="card relative overflow-hidden border-iron-blue/20">
          <div className="absolute inset-0 flex items-center justify-end pr-4 pointer-events-none select-none">
            <span className="text-[5rem] font-space font-black text-iron-blue/5 leading-none">OK</span>
          </div>
          <p className="text-xs font-space font-bold uppercase tracking-[0.2em] text-iron-text-secondary mb-4">
            Successful
          </p>
          <p className="text-5xl font-space font-black text-iron-blue tracking-tighter mb-3">
            {stats ? stats.successful_this_week : '—'}
          </p>
          <p className="text-iron-text-secondary text-xs italic mb-3">
            {stats?.success_rate}% transaction success rate this week
          </p>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-iron-blue/10 border border-iron-blue/20 rounded-full w-fit">
            <ShieldCheck size={11} className="text-iron-blue" />
            <span className="text-iron-blue text-xs font-black uppercase tracking-widest">Verified Secure</span>
          </div>
        </div>
      </div>

      {/* ── Revenue Trend Chart ───────────────────────────────────── */}
      <div className="card !p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-white font-space font-bold uppercase tracking-widest text-sm">Revenue Trend</h3>
            <p className="text-iron-text-secondary text-xs italic mt-0.5">
              {trendMode === 'monthly' ? 'Monthly collection performance' : 'Daily collection — last 30 days'}
            </p>
          </div>
          <div className="flex items-center bg-[#18181A] border border-border rounded-lg overflow-hidden">
            {['daily', 'monthly'].map(mode => (
              <button
                key={mode}
                onClick={() => handleTrendToggle(mode)}
                className={`px-4 py-2 text-xs font-space font-black uppercase tracking-widest transition-all ${
                  trendMode === mode
                    ? 'bg-iron-lime text-dark'
                    : 'text-iron-text-secondary hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
        <div className="px-2 py-4" style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#DFFF00" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#DFFF00" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F1F26" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#71717A', fontSize: 11, fontFamily: 'Space Grotesk' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: '#71717A', fontSize: 10, fontFamily: 'Space Grotesk' }}
                axisLine={false} tickLine={false}
                tickFormatter={v => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#DFFF00', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area
                type="monotone" dataKey="revenue"
                stroke="#DFFF00" strokeWidth={2.5}
                fill="url(#revenueGrad)"
                dot={false} activeDot={{ r: 5, fill: '#DFFF00', stroke: '#0A0A0E', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Payments Log ─────────────────────────────────────────── */}
      <div className="card !p-0 overflow-hidden">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-white font-space font-bold uppercase tracking-widest text-sm">Payments Log</h3>
            <p className="text-iron-text-secondary text-xs italic mt-0.5">Real-time transaction history and status</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex items-center">
              <div className="relative flex items-center">
                <Search size={13} className="absolute left-3 text-iron-text-secondary pointer-events-none" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search transactions..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  className="bg-[#18181A] border border-border rounded-lg pl-8 pr-8 py-2 text-xs text-white placeholder:text-iron-text-secondary/60 outline-none focus:border-iron-lime/40 transition-colors w-44"
                />
                {searchInput && (
                  <button type="button" onClick={clearSearch} className="absolute right-2 text-iron-text-secondary hover:text-white">
                    <X size={12} />
                  </button>
                )}
              </div>
            </form>
            <button onClick={downloadCSV} className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] hover:bg-white/[0.05] border border-white/5 rounded-lg text-xs font-bold text-iron-text-secondary hover:text-white uppercase tracking-widest transition-all">
              <Download size={13} /> Download CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="iron-table">
            <thead>
              <tr>
                <th>Member Name</th>
                <th>Plan Type</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Date</th>
                <th>Status</th>
                <th className="text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingTable ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex justify-center items-center gap-3 text-iron-text-secondary font-space text-xs uppercase tracking-widest">
                      <Loader2 size={16} className="animate-spin text-iron-lime" />
                      Loading transactions...
                    </div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-iron-text-secondary italic text-sm">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                records.map((r, idx) => (
                  <tr key={r.payment_id} className="group">
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar name={r.member_name || '??'} idx={idx} />
                        <div>
                          <p className="font-semibold text-white group-hover:text-iron-lime transition-colors text-sm">
                            {r.member_name || <span className="text-iron-text-secondary italic">Supplement Sale</span>}
                          </p>
                          <p className="text-xs text-iron-text-secondary uppercase tracking-tight">
                            #{r.member_id ? `M-${r.member_id}` : `P-${r.payment_id}`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-iron-text-secondary text-xs font-medium">
                        {r.plan_name || <span className="italic">—</span>}
                      </span>
                    </td>
                    <td>
                      <span className="text-white font-bold font-space">{formatINR(r.amount)}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 text-iron-text-secondary">
                        <span className="text-iron-text-secondary/70">{METHOD_ICONS[r.payment_method] || <CreditCard size={13} />}</span>
                        <span className="text-xs font-medium">{r.payment_method}</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-iron-text-secondary text-xs">{formatDate(r.payment_date)}</span>
                    </td>
                    <td>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-black uppercase tracking-widest border ${STATUS_STYLES[r.status] || STATUS_STYLES.Paid}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="text-right pr-6">
                      <button className="w-7 h-7 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center text-iron-text-secondary hover:text-white hover:border-white/20 transition-all ml-auto">
                        <MoreHorizontal size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <p className="text-iron-text-secondary text-xs italic">
            Showing <span className="text-white font-semibold">{records.length > 0 ? page * PAGE_SIZE + 1 : 0}–{Math.min((page + 1) * PAGE_SIZE, total)}</span> of <span className="text-white font-semibold">{total}</span> transactions
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.03] border border-white/5 rounded-lg text-xs font-bold text-iron-text-secondary hover:text-white hover:border-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-widest font-space"
            >
              <ChevronLeft size={13} /> Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-iron-lime text-dark border border-iron-lime rounded-lg text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-widest font-space hover:shadow-[0_0_15px_rgba(223,255,0,0.3)]"
            >
              Next <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Record Payment Modal ──────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div>
                <h2 className="text-white font-space font-bold text-base tracking-wide">Record Payment</h2>
                <p className="text-iron-text-secondary text-xs italic mt-0.5">Add a new transaction entry</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center text-iron-text-secondary hover:text-white transition-colors">
                <X size={15} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-xs">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-400 text-xs">
                  <CheckCircle size={14} className="flex-shrink-0" />
                  Payment recorded successfully!
                </div>
              )}

              <div className="space-y-1">
                <label className="text-iron-text-secondary text-xs uppercase tracking-widest font-space font-semibold">
                  Subscription <span className="text-red-400">*</span>
                </label>
                <select required value={formData.subscription_id}
                  onChange={e => setFormData({ ...formData, subscription_id: e.target.value })}
                  className="w-full bg-[#18181A] border border-border rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-iron-lime/50 transition-colors">
                  <option value="">— Select Subscription —</option>
                  {subscriptions.map(s => (
                    <option key={s.subscription_id} value={s.subscription_id}>
                      Sub #{s.subscription_id} · Member #{s.member_id} ({s.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-iron-text-secondary text-xs uppercase tracking-widest font-space font-semibold">
                  Amount (₹) <span className="text-red-400">*</span>
                </label>
                <input required type="number" step="0.01" placeholder="e.g. 2499"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full bg-[#18181A] border border-border rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-iron-lime/50 transition-colors placeholder:text-iron-text-secondary/50" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-iron-text-secondary text-xs uppercase tracking-widest font-space font-semibold">
                    Method <span className="text-red-400">*</span>
                  </label>
                  <select value={formData.payment_method}
                    onChange={e => setFormData({ ...formData, payment_method: e.target.value })}
                    className="w-full bg-[#18181A] border border-border rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-iron-lime/50 transition-colors">
                    <option>Card</option>
                    <option>Cash</option>
                    <option>UPI</option>
                    <option>Bank Transfer</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-iron-text-secondary text-xs uppercase tracking-widest font-space font-semibold">
                    Date <span className="text-red-400">*</span>
                  </label>
                  <input required type="date" value={formData.payment_date}
                    onChange={e => setFormData({ ...formData, payment_date: e.target.value })}
                    className="w-full bg-[#18181A] border border-border rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-iron-lime/50 transition-colors" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting}
                  className="flex-1 btn flex items-center justify-center gap-2">
                  {submitting ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Save Payment'}
                </button>
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-3 px-6 bg-white/[0.03] border border-white/10 rounded text-white text-xs font-space font-semibold uppercase tracking-wider hover:bg-white/5 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
