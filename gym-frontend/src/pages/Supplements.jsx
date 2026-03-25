import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Supplements() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ member_id: '', supplement_id: '', quantity: 1, sale_date: new Date().toISOString().split('T')[0] });

  useEffect(() => { fetchData(); }, []);
  const fetchData = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/supplements');
      setData(res.data);
      setLoading(false);
    } catch (err) { console.error(err); setLoading(false); }
  };

  const handleSale = async (e) => {
    e.preventDefault();
    try {
      // Calculate total amount automatically
      const selectedSupp = data.find(s => s.supplement_id === parseInt(formData.supplement_id));
      if (!selectedSupp) return alert('Please select a valid supplement.');
      const total_amount = selectedSupp.price * formData.quantity;

      await axios.post('http://localhost:5000/api/supplements/sale', { ...formData, total_amount });
      setShowModal(false);
      setFormData({ member_id: '', supplement_id: '', quantity: 1, sale_date: new Date().toISOString().split('T')[0] });
      fetchData();
      alert('Sale successful! Transaction added to Payments DB.');
    } catch(err) { alert(err.response?.data?.error || 'Failed to record sale. Insufficient stock?'); }
  };

  // Preview total amount based on current selections
  const previewSupplement = data.find(s => s.supplement_id === parseInt(formData.supplement_id));
  const previewTotal = previewSupplement ? (previewSupplement.price * formData.quantity) : 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h1 style={{ fontSize: '2rem' }}>Supplements Shop</h1>
        <button className="btn" onClick={() => setShowModal(true)}>+ Record Sale</button>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Record Supplement Sale</h2>
            <form onSubmit={handleSale}>
              <div className="form-group">
                <label>Member ID <span style={{color: '#ef4444'}}>*</span></label>
                <input required type="number" min="1" value={formData.member_id} onChange={(e) => setFormData({...formData, member_id: e.target.value})} />
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
                <label>Sale Date <span style={{color: '#ef4444'}}>*</span></label>
                <input required type="date" value={formData.sale_date} onChange={(e) => setFormData({...formData, sale_date: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="btn" style={{ flex: 1 }}>Save Sale</button>
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
