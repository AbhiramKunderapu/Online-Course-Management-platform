import React, { useState, useEffect } from 'react';
import { dashboardAPI, instructorAPI } from '../services/api';
import './Dashboard.css';

function InstructorDashboard({ user, onLogout }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [gradingForm, setGradingForm] = useState({ student_id: '', grade: '', status: 'completed' });
  const [contentForm, setContentForm] = useState({ course_id: '', module_number: '', title: '', type: 'video', url: '' });
  const [moduleForm, setModuleForm] = useState({ course_id: '', module_number: '', name: '', duration: '' });

  useEffect(() => {
    loadDashboardData();
    loadCourses();
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
      const response = await instructorAPI.getCourses(user.user_id);
      if (response.success) {
        setCourses(response.courses);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const loadCourseStudents = async (courseId) => {
    try {
      const response = await instructorAPI.getCourseStudents(user.user_id, courseId);
      if (response.success) {
        setStudents(response.students);
      }
    } catch (error) {
      console.error('Error loading students:', error);
      alert(error.response?.data?.error || 'Failed to load students');
    }
  };

  const loadCourseModules = async (courseId) => {
    try {
      const response = await instructorAPI.getCourseModules(user.user_id, courseId);
      if (response.success) {
        setModules(response.modules);
      }
    } catch (error) {
      console.error('Error loading modules:', error);
    }
  };

  const handleSelectCourse = (courseId) => {
    setSelectedCourse(courseId);
    loadCourseStudents(courseId);
    loadCourseModules(courseId);
  };

  const handleGradeStudent = async (e) => {
    e.preventDefault();
    if (!selectedCourse) {
      alert('Please select a course first');
      return;
    }

    try {
      const response = await instructorAPI.gradeStudent(
        user.user_id,
        selectedCourse,
        gradingForm.student_id,
        gradingForm.grade,
        gradingForm.status
      );
      if (response.success) {
        alert('Student graded successfully!');
        setGradingForm({ student_id: '', grade: '', status: 'completed' });
        loadCourseStudents(selectedCourse);
        loadDashboardData();
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to grade student');
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!selectedCourse) {
      alert('Please select a course first');
      return;
    }

    if (!window.confirm('Are you sure you want to remove this student from the course?')) {
      return;
    }

    try {
      const response = await instructorAPI.removeStudent(
        user.user_id,
        selectedCourse,
        studentId
      );
      if (response.success) {
        alert('Student removed from course');
        loadCourseStudents(selectedCourse);
        loadDashboardData();
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to remove student');
    }
  };

  const handleCreateModule = async (e) => {
    e.preventDefault();
    try {
      const response = await instructorAPI.createModule(
        user.user_id,
        moduleForm.course_id,
        parseInt(moduleForm.module_number),
        moduleForm.name,
        moduleForm.duration
      );
      if (response.success) {
        alert('Module created successfully!');
        setModuleForm({ course_id: '', module_number: '', name: '', duration: '' });
        if (moduleForm.course_id) {
          loadCourseModules(moduleForm.course_id);
        }
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create module');
    }
  };

  const handleAddContent = async (e) => {
    e.preventDefault();
    try {
      const response = await instructorAPI.addModuleContent(
        user.user_id,
        contentForm.course_id,
        contentForm.module_number,
        contentForm.title,
        contentForm.type,
        contentForm.url
      );
      if (response.success) {
        alert('Content added successfully!');
        setContentForm({ course_id: '', module_number: '', title: '', type: 'video', url: '' });
        if (contentForm.course_id) {
          loadCourseModules(contentForm.course_id);
        }
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to add content');
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
        <a href="#courses" onClick={() => setActiveTab('courses')}>My Courses</a>
        <a href="#students" onClick={() => setActiveTab('students')}>Manage Students</a>
        <a href="#modules" onClick={() => setActiveTab('modules')}>Create Modules</a>
        <a href="#content" onClick={() => setActiveTab('content')}>Add Content</a>
        <a href="#logout" onClick={onLogout}>Logout</a>
      </div>

      <div className="main-content">
        <div className="dashboard-header">
          <h1>Welcome, {user.name}!</h1>
        </div>

        <div className="dashboard-content">
          {activeTab === 'dashboard' && (
            <div>
              <h2>Instructor Dashboard</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Total Courses</h3>
                  <div className="value">{dashboardData?.total_courses || 0}</div>
                </div>
                <div className="stat-card">
                  <h3>Total Students</h3>
                  <div className="value">
                    {courses.reduce((sum, course) => sum + (course.enrolled_count || 0), 0)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'courses' && (
            <div>
              <h2>Courses I Teach</h2>
              {courses.length === 0 ? (
                <p>You are not teaching any courses yet.</p>
              ) : (
                <div className="courses-grid">
                  {courses.map((course) => (
                    <div key={course.course_id} className="course-card">
                      <h3>{course.title}</h3>
                      <p className="course-level">{course.level}</p>
                      <p className="course-duration">Duration: {course.duration}</p>
                      <p className="course-description">
                        <strong>Students Enrolled:</strong> {course.enrolled_count || 0}
                      </p>
                      {course.description && (
                        <p className="course-description">{course.description}</p>
                      )}
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          setSelectedCourse(course.course_id);
                          setActiveTab('students');
                          loadCourseStudents(course.course_id);
                        }}
                      >
                        View Students
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'students' && (
            <div>
              <h2>Manage Students</h2>
              
              {!selectedCourse && (
                <div className="card">
                  <p>Please select a course to view students:</p>
                  <select
                    className="input"
                    value={selectedCourse || ''}
                    onChange={(e) => handleSelectCourse(e.target.value)}
                    style={{ marginTop: '10px' }}
                  >
                    <option value="">Select a course</option>
                    {courses.map((course) => (
                      <option key={course.course_id} value={course.course_id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedCourse && (
                <>
                  <div className="card" style={{ marginBottom: '20px' }}>
                    <h3>Selected Course: {courses.find(c => c.course_id === selectedCourse)?.title}</h3>
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setSelectedCourse(null);
                        setStudents([]);
                      }}
                      style={{ marginTop: '10px', width: 'auto' }}
                    >
                      Change Course
                    </button>
                  </div>

                  <div className="card">
                    <h3>Enrolled Students</h3>
                    {students.length === 0 ? (
                      <p>No students enrolled in this course.</p>
                    ) : (
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Status</th>
                            <th>Grade</th>
                            <th>Enrolled Date</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.map((student) => (
                            <tr key={student.user_id}>
                              <td>{student.name}</td>
                              <td>{student.email}</td>
                              <td>
                                <span className={`status-badge status-${student.status}`}>
                                  {student.status}
                                </span>
                              </td>
                              <td>{student.grade || '-'}</td>
                              <td>{student.enroll_date}</td>
                              <td>
                                <button
                                  className="btn btn-danger"
                                  onClick={() => handleRemoveStudent(student.user_id)}
                                  style={{ padding: '6px 12px', width: 'auto', marginRight: '5px' }}
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  <div className="card" style={{ marginTop: '20px' }}>
                    <h3>Grade Student</h3>
                    <form onSubmit={handleGradeStudent}>
                      <div className="form-group">
                        <label>Select Student</label>
                        <select
                          className="input"
                          value={gradingForm.student_id}
                          onChange={(e) =>
                            setGradingForm({ ...gradingForm, student_id: e.target.value })
                          }
                          required
                        >
                          <option value="">Select a student</option>
                          {students
                            .filter(s => s.status === 'ongoing' || s.status === 'completed')
                            .map((student) => (
                              <option key={student.user_id} value={student.user_id}>
                                {student.name} ({student.status})
                              </option>
                            ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Grade</label>
                        <input
                          type="text"
                          className="input"
                          value={gradingForm.grade}
                          onChange={(e) =>
                            setGradingForm({ ...gradingForm, grade: e.target.value })
                          }
                          placeholder="e.g., A, B+, 85"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Status</label>
                        <select
                          className="input"
                          value={gradingForm.status}
                          onChange={(e) =>
                            setGradingForm({ ...gradingForm, status: e.target.value })
                          }
                          required
                        >
                          <option value="completed">Completed</option>
                          <option value="ongoing">Ongoing</option>
                        </select>
                      </div>
                      <button type="submit" className="btn btn-primary">
                        Submit Grade
                      </button>
                    </form>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'modules' && (
            <div>
              <h2>Create Module</h2>
              <form onSubmit={handleCreateModule} className="card">
                <div className="form-group">
                  <label>Select Course</label>
                  <select
                    className="input"
                    value={moduleForm.course_id}
                    onChange={(e) => {
                      setModuleForm({ ...moduleForm, course_id: e.target.value });
                      if (e.target.value) {
                        loadCourseModules(e.target.value);
                      }
                    }}
                    required
                  >
                    <option value="">Select a course</option>
                    {courses.map((course) => (
                      <option key={course.course_id} value={course.course_id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>

                {moduleForm.course_id && (
                  <>
                    <div className="form-group">
                      <label>Module Number</label>
                      <input
                        type="number"
                        className="input"
                        value={moduleForm.module_number}
                        onChange={(e) =>
                          setModuleForm({ ...moduleForm, module_number: e.target.value })
                        }
                        placeholder="e.g., 1, 2, 3"
                        min="1"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Module Name</label>
                      <input
                        type="text"
                        className="input"
                        value={moduleForm.name}
                        onChange={(e) =>
                          setModuleForm({ ...moduleForm, name: e.target.value })
                        }
                        placeholder="e.g., Introduction to Python"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Duration (Optional)</label>
                      <input
                        type="text"
                        className="input"
                        value={moduleForm.duration}
                        onChange={(e) =>
                          setModuleForm({ ...moduleForm, duration: e.target.value })
                        }
                        placeholder="e.g., 2 weeks, 5 hours"
                      />
                    </div>

                    <button type="submit" className="btn btn-primary">
                      Create Module
                    </button>
                  </>
                )}
              </form>

              {moduleForm.course_id && modules.length > 0 && (
                <div className="card" style={{ marginTop: '20px' }}>
                  <h3>Existing Modules</h3>
                  <ul>
                    {modules.map((module) => (
                      <li key={module.module_number} style={{ marginBottom: '8px' }}>
                        Module {module.module_number}: {module.name}
                        {module.duration && ` (${module.duration})`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'content' && (
            <div>
              <h2>Add Content to Module</h2>
              <form onSubmit={handleAddContent} className="card">
                <div className="form-group">
                  <label>Select Course</label>
                  <select
                    className="input"
                    value={contentForm.course_id}
                    onChange={(e) => {
                      setContentForm({ ...contentForm, course_id: e.target.value });
                      if (e.target.value) {
                        loadCourseModules(e.target.value);
                      }
                    }}
                    required
                  >
                    <option value="">Select a course</option>
                    {courses.map((course) => (
                      <option key={course.course_id} value={course.course_id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>

                {contentForm.course_id && (
                  <>
                    <div className="form-group">
                      <label>Select Module</label>
                      <select
                        className="input"
                        value={contentForm.module_number}
                        onChange={(e) =>
                          setContentForm({
                            ...contentForm,
                            module_number: parseInt(e.target.value),
                          })
                        }
                        required
                      >
                        <option value="">Select a module</option>
                        {modules.map((module) => (
                          <option key={module.module_number} value={module.module_number}>
                            Module {module.module_number}: {module.name}
                          </option>
                        ))}
                      </select>
                      {modules.length === 0 && (
                        <p style={{ color: '#666', fontSize: '14px', marginTop: '5px' }}>
                          No modules found for this course. Please create modules first.
                        </p>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Content Title</label>
                      <input
                        type="text"
                        className="input"
                        value={contentForm.title}
                        onChange={(e) =>
                          setContentForm({ ...contentForm, title: e.target.value })
                        }
                        placeholder="e.g., Introduction to Python"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Content Type</label>
                      <select
                        className="input"
                        value={contentForm.type}
                        onChange={(e) =>
                          setContentForm({ ...contentForm, type: e.target.value })
                        }
                        required
                      >
                        <option value="video">Video</option>
                        <option value="document">Document</option>
                        <option value="quiz">Quiz</option>
                        <option value="assignment">Assignment</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Content URL</label>
                      <input
                        type="url"
                        className="input"
                        value={contentForm.url}
                        onChange={(e) =>
                          setContentForm({ ...contentForm, url: e.target.value })
                        }
                        placeholder="https://example.com/content"
                        required
                      />
                    </div>

                    <button type="submit" className="btn btn-primary">
                      Add Content
                    </button>
                  </>
                )}
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default InstructorDashboard;
