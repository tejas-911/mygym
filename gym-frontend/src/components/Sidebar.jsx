import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Sidebar() {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  return (
    <div className="sidebar">
      <h2>GymMaster</h2>
      <nav>
        <Link to="/">Dashboard</Link>
        <Link to="/reports">Analytics & Reports</Link>
        <Link to="/members">Members</Link>
        <Link to="/trainers">Trainers</Link>
        <Link to="/plans">Plans & Subs</Link>
        <Link to="/attendance">Attendance</Link>
        <Link to="/payments">Payments</Link>
        <Link to="/assign">Assign Plan</Link>
        <Link to="/equipment">Equipment</Link>
        <Link to="/supplements">Supplements</Link>
      </nav>
      <div style={{ marginTop: 'auto' }}>
        <button className="btn" style={{ width: '100%', background: '#ef4444' }} onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}
