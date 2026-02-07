import React, { useState, useEffect } from 'react';
import { analystAPI } from '../services/api';
import './Dashboard.css';

function AnalystDashboard({ user, onLogout }) {
  const [overview, setOverview] = useState(null);
  const [courses, setCourses] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [overviewRes, coursesRes, insightsRes] = await Promise.all([
        analystAPI.getOverview(),
        analystAPI.getCourses(),
        analystAPI.getInsights()
      ]);
      if (overviewRes.success) setOverview(overviewRes.data);
      if (coursesRes.success) setCourses(coursesRes.courses);
      if (insightsRes.success) setInsights(insightsRes.insights);
    } catch (error) {
      console.error('Error loading analyst data:', error);
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
        <a href="#dashboard" onClick={() => setActiveTab('dashboard')}>Dashboard</a>
        <a href="#courses" onClick={() => setActiveTab('courses')}>All Courses</a>
        <a href="#insights" onClick={() => setActiveTab('insights')}>Insights</a>
        <a href="#logout" onClick={onLogout}>Logout</a>
      </div>

      <div className="main-content">
        <div className="dashboard-header">
          <h1>Welcome, {user.name}!</h1>
        </div>

        <div className="dashboard-content">
          {activeTab === 'dashboard' && (
            <div>
              <h2>Analyst Dashboard</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Total Users</h3>
                  <div className="value">{overview?.total_users || 0}</div>
                </div>
                <div className="stat-card">
                  <h3>Total Courses</h3>
                  <div className="value">{overview?.total_courses || 0}</div>
                </div>
                <div className="stat-card">
                  <h3>Total Enrollments</h3>
                  <div className="value">{overview?.total_enrollments || 0}</div>
                </div>
                <div className="stat-card">
                  <h3>Completed</h3>
                  <div className="value">{overview?.completed_enrollments || 0}</div>
                </div>
                <div className="stat-card">
                  <h3>Completion Rate</h3>
                  <div className="value">{overview?.completion_rate || 0}%</div>
                </div>
                <div className="stat-card">
                  <h3>Total Assignments</h3>
                  <div className="value">{overview?.total_assignments || 0}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'courses' && (
            <div>
              <h2>All Courses - Analytics</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Level</th>
                    <th>Duration</th>
                    <th>Enrolled</th>
                    <th>Completed</th>
                    <th>Completion Rate</th>
                    <th>Assignments</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((c) => (
                    <tr key={c.course_id}>
                      <td>{c.title}</td>
                      <td><span className="course-level">{c.level}</span></td>
                      <td>{c.duration}</td>
                      <td>{c.enrolled}</td>
                      <td>{c.completed}</td>
                      <td>{c.completion_rate}%</td>
                      <td>{c.assignment_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'insights' && (
            <div>
              <h2>Insights & Analysis</h2>

              <div className="card" style={{ marginBottom: '24px' }}>
                <h3>Enrollments by Course Level</h3>
                {insights?.enrollments_by_level?.length > 0 ? (
                  <table className="table">
                    <thead><tr><th>Level</th><th>Enrollments</th></tr></thead>
                    <tbody>
                      {insights.enrollments_by_level.map((item, i) => (
                        <tr key={i}><td>{item.level}</td><td>{item.count}</td></tr>
                      ))}
                    </tbody>
                  </table>
                ) : <p>No enrollment data yet.</p>}
              </div>

              <div className="card" style={{ marginBottom: '24px' }}>
                <h3>Users by Role</h3>
                {insights?.users_by_role?.length > 0 ? (
                  <table className="table">
                    <thead><tr><th>Role</th><th>Count</th></tr></thead>
                    <tbody>
                      {insights.users_by_role.map((item, i) => (
                        <tr key={i}><td>{item.role}</td><td>{item.count}</td></tr>
                      ))}
                    </tbody>
                  </table>
                ) : <p>No user data yet.</p>}
              </div>

              <div className="card">
                <h3>Top 5 Courses by Enrollment</h3>
                {insights?.top_courses_by_enrollment?.length > 0 ? (
                  <ol style={{ paddingLeft: '20px' }}>
                    {insights.top_courses_by_enrollment.map((item, i) => (
                      <li key={i} style={{ marginBottom: '8px' }}><strong>{item.title}</strong> — {item.enrollments} enrollments</li>
                    ))}
                  </ol>
                ) : <p>No course data yet.</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AnalystDashboard;
