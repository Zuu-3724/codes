import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaUserShield,
  FaUserPlus,
  FaUserEdit,
  FaUserLock,
  FaUserCheck,
} from "react-icons/fa";

const Security = () => {
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

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get("http://localhost:3000/auth/users");
      if (response.data.Status) {
        setUsers(response.data.Data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await axios.get("http://localhost:3000/auth/roles");
      if (response.data.Status) {
        setRoles(response.data.Data);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:3000/auth/add-user",
        formData
      );
      if (response.data.Status) {
        alert("User added successfully!");
        setShowAddUser(false);
        setFormData({ username: "", email: "", role: "", password: "" });
        fetchUsers();
      }
    } catch (error) {
      console.error("Error adding user:", error);
      alert("Failed to add user");
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `http://localhost:3000/auth/update-user/${selectedUser.id}`,
        formData
      );
      if (response.data.Status) {
        alert("User updated successfully!");
        setShowEditUser(false);
        setFormData({ username: "", email: "", role: "", password: "" });
        fetchUsers();
      }
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Failed to update user");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const response = await axios.delete(
          `http://localhost:3000/auth/delete-user/${userId}`
        );
        if (response.data.Status) {
          alert("User deleted successfully!");
          fetchUsers();
        }
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("Failed to delete user");
      }
    }
  };

  const handleResetPassword = async (userId) => {
    try {
      const response = await axios.post(
        `http://localhost:3000/auth/reset-password/${userId}`
      );
      if (response.data.Status) {
        alert("Password reset successfully!");
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      alert("Failed to reset password");
    }
  };

  return (
    <div className="container-fluid px-4">
      <h1 className="mt-4 mb-4">Security Management</h1>

      {/* Add User Button */}
      <div className="row mb-4">
        <div className="col-md-6">
          <button
            className="btn btn-primary"
            onClick={() => setShowAddUser(true)}
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
                {users.map((user) => (
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
                        {user.status}
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
                      >
                        <FaUserEdit /> Edit
                      </button>
                      <button
                        className="btn btn-warning btn-sm me-2"
                        onClick={() => handleResetPassword(user.id)}
                      >
                        <FaUserLock /> Reset Password
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <FaUserCheck /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                    >
                      <option value="">Select Role</option>
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
                    />
                  </div>
                  <div className="text-end">
                    <button
                      type="button"
                      className="btn btn-secondary me-2"
                      onClick={() => setShowAddUser(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Add User
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
                <h5 className="modal-title">Edit User</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowEditUser(false)}
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
                    >
                      <option value="">Select Role</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.name}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">
                      New Password (leave blank to keep current)
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                    />
                  </div>
                  <div className="text-end">
                    <button
                      type="button"
                      className="btn btn-secondary me-2"
                      onClick={() => setShowEditUser(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Update User
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
