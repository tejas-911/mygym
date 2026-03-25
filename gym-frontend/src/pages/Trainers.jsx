import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Trainers() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', specialization: '', salary: '', hire_date: new Date().toISOString().split('T')[0] });

  useEffect(() => { fetchTrainers(); }, []);
  const fetchTrainers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/trainers');
      setData(res.data);
      setLoading(false);
    } catch (err) { console.error(err); setLoading(false); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/trainers', formData);
      setShowModal(false);
      setFormData({ name: '', specialization: '', salary: '', hire_date: new Date().toISOString().split('T')[0] });
      fetchTrainers();
    } catch(err) { alert('Failed to add trainer'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h1 style={{ fontSize: '2rem' }}>Trainers</h1>
        <button className="btn" onClick={() => setShowModal(true)}>+ Add Trainer</button>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add New Trainer</h2>
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label>Name <span style={{color: '#ef4444'}}>*</span></label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Specialization <span style={{color: '#ef4444'}}>*</span></label>
                <input required type="text" value={formData.specialization} onChange={(e) => setFormData({...formData, specialization: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Monthly Salary (₹) <span style={{color: '#ef4444'}}>*</span></label>
                <input required type="number" value={formData.salary} onChange={(e) => setFormData({...formData, salary: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Hire Date <span style={{color: '#ef4444'}}>*</span></label>
                <input required type="date" value={formData.hire_date} onChange={(e) => setFormData({...formData, hire_date: e.target.value})} />
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
                <th>Specialization</th>
                <th>Salary</th>
                <th>Hire Date</th>
              </tr>
            </thead>
            <tbody>
              {data.map(item => (
                <tr key={item.trainer_id}>
                  <td>{item.trainer_id}</td>
                  <td style={{ fontWeight: 500 }}>{item.name}</td>
                  <td>{item.specialization}</td>
                  <td>₹{Number(item.salary).toLocaleString('en-IN')}</td>
                  <td>{new Date(item.hire_date).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
