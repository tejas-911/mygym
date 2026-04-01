import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';
import { useTheme } from '../context/ThemeContext';
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  IndianRupee, 
  ArrowUpRight, 
  MoreHorizontal,
  Plus
} from 'lucide-react';

export default function Dashboard() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentMembers, setRecentMembers] = useState([]);
  const [attendanceLog, setAttendanceLog] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    fetchRecentMembers();
    fetchAttendanceLog();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get('http://localhost:5000/api/reports', { headers });
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get('http://localhost:5000/api/members', { headers });
      setRecentMembers(res.data.slice(0, 3));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAttendanceLog = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get('http://localhost:5000/api/attendance', { headers });
      setAttendanceLog(res.data.slice(0, 2));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full text-iron-text-secondary font-space uppercase tracking-widest animate-pulse">
      Loading IronCore Metrics...
    </div>
  );
  
  if (!data) return <div className="p-6 text-red-500">Error loading dashboard data.</div>;

  const revenueData = data.revenue || [];
  const attendanceData = data.attendanceStats || [];

  const membershipData = [
    { name: 'Monthly', value: 35, fill: isLight ? '#2563EB' : '#1A3AFF' },
    { name: 'Quarterly', value: 40, fill: isLight ? '#3B82F6' : '#DFFF00' },
    { name: 'Annual', value: 20, fill: isLight ? '#93C5FD' : '#2A2A35' },
    { name: 'Student', value: 5, fill: isLight ? '#BFDBFE' : '#71717A' }
  ];

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase() || 'U';
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Stat Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Members */}
        <div className="stat-card group">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="stat-label">ACTIVE MEMBERS</h3>
              <p className="stat-value">{data.activeMembers}</p>
            </div>
            <div className="p-2 bg-iron-lime/10 rounded-lg group-hover:bg-iron-lime/20 transition-colors">
              <Users size={18} className="text-iron-lime" />
            </div>
          </div>
          <div className="stat-change text-emerald-400">
            <TrendingUp size={14} />
            <span>+12 this month</span>
          </div>
          <div className="mt-6 h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-iron-lime w-[65%] rounded-full shadow-[0_0_10px_rgba(223,255,0,0.5)]"></div>
          </div>
        </div>

        {/* Today's Check-ins */}
        <div className="stat-card group">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="stat-label">TODAY'S CHECK-INS</h3>
              <p className="stat-value">38</p>
            </div>
            <div className="p-2 bg-iron-blue/10 rounded-lg group-hover:bg-iron-blue/20 transition-colors">
              <Calendar size={18} className="text-iron-blue" />
            </div>
          </div>
          <div className="stat-change text-iron-text-secondary">
            <span>of 247 active</span>
          </div>
          <div className="mt-6 flex gap-1">
            {[1, 1, 1, 1, 0, 0].map((active, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full ${active ? 'bg-iron-lime shadow-[0_0_8px_rgba(223,255,0,0.3)]' : 'bg-white/5'}`}></div>
            ))}
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="stat-card group">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="stat-label">MONTHLY REVENUE</h3>
              <p className="stat-value">₹1,24.5k</p>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
              <IndianRupee size={18} className="text-emerald-400" />
            </div>
          </div>
          <div className="stat-change text-emerald-400">
            <ArrowUpRight size={14} />
            <span>+8% vs last</span>
          </div>
          <p className="mt-4 text-xs text-iron-text-secondary font-medium italic">
            On track for quarterly target
          </p>
        </div>

        {/* Classes Today */}
        <div className="stat-card group">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="stat-label">CLASSES TODAY</h3>
              <p className="stat-value">5</p>
            </div>
            <div className="p-2 bg-amber-500/10 rounded-lg group-hover:bg-amber-500/20 transition-colors">
              <TrendingUp size={18} className="text-amber-400" />
            </div>
          </div>
          <div className="stat-change text-iron-blue">
            <span>3 fully booked</span>
          </div>
          <div className="mt-4 flex -space-x-2">
            <div className="w-6 h-6 rounded-full bg-amber-400 border-2 border-surface flex items-center justify-center text-xs font-bold text-dark">H</div>
            <div className="w-6 h-6 rounded-full bg-iron-blue border-2 border-surface flex items-center justify-center text-xs font-bold text-white">C</div>
            <div className="w-6 h-6 rounded-full bg-border border-2 border-surface flex items-center justify-center text-xs font-bold text-white">+3</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="card lg:col-span-2">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-sm font-bold tracking-widest uppercase">REVENUE LAST 6 MONTHS</h2>
            <button className="text-iron-text-secondary hover:text-white transition-colors">
              <MoreHorizontal size={20} />
            </button>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isLight ? '#2563EB' : '#DFFF00'} stopOpacity={isLight ? 0.2 : 0.1} />
                    <stop offset="95%" stopColor={isLight ? '#2563EB' : '#DFFF00'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isLight ? '#E4E4EB' : '#1F1F26'} />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#71717A', fontSize: 10, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ background: isLight ? '#FFFFFF' : '#111116', border: `1px solid ${isLight ? '#E4E4EB' : '#1F1F26'}`, borderRadius: '8px', color: isLight ? '#0A0A0E' : '#FFFFFF' }}
                  itemStyle={{ color: isLight ? '#2563EB' : '#DFFF00' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke={isLight ? '#2563EB' : '#DFFF00'} 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#revenueGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Membership Split */}
        <div className="card">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-sm font-bold tracking-widest uppercase">MEMBERSHIP SPLIT</h2>
            <div className="w-4 h-4 bg-iron-text-secondary/20 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-iron-text-secondary rounded-full"></div>
            </div>
          </div>
          <div className="relative h-[220px]">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={membershipData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                  roundedCorner={40}
                >
                  {membershipData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold font-space">247</span>
              <span className="text-xs text-iron-text-secondary font-bold tracking-widest uppercase mt-1">TOTAL</span>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {membershipData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }}></div>
                <div className="flex flex-col">
                  <span className="text-xs text-iron-text-secondary font-bold uppercase">{item.name} {item.value}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3 - Recent Members & Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="card lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-bold tracking-widest uppercase">RECENT MEMBERS</h2>
            <button className="text-xs text-iron-lime font-bold tracking-widest uppercase hover:underline">VIEW ALL</button>
          </div>
          <div className="overflow-x-auto">
            <table className="iron-table">
              <thead>
                <tr>
                  <th>NAME</th>
                  <th>PLAN</th>
                  <th>JOIN DATE</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {recentMembers.map((member) => (
                  <tr key={member.member_id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-bold text-xs border border-white/10 group-hover:border-iron-lime/50 transition-colors">
                          {getInitials(member.name)}
                        </div>
                        <span className="font-semibold">{member.name}</span>
                      </div>
                    </td>
                    <td className="text-iron-text-secondary text-xs">Quarterly Elite</td>
                    <td className="text-iron-text-secondary text-xs">12 Jun 2024</td>
                    <td>
                      <span className="badge badge-active">ACTIVE</span>
                    </td>
                  </tr>
                ))}
                {/* Mocked for visual completion matching image */}
                <tr>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-bold text-xs border border-white/10">SL</div>
                      <span className="font-semibold">Sarah Lopez</span>
                    </div>
                  </td>
                  <td className="text-iron-text-secondary text-xs">Monthly Pro</td>
                  <td className="text-iron-text-secondary text-xs">10 Jun 2024</td>
                  <td>
                    <span className="badge badge-expired">EXPIRED</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="card flex flex-col">
          <h2 className="text-sm font-bold tracking-widest uppercase mb-8">TODAY'S ATTENDANCE LOG</h2>
          <div className="space-y-6 flex-1">
            <div className="flex items-center gap-4 relative">
              <div className="absolute left-5 top-8 bottom-[-24px] w-px bg-border/50"></div>
              <div className="w-10 h-10 rounded-full border-2 border-border overflow-hidden relative z-10">
                <img src="https://ui-avatars.com/api/?name=Liam+N&background=111116&color=FFFFFF" alt="Liam" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-bold">Liam N.</h4>
                  <span className="text-xs font-bold text-iron-lime">10:45 AM</span>
                </div>
                <p className="text-xs text-iron-text-secondary font-medium">Current Session • 42m</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full border-2 border-border overflow-hidden relative z-10">
                <img src="https://ui-avatars.com/api/?name=Elena+R&background=111116&color=FFFFFF" alt="Elena" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-bold">Elena R.</h4>
                  <span className="text-xs font-bold text-iron-text-secondary">09:15 AM</span>
                </div>
                <p className="text-xs text-iron-text-secondary font-medium">Duration • 1h 15m</p>
              </div>
            </div>
          </div>
          
          <button className="btn w-full mt-8 flex items-center justify-center gap-2">
            <Plus size={16} strokeWidth={3} />
            <span>NEW MEMBER</span>
          </button>
        </div>
      </div>
    </div>
  );
}
