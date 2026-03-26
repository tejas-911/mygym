import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Equipment() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get('http://localhost:5000/api/equipment', { headers });
      setData(res.data);
    } catch (err) { 
      console.error(err); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h1 style={{ fontSize: '2rem' }}>Equipment Info</h1>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <p style={{ padding: '20px' }}>Loading data...</p>
        ) : data.length === 0 ? (
          <p style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
            No equipment found. Add new equipment to see them listed here.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Purchase Date</th>
                <th>Condition</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {data.map(item => (
                <tr key={item.equipment_id}>
                  <td>{item.equipment_id}</td>
                  <td style={{ fontWeight: 500 }}>{item.equipment_name}</td>
                  <td>{new Date(item.purchase_date).toLocaleDateString('en-IN')}</td>
                  <td><span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem', background: item.condition_status === 'Good' || item.condition_status === 'New' ? '#dcfce7' : '#fef08a', color: '#374151' }}>{item.condition_status}</span></td>
                  <td>{item.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
