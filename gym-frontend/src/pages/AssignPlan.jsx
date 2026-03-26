import React, { useState, useEffect } from 'react';
import axios from 'axios';

const initialFormState = { member_id: '', plan_id: '', type: 'workout', start_date: '', end_date: '' };

export default function AssignPlan() {
  const [formData, setFormData] = useState(initialFormState);
  const [msg, setMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isError, setIsError] = useState(false);

  // Dropdown states
  const [members, setMembers] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [diets, setDiets] = useState([]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const [mRes, wRes, dRes] = await Promise.all([
          axios.get('http://localhost:5000/api/members', { headers }),
          axios.get('http://localhost:5000/api/workouts/plans', { headers }),
          axios.get('http://localhost:5000/api/diets/plans', { headers })
        ]);
        setMembers(mRes.data);
        setWorkouts(wRes.data);
        setDiets(dRes.data);
      } catch (err) {
        console.error("Error fetching dropdown options");
      }
    };
    fetchOptions();
  }, []);

  const handleAssign = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMsg('');
    setIsError(false);
    
    try {
      const endpoint = formData.type === 'workout' ? 'workouts/assign' : 'diets/assign';
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await axios.post(`http://localhost:5000/api/${endpoint}`, {
        member_id: formData.member_id,
        workout_id: formData.type === 'workout' ? formData.plan_id : null,
        diet_id: formData.type === 'diet' ? formData.plan_id : null,
        trainer_id: 1, // Defaulting to trainer 1 for demo
        start_date: formData.start_date,
        end_date: formData.end_date
      }, { headers });
      
      setIsError(false);
      setMsg('Plan successfully assigned!');
      setFormData(initialFormState);
    } catch (err) { 
      setIsError(true);
      setMsg(err.response?.data?.message || 'Error assigning plan. Please try again.'); 
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentPlans = formData.type === 'workout' ? workouts : diets;

  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '20px' }}>Assign Workout / Diet</h1>
      <div className="card" style={{ maxWidth: '500px' }}>
        {msg && (
          <div style={{ padding: '10px', marginBottom: '15px', background: isError ? '#fee2e2' : '#dcfce7', color: isError ? '#b91c1c' : '#047857', borderRadius: '4px' }}>
            {msg}
          </div>
        )}
        <form onSubmit={handleAssign}>
          <div className="form-group">
            <label>Select Member <span style={{color: '#ef4444'}}>*</span></label>
            <select required value={formData.member_id} onChange={(e) => setFormData({...formData, member_id: e.target.value})}>
                <option value="">-- Choose Member --</option>
                {members.map(m => (
                  <option key={m.member_id} value={m.member_id}>{m.name} (ID: {m.member_id})</option>
                ))}
            </select>
          </div>
          <div className="form-group">
            <label>Plan Type</label>
            <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value, plan_id: ''})}>
              <option value="workout">Workout Plan</option>
              <option value="diet">Diet Plan</option>
            </select>
          </div>
          <div className="form-group">
            <label>Select Plan <span style={{color: '#ef4444'}}>*</span></label>
            <select required value={formData.plan_id} onChange={(e) => setFormData({...formData, plan_id: e.target.value})}>
                <option value="">-- Choose {formData.type === 'workout' ? 'Workout' : 'Diet'} --</option>
                {currentPlans.map(p => {
                    const id = formData.type === 'workout' ? p.workout_id : p.diet_id;
                    return <option key={id} value={id}>{p.plan_name}</option>;
                })}
            </select>
          </div>
          <div className="form-group">
            <label>Start Date <span style={{color: '#ef4444'}}>*</span></label>
            <input type="date" required value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} />
          </div>
          <div className="form-group">
            <label>End Date <span style={{color: '#ef4444'}}>*</span></label>
            <input type="date" required value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} />
          </div>
          <button type="submit" className="btn" style={{ width: '100%', marginTop: '10px' }} disabled={isSubmitting}>
            {isSubmitting ? 'Assigning...' : 'Assign Plan'}
          </button>
        </form>
      </div>
    </div>
  );
}
