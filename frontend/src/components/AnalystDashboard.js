import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';
import { analystAPI } from '../services/api';
import './Dashboard.css';

const CHART_COLORS = ['#0ea5e9', '#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#6366f1', '#14b8a6'];

const X_AXIS_OPTIONS = [
  { value: 'course_name', label: 'Course Name' },
  { value: 'student_country', label: 'Student Country' },
  { value: 'student_age_group', label: 'Student Age Group' },
  { value: 'instructor_name', label: 'Instructor Name' },
  { value: 'university_name', label: 'University Name' },
  { value: 'student_branch', label: 'Student Branch' },
];

const Y_AXIS_OPTIONS = [
  { value: 'total_enrollments', label: 'Total Enrollments' },
  { value: 'total_revenue', label: 'Total Revenue' },
  { value: 'avg_eval_score', label: 'Average Evaluation Score' },
  { value: 'course_duration', label: 'Course Duration' },
  { value: 'grade_distribution', label: 'Students vs Grade (count per grade)' },
];

const CHART_TYPE_OPTIONS = [
  { value: 'bar', label: 'Bar Chart' },
  { value: 'pie', label: 'Pie Chart' },
  { value: 'line', label: 'Line Chart' },
];

function AnalystDashboard({ user, onLogout }) {
  const [overview, setOverview] = useState(null);
  const [courses, setCourses] = useState([]);
  const [insights, setInsights] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [chartBuilderData, setChartBuilderData] = useState([]);
  const [geoData, setGeoData] = useState([]);
  const [ageData, setAgeData] = useState([]);
  const [hotTopicsData, setHotTopicsData] = useState([]);
  const [workloadData, setWorkloadData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [groupBy, setGroupBy] = useState('course_name');
  const [metric, setMetric] = useState('total_enrollments');
  const [chartType, setChartType] = useState('bar');
  const [gradeCourseId, setGradeCourseId] = useState(''); // for grade_distribution filter

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard' && (groupBy || metric)) {
      loadChartBuilderData();
    }
  }, [groupBy, metric, activeTab, gradeCourseId]);

  const loadData = async () => {
    try {
      const [
        overviewRes,
        coursesRes,
        insightsRes,
        kpisRes,
        geoRes,
        ageRes,
        hotRes,
        workloadRes,
      ] = await Promise.all([
        analystAPI.getOverview(),
        analystAPI.getCourses(),
        analystAPI.getInsights(),
        analystAPI.getKPIs(),
        analystAPI.getGeographic(),
        analystAPI.getAgeDemographics(),
        analystAPI.getHotTopics(),
        analystAPI.getInstructorWorkload(),
      ]);
      if (overviewRes.success) setOverview(overviewRes.data);
      if (coursesRes.success) setCourses(coursesRes.courses);
      if (insightsRes.success) setInsights(insightsRes.insights);
      if (kpisRes.success) setKpis(kpisRes.data);
      if (geoRes.success) setGeoData(geoRes.data || []);
      if (ageRes.success) setAgeData(ageRes.data || []);
      if (hotRes.success) setHotTopicsData(hotRes.data || []);
      if (workloadRes.success) setWorkloadData(workloadRes.data || []);
    } catch (error) {
      console.error('Error loading analyst data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChartBuilderData = async () => {
    setChartLoading(true);
    try {
      const courseId = metric === 'grade_distribution' && gradeCourseId ? gradeCourseId : null;
      const res = await analystAPI.getChartBuilderData(groupBy, metric, courseId);
      if (res.success && res.data) setChartBuilderData(res.data);
      else setChartBuilderData([]);
    } catch (error) {
      console.error('Error loading chart data:', error);
      setChartBuilderData([]);
    } finally {
      setChartLoading(false);
    }
  };

  const handleBuildChart = () => {
    loadChartBuilderData();
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  const renderCustomChart = () => {
    const data = chartBuilderData.map((d) => ({
      name: d.label.length > 18 ? d.label.slice(0, 16) + '…' : d.label,
      value: d.value,
      fullName: d.label,
    }));
    if (!data.length) return <p className="empty-chart-msg">No data for this selection. Try different options.</p>;
    const isCurrency = metric === 'total_revenue';
    const isPct = metric === 'avg_eval_score';

    if (chartType === 'pie') {
      return (
        <ResponsiveContainer width="100%" height={360}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label={({ name, value }) => `${name}: ${isCurrency ? '$' + Number(value).toLocaleString() : value}${isPct ? '%' : ''}`}>
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => (isCurrency ? '$' + Number(v).toLocaleString() : v + (isPct ? '%' : ''))} />
          </PieChart>
        </ResponsiveContainer>
      );
    }
    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={360}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-35} textAnchor="end" height={70} />
            <YAxis tickFormatter={(v) => (isCurrency ? '$' + v : v)} />
            <Tooltip formatter={(v) => (isCurrency ? '$' + Number(v).toLocaleString() : v)} labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || _} />
            <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 4 }} name={Y_AXIS_OPTIONS.find((o) => o.value === metric)?.label || 'Value'} />
          </LineChart>
        </ResponsiveContainer>
      );
    }
    return (
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" angle={-35} textAnchor="end" height={70} />
          <YAxis tickFormatter={(v) => (isCurrency ? '$' + v : v)} />
          <Tooltip formatter={(v) => (isCurrency ? '$' + Number(v).toLocaleString() : v)} labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || _} />
          <Bar dataKey="value" fill="#0ea5e9" name={Y_AXIS_OPTIONS.find((o) => o.value === metric)?.label || 'Value'} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="dashboard-container analyst-dashboard">
      <div className="sidebar">
        <h2>🎓 CourseHub</h2>
        <span className="sidebar-role">Analyst</span>
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
            <>
              <section className="kpi-section">
                <h2>Real-Time KPIs</h2>
                <div className="stats-grid kpi-grid">
                  <div className="stat-card kpi-card">
                    <h3>Total Revenue</h3>
                    <div className="value">${(kpis?.total_revenue ?? 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                  </div>
                  <div className="stat-card kpi-card">
                    <h3>Live Enrollments</h3>
                    <div className="value">{(kpis?.live_enrollment_count ?? 0).toLocaleString()}</div>
                  </div>
                  <div className="stat-card kpi-card">
                    <h3>Completion Rate</h3>
                    <div className="value">{(kpis?.completion_rate ?? 0)}%</div>
                  </div>
                  <div className="stat-card kpi-card">
                    <h3>Top University</h3>
                    <div className="value kpi-text">{kpis?.top_performing_university ?? 'N/A'}</div>
                  </div>
                </div>
              </section>

              <section className="chart-builder-section">
                <h2>Interactive Chart Builder</h2>
                <p className="section-desc">Build bar, pie, or line charts: e.g. <strong>Students vs Grade</strong>, enrollments by course, revenue by country, and more.</p>
                <div className="chart-builder-controls">
                  <div className="chart-select-group">
                    <label>Group by (X-Axis)</label>
                    <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
                      {X_AXIS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="chart-select-group">
                    <label>Metric (Y-Axis)</label>
                    <select value={metric} onChange={(e) => setMetric(e.target.value)}>
                      {Y_AXIS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  {metric === 'grade_distribution' && (
                    <div className="chart-select-group">
                      <label>Course (optional)</label>
                      <select value={gradeCourseId} onChange={(e) => setGradeCourseId(e.target.value)}>
                        <option value="">All courses</option>
                        {courses.map((c) => (
                          <option key={c.course_id} value={c.course_id}>{c.title}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="chart-select-group">
                    <label>Chart type</label>
                    <select value={chartType} onChange={(e) => setChartType(e.target.value)}>
                      {CHART_TYPE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <button type="button" className="btn btn-primary build-chart-btn" onClick={handleBuildChart} disabled={chartLoading}>
                    {chartLoading ? 'Loading…' : 'Build Chart'}
                  </button>
                </div>
                <div className="chart-builder-canvas card">
                  {chartLoading ? <p>Loading chart…</p> : renderCustomChart()}
                </div>
              </section>

              <section className="prebuilt-insights">
                <h2>Pre-Built Insights</h2>
                <div className="insights-grid">
                  <div className="card insight-card">
                    <h3>Geographic Distribution</h3>
                    <p className="insight-desc">Where students are from</p>
                    {geoData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie data={geoData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={({ name, value }) => `${name}: ${value}`}>
                            {geoData.map((_, i) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : <p className="empty-chart-msg">No geographic data yet.</p>}
                  </div>
                  <div className="card insight-card">
                    <h3>Age Demographics</h3>
                    <p className="insight-desc">Student age groups</p>
                    {ageData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={ageData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                          <XAxis dataKey="age_group" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Students" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <p className="empty-chart-msg">No age data yet.</p>}
                  </div>
                  <div className="card insight-card">
                    <h3>Hot Topics</h3>
                    <p className="insight-desc">Top 5 courses by enrollment</p>
                    {hotTopicsData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={hotTopicsData} margin={{ top: 10, right: 10, left: 0, bottom: 80 }}>
                          <XAxis dataKey="title" angle={-35} textAnchor="end" height={70} interval={0} />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="enrollments" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <p className="empty-chart-msg">No course data yet.</p>}
                  </div>
                  <div className="card insight-card">
                    <h3>Instructor Workload</h3>
                    <p className="insight-desc">Courses per instructor</p>
                    {workloadData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={workloadData} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
                          <XAxis type="number" />
                          <YAxis type="category" dataKey="name" width={75} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="course_count" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Courses" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <p className="empty-chart-msg">No instructor data yet.</p>}
                  </div>
                </div>
              </section>
            </>
          )}

          {activeTab === 'courses' && (
            <div>
              <h2>All Courses – Analytics</h2>
              <div className="table-wrap">
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
