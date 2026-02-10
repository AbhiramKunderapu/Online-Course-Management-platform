import React, { useState, useEffect } from 'react';
import { dashboardAPI, adminAPI } from '../services/api';
import Toast from './Toast';
import './Dashboard.css';

function AdminDashboard({ user, onLogout }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [assignForm, setAssignForm] = useState({ instructor_id: '', course_id: '' });
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [addCourseForm, setAddCourseForm] = useState({
    title: '',
    duration: '',
    level: 'beginner',
    description: '',
    fees: '',
    university_name: '',
    university_ranking: ''
  });
  const [addCourseLoading, setAddCourseLoading] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [editCourseForm, setEditCourseForm] = useState({
    title: '',
    duration: '',
    level: 'beginner',
    description: '',
    fees: '',
    university_name: '',
    university_ranking: ''
  });
  const [editCourseLoading, setEditCourseLoading] = useState(false);
  const [courseInstructors, setCourseInstructors] = useState([]);
  const [deleteCourseLoading, setDeleteCourseLoading] = useState(false);
  const [instructorSearch, setInstructorSearch] = useState('');
  const [courseSearch, setCourseSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [pendingSearch, setPendingSearch] = useState('');
  const [usersSearch, setUsersSearch] = useState('');
  const [coursesSearch, setCoursesSearch] = useState('');
  const [theme, setTheme] = useState('light');

  const showToast = (type, message, title) => setToast({ type, message, title });

  useEffect(() => {
    loadDashboardData();
    loadUsers();
    loadCourses();
    loadInstructors();
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

  const loadUsers = async () => {
    try {
      const response = await adminAPI.getUsers();
      if (response.success) {
        setUsers(response.users);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadCourses = async () => {
    try {
      const response = await adminAPI.getCourses();
      if (response.success) {
        setCourses(response.courses);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const loadInstructors = async () => {
    try {
      const response = await adminAPI.getInstructors();
      if (response.success) {
        setInstructors(response.instructors);
      }
    } catch (error) {
      console.error('Error loading instructors:', error);
    }
  };

  const handleApproveUser = async (userId) => {
    try {
      const response = await adminAPI.approveUser(userId);
      if (response.success) {
        showToast('success', 'User approved successfully');
        loadUsers();
      }
    } catch (error) {
      showToast('error', error.response?.data?.error || 'Failed to approve user');
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const response = await adminAPI.deleteUser(userId);
      if (response.success) {
        showToast('success', 'User deleted successfully');
        loadUsers();
        loadDashboardData();
      }
    } catch (error) {
      showToast('error', error.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleAssignInstructor = async (e) => {
    e.preventDefault();
    try {
      const response = await adminAPI.assignInstructor(
        assignForm.instructor_id,
        assignForm.course_id
      );
      if (response.success) {
        showToast('success', 'Instructor assigned successfully');
        setAssignForm({ instructor_id: '', course_id: '' });
      }
    } catch (error) {
      showToast('error', error.response?.data?.error || 'Failed to assign instructor');
    }
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();
    if (!addCourseForm.university_name || !addCourseForm.university_name.trim()) {
      showToast('error', 'University name is required');
      return;
    }
    setAddCourseLoading(true);
    try {
      const response = await adminAPI.createCourse(user.user_id, {
        title: addCourseForm.title,
        duration: addCourseForm.duration,
        level: addCourseForm.level,
        description: addCourseForm.description,
        fees: addCourseForm.fees ? parseFloat(addCourseForm.fees) : null,
        university_name: addCourseForm.university_name.trim(),
        university_ranking: addCourseForm.university_ranking ? parseInt(addCourseForm.university_ranking, 10) : null
      });
      if (response.success) {
        showToast('success', 'Course created successfully!');
        setShowAddCourse(false);
        setAddCourseForm({ title: '', duration: '', level: 'beginner', description: '', fees: '', university_name: '', university_ranking: '' });
        loadCourses();
        loadDashboardData();
      }
    } catch (error) {
      showToast('error', error.response?.data?.error || 'Failed to create course');
    } finally {
      setAddCourseLoading(false);
    }
  };

  const openEditCourse = async (course) => {
    setEditingCourse(course);
    setEditCourseForm({
      title: course.title || '',
      duration: course.duration || '',
      level: course.level || 'beginner',
      description: course.description || '',
      fees: course.fees != null ? String(course.fees) : '',
      university_name: course.university_name || '',
      university_ranking: course.university_ranking != null ? String(course.university_ranking) : ''
    });
    try {
      const res = await adminAPI.getCourseInstructors(user.user_id, course.course_id);
      if (res.success) setCourseInstructors(res.instructors || []);
      else setCourseInstructors([]);
    } catch {
      setCourseInstructors([]);
    }
  };

  const closeEditCourse = () => {
    setEditingCourse(null);
    setCourseInstructors([]);
    setEditCourseForm({ title: '', duration: '', level: 'beginner', description: '', fees: '', university_name: '', university_ranking: '' });
  };

  const handleDeleteCourse = async () => {
    if (!editingCourse) return;
    if (!window.confirm(`Delete course "${editingCourse.title}"? This will remove all enrollments and course content.`)) return;
    setDeleteCourseLoading(true);
    try {
      const response = await adminAPI.deleteCourse(user.user_id, editingCourse.course_id);
      if (response.success) {
        showToast('success', 'Course deleted');
        closeEditCourse();
        loadCourses();
        loadDashboardData();
      }
    } catch (error) {
      showToast('error', error.response?.data?.error || 'Failed to delete course');
    } finally {
      setDeleteCourseLoading(false);
    }
  };

  const handleRemoveInstructor = async (instructorId) => {
    if (!editingCourse) return;
    if (!window.confirm('Remove this instructor from the course?')) return;
    try {
      const response = await adminAPI.removeCourseInstructor(user.user_id, editingCourse.course_id, instructorId);
      if (response.success) {
        const res = await adminAPI.getCourseInstructors(user.user_id, editingCourse.course_id);
        if (res.success) setCourseInstructors(res.instructors || []);
        loadCourses();
      }
    } catch (error) {
      showToast('error', error.response?.data?.error || 'Failed to remove instructor');
    }
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    if (!editingCourse) return;
    setEditCourseLoading(true);
    try {
      const response = await adminAPI.updateCourse(user.user_id, editingCourse.course_id, {
        title: editCourseForm.title,
        duration: editCourseForm.duration,
        level: editCourseForm.level,
        description: editCourseForm.description,
        fees: editCourseForm.fees ? parseFloat(editCourseForm.fees) : null,
        university_name: editCourseForm.university_name != null ? editCourseForm.university_name.trim() : undefined,
        university_ranking: editCourseForm.university_ranking ? parseInt(editCourseForm.university_ranking, 10) : null
      });
      if (response.success) {
        showToast('success', 'Course updated successfully!');
        closeEditCourse();
        loadCourses();
        loadDashboardData();
      }
    } catch (error) {
      showToast('error', error.response?.data?.error || 'Failed to update course');
    } finally {
      setEditCourseLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'light' === prev ? 'dark' : 'dark'));
  };

  return (
    <div className={`dashboard-container ${theme === 'dark' ? 'dark' : 'light'}`}>
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div className="sidebar">
        <h2>🎓 CourseHub</h2>
        <a href="#dashboard" onClick={() => setActiveTab('dashboard')}>Dashboard</a>
        <a href="#users" onClick={() => setActiveTab('users')}>Manage Users</a>
        <a href="#pending" onClick={() => setActiveTab('pending')}>Pending Approval</a>
        <a href="#courses" onClick={() => setActiveTab('courses')}>Manage Courses</a>
        <a href="#assign" onClick={() => setActiveTab('assign')}>Assign Instructors</a>
        <a href="#logout" onClick={onLogout}>Logout</a>
      </div>

      <div className="main-content">
        <div className="dashboard-header">
          <h1>Admin Panel - {user.name}</h1>
          <button
            type="button"
            className="btn btn-secondary btn-theme-toggle"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? '🌞 Light' : '🌙 Dark'}
          </button>
        </div>

        <div className="dashboard-content">
          {activeTab === 'dashboard' && (
            <div>
              <h2>Admin Dashboard</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Total Users</h3>
                  <div className="value">{dashboardData?.total_users || 0}</div>
                </div>
                <div className="stat-card">
                  <h3>Total Courses</h3>
                  <div className="value">{dashboardData?.total_courses || 0}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pending' && (
            <div>
              <h2>Pending Approval</h2>
              <div className="section-header" style={{ marginBottom: '12px' }}>
                <input
                  type="text"
                  className="input"
                  style={{ maxWidth: 420 }}
                  placeholder="Search pending users (name/email/role)..."
                  value={pendingSearch}
                  onChange={(e) => setPendingSearch(e.target.value)}
                />
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-compact"
                    onClick={async () => {
                      const pending = users.filter(u => !u.approved);
                      for (const u of pending) {
                        // eslint-disable-next-line no-await-in-loop
                        await handleApproveUser(u.user_id);
                      }
                      showToast('success', 'Approved all pending users');
                    }}
                    disabled={users.filter(u => !u.approved).length === 0}
                  >
                    Approve all
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-compact"
                    onClick={async () => {
                      const pending = users.filter(u => !u.approved);
                      for (const u of pending) {
                        // eslint-disable-next-line no-await-in-loop
                        await handleDeleteUser(u.user_id);
                      }
                      showToast('success', 'Rejected all pending users');
                    }}
                    disabled={users.filter(u => !u.approved).length === 0}
                  >
                    Reject all
                  </button>
                </div>
              </div>

              {users.filter(u => !u.approved).filter((u) => {
                const q = (pendingSearch || '').toLowerCase().trim();
                if (!q) return true;
                return [u.name, u.email, u.role].some((s) => (s || '').toLowerCase().includes(q));
              }).length === 0 ? (
                <p>No users pending approval.</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.filter(u => !u.approved).filter((u) => {
                      const q = (pendingSearch || '').toLowerCase().trim();
                      if (!q) return true;
                      return [u.name, u.email, u.role].some((s) => (s || '').toLowerCase().includes(q));
                    }).map((u) => (
                      <tr key={u.user_id}>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td>{u.role}</td>
                        <td>
                          <button className="btn btn-primary btn-compact" onClick={() => handleApproveUser(u.user_id)} style={{ marginRight: '8px' }}>Approve</button>
                          {u.role === 'student' && (
                            <button className="btn btn-danger btn-compact" onClick={() => handleDeleteUser(u.user_id)} style={{ width: 'auto' }}>Delete</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <h2>Manage Users</h2>
              <div style={{ margin: '8px 0 14px 0' }}>
                <input
                  type="text"
                  className="input"
                  style={{ maxWidth: 420 }}
                  placeholder="Search users (name/email/role)..."
                  value={usersSearch}
                  onChange={(e) => setUsersSearch(e.target.value)}
                />
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.filter((u) => {
                    const q = (usersSearch || '').toLowerCase().trim();
                    if (!q) return true;
                    return [u.name, u.email, u.role].some((s) => (s || '').toLowerCase().includes(q));
                  }).map((u) => (
                    <tr key={u.user_id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.role}</td>
                      <td>
                        <span className={`status-badge status-${u.approved ? 'completed' : 'ongoing'}`}>
                          {u.approved ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                      <td>
                        {!u.approved && (
                          <button className="btn btn-primary btn-compact" onClick={() => handleApproveUser(u.user_id)} style={{ marginRight: '8px' }}>Approve</button>
                        )}
                        {u.role === 'student' && (
                          <button className="btn btn-danger btn-compact" onClick={() => handleDeleteUser(u.user_id)} style={{ width: 'auto' }}>Delete</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'courses' && (
            <div>
              <div className="section-header">
                <h2>Manage Courses</h2>
                <button
                  className="btn btn-primary btn-add"
                  onClick={() => setShowAddCourse(!showAddCourse)}
                >
                  {showAddCourse ? '− Cancel' : '+ Add Course'}
                </button>
              </div>
              <div style={{ margin: '8px 0 14px 0' }}>
                <input
                  type="text"
                  className="input"
                  style={{ maxWidth: 520 }}
                  placeholder="Search courses (title/university)..."
                  value={coursesSearch}
                  onChange={(e) => setCoursesSearch(e.target.value)}
                />
              </div>
              {showAddCourse && (
                <form onSubmit={handleAddCourse} className="card add-course-form">
                  <h3>Add New Course</h3>
                  <div className="form-group">
                    <label>Course Title *</label>
                    <input
                      type="text"
                      className="input"
                      value={addCourseForm.title}
                      onChange={(e) => setAddCourseForm({ ...addCourseForm, title: e.target.value })}
                      placeholder="e.g., Introduction to Python"
                      required
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Duration</label>
                      <input
                        type="text"
                        className="input"
                        value={addCourseForm.duration}
                        onChange={(e) => setAddCourseForm({ ...addCourseForm, duration: e.target.value })}
                        placeholder="e.g., 8 weeks"
                      />
                    </div>
                    <div className="form-group">
                      <label>Level</label>
                      <select
                        className="input"
                        value={addCourseForm.level}
                        onChange={(e) => setAddCourseForm({ ...addCourseForm, level: e.target.value })}
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Fees (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="input"
                        value={addCourseForm.fees}
                        onChange={(e) => setAddCourseForm({ ...addCourseForm, fees: e.target.value })}
                        placeholder="0 for free"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>University Name *</label>
                      <input
                        type="text"
                        className="input"
                        value={addCourseForm.university_name}
                        onChange={(e) => setAddCourseForm({ ...addCourseForm, university_name: e.target.value })}
                        placeholder="e.g., MIT"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>University Ranking</label>
                      <input
                        type="number"
                        min="1"
                        className="input"
                        value={addCourseForm.university_ranking}
                        onChange={(e) => setAddCourseForm({ ...addCourseForm, university_ranking: e.target.value })}
                        placeholder="e.g., 1"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      className="input"
                      rows="3"
                      value={addCourseForm.description}
                      onChange={(e) => setAddCourseForm({ ...addCourseForm, description: e.target.value })}
                      placeholder="Brief course description..."
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={addCourseLoading}>
                    {addCourseLoading ? 'Creating...' : 'Create Course'}
                  </button>
                </form>
              )}
              <h3 className="courses-list-title">All Courses — hover a course and click Edit to modify</h3>
              <div className="courses-grid courses-grid-admin">
                {courses.length === 0 ? (
                  <p className="empty-state">No courses yet. Add your first course above!</p>
                ) : (
                  courses.filter((course) => {
                    const q = (coursesSearch || '').toLowerCase().trim();
                    if (!q) return true;
                    return [course.title, course.university_name, course.instructor_names].some((s) => (s || '').toLowerCase().includes(q));
                  }).map((course) => (
                    <div key={course.course_id} className="course-card course-card-hover-edit">
                      <h4>{course.title}</h4>
                      {course.university_name && (
                        <p className="course-meta">
                          Offered by: {course.university_name}
                          {course.university_ranking != null && ` (Rank #${course.university_ranking})`}
                        </p>
                      )}
                      {course.instructor_names && <p className="course-meta">Taught by: {course.instructor_names}</p>}
                      <p className="course-level">{course.level}</p>
                      <p className="course-duration">Duration: {course.duration || '—'}</p>
                      {course.fees != null && <p className="course-fees">₹{course.fees}</p>}
                      <div className="course-card-edit-overlay">
                        <button type="button" className="btn btn-primary btn-edit-on-card" onClick={(e) => { e.stopPropagation(); openEditCourse(course); }}>
                          Edit
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {editingCourse && (
                <div className="modal-overlay" onClick={closeEditCourse}>
                  <div className="modal-panel edit-course-modal" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleUpdateCourse} className="card add-course-form edit-course-form">
                  <div className="edit-course-header">
                    <h3>Edit Course</h3>
                    <button type="button" className="btn btn-secondary btn-close-edit" onClick={closeEditCourse}>
                      Cancel
                    </button>
                  </div>
                  <div className="form-group">
                    <label>Course Title *</label>
                    <input
                      type="text"
                      className="input"
                      value={editCourseForm.title}
                      onChange={(e) => setEditCourseForm({ ...editCourseForm, title: e.target.value })}
                      placeholder="e.g., Introduction to Python"
                      required
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Duration</label>
                      <input
                        type="text"
                        className="input"
                        value={editCourseForm.duration}
                        onChange={(e) => setEditCourseForm({ ...editCourseForm, duration: e.target.value })}
                        placeholder="e.g., 8 weeks"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="form-group">
                      <label>Level</label>
                      <select
                        className="input"
                        value={editCourseForm.level}
                        onChange={(e) => setEditCourseForm({ ...editCourseForm, level: e.target.value })}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Fees (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="input"
                        value={editCourseForm.fees}
                        onChange={(e) => setEditCourseForm({ ...editCourseForm, fees: e.target.value })}
                        placeholder="0 for free"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>University Name</label>
                      <input
                        type="text"
                        className="input"
                        value={editCourseForm.university_name}
                        onChange={(e) => setEditCourseForm({ ...editCourseForm, university_name: e.target.value })}
                        placeholder="e.g., MIT"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="form-group">
                      <label>University Ranking</label>
                      <input
                        type="number"
                        min="1"
                        className="input"
                        value={editCourseForm.university_ranking}
                        onChange={(e) => setEditCourseForm({ ...editCourseForm, university_ranking: e.target.value })}
                        placeholder="e.g., 1"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      className="input"
                      rows="3"
                      value={editCourseForm.description}
                      onChange={(e) => setEditCourseForm({ ...editCourseForm, description: e.target.value })}
                      placeholder="Brief course description..."
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="form-group">
                    <label>Instructors</label>
                    {courseInstructors.length === 0 ? (
                      <p className="course-meta">No instructors assigned. Use &quot;Assign Instructors&quot; tab to add.</p>
                    ) : (
                      <ul className="course-instructors-list">
                        {courseInstructors.map((inst) => (
                          <li key={inst.user_id}>
                            Prof. {inst.name}
                            <button type="button" className="btn btn-danger btn-sm" onClick={(e) => { e.stopPropagation(); handleRemoveInstructor(inst.user_id); }} style={{ marginLeft: '8px' }}>
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="edit-course-actions">
                    <button type="submit" className="btn btn-primary" disabled={editCourseLoading}>
                      {editCourseLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button type="button" className="btn btn-danger" onClick={(e) => { e.stopPropagation(); handleDeleteCourse(); }} disabled={deleteCourseLoading}>
                      {deleteCourseLoading ? 'Deleting...' : 'Delete Course'}
                    </button>
                  </div>
                </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'assign' && (
            <div>
              <h2>Assign Instructor to Course</h2>
              <form onSubmit={handleAssignInstructor} className="card">
                <div className="form-group">
                  <label>Select Instructor</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Search by name, branch, or phone..."
                    value={instructorSearch}
                    onChange={(e) => setInstructorSearch(e.target.value)}
                  />
                  <div className="searchable-list">
                    {instructors
                      .filter((instructor) => {
                        const q = (instructorSearch || '').toLowerCase();
                        if (!q) return true;
                        const name = (instructor.name || '').toLowerCase();
                        const branch = (instructor.branch || '').toLowerCase();
                        const phone = (instructor.phone_number || '').toLowerCase();
                        return name.includes(q) || branch.includes(q) || phone.includes(q);
                      })
                      .map((instructor) => (
                        <div
                          key={instructor.user_id}
                          className={`searchable-list-item ${assignForm.instructor_id === instructor.user_id ? 'selected' : ''}`}
                          onClick={() => setAssignForm({ ...assignForm, instructor_id: instructor.user_id })}
                        >
                          <strong>Prof. {instructor.name}</strong>
                          {(instructor.branch || instructor.phone_number) && (
                            <span className="searchable-list-meta">
                              {[instructor.branch, instructor.phone_number].filter(Boolean).join(' · ')}
                            </span>
                          )}
                        </div>
                      ))}
                  </div>
                  {assignForm.instructor_id && (
                    <p className="form-hint">Selected: Prof. {instructors.find((i) => i.user_id === assignForm.instructor_id)?.name}</p>
                  )}
                </div>
                <div className="form-group">
                  <label>Select Course</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Search by title, university, or instructor..."
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                  />
                  <div className="searchable-list">
                    {courses
                      .filter((course) => {
                        const q = (courseSearch || '').toLowerCase();
                        if (!q) return true;
                        const title = (course.title || '').toLowerCase();
                        const univ = (course.university_name || '').toLowerCase();
                        const inst = (course.instructor_names || '').toLowerCase();
                        return title.includes(q) || univ.includes(q) || inst.includes(q);
                      })
                      .map((course) => (
                        <div
                          key={course.course_id}
                          className={`searchable-list-item ${assignForm.course_id === course.course_id ? 'selected' : ''}`}
                          onClick={() => setAssignForm({ ...assignForm, course_id: course.course_id })}
                        >
                          <strong>{course.title}</strong>
                          <span className="searchable-list-meta">
                            {course.level}
                            {course.university_name && ` · ${course.university_name}`}
                            {course.instructor_names && ` · ${course.instructor_names}`}
                          </span>
                        </div>
                      ))}
                  </div>
                  {assignForm.course_id && (
                    <p className="form-hint">Selected: {courses.find((c) => c.course_id === assignForm.course_id)?.title}</p>
                  )}
                </div>
                <button type="submit" className="btn btn-primary" disabled={!assignForm.instructor_id || !assignForm.course_id}>
                  Assign Instructor
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
