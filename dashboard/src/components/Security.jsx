import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaUserShield,
  FaUserPlus,
  FaUserEdit,
  FaUserLock,
  FaUserCheck,
} from "react-icons/fa";
import { getAuthConfig } from "../config/api.config";
import { useNavigate } from "react-router-dom";

const Security = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    role: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const config = getAuthConfig(navigate);
      if (!config) return;

      const response = await axios.get(
        `http://localhost:9000/auth/users`,
        config
      );
      if (response.data.Status) {
        setUsers(response.data.Data);
      } else {
        setError(response.data.Error || "Unable to load user list");
      }
    } catch (error) {
      console.error("Error loading user list:", error);
      if (error.response?.status === 401) {
        navigate("/login");
      } else {
        setError("Connection error to server. Please try again later");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const config = getAuthConfig(navigate);
      if (!config) return;

      const response = await axios.get(
        `http://localhost:9000/auth/roles`,
        config
      );
      if (response.data.Status) {
        setRoles(response.data.Data);
      } else {
        console.error("Error loading roles:", response.data.Error);
      }
    } catch (error) {
      console.error("Error loading role list:", error);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const config = getAuthConfig(navigate);
      if (!config) return;

      const response = await axios.post(
        `http://localhost:9000/auth/add-user`,
        formData,
        config
      );
      if (response.data.Status) {
        alert("User added successfully!");
        setShowAddUser(false);
        setFormData({ username: "", email: "", role: "", password: "" });
        fetchUsers();
      } else {
        setError(response.data.Error || "Unable to add user");
      }
    } catch (error) {
      console.error("Error adding user:", error);
      if (error.response?.status === 401) {
        navigate("/login");
      } else {
        setError(error.response?.data?.Error || "Connection error to server");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const config = getAuthConfig(navigate);
      if (!config) return;

      const response = await axios.put(
        `http://localhost:9000/auth/update-user/${selectedUser.id}`,
        formData,
        config
      );
      if (response.data.Status) {
        alert("User updated successfully!");
        setShowEditUser(false);
        setFormData({ username: "", email: "", role: "", password: "" });
        fetchUsers();
      } else {
        setError(response.data.Error || "Unable to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      if (error.response?.status === 401) {
        navigate("/login");
      } else {
        setError(error.response?.data?.Error || "Connection error to server");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      setLoading(true);
      try {
        const config = getAuthConfig(navigate);
        if (!config) return;

        const response = await axios.delete(
          `http://localhost:9000/auth/delete-user/${userId}`,
          config
        );
        if (response.data.Status) {
          alert("User deleted successfully!");
          fetchUsers();
        } else {
          setError(response.data.Error || "Unable to delete user");
        }
      } catch (error) {
        console.error("Error deleting user:", error);
        if (error.response?.status === 401) {
          navigate("/login");
        } else {
          alert("Unable to delete user. Please try again later");
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleResetPassword = async (userId) => {
    setLoading(true);
    try {
      const config = getAuthConfig(navigate);
      if (!config) return;

      const response = await axios.post(
        `http://localhost:9000/auth/reset-password/${userId}`,
        {},
        config
      );
      if (response.data.Status) {
        alert("Password reset successful!");
      } else {
        alert(response.data.Error || "Unable to reset password");
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      if (error.response?.status === 401) {
        navigate("/login");
      } else {
        alert("Unable to reset password. Please try again later");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid px-4">
      <h1 className="mt-4 mb-4">Security Management</h1>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
          <button
            className="btn-close float-end"
            onClick={() => setError(null)}
          ></button>
        </div>
      )}

      {/* Add User Button */}
      <div className="row mb-4">
        <div className="col-md-6">
          <button
            className="btn btn-primary"
            onClick={() => setShowAddUser(true)}
            disabled={loading}
          >
            <FaUserPlus className="me-1" /> Add New User
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="card shadow mb-4">
        <div className="card-header py-3">
          <h6 className="m-0 font-weight-bold text-primary">User Management</h6>
        </div>
        <div className="card-body">
          {loading && !showAddUser && !showEditUser ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading user data...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length > 0 ? (
                    users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.username}</td>
                        <td>{user.email}</td>
                        <td>{user.role}</td>
                        <td>
                          <span
                            className={`badge bg-${
                              user.status === "Active" ? "success" : "danger"
                            }`}
                          >
                            {user.status === "Active" ? "Active" : "Locked"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-info btn-sm me-2"
                            onClick={() => {
                              setSelectedUser(user);
                              setFormData({
                                username: user.username,
                                email: user.email,
                                role: user.role,
                                password: "",
                              });
                              setShowEditUser(true);
                            }}
                            disabled={loading}
                          >
                            <FaUserEdit /> Edit
                          </button>
                          <button
                            className="btn btn-warning btn-sm me-2"
                            onClick={() => handleResetPassword(user.id)}
                            disabled={loading}
                          >
                            <FaUserLock /> Reset Password
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={loading}
                          >
                            <FaUserCheck /> Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center">
                        No user data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New User</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddUser(false)}
                  disabled={loading}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleAddUser}>
                  <div className="mb-3">
                    <label className="form-label">Username</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Role</label>
                    <select
                      className="form-control"
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                      required
                      disabled={loading}
                    >
                      <option value="">Select role</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.name}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="text-end">
                    <button
                      type="button"
                      className="btn btn-secondary me-2"
                      onClick={() => setShowAddUser(false)}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? "Processing..." : "Add User"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUser && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit User Information</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowEditUser(false)}
                  disabled={loading}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleEditUser}>
                  <div className="mb-3">
                    <label className="form-label">Username</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Role</label>
                    <select
                      className="form-control"
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                      required
                      disabled={loading}
                    >
                      <option value="">Select role</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.name}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">
                      New Password (leave blank if not changing)
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      disabled={loading}
                    />
                  </div>
                  <div className="text-end">
                    <button
                      type="button"
                      className="btn btn-secondary me-2"
                      onClick={() => setShowEditUser(false)}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? "Processing..." : "Update"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Security;
