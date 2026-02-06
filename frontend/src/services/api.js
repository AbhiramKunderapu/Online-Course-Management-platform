import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth API
export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/login', { email, password });
    return response.data;
  },

  signup: async (name, email, password, role = 'student') => {
    const response = await api.post('/signup', { name, email, password, role });
    return response.data;
  },
};

// Dashboard API
export const dashboardAPI = {
  getDashboardData: async (user_id, role) => {
    const response = await api.get('/dashboard', {
      params: { user_id, role },
    });
    return response.data;
  },
};

// Courses API
export const coursesAPI = {
  getAll: async () => {
    const response = await api.get('/courses');
    return response.data;
  },

  enroll: async (user_id, course_id) => {
    const response = await api.post('/courses/enroll', { user_id, course_id });
    return response.data;
  },

  getMyCourses: async (user_id, status = null) => {
    const params = { user_id };
    if (status) params.status = status;
    const response = await api.get('/courses/my-courses', { params });
    return response.data;
  },
};

// Student API
export const studentAPI = {
  getProfile: async (user_id) => {
    const response = await api.get('/student/profile', {
      params: { user_id },
    });
    return response.data;
  },

  updateProfile: async (user_id, profileData) => {
    const response = await api.put('/student/profile', {
      user_id,
      ...profileData,
    });
    return response.data;
  },
};

// Admin API
export const adminAPI = {
  getUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  deleteUser: async (user_id) => {
    const response = await api.delete(`/admin/users/${user_id}`);
    return response.data;
  },

  assignInstructor: async (instructor_id, course_id) => {
    const response = await api.post('/admin/assign', {
      instructor_id,
      course_id,
    });
    return response.data;
  },

  getCourses: async () => {
    const response = await api.get('/admin/courses');
    return response.data;
  },

  getInstructors: async () => {
    const response = await api.get('/admin/instructors');
    return response.data;
  },
};

// Instructor API
export const instructorAPI = {
  getCourses: async (instructor_id) => {
    const response = await api.get('/instructor/courses', {
      params: { instructor_id },
    });
    return response.data;
  },

  getCourseStudents: async (instructor_id, course_id) => {
    const response = await api.get(`/instructor/courses/${course_id}/students`, {
      params: { instructor_id },
    });
    return response.data;
  },

  gradeStudent: async (instructor_id, course_id, student_id, grade, status = 'completed') => {
    const response = await api.post('/instructor/grade', {
      instructor_id,
      course_id,
      student_id,
      grade,
      status,
    });
    return response.data;
  },

  removeStudent: async (instructor_id, course_id, student_id) => {
    const response = await api.post('/instructor/remove-student', {
      instructor_id,
      course_id,
      student_id,
    });
    return response.data;
  },

  getCourseModules: async (instructor_id, course_id) => {
    const response = await api.get(`/instructor/courses/${course_id}/modules`, {
      params: { instructor_id },
    });
    return response.data;
  },

  createModule: async (instructor_id, course_id, module_number, name, duration = '') => {
    const response = await api.post('/instructor/module', {
      instructor_id,
      course_id,
      module_number,
      name,
      duration,
    });
    return response.data;
  },

  addModuleContent: async (instructor_id, course_id, module_number, title, type, url) => {
    const response = await api.post('/instructor/module-content', {
      instructor_id,
      course_id,
      module_number,
      title,
      type,
      url,
    });
    return response.data;
  },
};

// Student Course Content API
export const studentCourseAPI = {
  getCourseModules: async (user_id, course_id) => {
    const response = await api.get(`/student/courses/${course_id}/modules`, {
      params: { user_id },
    });
    return response.data;
  },
};

export default api;
