import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Members() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', join_date: new Date().toISOString().split('T')[0] });

  useEffect(() => { fetchMembers(); }, []);
  const fetchMembers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/members');
      setData(res.data);
      setLoading(false);
    } catch (err) { console.error(err); setLoading(false); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/members', formData);
      setShowModal(false);
      setFormData({ name: '', email: '', phone: '', join_date: new Date().toISOString().split('T')[0] });
      fetchMembers();
    } catch(err) { alert('Failed to add member'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h1 style={{ fontSize: '2rem' }}>Members</h1>
        <button className="btn" onClick={() => setShowModal(true)}>+ Add Member</button>
      </div>
      
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add New Member</h2>
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label>Name <span style={{color: '#ef4444'}}>*</span></label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Email <span style={{color: '#ef4444'}}>*</span></label>
                <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Join Date <span style={{color: '#ef4444'}}>*</span></label>
                <input required type="date" value={formData.join_date} onChange={(e) => setFormData({...formData, join_date: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="btn" style={{ flex: 1 }}>Save</button>
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
                <th>Name</th>
                <th>Email</th>
                <th>Join Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map(item => (
                <tr key={item.member_id}>
                  <td>{item.member_id}</td>
                  <td style={{ fontWeight: 500 }}>{item.name}</td>
                  <td>{item.email}</td>
                  <td>{new Date(item.join_date).toLocaleDateString('en-IN')}</td>
                  <td><span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem', background: item.status === 'Active' ? '#dcfce7' : '#fee2e2', color: '#374151' }}>{item.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
