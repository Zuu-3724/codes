import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../config/AuthContext";

/**
 * ProtectedRoute component to protect routes based on user authentication and roles
 *
 * @param {Object} props
 * @param {Array} props.allowedRoles - Array of roles allowed to access the route
 * @param {boolean} props.requireAuth - Whether the route requires authentication
 * @param {React.ReactNode} props.children - The component to render if authorized
 * @returns {React.ReactNode}
 */
const ProtectedRoute = ({
  allowedRoles = [],
  requireAuth = true,
  children,
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading state
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="ms-2 mb-0">Verifying access...</p>
      </div>
    );
  }

  // If authentication is required and user is not authenticated
  if (requireAuth && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If specific roles are required and user's role is not included
  if (user && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <h4 className="alert-heading">Access Denied</h4>
          <p>
            You don't have permission to access this page. This page is
            restricted to <strong>{allowedRoles.join(", ")}</strong> users.
          </p>
          <hr />
          <p className="mb-0">
            <button
              className="btn btn-outline-danger"
              onClick={() => window.history.back()}
            >
              Go Back
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Render the children if all checks pass
  return children;
};

export default ProtectedRoute;
