import React, { useState, useEffect } from 'react';
import { dashboardAPI, coursesAPI, studentAPI, studentCourseAPI } from '../services/api';
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
  const [selectedCourseForContent, setSelectedCourseForContent] = useState(null);
  const [courseModules, setCourseModules] = useState([]);

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
        alert('Enrolled successfully!');
        loadAllEnrolledCourses();
        loadActiveCourses();
        loadDashboardData();
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to enroll');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      // Only send phone_number for update
      const response = await studentAPI.updateProfile(user.user_id, {
        phone_number: editForm.phone_number
      });
      if (response.success) {
        alert('Phone number updated successfully!');
        setIsEditingProfile(false);
        loadProfile();
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update profile');
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
      alert(error.response?.data?.error || 'Failed to load course content');
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
        <a href="#profile" onClick={() => setActiveTab('profile')}>Personal Info</a>
        <a href="#enrolled" onClick={() => setActiveTab('enrolled')}>All Enrolled Courses</a>
        <a href="#active" onClick={() => setActiveTab('active')}>Active Courses</a>
        <a href="#completed" onClick={() => setActiveTab('completed')}>Completed Courses</a>
        <a href="#content" onClick={() => setActiveTab('content')}>Course Content</a>
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
                        <label>Name (Cannot be changed)</label>
                        <input
                          type="text"
                          className="input"
                          value={profile.name}
                          disabled
                        />
                      </div>
                      <div className="form-group">
                        <label>Email (Cannot be changed)</label>
                        <input
                          type="email"
                          className="input"
                          value={profile.email}
                          disabled
                        />
                      </div>
                      <div className="form-group">
                        <label>Branch (Cannot be changed)</label>
                        <input
                          type="text"
                          name="branch"
                          className="input"
                          value={editForm.branch || ''}
                          disabled
                          placeholder="e.g., Computer Science"
                        />
                      </div>
                      <div className="form-group">
                        <label>Country (Cannot be changed)</label>
                        <input
                          type="text"
                          name="country"
                          className="input"
                          value={editForm.country || ''}
                          disabled
                          placeholder="e.g., India"
                        />
                      </div>
                      <div className="form-group">
                        <label>Date of Birth (Cannot be changed)</label>
                        <input
                          type="date"
                          name="dob"
                          className="input"
                          value={editForm.dob || ''}
                          disabled
                        />
                      </div>
                      <div className="form-group">
                        <label>Phone Number</label>
                        <input
                          type="tel"
                          name="phone_number"
                          className="input"
                          value={editForm.phone_number}
                          onChange={handleEditChange}
                          placeholder="e.g., +1234567890"
                          required
                        />
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
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Duration</th>
                      <th>Level</th>
                      <th>Enrolled Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeCourses.map((course) => (
                      <tr key={course.course_id}>
                        <td>{course.title}</td>
                        <td>{course.duration}</td>
                        <td>{course.level}</td>
                        <td>{course.enroll_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

          {activeTab === 'content' && (
            <div>
              <h2>Course Content</h2>
              
              {!selectedCourseForContent && (
                <div className="card">
                  <p>Select a course to view its modules and content:</p>
                  <select
                    className="input"
                    value={selectedCourseForContent || ''}
                    onChange={(e) => {
                      setSelectedCourseForContent(e.target.value);
                      if (e.target.value) {
                        loadCourseContent(e.target.value);
                      }
                    }}
                    style={{ marginTop: '10px' }}
                  >
                    <option value="">Select a course</option>
                    {allEnrolledCourses.map((course) => (
                      <option key={course.course_id} value={course.course_id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedCourseForContent && (
                <>
                  <div className="card" style={{ marginBottom: '20px' }}>
                    <h3>
                      {allEnrolledCourses.find(c => c.course_id === selectedCourseForContent)?.title}
                    </h3>
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setSelectedCourseForContent(null);
                        setCourseModules([]);
                      }}
                      style={{ marginTop: '10px', width: 'auto' }}
                    >
                      Change Course
                    </button>
                  </div>

                  {courseModules.length === 0 ? (
                    <div className="card">
                      <p>No modules available for this course yet.</p>
                    </div>
                  ) : (
                    <div>
                      {courseModules.map((module) => (
                        <div key={module.module_number} className="card" style={{ marginBottom: '20px' }}>
                          <h3>
                            Module {module.module_number}: {module.name}
                          </h3>
                          {module.duration && (
                            <p style={{ color: '#666', marginBottom: '15px' }}>
                              Duration: {module.duration}
                            </p>
                          )}
                          
                          {module.content.length === 0 ? (
                            <p style={{ color: '#999', fontStyle: 'italic' }}>
                              No content available in this module yet.
                            </p>
                          ) : (
                            <div>
                              <h4 style={{ marginBottom: '10px', fontSize: '16px' }}>Content:</h4>
                              <div className="content-list">
                                {module.content.map((content) => (
                                  <div key={content.content_id} className="content-item">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <div>
                                        <strong>{content.title}</strong>
                                        <span className="content-type-badge">{content.type}</span>
                                      </div>
                                      <a
                                        href={content.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-primary"
                                        style={{ padding: '6px 12px', width: 'auto', textDecoration: 'none' }}
                                      >
                                        View
                                      </a>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'browse' && (
            <div>
              <h2>Browse Courses</h2>
              <div className="courses-grid">
                {courses.map((course) => (
                  <div key={course.course_id} className="course-card">
                    <h3>{course.title}</h3>
                    <p className="course-level">{course.level}</p>
                    <p className="course-duration">Duration: {course.duration}</p>
                    {course.fees && <p className="course-fees">${course.fees}</p>}
                    {course.description && <p className="course-description">{course.description}</p>}
                    <button
                      className="btn btn-primary"
                      onClick={() => handleEnroll(course.course_id)}
                    >
                      Enroll Now
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
