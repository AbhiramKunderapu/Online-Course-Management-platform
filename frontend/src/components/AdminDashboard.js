import React, { useState, useEffect } from 'react';
import { dashboardAPI, adminAPI } from '../services/api';
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
    fees: ''
  });
  const [addCourseLoading, setAddCourseLoading] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [editCourseForm, setEditCourseForm] = useState({
    title: '',
    duration: '',
    level: 'beginner',
    description: '',
    fees: ''
  });
  const [editCourseLoading, setEditCourseLoading] = useState(false);

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
        alert('User approved successfully');
        loadUsers();
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to approve user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await adminAPI.deleteUser(userId);
        if (response.success) {
          alert('User deleted successfully');
          loadUsers();
          loadDashboardData();
        }
      } catch (error) {
        alert(error.response?.data?.error || 'Failed to delete user');
      }
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
        alert('Instructor assigned successfully');
        setAssignForm({ instructor_id: '', course_id: '' });
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to assign instructor');
    }
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();
    setAddCourseLoading(true);
    try {
      const response = await adminAPI.createCourse(user.user_id, {
        title: addCourseForm.title,
        duration: addCourseForm.duration,
        level: addCourseForm.level,
        description: addCourseForm.description,
        fees: addCourseForm.fees ? parseFloat(addCourseForm.fees) : null
      });
      if (response.success) {
        alert('Course created successfully!');
        setShowAddCourse(false);
        setAddCourseForm({ title: '', duration: '', level: 'beginner', description: '', fees: '' });
        loadCourses();
        loadDashboardData();
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create course');
    } finally {
      setAddCourseLoading(false);
    }
  };

  const openEditCourse = (course) => {
    setEditingCourse(course);
    setEditCourseForm({
      title: course.title || '',
      duration: course.duration || '',
      level: course.level || 'beginner',
      description: course.description || '',
      fees: course.fees != null ? String(course.fees) : ''
    });
  };

  const closeEditCourse = () => {
    setEditingCourse(null);
    setEditCourseForm({ title: '', duration: '', level: 'beginner', description: '', fees: '' });
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
        fees: editCourseForm.fees ? parseFloat(editCourseForm.fees) : null
      });
      if (response.success) {
        alert('Course updated successfully!');
        closeEditCourse();
        loadCourses();
        loadDashboardData();
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update course');
    } finally {
      setEditCourseLoading(false);
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
        <a href="#users" onClick={() => setActiveTab('users')}>Manage Users</a>
        <a href="#pending" onClick={() => setActiveTab('pending')}>Pending Approval</a>
        <a href="#courses" onClick={() => setActiveTab('courses')}>Manage Courses</a>
        <a href="#assign" onClick={() => setActiveTab('assign')}>Assign Instructors</a>
        <a href="#logout" onClick={onLogout}>Logout</a>
      </div>

      <div className="main-content">
        <div className="dashboard-header">
          <h1>Admin Panel - {user.name}</h1>
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
              {users.filter(u => !u.approved).length === 0 ? (
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
                    {users.filter(u => !u.approved).map((u) => (
                      <tr key={u.user_id}>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td>{u.role}</td>
                        <td>
                          <button className="btn btn-primary" onClick={() => handleApproveUser(u.user_id)} style={{ padding: '6px 12px', marginRight: '8px' }}>Approve</button>
                          {u.role === 'student' && (
                            <button className="btn btn-danger" onClick={() => handleDeleteUser(u.user_id)} style={{ padding: '6px 12px' }}>Delete</button>
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
                  {users.map((u) => (
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
                          <button className="btn btn-primary" onClick={() => handleApproveUser(u.user_id)} style={{ padding: '6px 12px', marginRight: '8px' }}>Approve</button>
                        )}
                        {u.role === 'student' && (
                          <button className="btn btn-danger" onClick={() => handleDeleteUser(u.user_id)} style={{ padding: '6px 12px', width: 'auto' }}>Delete</button>
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
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Fees ($)</label>
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
              <h3 className="courses-list-title">All Courses — click any course to edit</h3>
              <div className="courses-grid">
                {courses.length === 0 ? (
                  <p className="empty-state">No courses yet. Add your first course above!</p>
                ) : (
                  courses.map((course) => (
                    <div
                      key={course.course_id}
                      className={`course-card course-card-clickable ${editingCourse?.course_id === course.course_id ? 'course-card-editing' : ''}`}
                      onClick={() => openEditCourse(course)}
                    >
                      <h4>{course.title}</h4>
                      <p className="course-level">{course.level}</p>
                      <p className="course-duration">Duration: {course.duration || '—'}</p>
                      {course.fees != null && <p className="course-fees">${course.fees}</p>}
                    </div>
                  ))
                )}
              </div>
              {editingCourse && (
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
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Fees ($)</label>
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
                  <button type="submit" className="btn btn-primary" disabled={editCourseLoading}>
                    {editCourseLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              )}
            </div>
          )}

          {activeTab === 'assign' && (
            <div>
              <h2>Assign Instructor to Course</h2>
              <form onSubmit={handleAssignInstructor} className="card">
                <div className="form-group">
                  <label>Select Instructor</label>
                  <select
                    className="input"
                    value={assignForm.instructor_id}
                    onChange={(e) =>
                      setAssignForm({ ...assignForm, instructor_id: e.target.value })
                    }
                    required
                  >
                    <option value="">Select an instructor</option>
                    {instructors.map((instructor) => (
                      <option key={instructor.user_id} value={instructor.user_id}>
                        {instructor.name} ({instructor.branch}, {instructor.phone_number})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Select Course</label>
                  <select
                    className="input"
                    value={assignForm.course_id}
                    onChange={(e) =>
                      setAssignForm({ ...assignForm, course_id: e.target.value })
                    }
                    required
                  >
                    <option value="">Select a course</option>
                    {courses.map((course) => (
                      <option key={course.course_id} value={course.course_id}>
                        {course.title} ({course.level})
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary">
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
