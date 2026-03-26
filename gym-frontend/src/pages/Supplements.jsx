import React, { useEffect, useState } from 'react';
import axios from 'axios';

const initialFormState = { 
  member_id: '', 
  supplement_id: '', 
  quantity: 1, 
  sale_date: new Date().toISOString().split('T')[0],
  payment_method: 'Card'
};

export default function Supplements() {
  const [data, setData] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(initialFormState);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const [suppRes, memRes] = await Promise.all([
        axios.get('http://localhost:5000/api/supplements', { headers }),
        axios.get('http://localhost:5000/api/members', { headers })
      ]);
      
      setData(suppRes.data);
      setMembers(memRes.data);
    } catch (err) { 
      console.error(err); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSale = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError('');
    setSuccessMsg('');
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const selectedSupp = data.find(s => s.supplement_id === parseInt(formData.supplement_id));
      if (!selectedSupp) {
        setModalError('Please select a valid supplement.');
        setIsSubmitting(false);
        return;
      }
      
      const total_amount = selectedSupp.price * formData.quantity;
      await axios.post('http://localhost:5000/api/supplements/sale', { ...formData, total_amount }, { headers });
      
      setShowModal(false);
      setFormData(initialFormState);
      fetchData();
      
      setSuccessMsg('Sale successful! Transaction added to Payments DB.');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch(err) { 
      console.error(err);
      setModalError(err.response?.data?.error || 'Failed to record sale. Insufficient stock?'); 
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewSupplement = data.find(s => s.supplement_id === parseInt(formData.supplement_id));
  const previewTotal = previewSupplement ? (previewSupplement.price * formData.quantity) : 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h1 style={{ fontSize: '2rem' }}>Supplements Shop</h1>
        <button className="btn" onClick={() => setShowModal(true)}>+ Record Sale</button>
      </div>

      {successMsg && (
        <div style={{ padding: '15px', marginBottom: '20px', background: '#dcfce7', color: '#047857', borderRadius: '6px', fontWeight: '500' }}>
          {successMsg}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Record Supplement Sale</h2>
            {modalError && (
              <div style={{ padding: '10px', marginBottom: '15px', background: '#fee2e2', color: '#b91c1c', borderRadius: '4px' }}>
                {modalError}
              </div>
            )}
            <form onSubmit={handleSale}>
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
                <label>Select Supplement <span style={{color: '#ef4444'}}>*</span></label>
                <select required value={formData.supplement_id} onChange={(e) => setFormData({...formData, supplement_id: e.target.value})}>
                  <option value="">-- Choose Supplement --</option>
                  {data.map(s => (
                    <option key={s.supplement_id} value={s.supplement_id}>
                      {s.name} (₹{Number(s.price).toLocaleString('en-IN')} each) - {s.stock_quantity} left
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Quantity <span style={{color: '#ef4444'}}>*</span></label>
                <input required type="number" min="1" max={previewSupplement ? previewSupplement.stock_quantity : 99} value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})} />
              </div>
              <div className="form-group">
                <label>Calculated Total (₹)</label>
                <input type="text" readOnly value={`₹${Number(previewTotal).toLocaleString('en-IN')}`} style={{ background: '#f3f4f6', fontWeight: 'bold', color: '#10b981' }} />
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
                <label>Sale Date <span style={{color: '#ef4444'}}>*</span></label>
                <input required type="date" value={formData.sale_date} onChange={(e) => setFormData({...formData, sale_date: e.target.value})} />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="btn" style={{ flex: 1 }} disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Sale'}
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
            No supplements found in the shop.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Brand</th>
                <th>Price</th>
                <th>Stock Quantity</th>
              </tr>
            </thead>
            <tbody>
              {data.map(item => (
                <tr key={item.supplement_id}>
                  <td>{item.supplement_id}</td>
                  <td style={{ fontWeight: 500 }}>{item.name}</td>
                  <td>{item.brand}</td>
                  <td>₹{Number(item.price).toLocaleString('en-IN')}</td>
                  <td><span style={{ fontWeight: 500, color: item.stock_quantity > 10 ? '#10b981' : '#ef4444' }}>{item.stock_quantity}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
