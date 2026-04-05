import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  Search, Filter, Plus, X, ChevronLeft, ChevronRight,
  Dumbbell, MoreHorizontal, Loader2, Clock, IndianRupee, UserCheck, Pencil
} from 'lucide-react';

const API = 'http://localhost:5000/api/members';

function getHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const initialFormState = {
  name: '', email: '', phone: '', gender: 'Male', date_of_birth: ''
};

export default function Members() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const location = useLocation();

  const fetchMembers = async () => {
    try {
      const res = await axios.get(API, { headers: getHeaders() });
      setData(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { 
    fetchMembers(); 
    if (location.state?.openModal) {
      setShowModal(true);
      // Optional: clear state so it doesn't reopen on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Uses sp_register_member STORED PROCEDURE via backend
  const handleAdd = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError('');
    setModalSuccess('');
    try {
      const res = await axios.post(API, formData, { headers: getHeaders() });
      setModalSuccess(res.data.message || 'Member registered successfully!');
      fetchMembers();
      setTimeout(() => { setShowModal(false); setModalSuccess(''); setFormData(initialFormState); }, 1500);
    } catch (err) {
      // Error message comes from stored procedure validation
      setModalError(err.response?.data?.message || 'Failed to add member.');
    } finally { setIsSubmitting(false); }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setModalError('');
    setModalSuccess('');
    setShowModal(true);
  };

  const openEditModal = (member) => {
    setEditingId(member.member_id);
    setFormData({
      name: member.member_name || member.name || '',
      email: member.email || '',
      phone: member.phone || '',
      gender: member.gender || 'Male',
      date_of_birth: member.date_of_birth ? String(member.date_of_birth).split('T')[0] : '',
      join_date: member.join_date ? String(member.join_date).split('T')[0] : '',
      status: member.member_status || member.status || 'Active'
    });
    setModalError('');
    setModalSuccess('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    if (editingId) {
      e.preventDefault();
      setIsSubmitting(true);
      setModalError('');
      setModalSuccess('');
      try {
        await axios.put(`${API}/${editingId}`, formData, { headers: getHeaders() });
        setModalSuccess('Member updated successfully!');
        fetchMembers();
        setTimeout(() => {
          setShowModal(false);
          setModalSuccess('');
          setEditingId(null);
          setFormData(initialFormState);
        }, 1200);
      } catch (err) {
        setModalError(err.response?.data?.message || 'Failed to update member.');
      } finally { setIsSubmitting(false); }
      return;
    }
    return handleAdd(e);
  };

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??';

  // Filter + search
  const filtered = data.filter(m => {
    const matchesSearch = !searchQuery ||
      (m.member_name || m.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    const status = (m.member_status || m.status || '').toLowerCase();
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCount = data.filter(m => (m.member_status || m.status || '').toLowerCase() === 'active').length;

  // Check if enriched data is available (view + functions ran)
  const hasEnrichedData = data.length > 0 && data[0].subscription_status_label !== undefined;

  return (
    <div className="space-y-8 pb-12 font-manrope">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-space font-bold tracking-tighter text-white mb-2">Members</h1>
          <p className="text-iron-text-secondary font-medium italic text-sm">
            {data.length} total · {activeCount} active
            {hasEnrichedData && <span className="ml-2 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[11px] font-black uppercase tracking-widest">View + Functions Active</span>}
          </p>
        </div>
        <button className="btn flex items-center gap-2 group" onClick={openCreateModal}>
          <Dumbbell size={18} className="group-hover:rotate-12 transition-transform" />
          <span>Register Member</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-iron-text-secondary group-focus-within:text-iron-lime transition-colors">
            <Search size={18} />
          </div>
          <input type="text" placeholder="Search by name or email..."
            className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-iron-lime/20 focus:bg-white/[0.05] transition-all"
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <div className="flex gap-4">
          <select className="bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-iron-lime/20 appearance-none min-w-[140px] cursor-pointer"
            value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Members Table */}
      <div className="card !p-0 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="iron-table">
            <thead>
              <tr className="bg-white/[0.01]">
                <th>MEMBER</th>
                <th>CONTACT</th>
                {hasEnrichedData && <th>AGE</th>}
                {hasEnrichedData && <th>PLAN & STATUS</th>}
                {hasEnrichedData && <th>REVENUE</th>}
                {hasEnrichedData && <th>VISITS</th>}
                {!hasEnrichedData && <th>JOIN DATE</th>}
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {loading ? (
                <tr>
                  <td colSpan={hasEnrichedData ? 8 : 6} className="py-20 text-center text-iron-text-secondary font-space uppercase tracking-widest text-xs animate-pulse italic">
                    Retrieving member directory...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={hasEnrichedData ? 8 : 6} className="py-20 text-center text-iron-text-secondary italic">
                    No members found matching your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map(member => {
                  const name = member.member_name || member.name;
                  const status = (member.member_status || member.status || 'Active').toLowerCase();
                  const isActive = status === 'active';

                  return (
                    <tr key={member.member_id} className="group hover:bg-white/[0.02] transition-colors">
                      <td>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center font-bold text-xs text-iron-lime group-hover:border-iron-lime/30 transition-all">
                            {getInitials(name)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-white group-hover:text-iron-lime transition-colors">{name}</span>
                            <span className="text-xs font-bold text-iron-text-secondary uppercase tracking-tighter">ID: IC-{member.member_id}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-white/80">{member.email}</span>
                          <span className="text-xs font-medium text-iron-text-secondary tracking-tighter italic">{member.phone || '—'}</span>
                        </div>
                      </td>

                      {/* ── Enriched columns from VIEW + FUNCTIONS ── */}
                      {hasEnrichedData && (
                        <>
                          {/* fn_member_age() */}
                          <td>
                            <span className="text-sm text-white font-space font-bold">
                              {member.age != null ? member.age : '—'}
                            </span>
                            {member.age != null && <span className="text-iron-text-secondary text-xs ml-1">yrs</span>}
                          </td>

                          {/* vw_member_dashboard plan + fn_subscription_status_label() */}
                          <td>
                            <div className="flex flex-col gap-1.5">
                              {member.plan_name ? (
                                <span className="px-2.5 py-0.5 bg-iron-blue/10 text-iron-blue border border-iron-blue/20 rounded text-[11px] font-black uppercase tracking-widest w-fit">
                                  {member.plan_name}
                                </span>
                              ) : (
                                <span className="text-iron-text-secondary text-xs italic">No plan</span>
                              )}
                              <span className={`text-xs font-bold italic ${
                                (member.subscription_status_label || '').includes('Expiring') ? 'text-amber-400' :
                                (member.subscription_status_label || '').includes('Expired') ? 'text-red-400' :
                                (member.subscription_status_label || '').includes('Active') ? 'text-emerald-400' :
                                'text-iron-text-secondary'
                              }`}>
                                {member.subscription_status_label || '—'}
                              </span>
                              {member.days_remaining != null && member.days_remaining > 0 && member.days_remaining <= 7 && (
                                <span className="flex items-center gap-1 text-amber-400 text-[11px] font-black uppercase tracking-widest">
                                  <Clock size={10} /> Renew Soon
                                </span>
                              )}
                            </div>
                          </td>

                          {/* fn_total_revenue_by_member() */}
                          <td>
                            <div className="flex items-center gap-1.5">
                              <IndianRupee size={12} className="text-emerald-400" />
                              <span className="text-white font-space font-bold text-sm">
                                {member.lifetime_revenue != null ? parseFloat(member.lifetime_revenue).toFixed(2) : '0.00'}
                              </span>
                            </div>
                          </td>

                          {/* vw_member_dashboard total_visits */}
                          <td>
                            <span className="px-2.5 py-1 bg-white/[0.03] border border-white/5 rounded text-xs font-black text-white font-space">
                              {member.total_visits || 0}
                            </span>
                          </td>
                        </>
                      )}

                      {!hasEnrichedData && (
                        <td>
                          <span className="text-xs text-iron-text-secondary font-medium">
                            {member.join_date ? new Date(member.join_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '—'}
                          </span>
                        </td>
                      )}

                      <td>
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-iron-lime shadow-[0_0_8px_rgba(223,255,0,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
                          <span className={`text-xs font-black uppercase tracking-widest ${isActive ? 'text-iron-lime' : 'text-red-400'}`}>
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <button
                          onClick={() => openEditModal(member)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 text-xs font-black uppercase tracking-widest text-iron-text-secondary hover:text-white hover:border-iron-lime/30 transition-all"
                        >
                          <Pencil size={12} />
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-6 bg-white/[0.01] border-t border-white/[0.03] flex items-center justify-between">
          <p className="text-xs font-bold text-iron-text-secondary uppercase tracking-widest italic">
            Showing {filtered.length} of {data.length} members
          </p>
        </div>
      </div>

      {/* Register Modal — calls sp_register_member STORED PROCEDURE */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-dark/80 backdrop-blur-md" onClick={() => setShowModal(false)} />
          <div className="bg-surface border border-border rounded-xl w-full max-w-[640px] relative z-[210] shadow-[0_30px_100px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="p-6 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">{editingId ? 'Edit Member' : 'Register Member'}</h2>
                <p className="text-iron-text-secondary text-xs italic mt-1">
                  {editingId ? 'Update profile details and membership status' : 'Uses sp_register_member stored procedure'}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-iron-text-secondary hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="w-full h-px bg-white/5" />

            <form onSubmit={handleSave} className="p-6 space-y-6">
              {modalError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-3 italic">
                  <div className="w-1 h-1 bg-red-400 rounded-full animate-pulse" />
                  {modalError}
                </div>
              )}
              {modalSuccess && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-3">
                  <UserCheck size={14} />
                  <span className="font-bold">{modalSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-iron-text-secondary uppercase tracking-[0.2em] block">Full Name <span className="text-red-400">*</span></label>
                  <input required type="text" placeholder="e.g. Arjun Sharma"
                    className="w-full bg-[#18181A] border border-white/5 rounded py-3 px-4 text-sm text-white focus:outline-none focus:border-iron-lime/30 transition-all placeholder:text-iron-text-secondary"
                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-iron-text-secondary uppercase tracking-[0.2em] block">Email Address <span className="text-red-400">*</span></label>
                  <input required type="email" placeholder="email@example.com"
                    className="w-full bg-[#18181A] border border-white/5 rounded py-3 px-4 text-sm text-white focus:outline-none focus:border-iron-lime/30 transition-all placeholder:text-iron-text-secondary"
                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-iron-text-secondary uppercase tracking-[0.2em] block">Phone Number</label>
                  <input type="text" placeholder="+91 00000 00000"
                    className="w-full bg-[#18181A] border border-white/5 rounded py-3 px-4 text-sm text-white focus:outline-none focus:border-iron-lime/30 transition-all placeholder:text-iron-text-secondary"
                    value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-iron-text-secondary uppercase tracking-[0.2em] block">DOB</label>
                    <input type="date"
                      className="w-full bg-[#18181A] border border-white/5 rounded py-3 px-4 text-sm text-white focus:outline-none focus:border-iron-lime/30 transition-all [color-scheme:dark]"
                      value={formData.date_of_birth} onChange={e => setFormData({ ...formData, date_of_birth: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-iron-text-secondary uppercase tracking-[0.2em] block">Gender</label>
                    <select className="w-full bg-[#18181A] border border-white/5 rounded py-3 px-4 text-sm text-white focus:outline-none focus:border-iron-lime/30 cursor-pointer"
                      value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                {editingId && (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-iron-text-secondary uppercase tracking-[0.2em] block">Join Date</label>
                      <input type="date"
                        className="w-full bg-[#18181A] border border-white/5 rounded py-3 px-4 text-sm text-white focus:outline-none focus:border-iron-lime/30 transition-all [color-scheme:dark]"
                        value={formData.join_date || ''} onChange={e => setFormData({ ...formData, join_date: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-iron-text-secondary uppercase tracking-[0.2em] block">Status</label>
                      <select className="w-full bg-[#18181A] border border-white/5 rounded py-3 px-4 text-sm text-white focus:outline-none focus:border-iron-lime/30 cursor-pointer"
                        value={formData.status || 'Active'} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-6 py-3 rounded-lg border border-white/10 text-xs font-bold tracking-widest uppercase text-white hover:bg-white/5 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="px-6 py-3 rounded-lg bg-iron-lime text-dark text-xs font-black tracking-widest uppercase hover:shadow-[0_0_20px_rgba(223,255,0,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <span>{editingId ? 'Save Changes' : 'Register Member'}</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
