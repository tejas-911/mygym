import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
  CalendarDays, TrendingUp, Gauge, ChevronLeft, ChevronRight,
  Plus, X, Loader2, AlertCircle, CheckCircle, MoreHorizontal,
  Users, Clock, Trash2, ChevronDown, CalendarOff
} from 'lucide-react';

const API = 'http://localhost:5000/api/classes';

function getHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Colour palette per class ─────────────────────────────────────
const PALETTE = {
  lime:    { border: 'border-iron-lime',   text: 'text-iron-lime',   bg: 'bg-iron-lime/10',   hex: '#DFFF00' },
  orange:  { border: 'border-orange-400',  text: 'text-orange-400',  bg: 'bg-orange-400/10',  hex: '#FB923C' },
  blue:    { border: 'border-blue-400',    text: 'text-blue-400',    bg: 'bg-blue-400/10',    hex: '#60A5FA' },
  pink:    { border: 'border-pink-400',    text: 'text-pink-400',    bg: 'bg-pink-400/10',    hex: '#F472B6' },
  purple:  { border: 'border-purple-400',  text: 'text-purple-400',  bg: 'bg-purple-400/10',  hex: '#C084FC' },
  emerald: { border: 'border-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-400/10', hex: '#34D399' },
};
const PALETTE_KEYS = Object.keys(PALETTE);

function pal(color) { return PALETTE[color] || PALETTE.lime; }

// ── Status badge ────────────────────────────────────────────────
const STATUS_CFG = {
  'Booking Open': 'bg-iron-lime/15 text-iron-lime border-iron-lime/20',
  'Full':         'bg-red-500/15 text-red-400 border-red-500/20',
  'Waitlist':     'bg-orange-500/15 text-orange-400 border-orange-500/20',
  'Cancelled':    'bg-white/5 text-iron-text-secondary border-white/10',
};

function StatusBadge({ status }) {
  return (
    <span className={`px-2.5 py-1 rounded text-[11px] font-black uppercase tracking-widest border ${STATUS_CFG[status] || STATUS_CFG['Booking Open']}`}>
      {status}
    </span>
  );
}

// ── Week helpers ─────────────────────────────────────────────────
const DAY_LABELS = ['MON','TUE','WED','THU','FRI','SAT','SUN'];

function getMondayOf(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0,0,0,0);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

// Always use LOCAL date parts — toISOString() is UTC and shifts the date in non-UTC timezones
function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Parse a YYYY-MM-DD string from MySQL as LOCAL midnight (not UTC midnight)
function parseDBDate(str) {
  if (!str) return new Date();
  const s = String(str).split('T')[0];          // strip any time part
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);                 // local midnight ✓
}

function fmtWeekRange(mon) {
  const sun = addDays(mon, 6);
  const opts = { month: 'short', day: '2-digit', year: 'numeric' };
  return `${mon.toLocaleDateString('en-US', { month:'short', day:'2-digit' })} – ${sun.toLocaleDateString('en-US', opts)}`;
}

function isToday(dateStr) {
  return dateStr === toISO(new Date()); // toISO now uses local parts ✓
}

// ── Capacity mini bar ────────────────────────────────────────────
function CapBar({ registered, capacity, color }) {
  const pct = capacity > 0 ? Math.min(Math.round((registered / capacity) * 100), 100) : 0;
  const p = pal(color);
  return (
    <div className="mt-2 space-y-1">
      <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${
          pct >= 100 ? 'bg-red-500' : pct >= 90 ? 'bg-orange-400' : `bg-[${p.hex}]`
        }`} style={{ width: `${pct}%`, backgroundColor: pct < 90 ? p.hex : undefined }} />
      </div>
      <div className="flex justify-between">
        <span className={`text-[11px] font-black ${p.text}`}>{registered}/{capacity}</span>
      </div>
    </div>
  );
}

// ── Initial form state ────────────────────────────────────────────
const initForm = {
  class_name: '', trainer_name: '', scheduled_date: toISO(new Date()),
  scheduled_time: '07:00', duration_minutes: 60, capacity: 20, color: 'lime'
};

export default function Plans() {
  const [stats, setStats]           = useState({ classes_today: 0, total_bookings: 0, avg_capacity: 0 });
  const [weekClasses, setWeekClasses] = useState([]);
  const [upcoming, setUpcoming]     = useState([]);
  const [weekStart, setWeekStart]   = useState(getMondayOf(new Date()));
  const [loading, setLoading]       = useState(true);
  const [upFilter, setUpFilter]     = useState('all');
  const [showFilterDrop, setShowFilterDrop] = useState(false);

  // Modal
  const [showModal, setShowModal]   = useState(false);
  const [formData, setFormData]     = useState(initForm);
  const [submitting, setSubmitting] = useState(false);
  const [formErr, setFormErr]       = useState('');
  const [formOk, setFormOk]         = useState(false);

  // Actions dropdown
  const [openAction, setOpenAction] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/stats`, { headers: getHeaders() });
      setStats(data);
    } catch(e) { console.error(e); }
  }, []);

  const fetchWeek = useCallback(async (mon) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/week`, {
        headers: getHeaders(),
        params: { weekStart: toISO(mon) }
      });
      setWeekClasses(Array.isArray(data.classes) ? data.classes : []);
    } catch(e) { console.error(e); setWeekClasses([]); }
    finally { setLoading(false); }
  }, []);

  const fetchUpcoming = useCallback(async (statusFilter = 'all') => {
    try {
      const { data } = await axios.get(`${API}/upcoming`, {
        headers: getHeaders(),
        params: { status: statusFilter }
      });
      setUpcoming(Array.isArray(data) ? data : []);
    } catch(e) { console.error(e); }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchWeek(weekStart);
    fetchUpcoming(upFilter);
  }, []);

  useEffect(() => { fetchWeek(weekStart); }, [weekStart]);
  useEffect(() => { fetchUpcoming(upFilter); }, [upFilter]);

  const prevWeek = () => setWeekStart(prev => addDays(prev, -7));
  const nextWeek = () => setWeekStart(prev => addDays(prev, 7));

  // group by day index 0–6 (Mon–Sun)
  const byDay = Array.from({ length: 7 }, (_, i) => {
    const dayDate = toISO(addDays(weekStart, i));
    // parseDBDate avoids the UTC-midnight shift when MySQL returns "YYYY-MM-DD" strings
    return weekClasses.filter(c => toISO(parseDBDate(c.scheduled_date)) === dayDate);
  });

  const openModal = () => {
    setFormData(initForm); setFormErr(''); setFormOk(false);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setFormErr('');
    try {
      await axios.post(API, formData, { headers: getHeaders() });
      setFormOk(true);
      fetchStats(); fetchWeek(weekStart); fetchUpcoming(upFilter);
      setTimeout(() => { setShowModal(false); setFormOk(false); }, 1000);
    } catch(err) {
      setFormErr(err.response?.data?.message || 'Failed to create class.');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this class?')) return;
    try {
      await axios.delete(`${API}/${id}`, { headers: getHeaders() });
      fetchStats(); fetchWeek(weekStart); fetchUpcoming(upFilter);
    } catch(e) { console.error(e); }
    setOpenAction(null);
  };

  const FILTER_OPTS = [
    ['all', 'All Status'],
    ['booking_open', 'Booking Open'],
    ['full', 'Full'],
    ['waitlist', 'Waitlist'],
  ];

  return (
    <div className="space-y-6 pb-10 font-manrope" onClick={() => { setShowFilterDrop(false); setOpenAction(null); }}>

      {/* ── Stats ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="stat-card">
          <div className="flex items-start justify-between mb-4">
            <p className="text-xs font-space font-bold uppercase tracking-[0.2em] text-iron-text-secondary">Classes Today</p>
            <div className="w-9 h-9 rounded-lg bg-iron-lime/10 flex items-center justify-center text-iron-lime">
              <CalendarDays size={16} />
            </div>
          </div>
          <p className="text-5xl font-space font-black text-white tracking-tighter">
            {String(stats.classes_today).padStart(2,'0')}
          </p>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between mb-4">
            <p className="text-xs font-space font-bold uppercase tracking-[0.2em] text-iron-text-secondary">Total Bookings</p>
            <div className="w-9 h-9 rounded-lg bg-iron-blue/10 flex items-center justify-center text-blue-400">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="flex items-end gap-3">
            <p className="text-5xl font-space font-black text-white tracking-tighter">{stats.total_bookings}</p>
            <span className="text-emerald-400 text-xs font-bold mb-2">+13%</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between mb-4">
            <p className="text-xs font-space font-bold uppercase tracking-[0.2em] text-iron-text-secondary">Avg. Capacity</p>
            <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-iron-text-secondary">
              <Gauge size={16} />
            </div>
          </div>
          <p className="text-5xl font-space font-black text-white tracking-tighter">{stats.avg_capacity}%</p>
        </div>
      </div>

      {/* ── Weekly Schedule ──────────────────────────────────────── */}
      <div className="card !p-0 overflow-hidden">
        {/* Calendar header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-4">
            <h2 className="text-white font-space font-bold text-base tracking-tight">Weekly Schedule</h2>
            <div className="flex items-center gap-2 bg-white/[0.03] border border-white/5 rounded-lg px-3 py-1.5">
              <button onClick={(e) => { e.stopPropagation(); prevWeek(); }}
                className="text-iron-text-secondary hover:text-white transition-colors">
                <ChevronLeft size={14} />
              </button>
              <span className="text-white text-xs font-space font-bold tracking-wide px-2">
                {fmtWeekRange(weekStart)}
              </span>
              <button onClick={(e) => { e.stopPropagation(); nextWeek(); }}
                className="text-iron-text-secondary hover:text-white transition-colors">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); openModal(); }}
            className="btn flex items-center gap-2 !py-2 !text-xs">
            <Plus size={13} /> Add New Class
          </button>
        </div>

        {/* 7-day grid */}
        <div className="grid grid-cols-7 divide-x divide-border min-h-[280px]">
          {DAY_LABELS.map((label, i) => {
            const dayDate  = addDays(weekStart, i);
            const dateNum  = dayDate.getDate();
            const classes  = byDay[i] || [];
            const todayDay = isToday(toISO(dayDate));  // dayDate is already a local Date ✓
            const isSun    = i === 6;

            return (
              <div key={i} className={`flex flex-col ${todayDay ? 'bg-iron-lime/[0.03]' : ''}`}>
                {/* Day header */}
                <div className={`py-3 px-2 text-center border-b border-border ${todayDay ? 'border-iron-lime/30' : ''}`}>
                  <p className={`text-xs font-black uppercase tracking-widest font-space ${todayDay ? 'text-iron-lime' : 'text-iron-text-secondary'}`}>{label}</p>
                  <p className={`text-lg font-space font-bold mt-0.5 ${todayDay ? 'text-iron-lime' : 'text-white'}`}>{dateNum}</p>
                </div>

                {/* Classes */}
                <div className="flex-1 p-1.5 space-y-1.5 overflow-y-auto max-h-[360px]">
                  {loading ? (
                    <div className="flex justify-center pt-4">
                      <Loader2 size={14} className="animate-spin text-iron-text-secondary" />
                    </div>
                  ) : classes.length === 0 ? (
                    isSun ? (
                      <div className="flex flex-col items-center justify-center h-full py-8 gap-2 opacity-20">
                        <CalendarOff size={20} className="text-white" />
                        <p className="text-[11px] font-bold uppercase tracking-widest text-white text-center">Gym Closed</p>
                      </div>
                    ) : null
                  ) : (
                    classes.map(cls => {
                      const p = pal(cls.color);
                      return (
                        <div key={cls.class_id}
                          className={`rounded-lg p-2 bg-white/[0.03] border-l-2 ${p.border} hover:bg-white/[0.05] transition-colors cursor-pointer group`}>
                          <p className={`text-[11px] font-black uppercase tracking-wider ${p.text}`}>
                            {cls.time_display}
                          </p>
                          <p className="text-white text-[11px] font-bold leading-tight mt-0.5 group-hover:text-white/90 truncate">
                            {cls.class_name}
                          </p>
                          <p className="text-iron-text-secondary text-[11px] italic truncate mt-0.5">
                            {cls.trainer_name}
                          </p>
                          <CapBar registered={cls.registered} capacity={cls.capacity} color={cls.color} />
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Upcoming Sessions ────────────────────────────────────── */}
      <div className="card !p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 className="text-white font-space font-bold text-sm uppercase tracking-widest">Upcoming Sessions</h3>
          </div>
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <span className="text-iron-text-secondary text-xs font-bold uppercase tracking-widest">Filter by:</span>
            <div className="relative">
              <button
                onClick={() => setShowFilterDrop(v => !v)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border border-white/5 rounded-lg text-xs font-bold text-white uppercase tracking-widest hover:bg-white/5 transition-colors"
              >
                {FILTER_OPTS.find(([v]) => v === upFilter)?.[1] || 'Status'}
                <ChevronDown size={12} className={`transition-transform ${showFilterDrop ? 'rotate-180' : ''}`} />
              </button>
              {showFilterDrop && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-[#18181A] border border-border rounded-xl shadow-xl z-20 overflow-hidden py-1">
                  {FILTER_OPTS.map(([val, label]) => (
                    <button key={val}
                      onClick={() => { setUpFilter(val); setShowFilterDrop(false); }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors ${
                        upFilter === val ? 'text-iron-lime bg-iron-lime/5' : 'text-iron-text-secondary hover:text-white hover:bg-white/5'
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_80px] px-6 py-2 border-b border-border bg-white/[0.01]">
          {['Class Name','Trainer','Time','Registered','Status','Actions'].map(h => (
            <span key={h} className="text-xs font-black uppercase tracking-widest text-iron-text-secondary font-space">{h}</span>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y divide-white/[0.03]">
          {upcoming.length === 0 ? (
            <div className="py-16 text-center text-iron-text-secondary italic text-sm">
              No upcoming sessions found.
            </div>
          ) : (
            upcoming.map(cls => {
              const p = pal(cls.color);
              const pct = cls.capacity > 0 ? Math.min(Math.round((cls.registered / cls.capacity) * 100), 100) : 0;
              return (
                <div key={cls.class_id}
                  className={`grid grid-cols-[2fr_1fr_1fr_1fr_1fr_80px] px-0 py-0 items-center hover:bg-white/[0.015] transition-colors group border-l-2 ${p.border}`}>
                  {/* Class name */}
                  <div className="px-6 py-4">
                    <p className={`text-white font-bold text-sm group-hover:${p.text} transition-colors`}>{cls.class_name}</p>
                  </div>
                  {/* Trainer */}
                  <div className="px-2 py-4">
                    <p className="text-iron-text-secondary text-xs font-medium">{cls.trainer_name}</p>
                  </div>
                  {/* Time */}
                  <div className="px-2 py-4">
                    <p className="text-white text-xs font-bold">
                      <span className="text-iron-text-secondary">{cls.date_label},</span>{' '}
                      {cls.time_display}
                    </p>
                  </div>
                  {/* Registered */}
                  <div className="px-2 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-black font-space ${pct >= 100 ? 'text-red-400' : 'text-white'}`}>
                        {cls.registered}/{cls.capacity}
                      </span>
                      <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden min-w-[40px]">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: pct >= 100 ? '#EF4444' : p.hex }} />
                      </div>
                    </div>
                  </div>
                  {/* Status */}
                  <div className="px-2 py-4">
                    <StatusBadge status={cls.status} />
                  </div>
                  {/* Actions */}
                  <div className="px-4 py-4 flex justify-center" onClick={e => e.stopPropagation()}>
                    <div className="relative">
                      <button
                        onClick={() => setOpenAction(openAction === cls.class_id ? null : cls.class_id)}
                        className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center text-iron-text-secondary hover:text-white hover:bg-white/5 transition-colors">
                        <MoreHorizontal size={14} />
                      </button>
                      {openAction === cls.class_id && (
                        <div className="absolute right-0 top-full mt-1 w-36 bg-[#18181A] border border-border rounded-xl shadow-xl z-20 overflow-hidden py-1">
                          <button onClick={() => handleDelete(cls.class_id)}
                            className="w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2">
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Add Class Modal ──────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}>
          <div className="bg-surface border border-border rounded-2xl w-full max-w-lg shadow-2xl"
            onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div>
                <h2 className="text-white font-space font-bold text-base tracking-wide">Add New Class</h2>
                <p className="text-iron-text-secondary text-xs italic mt-0.5">Schedule a new fitness session</p>
              </div>
              <button onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center text-iron-text-secondary hover:text-white transition-colors">
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {formErr && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-xs">
                  <AlertCircle size={14} className="flex-shrink-0" />{formErr}
                </div>
              )}
              {formOk && (
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-400 text-xs">
                  <CheckCircle size={14} className="flex-shrink-0" />Class scheduled successfully!
                </div>
              )}

              {/* Class name + trainer */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-iron-text-secondary text-xs uppercase tracking-widest font-space font-bold">
                    Class Name <span className="text-red-400">*</span>
                  </label>
                  <input required type="text" placeholder="e.g. Power Lifting"
                    value={formData.class_name}
                    onChange={e => setFormData({ ...formData, class_name: e.target.value })}
                    className="w-full bg-[#18181A] border border-border rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-iron-lime/50 transition-colors placeholder:text-iron-text-secondary/50" />
                </div>
                <div className="space-y-1">
                  <label className="text-iron-text-secondary text-xs uppercase tracking-widest font-space font-bold">Trainer</label>
                  <input type="text" placeholder="e.g. Coach Marcus"
                    value={formData.trainer_name}
                    onChange={e => setFormData({ ...formData, trainer_name: e.target.value })}
                    className="w-full bg-[#18181A] border border-border rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-iron-lime/50 transition-colors placeholder:text-iron-text-secondary/50" />
                </div>
              </div>

              {/* Date + Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-iron-text-secondary text-xs uppercase tracking-widest font-space font-bold">
                    Date <span className="text-red-400">*</span>
                  </label>
                  <input required type="date"
                    value={formData.scheduled_date}
                    onChange={e => setFormData({ ...formData, scheduled_date: e.target.value })}
                    className="w-full bg-[#18181A] border border-border rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-iron-lime/50 transition-colors" />
                </div>
                <div className="space-y-1">
                  <label className="text-iron-text-secondary text-xs uppercase tracking-widest font-space font-bold">
                    Start Time <span className="text-red-400">*</span>
                  </label>
                  <input required type="time"
                    value={formData.scheduled_time}
                    onChange={e => setFormData({ ...formData, scheduled_time: e.target.value })}
                    className="w-full bg-[#18181A] border border-border rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-iron-lime/50 transition-colors" />
                </div>
              </div>

              {/* Duration + Capacity */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-iron-text-secondary text-xs uppercase tracking-widest font-space font-bold">Duration (min)</label>
                  <input type="number" min="15" max="240" placeholder="60"
                    value={formData.duration_minutes}
                    onChange={e => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
                    className="w-full bg-[#18181A] border border-border rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-iron-lime/50 transition-colors" />
                </div>
                <div className="space-y-1">
                  <label className="text-iron-text-secondary text-xs uppercase tracking-widest font-space font-bold">Capacity</label>
                  <input type="number" min="1" max="200" placeholder="20"
                    value={formData.capacity}
                    onChange={e => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    className="w-full bg-[#18181A] border border-border rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-iron-lime/50 transition-colors" />
                </div>
              </div>

              {/* Color picker */}
              <div className="space-y-2">
                <label className="text-iron-text-secondary text-xs uppercase tracking-widest font-space font-bold">Accent Colour</label>
                <div className="flex gap-2">
                  {PALETTE_KEYS.map(key => (
                    <button key={key} type="button"
                      onClick={() => setFormData({ ...formData, color: key })}
                      title={key}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${formData.color === key ? 'scale-125 border-white' : 'border-transparent hover:scale-110'}`}
                      style={{ backgroundColor: PALETTE[key].hex }} />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting}
                  className="flex-1 btn flex items-center justify-center gap-2">
                  {submitting ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Plus size={13} /> Schedule Class</>}
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
