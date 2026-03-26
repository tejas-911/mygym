import React, { useEffect, useState } from 'react';
import axios from 'axios';

// Abstracting initial form state outside the component
const initialFormState = { 
  name: '', 
  specialization: '', 
  salary: '', 
  hire_date: new Date().toISOString().split('T')[0] 
};

export default function Trainers() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(initialFormState);

  // New states for better UX
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchTrainers = async () => {
    try {
      // Preparation for JWT authentication if needed
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.get('http://localhost:5000/api/trainers', { headers });
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchTrainers(); 
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError('');

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await axios.post('http://localhost:5000/api/trainers', formData, { headers });
      setShowModal(false);
      setFormData(initialFormState); // Reset to initial state
      fetchTrainers();
    } catch(err) {
      console.error(err);
      // Better error handling instead of alert()
      setModalError(err.response?.data?.message || 'Failed to add trainer. Please try again.');
    } finally {
      setIsSubmitting(false); // Make sure to stop loading state
    }
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
            
            {/* Displaying inline errors gracefully */}
            {modalError && (
              <div style={{ padding: '10px', marginBottom: '15px', background: '#fee2e2', color: '#b91c1c', borderRadius: '4px' }}>
                {modalError}
              </div>
            )}

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
                <input required min="0" type="number" value={formData.salary} onChange={(e) => setFormData({...formData, salary: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Hire Date <span style={{color: '#ef4444'}}>*</span></label>
                <input required type="date" value={formData.hire_date} onChange={(e) => setFormData({...formData, hire_date: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="btn" style={{ flex: 1 }} disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
                <button 
                  type="button" 
                  className="btn" 
                  style={{ flex: 1, background: '#6b7280' }} 
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                >
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
          /* Proper empty state handling */
          <p style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
            No trainers found. Click "+ Add Trainer" to get started. 
          </p>
        ) : (
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
