const API_URL = import.meta.env.VITE_API_URL || "http://localhost:9000";

export const API_ENDPOINTS = {
  // Auth routes
  userLogin: `${API_URL}/auth/login`,
  register: `${API_URL}/auth/register`,
  logout: `${API_URL}/auth/logout`,
  checkAuth: `${API_URL}/auth/check-auth`,

  // Employee routes
  getEmployees: `${API_URL}/employees`,
  getEmployee: (id) => `${API_URL}/employees/${id}`,
  createEmployee: `${API_URL}/employees`,
  updateEmployee: (id) => `${API_URL}/employees/${id}`,
  deleteEmployee: (id) => `${API_URL}/employees/${id}`,

  // User routes
  getUsers: `${API_URL}/users`,
  createUser: `${API_URL}/users`,
  updateUser: (id) => `${API_URL}/users/${id}`,
  deleteUser: (id) => `${API_URL}/users/${id}`,
};
