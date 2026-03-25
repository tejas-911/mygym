import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/reports');
      setData(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading reports...</div>;
  if (!data) return <div style={{ padding: '20px' }}>Error loading reports.</div>;

  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '25px' }}>Gym Analytics & Reports</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <h3 style={{ color: '#6b7280', fontSize: '0.9rem', textTransform: 'uppercase' }}>Active Members</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{data.activeMembers}</p>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #ef4444' }}>
          <h3 style={{ color: '#6b7280', fontSize: '0.9rem', textTransform: 'uppercase' }}>Expired Subs</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{data.expiredSubs}</p>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <h3 style={{ color: '#6b7280', fontSize: '0.9rem', textTransform: 'uppercase' }}>Members Absent (7 Days)</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{data.absentMembers}</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '30px' }}>
        <h2 style={{ marginBottom: '20px', fontSize: '1.2rem', color: '#374151' }}>Monthly Revenue</h2>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={data.revenue}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} />
              <Tooltip cursor={{fill: 'transparent'}} wrapperStyle={{ outline: 'none' }} />
              <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div className="card">
          <h3 style={{ marginBottom: '15px' }}>Top Performing Assets</h3>
          <p style={{ marginBottom: '10px' }}><strong>Most Popular Workout:</strong> {data.popularWorkout ? `${data.popularWorkout.plan_name} (${data.popularWorkout.count} members)` : 'N/A'}</p>
          <p style={{ marginBottom: '10px' }}><strong>Top Trainer:</strong> {data.topTrainer ? `${data.topTrainer.name} (${data.topTrainer.count} members)` : 'N/A'}</p>
          <p><strong>Top Supplement:</strong> {data.topSupplement ? `${data.topSupplement.name} (${data.topSupplement.sold} sold)` : 'N/A'}</p>
        </div>
        
        <div className="card">
          <h3 style={{ marginBottom: '15px', color: '#ef4444' }}>Maintenance Alerts</h3>
          {data.equipmentAlerts && data.equipmentAlerts.length > 0 ? (
            <ul style={{ paddingLeft: '20px' }}>
              {data.equipmentAlerts.map((eq, i) => (
                <li key={i} style={{ marginBottom: '8px' }}>
                  <strong>{eq.equipment_name}</strong> - {eq.condition_status}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: '#10b981' }}>All equipment is functioning well!</p>
          )}
        </div>
      </div>
    </div>
  );
}
