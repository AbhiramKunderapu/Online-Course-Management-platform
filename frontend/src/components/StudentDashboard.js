import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardAPI, coursesAPI, studentAPI, studentCourseAPI } from '../services/api';
import Toast from './Toast';
import './Dashboard.css';

function StudentDashboard({ user, onLogout }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [allEnrolledCourses, setAllEnrolledCourses] = useState([]);
  const [activeCourses, setActiveCourses] = useState([]);
  const [completedCourses, setCompletedCourses] = useState([]);
  const [profile, setProfile] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedActiveCourse, setSelectedActiveCourse] = useState(null);
  const [courseModules, setCourseModules] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submittingFor, setSubmittingFor] = useState(null);
  const [submitUrl, setSubmitUrl] = useState('');
  const [announcements, setAnnouncements] = useState([]);
  const [courseAnalytics, setCourseAnalytics] = useState(null);
  const [browseSearch, setBrowseSearch] = useState('');
  const [browseLevelFilter, setBrowseLevelFilter] = useState('all');
  const [toast, setToast] = useState(null);
  const [showInsights, setShowInsights] = useState(false);
  const [moduleSearch, setModuleSearch] = useState('');
  const [selectedModule, setSelectedModule] = useState('');

  const showToast = (type, message, title) => {
    setToast({ type, message, title });
  };

  useEffect(() => {
    loadDashboardData();
    loadCourses();
    loadAllEnrolledCourses();
    loadActiveCourses();
    loadCompletedCourses();
    loadProfile();
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

  const loadCourses = async () => {
    try {
      const response = await coursesAPI.getAll();
      if (response.success) {
        setCourses(response.courses);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const loadAllEnrolledCourses = async () => {
    try {
      const response = await coursesAPI.getMyCourses(user.user_id);
      if (response.success) {
        setAllEnrolledCourses(response.courses);
      }
    } catch (error) {
      console.error('Error loading enrolled courses:', error);
    }
  };

  const loadActiveCourses = async () => {
    try {
      const response = await coursesAPI.getMyCourses(user.user_id, 'ongoing');
      if (response.success) {
        setActiveCourses(response.courses);
      }
    } catch (error) {
      console.error('Error loading active courses:', error);
    }
  };

  const loadCompletedCourses = async () => {
    try {
      const response = await coursesAPI.getMyCourses(user.user_id, 'completed');
      if (response.success) {
        setCompletedCourses(response.courses);
      }
    } catch (error) {
      console.error('Error loading completed courses:', error);
    }
  };

  const loadProfile = async () => {
    try {
      const response = await studentAPI.getProfile(user.user_id);
      if (response.success) {
        setProfile(response.profile);
        setEditForm({
          name: response.profile.name || '',
          branch: response.profile.branch || '',
          country: response.profile.country || '',
          dob: response.profile.dob || '',
          phone_number: response.profile.phone_number || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleEnroll = async (courseId) => {
    try {
      const response = await coursesAPI.enroll(user.user_id, courseId);
      if (response.success) {
        showToast('success', 'Enrolled successfully!');
        loadAllEnrolledCourses();
        loadActiveCourses();
        loadDashboardData();
      }
    } catch (error) {
      showToast('error', error.response?.data?.error || 'Failed to enroll');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      // Only send phone_number for update
      const response = await studentAPI.updateProfile(user.user_id, {
        name: editForm.name,
        branch: editForm.branch,
        country: editForm.country,
        dob: editForm.dob,
        phone_number: editForm.phone_number
      });
      if (response.success) {
        showToast('success', 'Profile updated successfully!');
        setIsEditingProfile(false);
        loadProfile();
      }
    } catch (error) {
      showToast('error', error.response?.data?.error || 'Failed to update profile');
    }
  };

  const handleEditChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value,
    });
  };

  const loadCourseContent = async (courseId) => {
    try {
      const response = await studentCourseAPI.getCourseModules(user.user_id, courseId);
      if (response.success) {
        setCourseModules(response.modules);
      }
    } catch (error) {
      console.error('Error loading course content:', error);
      showToast('error', error.response?.data?.error || 'Failed to load course content');
    }
  };

  const loadAssignments = async (courseId) => {
    try {
      const response = await studentCourseAPI.getCourseAssignments(user.user_id, courseId);
      if (response.success) setAssignments(response.assignments);
    } catch (error) {
      console.error('Error loading assignments:', error);
      showToast('error', error.response?.data?.error || 'Failed to load assignments');
    }
  };

  const loadAnnouncements = async (courseId) => {
    try {
      const response = await studentCourseAPI.getAnnouncements(user.user_id, courseId);
      if (response.success) setAnnouncements(response.announcements);
    } catch (error) {
      console.error('Error loading announcements:', error);
      setAnnouncements([]);
    }
  };

  const loadCourseAnalytics = async (courseId) => {
    try {
      const response = await studentCourseAPI.getCourseAnalytics(user.user_id, courseId);
      if (response.success && response.published && response.data) {
        setCourseAnalytics(response.data);
      } else {
        setCourseAnalytics(null);
      }
    } catch (error) {
      console.error('Error loading course analytics:', error);
      setCourseAnalytics(null);
    }
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    if (!submittingFor || !submitUrl.trim()) return;
    try {
      const response = await studentCourseAPI.submitAssignment(user.user_id, submittingFor, submitUrl.trim());
      if (response.success) {
        showToast('success', 'Submission successful!');
        setSubmittingFor(null);
        setSubmitUrl('');
        if (selectedActiveCourse) loadAssignments(selectedActiveCourse);
      }
    } catch (error) {
      showToast('error', error.response?.data?.error || 'Failed to submit');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div className="sidebar">
        <h2>🎓 CourseHub</h2>
        <a href="#dashboard" onClick={() => setActiveTab('dashboard')}>Dashboard</a>
        <a href="#profile" onClick={() => setActiveTab('profile')}>Personal Info</a>
        <a href="#enrolled" onClick={() => setActiveTab('enrolled')}>All Enrolled Courses</a>
        <a href="#active" onClick={() => { setActiveTab('active'); setSelectedActiveCourse(null); }}>Active Courses</a>
        <a href="#completed" onClick={() => setActiveTab('completed')}>Completed Courses</a>
        <a href="#browse" onClick={() => setActiveTab('browse')}>Browse Courses</a>
        <a href="#logout" onClick={onLogout}>Logout</a>
      </div>

      <div className="main-content">
        <div className="dashboard-header">
          <h1>Welcome, {user.name}!</h1>
        </div>

        <div className="dashboard-content">
          {activeTab === 'dashboard' && (
            <div>
              <h2>Student Dashboard</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Courses Enrolled</h3>
                  <div className="value">{dashboardData?.enrolled_count || 0}</div>
                </div>
                <div className="stat-card">
                  <h3>Courses Completed</h3>
                  <div className="value">{dashboardData?.completed_count || 0}</div>
                </div>
                <div className="stat-card">
                  <h3>Active Courses</h3>
                  <div className="value">{activeCourses.length}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div>
              <h2>Personal Information</h2>
              {profile && (
                <div className="card">
                  {!isEditingProfile ? (
                    <div>
                      <div className="profile-view">
                        <div className="profile-field">
                          <label>Name:</label>
                          <span>{profile.name}</span>
                        </div>
                        <div className="profile-field">
                          <label>Email:</label>
                          <span>{profile.email}</span>
                        </div>
                        <div className="profile-field">
                          <label>Branch:</label>
                          <span>{profile.branch || 'Not set'}</span>
                        </div>
                        <div className="profile-field">
                          <label>Country:</label>
                          <span>{profile.country || 'Not set'}</span>
                        </div>
                        <div className="profile-field">
                          <label>Date of Birth:</label>
                          <span>{profile.dob || 'Not set'}</span>
                        </div>
                        <div className="profile-field">
                          <label>Phone Number:</label>
                          <span>{profile.phone_number || 'Not set'}</span>
                        </div>
                      </div>
                      <button
                        className="btn btn-primary"
                        onClick={() => setIsEditingProfile(true)}
                        style={{ marginTop: '20px' }}
                      >
                        Edit Personal Info
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleUpdateProfile}>
                      <div className="form-group">
                        <label>Name</label>
                        <input type="text" name="name" className="input" value={editForm.name || ''} onChange={handleEditChange} placeholder="Your name" required />
                      </div>
                      <div className="form-group">
                        <label>Email (Cannot be changed)</label>
                        <input type="email" className="input" value={profile.email} disabled />
                      </div>
                      <div className="form-group">
                        <label>Branch</label>
                        <input type="text" name="branch" className="input" value={editForm.branch || ''} onChange={handleEditChange} placeholder="e.g., Computer Science" />
                      </div>
                      <div className="form-group">
                        <label>Country</label>
                        <input type="text" name="country" className="input" value={editForm.country || ''} onChange={handleEditChange} placeholder="e.g., India" />
                      </div>
                      <div className="form-group">
                        <label>Date of Birth</label>
                        <input type="date" name="dob" className="input" value={editForm.dob || ''} onChange={handleEditChange} />
                      </div>
                      <div className="form-group">
                        <label>Phone Number</label>
                        <input type="tel" name="phone_number" className="input" value={editForm.phone_number} onChange={handleEditChange} placeholder="e.g., +1234567890" />
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="submit" className="btn btn-primary">
                          Save Changes
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            setIsEditingProfile(false);
                            loadProfile(); // Reset form
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'enrolled' && (
            <div>
              <h2>All Enrolled Courses</h2>
              {allEnrolledCourses.length === 0 ? (
                <p>You haven't enrolled in any courses yet.</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>University</th>
                      <th>Instructor</th>
                      <th>Duration</th>
                      <th>Level</th>
                      <th>Status</th>
                      <th>Enrolled Date</th>
                      {allEnrolledCourses.some(c => c.grade) && <th>Grade</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {allEnrolledCourses.map((course) => (
                      <tr key={course.course_id}>
                        <td>{course.title}</td>
                        <td>{course.university_name ? `${course.university_name}${course.university_ranking != null ? ` (Rank #${course.university_ranking})` : ''}` : '—'}</td>
                        <td>{course.instructor_names || '—'}</td>
                        <td>{course.duration}</td>
                        <td>{course.level}</td>
                        <td>
                          <span className={`status-badge status-${course.status}`}>
                            {course.status}
                          </span>
                        </td>
                        <td>{course.enroll_date}</td>
                        {allEnrolledCourses.some(c => c.grade) && (
                          <td>{course.grade || '-'}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'active' && (
            <div>
              <h2>Active Courses</h2>
              {activeCourses.length === 0 ? (
                <p>You don't have any active courses.</p>
              ) : !selectedActiveCourse ? (
                <div className="courses-grid">
                  {activeCourses.map((course) => (
                    <div key={course.course_id} className="course-card course-card-clickable" onClick={() => { setSelectedActiveCourse(course.course_id); loadCourseContent(course.course_id); loadAssignments(course.course_id); loadAnnouncements(course.course_id); loadCourseAnalytics(course.course_id); }}>
                      <h3>{course.title}</h3>
                      {course.university_name && (
                        <p className="course-meta">Offered by: {course.university_name}{course.university_ranking != null ? ` (Rank #${course.university_ranking})` : ''}</p>
                      )}
                      {course.instructor_names && <p className="course-meta">Taught by: {course.instructor_names}</p>}
                      <p className="course-level">{course.level}</p>
                      <p className="course-duration">Duration: {course.duration}</p>
                      <p className="course-action-hint">Click to view content, assignments & marks</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="student-course-view">
                  <div className="student-course-header">
                    <div className="student-course-header-info">
                      <h3>{activeCourses.find(c => c.course_id === selectedActiveCourse)?.title}</h3>
                      {(() => {
                        const c = activeCourses.find(c => c.course_id === selectedActiveCourse);
                        return (c?.university_name || c?.instructor_names) ? (
                          <p className="student-course-meta">
                            {c?.university_name && <>Offered by: {c.university_name}{c?.university_ranking != null ? ` (Rank #${c.university_ranking})` : ''}</>}
                            {c?.university_name && c?.instructor_names && ' · '}
                            {c?.instructor_names && <>Taught by: {c.instructor_names}</>}
                          </p>
                        ) : null;
                      })()}
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      {courseAnalytics && (
                        <button
                          className="btn btn-secondary btn-compact"
                          type="button"
                          onClick={() => setShowInsights((v) => !v)}
                        >
                          {showInsights ? 'Hide insights' : 'View insights'}
                        </button>
                      )}
                      <button className="btn btn-secondary btn-compact" onClick={() => { setSelectedActiveCourse(null); setCourseModules([]); setAssignments([]); setSubmittingFor(null); setSubmitUrl(''); setAnnouncements([]); setCourseAnalytics(null); setShowInsights(true); }}>← Back to Courses</button>
                    </div>
                  </div>

                  {showInsights ? (
                    <div className="student-course-section student-course-insights">
                      <h3>Course insights</h3>
                      {courseAnalytics ? (
                        <>
                          <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 16px 0' }}>Enrollment and grade distribution for this course.</p>
                          <div className="analyst-course-stats" style={{ marginBottom: '16px' }}>
                            <div className="stat-card small">
                              <h3>Enrolled</h3>
                              <div className="value">{courseAnalytics.enrolled}</div>
                            </div>
                            <div className="stat-card small">
                              <h3>Completed</h3>
                              <div className="value">{courseAnalytics.completed}</div>
                            </div>
                            <div className="stat-card small">
                              <h3>Completion rate</h3>
                              <div className="value">{courseAnalytics.completion_rate}%</div>
                            </div>
                          </div>
                          {courseAnalytics.grade_distribution?.length > 0 ? (
                            <div className="student-insights-chart-wrap">
                              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#475569' }}>Students vs grade</h4>
                              <ResponsiveContainer width="100%" height={240}>
                                <BarChart data={courseAnalytics.grade_distribution} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                  <XAxis dataKey="grade" tick={{ fontSize: 11 }} />
                                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                  <Tooltip />
                                  <Bar dataKey="count" name="Students" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          ) : (
                            <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>No grade data for this course yet.</p>
                          )}
                        </>
                      ) : (
                        <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Insights are not available for this course yet.</p>
                      )}
                    </div>
                  ) : (
                  <>
                  <div className="student-course-section">
                    <h3>Course Content</h3>
                    {courseModules.length === 0 ? (
                      <p style={{ color: '#666', margin: 0 }}>No modules available for this course yet.</p>
                    ) : (
                      <>
                        <div className="form-row" style={{ marginBottom: '16px', alignItems: 'center' }}>
                          <div className="form-group" style={{ flex: 1, minWidth: 220 }}>
                            <label>Search module</label>
                            <input
                              type="text"
                              className="input"
                              placeholder="Search by module number or name..."
                              value={moduleSearch}
                              onChange={(e) => setModuleSearch(e.target.value)}
                            />
                          </div>
                          <div className="form-group" style={{ width: 220 }}>
                            <label>Select module</label>
                            <select
                              className="input"
                              value={selectedModule || (courseModules[0]?.module_number ?? '')}
                              onChange={(e) => setSelectedModule(e.target.value)}
                            >
                              {courseModules
                                .filter((m) => {
                                  const q = (moduleSearch || '').toLowerCase().trim();
                                  if (!q) return true;
                                  const num = String(m.module_number || '');
                                  const name = (m.name || '').toLowerCase();
                                  return num.includes(q) || name.includes(q);
                                })
                                .map((m) => (
                                  <option key={m.module_number} value={m.module_number}>
                                    {`Module ${m.module_number}: ${m.name}`}
                                  </option>
                                ))}
                            </select>
                          </div>
                        </div>
                        {(() => {
                          const activeModule =
                            courseModules.find((m) => String(m.module_number) === String(selectedModule)) ||
                            courseModules[0];
                          if (!activeModule) {
                            return <p style={{ color: '#666', margin: 0 }}>No modules match your search.</p>;
                          }
                          return (
                            <div key={activeModule.module_number} className="student-module-block">
                              <h4>Module {activeModule.module_number}: {activeModule.name}</h4>
                              {activeModule.duration && <p style={{ color: '#666', fontSize: '13px', margin: '0 0 8px 0' }}>Duration: {activeModule.duration}</p>}
                              {activeModule.content.length === 0 ? (
                                <p style={{ color: '#999', fontStyle: 'italic', margin: 0, fontSize: '14px' }}>No content in this module.</p>
                              ) : (
                                activeModule.content.map((content) => (
                                  <div key={content.content_id} className="student-content-item">
                                    <div className="student-content-left">
                                      <span className="student-content-title" title={content.title}>{content.title}</span>
                                      <span className="content-type-badge">{content.type}</span>
                                    </div>
                                    <a href={content.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-view-compact btn-compact">View</a>
                                  </div>
                                ))
                              )}
                            </div>
                          );
                        })()}
                      </>
                    )}
                  </div>

                  <div className="student-course-section student-assignments-section">
                    <h3>Assignments</h3>
                    {assignments.length === 0 ? (
                      <p className="assignment-empty-msg">No assignments for this course yet.</p>
                    ) : (
                      <>
                        <div className="student-assignment-list">
                          {assignments.map((a) => (
                            <div key={a.assignment_id} className="student-assignment-block">
                              <h4 className="student-assignment-title">{a.title}</h4>
                              {a.description && <p className="student-assignment-desc">{a.description}</p>}
                              <p className="student-assignment-meta"><strong>Max Marks:</strong> {a.max_marks}{a.due_date && <> · <strong>Due:</strong> {new Date(a.due_date).toLocaleString()}</>}</p>
                              <div className="student-assignment-actions">
                                <a href={a.assignment_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-assignment-view">View Assignment</a>
                                {submittingFor === a.assignment_id ? (
                                  <form onSubmit={handleSubmitAssignment} className="student-submit-form">
                                    <input type="url" className="input student-submit-input" value={submitUrl} onChange={(e) => setSubmitUrl(e.target.value)} placeholder="Paste your solution URL" required />
                                    <button type="submit" className="btn btn-primary btn-sm">Submit</button>
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setSubmittingFor(null); setSubmitUrl(''); }}>Cancel</button>
                                  </form>
                                ) : (
                                  a.submission_url ? (
                                    <span className="student-submission-status">
                                      Submitted: <a href={a.submission_url} target="_blank" rel="noopener noreferrer">View</a>
                                      {a.marks_obtained != null && ` · Marks: ${a.marks_obtained}/${a.max_marks}`}
                                      {a.submitted_at && ` · Submitted at: ${new Date(a.submitted_at).toLocaleString()}`}
                                      {a.feedback && ` · Feedback: ${a.feedback}`}
                                    </span>
                                  ) : (
                                    <button type="button" className="btn btn-secondary btn-assignment-submit" onClick={() => setSubmittingFor(a.assignment_id)}>Submit Solution Link</button>
                                  )
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="student-total-marks">
                          Total Marks: {(() => {
                            const totalObtained = assignments.reduce((s, a) => s + (a.marks_obtained ?? 0), 0);
                            const totalPossible = assignments.reduce((s, a) => s + (a.max_marks || 0), 0);
                            const percent = totalPossible > 0 ? Math.round(totalObtained / totalPossible * 100) : 0;
                            return `${totalObtained}/${totalPossible} (${percent}%)`;
                          })()}
                        </div>
                      </>
                    )}
                  </div>
                  </>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'completed' && (
            <div>
              <h2>Completed Courses</h2>
              {completedCourses.length === 0 ? (
                <p>You haven't completed any courses yet.</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>University</th>
                      <th>Instructor</th>
                      <th>Duration</th>
                      <th>Level</th>
                      <th>Completion Date</th>
                      <th>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedCourses.map((course) => (
                      <tr key={course.course_id}>
                        <td>{course.title}</td>
                        <td>{course.university_name ? `${course.university_name}${course.university_ranking != null ? ` (Rank #${course.university_ranking})` : ''}` : '—'}</td>
                        <td>{course.instructor_names || '—'}</td>
                        <td>{course.duration}</td>
                        <td>{course.level}</td>
                        <td>{course.completion_date || course.enroll_date}</td>
                        <td>
                          <span className="grade-badge">
                            {course.grade || 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'browse' && (
            <div>
              <h2>Browse Courses</h2>
              <p className="browse-subtitle">Explore all available courses and enroll in the ones you're interested in.</p>
              <div className="browse-filters">
                <input
                  type="text"
                  className="input browse-search-input"
                  placeholder="Search by course name, university, or instructor..."
                  value={browseSearch}
                  onChange={(e) => setBrowseSearch(e.target.value)}
                />
                <div className="browse-level-filters">
                  <span className="filter-label">Level:</span>
                  {['all', 'beginner', 'intermediate', 'advanced'].map((level) => (
                    <button
                      key={level}
                      type="button"
                      className={`btn btn-filter ${browseLevelFilter === level ? 'active' : ''}`}
                      onClick={() => setBrowseLevelFilter(level)}
                    >
                      {level === 'all' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="courses-grid browse-courses">
                {courses.length === 0 ? (
                  <p className="empty-state">No courses available. Check back later!</p>
                ) : (() => {
                  const filtered = courses.filter((course) => {
                    const levelOk = browseLevelFilter === 'all' || (course.level || '').toLowerCase() === browseLevelFilter;
                    const q = (browseSearch || '').toLowerCase().trim();
                    const searchOk = !q || [
                      course.title,
                      course.university_name,
                      course.instructor_names,
                      course.description
                    ].some((s) => (s || '').toLowerCase().includes(q));
                    return levelOk && searchOk;
                  });
                  return filtered.length === 0 ? (
                    <p className="empty-state">No courses match your search or filters. Try changing the level or search text.</p>
                  ) : (
                  filtered.map((course) => {
                    const isEnrolled = allEnrolledCourses.some(
                      (e) => e.course_id === course.course_id
                    );
                    return (
                      <div key={course.course_id} className="course-card course-card-browse">
                        <div className="course-card-header">
                          <h3>{course.title}</h3>
                          <span className="course-level">{course.level}</span>
                        </div>
                        {course.university_name && (
                          <p className="course-meta">Offered by: {course.university_name}{course.university_ranking != null ? ` (Rank #${course.university_ranking})` : ''}</p>
                        )}
                        {course.instructor_names && <p className="course-meta">Taught by: {course.instructor_names}</p>}
                        <p className="course-duration">Duration: {course.duration || '—'}</p>
                        <p className={`course-fees ${!course.fees ? 'free' : ''}`}>
                          {course.fees ? `₹${course.fees}` : 'Free'}
                        </p>
                        {course.description && (
                          <p className="course-description">{course.description}</p>
                        )}
                        {isEnrolled ? (
                          <span className="enrolled-badge">Already Enrolled</span>
                        ) : (
                          <button
                            className="btn btn-primary btn-enroll"
                            onClick={() => handleEnroll(course.course_id)}
                          >
                            Enroll Now
                          </button>
                        )}
                      </div>
                    );
                  }));
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
