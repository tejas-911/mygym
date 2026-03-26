import React, { useEffect, useState } from 'react';
import axios from 'axios';

const initialFormState = { 
  subscription_id: '', 
  amount: '', 
  payment_date: new Date().toISOString().split('T')[0], 
  payment_method: 'Card' 
};

export default function Payments() {
  const [data, setData] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const [payRes, subRes] = await Promise.all([
        axios.get('http://localhost:5000/api/payments', { headers }),
        axios.get('http://localhost:5000/api/subscriptions', { headers })
      ]);
      
      setData(payRes.data);
      setSubscriptions(subRes.data);
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
      await axios.post('http://localhost:5000/api/payments', formData, { headers });
      setShowModal(false);
      setFormData(initialFormState);
      fetchData();
    } catch(err) { 
      console.error(err);
      setModalError(err.response?.data?.message || 'Failed to record payment. Please try again.'); 
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h1 style={{ fontSize: '2rem' }}>Payments</h1>
        <button className="btn" onClick={() => setShowModal(true)}>+ Record Payment</button>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Record Payment</h2>
            {modalError && (
              <div style={{ padding: '10px', marginBottom: '15px', background: '#fee2e2', color: '#b91c1c', borderRadius: '4px' }}>
                {modalError}
              </div>
            )}
            <form onSubmit={handleLog}>
              <div className="form-group">
                <label>Subscription ID <span style={{color: '#ef4444'}}>*</span></label>
                <select required value={formData.subscription_id} onChange={(e) => setFormData({...formData, subscription_id: e.target.value})}>
                  <option value="">-- Select Subscription --</option>
                  {subscriptions.map(s => (
                    <option key={s.subscription_id} value={s.subscription_id}>Sub #{s.subscription_id} (Member ID #{s.member_id})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Amount (₹) <span style={{color: '#ef4444'}}>*</span></label>
                <input required type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Payment Method <span style={{color: '#ef4444'}}>*</span></label>
                <select value={formData.payment_method} onChange={(e) => setFormData({...formData, payment_method: e.target.value})}>
                  <option value="Card">Card</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>
              <div className="form-group">
                <label>Date <span style={{color: '#ef4444'}}>*</span></label>
                <input required type="date" value={formData.payment_date} onChange={(e) => setFormData({...formData, payment_date: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="btn" style={{ flex: 1 }} disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Payment'}
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
            No payment records found. Click "+ Record Payment" to get started. 
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Receipt ID</th>
                <th>Sub ID / Type</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Method</th>
              </tr>
            </thead>
            <tbody>
              {data.map(item => (
                <tr key={item.payment_id}>
                  <td>{item.payment_id}</td>
                  <td style={{ fontWeight: 500 }}>
                    {item.subscription_id ? `Sub #${item.subscription_id}` : (
                      <span style={{ fontSize: '0.85rem', color: '#6b7280', backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>Supplement Sale</span>
                    )}
                  </td>
                  <td><span style={{ color: '#10b981', fontWeight: 600 }}>₹{Number(item.amount).toLocaleString('en-IN')}</span></td>
                  <td>{new Date(item.payment_date).toLocaleDateString('en-IN')}</td>
                  <td>{item.payment_method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
