import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Attendance() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ member_id: '', check_in_time: new Date().toISOString().slice(0, 16), date: new Date().toISOString().split('T')[0] });

  useEffect(() => { fetchData(); }, []);
  const fetchData = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/attendance');
      setData(res.data);
      setLoading(false);
    } catch (err) { console.error(err); setLoading(false); }
  };

  const handleLog = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/attendance', { 
        member_id: formData.member_id, 
        check_in_time: formData.check_in_time.replace('T', ' ') + ':00', 
        date: formData.date 
      });
      setShowModal(false);
      setFormData({ member_id: '', check_in_time: new Date().toISOString().slice(0, 16), date: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch(err) { alert('Failed to log attendance'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h1 style={{ fontSize: '2rem' }}>Attendance</h1>
        <button className="btn" onClick={() => setShowModal(true)}>+ Log Visit</button>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Log Member Visit</h2>
            <form onSubmit={handleLog}>
              <div className="form-group">
                <label>Member ID <span style={{color: '#ef4444'}}>*</span></label>
                <input required type="number" value={formData.member_id} onChange={(e) => setFormData({...formData, member_id: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Check-in Time <span style={{color: '#ef4444'}}>*</span></label>
                <input required type="datetime-local" value={formData.check_in_time} onChange={(e) => setFormData({...formData, check_in_time: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Date <span style={{color: '#ef4444'}}>*</span></label>
                <input required type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="btn" style={{ flex: 1 }}>Save Check-in</button>
                <button type="button" className="btn" style={{ flex: 1, background: '#6b7280' }} onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? <p style={{ padding: '20px' }}>Loading data...</p> : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Member ID</th>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
              </tr>
            </thead>
            <tbody>
              {data.map(item => (
                <tr key={item.attendance_id}>
                  <td>{item.attendance_id}</td>
                  <td style={{ fontWeight: 500 }}>{item.member_id}</td>
                  <td>{new Date(item.date).toLocaleDateString('en-IN')}</td>
                  <td>{new Date(item.check_in_time).toLocaleTimeString('en-IN')}</td>
                  <td>{item.check_out_time ? new Date(item.check_out_time).toLocaleTimeString('en-IN') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
