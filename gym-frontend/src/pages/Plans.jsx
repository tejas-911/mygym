import React, { useEffect, useState } from 'react';
import axios from 'axios';

const initialFormState = { 
  plan_name: '', 
  duration_months: '', 
  price: '', 
  description: '' 
};

export default function Plans() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get('http://localhost:5000/api/plans', { headers });
      setData(res.data);
    } catch (err) { 
      console.error(err); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlans(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError('');
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post('http://localhost:5000/api/plans', formData, { headers });
      setShowModal(false);
      setFormData(initialFormState);
      fetchPlans();
    } catch(err) { 
      console.error(err);
      setModalError(err.response?.data?.message || 'Failed to add plan. Please try again.'); 
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h1 style={{ fontSize: '2rem' }}>Membership Plans</h1>
        <button className="btn" onClick={() => setShowModal(true)}>+ Add Plan</button>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add New Plan</h2>
            {modalError && (
              <div style={{ padding: '10px', marginBottom: '15px', background: '#fee2e2', color: '#b91c1c', borderRadius: '4px' }}>
                {modalError}
              </div>
            )}
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label>Plan Name <span style={{color: '#ef4444'}}>*</span></label>
                <input required type="text" value={formData.plan_name} onChange={(e) => setFormData({...formData, plan_name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Duration (Months) <span style={{color: '#ef4444'}}>*</span></label>
                <input required type="number" min="1" value={formData.duration_months} onChange={(e) => setFormData({...formData, duration_months: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Price (₹) <span style={{color: '#ef4444'}}>*</span></label>
                <input required type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows="3" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db'}}></textarea>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="btn" style={{ flex: 1 }} disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save'}
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
            No membership plans found. Click "+ Add Plan" to create one.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Duration (Months)</th>
                <th>Price</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {data.map(item => (
                <tr key={item.plan_id}>
                  <td>{item.plan_id}</td>
                  <td style={{ fontWeight: 500 }}>{item.plan_name}</td>
                  <td>{item.duration_months}</td>
                  <td>₹{Number(item.price).toLocaleString('en-IN')}</td>
                  <td>{item.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
