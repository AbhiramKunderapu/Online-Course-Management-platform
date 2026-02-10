import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { analystAPI } from '../services/api';
import './Dashboard.css';

const CHART_COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#6366f1', '#ec4899'];

function AnalystDashboard({ user, onLogout }) {
  const [overview, setOverview] = useState(null);
  const [courses, setCourses] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [courseAnalytics, setCourseAnalytics] = useState(null);
  const [loadingCourseAnalytics, setLoadingCourseAnalytics] = useState(false);
  const [publishToStudents, setPublishToStudents] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'course-analytics' && selectedCourseId) {
      loadCourseAnalytics(selectedCourseId);
    } else {
      setCourseAnalytics(null);
    }
  }, [activeTab, selectedCourseId]);

  const loadData = async () => {
    try {
      const [overviewRes, coursesRes, insightsRes] = await Promise.all([
        analystAPI.getOverview(),
        analystAPI.getCourses(),
        analystAPI.getInsights()
      ]);
      if (overviewRes.success) setOverview(overviewRes.data);
      if (coursesRes.success) {
        setCourses(coursesRes.courses);
        if (coursesRes.courses?.length > 0 && !selectedCourseId) {
          setSelectedCourseId(coursesRes.courses[0].course_id);
        }
      }
      if (insightsRes.success) setInsights(insightsRes.insights);
    } catch (error) {
      console.error('Error loading analyst data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCourseAnalytics = async (courseId) => {
    setLoadingCourseAnalytics(true);
    try {
      const [analyticsRes, settingRes] = await Promise.all([
        analystAPI.getCourseAnalytics(courseId),
        analystAPI.getCourseInsightsSetting(courseId),
      ]);
      if (analyticsRes.success) setCourseAnalytics(analyticsRes.data);
      else setCourseAnalytics(null);
      if (settingRes.success) setPublishToStudents(!!settingRes.published);
    } catch (e) {
      console.error('Error loading course analytics:', e);
      setCourseAnalytics(null);
      setPublishToStudents(false);
    } finally {
      setLoadingCourseAnalytics(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <h2>🎓 CourseHub</h2>
        <a href="#dashboard" onClick={() => setActiveTab('dashboard')}>Dashboard</a>
        <a href="#courses" onClick={() => setActiveTab('courses')}>All Courses</a>
        <a href="#insights" onClick={() => setActiveTab('insights')}>Insights & Charts</a>
        <a href="#course-analytics" onClick={() => setActiveTab('course-analytics')}>Course Analytics</a>
        <a href="#logout" onClick={onLogout}>Logout</a>
      </div>

      <div className="main-content">
        <div className="dashboard-header">
          <h1>Welcome, {user.name}!</h1>
        </div>

        <div className="dashboard-content analyst-content">
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
              {insights?.grade_distribution_platform?.length > 0 && (
                <div className="analyst-chart-card">
                  <h3>Platform: Grades (Completed Enrollments)</h3>
                  <div className="chart-wrap">
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={insights.grade_distribution_platform} margin={{ top: 12, right: 12, bottom: 12, left: 12 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="grade" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" name="Students" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
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
            <div className="analyst-insights">
              <h2>Insights & Analysis</h2>

              {insights?.enrollments_by_level?.length > 0 && (
                <div className="analyst-chart-card">
                  <h3>Enrollments by Course Level</h3>
                  <div className="chart-wrap">
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={insights.enrollments_by_level} margin={{ top: 12, right: 12, bottom: 12, left: 12 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="level" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" name="Enrollments" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {insights?.users_by_role?.length > 0 && (
                <div className="analyst-chart-card">
                  <h3>Users by Role</h3>
                  <div className="chart-wrap chart-wrap-pie">
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={insights.users_by_role}
                          dataKey="count"
                          nameKey="role"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          label={({ role, count }) => `${role}: ${count}`}
                        >
                          {insights.users_by_role.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {insights?.top_courses_by_enrollment?.length > 0 && (
                <div className="analyst-chart-card">
                  <h3>Top 5 Courses by Enrollment</h3>
                  <div className="chart-wrap">
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart
                        data={insights.top_courses_by_enrollment.map((c) => ({ ...c, name: c.title.length > 25 ? c.title.slice(0, 25) + '…' : c.title }))}
                        layout="vertical"
                        margin={{ top: 12, right: 12, bottom: 12, left: 80 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={75} />
                        <Tooltip formatter={(val, name, props) => [val, props.payload?.title || 'Enrollments']} />
                        <Bar dataKey="enrollments" name="Enrollments" fill="#10b981" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {insights?.grade_distribution_platform?.length > 0 && (
                <div className="analyst-chart-card">
                  <h3>Platform: Students vs Grade (Completed)</h3>
                  <div className="chart-wrap">
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={insights.grade_distribution_platform} margin={{ top: 12, right: 12, bottom: 12, left: 12 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="grade" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" name="No. of Students" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {(!insights?.enrollments_by_level?.length && !insights?.users_by_role?.length && !insights?.top_courses_by_enrollment?.length) && (
                <p className="analyst-no-data">No insight data yet.</p>
              )}
            </div>
          )}

          {activeTab === 'course-analytics' && (
            <div>
              <h2>Course Analytics</h2>
              <p className="analyst-subtitle">Select a course to view grade distribution and choose whether to share insights with enrolled students.</p>
              <div className="analyst-course-select-wrap">
                <label htmlFor="analyst-course-select">Course:</label>
                <select
                  id="analyst-course-select"
                  className="input analyst-course-select"
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                >
                  {courses.map((c) => (
                    <option key={c.course_id} value={c.course_id}>{c.title}</option>
                  ))}
                </select>
              </div>
              {loadingCourseAnalytics && <p className="analyst-loading-msg">Loading analytics…</p>}
              {!loadingCourseAnalytics && courseAnalytics && (
                <div className="analyst-course-analytics">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    <div>
                      <span style={{ fontSize: '13px', color: '#64748b' }}>Student visibility:</span>
                      <strong style={{ marginLeft: 6, fontSize: '13px', color: publishToStudents ? '#10b981' : '#f97316' }}>
                        {publishToStudents ? 'Published to enrolled students' : 'Hidden from students'}
                      </strong>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-compact"
                      onClick={async () => {
                        const next = !publishToStudents;
                        try {
                          const res = await analystAPI.updateCourseInsightsSetting(selectedCourseId, next);
                          if (res.success) {
                            setPublishToStudents(!!res.published);
                          }
                        } catch (e) {
                          console.error('Error updating insights visibility', e);
                        }
                      }}
                    >
                      {publishToStudents ? 'Unpublish from students' : 'Publish to students'}
                    </button>
                  </div>
                  <div className="analyst-course-stats">
                    <div className="stat-card small">
                      <h3>Enrolled</h3>
                      <div className="value">{courseAnalytics.enrolled}</div>
                    </div>
                    <div className="stat-card small">
                      <h3>Completed</h3>
                      <div className="value">{courseAnalytics.completed}</div>
                    </div>
                    <div className="stat-card small">
                      <h3>Completion Rate</h3>
                      <div className="value">{courseAnalytics.completion_rate}%</div>
                    </div>
                  </div>
                  <div className="analyst-chart-card">
                    <h3>Students vs Grade (this course)</h3>
                    {courseAnalytics.grade_distribution?.length > 0 ? (
                      <div className="chart-wrap">
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={courseAnalytics.grade_distribution} margin={{ top: 12, right: 12, bottom: 12, left: 12 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="grade" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="count" name="Students" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="analyst-no-data">No grade data for this course yet.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AnalystDashboard;
