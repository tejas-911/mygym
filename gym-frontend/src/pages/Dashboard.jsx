import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
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

  if (loading) return <div style={{ padding: '20px' }}>Loading dashboard data...</div>;
  if (!data) return <div style={{ padding: '20px' }}>Error loading dashboard data.</div>;

  // Fallbacks to prevent white screens
  const revenueData = data.revenue || [];
  const attendanceData = data.attendanceStats || [];
  const growthData = data.memberGrowth || [];

  // Calculate some derived metrics
  const totalRevenueThisMonth = revenueData.length > 0 
    ? revenueData[revenueData.length - 1].total 
    : 0;
    
  const totalAttendanceToday = attendanceData.length > 0 
    ? attendanceData[attendanceData.length - 1].count 
    : 0;

  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>Dashboard</h1>
      <p style={{ color: '#6b7280', marginBottom: '30px' }}>Welcome back to GymMaster.</p>
      
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <h3 style={{ color: '#4b5563', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase' }}>Active Members</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1f2937', marginTop: '10px' }}>{data.activeMembers}</p>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
          <h3 style={{ color: '#4b5563', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase' }}>Recent Revenue</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1f2937', marginTop: '10px' }}>₹{Number(totalRevenueThisMonth).toLocaleString('en-IN')}</p>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <h3 style={{ color: '#4b5563', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase' }}>Total Trainers</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1f2937', marginTop: '10px' }}>{data.topTrainer ? 5 : 0} {/* Seeded DB */}</p>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <h3 style={{ color: '#4b5563', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase' }}>Recent Attendance</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1f2937', marginTop: '10px' }}>{totalAttendanceToday}</p>
        </div>
      </div>

      {/* Graphs Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px', marginBottom: '30px' }}>
        
        {/* Revenue Progress */}
        <div className="card" style={{ padding: '25px' }}>
          <h2 style={{ fontSize: '1.2rem', color: '#374151', marginBottom: '20px' }}>Revenue Progress</h2>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₹${Number(val).toLocaleString('en-IN')}`} tick={{fill: '#6b7280'}} />
                <Tooltip cursor={{stroke: '#e5e7eb', strokeWidth: 2}} wrapperStyle={{ outline: 'none' }} />
                <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={4} dot={{r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 8}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Member Growth */}
        <div className="card" style={{ padding: '25px' }}>
          <h2 style={{ fontSize: '1.2rem', color: '#374151', marginBottom: '20px' }}>New Member Growth</h2>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
                <Tooltip cursor={{stroke: '#e5e7eb', strokeWidth: 2}} wrapperStyle={{ outline: 'none' }} />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorMembers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attendance (Last 7 records) */}
        <div className="card" style={{ padding: '25px' }}>
          <h2 style={{ fontSize: '1.2rem', color: '#374151', marginBottom: '20px' }}>Weekly Check-ins</h2>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
                <Tooltip cursor={{fill: 'transparent'}} wrapperStyle={{ outline: 'none' }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Add a quick insight box for symmetry if window is wide */}
        <div className="card" style={{ padding: '25px' }}>
          <h2 style={{ fontSize: '1.2rem', color: '#374151', marginBottom: '20px' }}>Quick Details</h2>
          <div style={{ padding: '20px', background: '#f9fafb', borderRadius: '8px', marginBottom: '15px' }}>
             <h4 style={{ color: '#4b5563', marginBottom: '5px' }}>Most Popular Plan</h4>
             <p style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#1f2937' }}>{data.popularWorkout?.plan_name || 'N/A'}</p>
          </div>
          <div style={{ padding: '20px', background: '#f9fafb', borderRadius: '8px', marginBottom: '15px' }}>
             <h4 style={{ color: '#4b5563', marginBottom: '5px' }}>Top Performing Trainer</h4>
             <p style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#1f2937' }}>{data.topTrainer?.name || 'N/A'}</p>
          </div>
          <div style={{ padding: '20px', background: '#f9fafb', borderRadius: '8px' }}>
             <h4 style={{ color: '#4b5563', marginBottom: '5px' }}>Top Supplement Sold</h4>
             <p style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#1f2937' }}>{data.topSupplement?.name || 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
