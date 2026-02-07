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

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <h2>🎓 MOOC</h2>
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
              <h2>All Courses</h2>
              <div className="courses-grid">
                {courses.map((course) => (
                  <div key={course.course_id} className="course-card">
                    <h3>{course.title}</h3>
                    <p className="course-level">{course.level}</p>
                    <p className="course-duration">Duration: {course.duration}</p>
                  </div>
                ))}
              </div>
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
