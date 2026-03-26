import React, { useEffect, useState } from 'react';
import axios from 'axios';

const initialFormState = { 
  member_id: '', 
  check_in_time: new Date().toISOString().slice(0, 16), 
  check_out_time: '',
  date: new Date().toISOString().split('T')[0] 
};

export default function Attendance() {
  const [data, setData] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const [attRes, memRes] = await Promise.all([
        axios.get('http://localhost:5000/api/attendance', { headers }),
        axios.get('http://localhost:5000/api/members', { headers })
      ]);
      
      setData(attRes.data);
      setMembers(memRes.data);
    } catch (err) { 
      console.error(err); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleLog = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError('');
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      await axios.post('http://localhost:5000/api/attendance', { 
        member_id: formData.member_id, 
        check_in_time: formData.check_in_time.replace('T', ' ') + ':00', 
        check_out_time: formData.check_out_time ? formData.check_out_time.replace('T', ' ') + ':00' : null,
        date: formData.date 
      }, { headers });
      
      setShowModal(false);
      setFormData(initialFormState);
      fetchData();
    } catch(err) { 
      console.error(err);
      setModalError(err.response?.data?.message || 'Failed to log attendance. Please try again.'); 
    } finally {
      setIsSubmitting(false);
    }
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
            {modalError && (
              <div style={{ padding: '10px', marginBottom: '15px', background: '#fee2e2', color: '#b91c1c', borderRadius: '4px' }}>
                {modalError}
              </div>
            )}
            <form onSubmit={handleLog}>
              <div className="form-group">
                <label>Member <span style={{color: '#ef4444'}}>*</span></label>
                <select required value={formData.member_id} onChange={(e) => setFormData({...formData, member_id: e.target.value})}>
                  <option value="">-- Select Member --</option>
                  {members.map(m => (
                    <option key={m.member_id} value={m.member_id}>{m.name} (ID: {m.member_id})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Check-in Time <span style={{color: '#ef4444'}}>*</span></label>
                <input required type="datetime-local" value={formData.check_in_time} onChange={(e) => setFormData({...formData, check_in_time: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Check-out Time</label>
                <input type="datetime-local" value={formData.check_out_time} onChange={(e) => setFormData({...formData, check_out_time: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Date <span style={{color: '#ef4444'}}>*</span></label>
                <input required type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="btn" style={{ flex: 1 }} disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Check-in'}
                </button>
                <button type="button" className="btn" style={{ flex: 1, background: '#6b7280' }} onClick={() => setShowModal(false)} disabled={isSubmitting}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <p style={{ padding: '20px' }}>Loading data...</p>
        ) : data.length === 0 ? (
          <p style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
            No attendance records found. Click "+ Log Visit" to get started. 
          </p>
        ) : (
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
