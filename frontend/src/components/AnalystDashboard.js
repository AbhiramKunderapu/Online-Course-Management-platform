import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import './Dashboard.css';

function AnalystDashboard({ user, onLogout }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await dashboardAPI.getDashboardData(user.user_id, user.role);
      if (response.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <h2>🎓 MOOC</h2>
        <a href="#dashboard">Dashboard</a>
        <a href="#stats">Statistics</a>
        <a href="#reports">Reports</a>
        <a href="#logout" onClick={onLogout}>Logout</a>
      </div>

      <div className="main-content">
        <div className="dashboard-header">
          <h1>Welcome, {user.name}!</h1>
        </div>

        <div className="dashboard-content">
          <h2>Data Analyst Dashboard</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Enrollments</h3>
              <div className="value">{dashboardData?.total_enrollments || 0}</div>
            </div>
          </div>

          <div className="card">
            <h3>Analytics & Reports</h3>
            <p>Advanced analytics features coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalystDashboard;
