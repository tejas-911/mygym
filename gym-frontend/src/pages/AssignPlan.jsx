import React, { useState } from 'react';
import axios from 'axios';

export default function AssignPlan() {
  const [formData, setFormData] = useState({ member_id: '', plan_id: '', type: 'workout', start_date: '', end_date: '' });
  const [msg, setMsg] = useState('');

  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      const endpoint = formData.type === 'workout' ? 'workouts/assign' : 'diets/assign';
      await axios.post(`http://localhost:5000/api/${endpoint}`, {
        member_id: formData.member_id,
        workout_id: formData.type === 'workout' ? formData.plan_id : null,
        diet_id: formData.type === 'diet' ? formData.plan_id : null,
        trainer_id: 1, // Defaulting to trainer 1 for demo
        start_date: formData.start_date,
        end_date: formData.end_date
      });
      setMsg('Plan successfully assigned!');
    } catch (err) { setMsg('Error assigning plan.'); }
  };

  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '20px' }}>Assign Workout / Diet</h1>
      <div className="card" style={{ maxWidth: '500px' }}>
        {msg && <p style={{ color: '#10b981', fontWeight: 500, marginBottom: '15px' }}>{msg}</p>}
        <form onSubmit={handleAssign}>
          <div className="form-group">
            <label>Member ID</label>
            <input type="number" required onChange={(e) => setFormData({...formData, member_id: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Plan Type</label>
            <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
              <option value="workout">Workout Plan</option>
              <option value="diet">Diet Plan</option>
            </select>
          </div>
          <div className="form-group">
            <label>Plan ID</label>
            <input type="number" required onChange={(e) => setFormData({...formData, plan_id: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Start Date</label>
            <input type="date" required onChange={(e) => setFormData({...formData, start_date: e.target.value})} />
          </div>
          <div className="form-group">
            <label>End Date</label>
            <input type="date" required onChange={(e) => setFormData({...formData, end_date: e.target.value})} />
          </div>
          <button type="submit" className="btn" style={{ width: '100%', marginTop: '10px' }}>Assign Plan</button>
        </form>
      </div>
    </div>
  );
}
