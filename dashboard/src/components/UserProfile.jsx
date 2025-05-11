import React from "react";
import { useAuth } from "../config/AuthContext";
import {
  FaUser,
  FaUserShield,
  FaKey,
  FaIdCard,
  FaCalendarAlt,
} from "react-icons/fa";

const UserProfile = () => {
  const { user, hasRole, ROLES } = useAuth();

  if (!user) {
    return (
      <div className="alert alert-warning">
        You are not logged in. Please log in to view your profile.
      </div>
    );
  }

  const userRoleDescription = () => {
    switch (user.role) {
      case ROLES.ADMIN:
        return "Full access to all system features and data.";
      case ROLES.HR_MANAGER:
        return "Manage employees and departments, view payroll information.";
      case ROLES.PAYROLL_MANAGER:
        return "Manage salary and payroll data, view employee information.";
      case ROLES.EMPLOYEE:
        return "View your own information and salary details.";
      default:
        return "Unknown role permissions.";
    }
  };

  return (
    <div className="container-fluid px-4">
      <h1 className="mt-4 mb-4">
        <FaUser className="me-2" /> User Profile
      </h1>

      <div className="row">
        <div className="col-md-6">
          <div className="card shadow mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <FaIdCard className="me-2" /> Account Information
              </h5>
            </div>
            <div className="card-body">
              <table className="table">
                <tbody>
                  <tr>
                    <th style={{ width: "30%" }}>Username:</th>
                    <td>{user.username}</td>
                  </tr>
                  <tr>
                    <th>User ID:</th>
                    <td>{user.id}</td>
                  </tr>
                  <tr>
                    <th>
                      <FaUserShield className="me-1" /> Role:
                    </th>
                    <td>
                      <span className="badge bg-primary">{user.role}</span>
                    </td>
                  </tr>
                  <tr>
                    <th>Description:</th>
                    <td>{userRoleDescription()}</td>
                  </tr>
                  <tr>
                    <th>
                      <FaCalendarAlt className="me-1" /> Last Login:
                    </th>
                    <td>
                      {user.lastLogin
                        ? new Date(user.lastLogin).toLocaleString()
                        : "Not available"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card shadow mb-4">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">
                <FaKey className="me-2" /> Permissions
              </h5>
            </div>
            <div className="card-body">
              <ul className="list-group">
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  View Employee List
                  <span className="badge bg-success rounded-pill">✓</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  View Payroll Information
                  <span className="badge bg-success rounded-pill">✓</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  Manage Employees
                  <span
                    className={`badge rounded-pill ${
                      hasRole(ROLES.ADMIN) || hasRole(ROLES.HR_MANAGER)
                        ? "bg-success"
                        : "bg-danger"
                    }`}
                  >
                    {hasRole(ROLES.ADMIN) || hasRole(ROLES.HR_MANAGER)
                      ? "✓"
                      : "✗"}
                  </span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  Manage Payroll
                  <span
                    className={`badge rounded-pill ${
                      hasRole(ROLES.ADMIN) || hasRole(ROLES.PAYROLL_MANAGER)
                        ? "bg-success"
                        : "bg-danger"
                    }`}
                  >
                    {hasRole(ROLES.ADMIN) || hasRole(ROLES.PAYROLL_MANAGER)
                      ? "✓"
                      : "✗"}
                  </span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  System Administration
                  <span
                    className={`badge rounded-pill ${
                      hasRole(ROLES.ADMIN) ? "bg-success" : "bg-danger"
                    }`}
                  >
                    {hasRole(ROLES.ADMIN) ? "✓" : "✗"}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
