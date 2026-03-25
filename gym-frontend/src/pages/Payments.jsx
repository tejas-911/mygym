import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Payments() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ subscription_id: '', amount: '', payment_date: new Date().toISOString().split('T')[0], payment_method: 'Card' });

  useEffect(() => { fetchData(); }, []);
  const fetchData = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/payments');
      setData(res.data);
      setLoading(false);
    } catch (err) { console.error(err); setLoading(false); }
  };

  const handleLog = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/payments', formData);
      setShowModal(false);
      setFormData({ subscription_id: '', amount: '', payment_date: new Date().toISOString().split('T')[0], payment_method: 'Card' });
      fetchData();
    } catch(err) { alert('Failed to record payment'); }
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
            <form onSubmit={handleLog}>
              <div className="form-group">
                <label>Subscription ID <span style={{color: '#ef4444'}}>*</span></label>
                <input required type="number" value={formData.subscription_id} onChange={(e) => setFormData({...formData, subscription_id: e.target.value})} />
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
                  <option value="Online">Online</option>
                </select>
              </div>
              <div className="form-group">
                <label>Date <span style={{color: '#ef4444'}}>*</span></label>
                <input required type="date" value={formData.payment_date} onChange={(e) => setFormData({...formData, payment_date: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="btn" style={{ flex: 1 }}>Save Payment</button>
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
                <th>Receipt ID</th>
                <th>Sub ID</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Method</th>
              </tr>
            </thead>
            <tbody>
              {data.map(item => (
                <tr key={item.payment_id}>
                  <td>{item.payment_id}</td>
                  <td style={{ fontWeight: 500 }}>{item.subscription_id}</td>
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
