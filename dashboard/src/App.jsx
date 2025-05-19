import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "./components/style.css";
import Login from "./components/Login";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router";
import Dashboard from "./components/Dashboard";
import Home from "./components/Home";
import Employees from "./components/Employees";
import Payroll from "./components/Payroll";
import Attendance from "./components/Attendance";
import Departments from "./components/Departments";
import Reports from "./components/Reports";
import Alerts from "./components/Alerts";
import Security from "./components/Security";
import ServerConfig from "./components/ServerConfig";
import AddEmployee from "./components/AddEmployee";
import UpdateEmployee from "./components/UpdateEmployee";
import UpdateDepartment from "./components/UpdateDepartment";
import AddDepartment from "./components/AddDepartment";
import UserProfile from "./components/UserProfile";
import { AuthProvider, useAuth } from "./config/AuthContext";
import React from "react";

// Protected route component
const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="p-5 text-center">Loading...</div>;
  }

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If roles are specified and user doesn't have required role, show unauthorized
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return (
      <div className="p-5 text-center">
        <h2>Access Denied</h2>
        <p>You don't have permission to access this page.</p>
        <button
          className="btn btn-primary"
          onClick={() => window.history.back()}
        >
          Go Back
        </button>
      </div>
    );
  }

  // If all checks pass, render the child component
  return children;
};

// AppRoutes component that uses the auth context
const AppRoutes = () => {
  const { ROLES } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route path="" element={<Home />} />

        {/* Employee routes */}
        <Route path="/dashboard/employees" element={<Employees />} />
        <Route
          path="/dashboard/add_employee"
          element={
            <ProtectedRoute requiredRoles={[ROLES.ADMIN, ROLES.HR_MANAGER]}>
              <AddEmployee />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/update_employee/:id"
          element={
            <ProtectedRoute requiredRoles={[ROLES.ADMIN, ROLES.HR_MANAGER]}>
              <UpdateEmployee />
            </ProtectedRoute>
          }
        />

        {/* Payroll routes */}
        <Route path="/dashboard/payroll" element={<Payroll />} />

        {/* Attendance routes */}
        <Route path="/dashboard/attendance" element={<Attendance />} />

        {/* Department routes */}
        <Route
          path="/dashboard/departments"
          element={
            <ProtectedRoute requiredRoles={[ROLES.ADMIN, ROLES.HR_MANAGER]}>
              <Departments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/add_department"
          element={
            <ProtectedRoute requiredRoles={[ROLES.ADMIN, ROLES.HR_MANAGER]}>
              <AddDepartment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/update_department/:id"
          element={
            <ProtectedRoute requiredRoles={[ROLES.ADMIN, ROLES.HR_MANAGER]}>
              <UpdateDepartment />
            </ProtectedRoute>
          }
        />

        {/* Reports routes */}
        <Route path="/dashboard/reports" element={<Reports />} />

        {/* Alerts routes */}
        <Route path="/dashboard/alerts" element={<Alerts />} />

        {/* Security routes - Admin only */}
        <Route
          path="/dashboard/security"
          element={
            <ProtectedRoute requiredRoles={[ROLES.ADMIN]}>
              <Security />
            </ProtectedRoute>
          }
        />

        {/* Server Config route - Admin only */}
        <Route
          path="/dashboard/server"
          element={
            <ProtectedRoute requiredRoles={[ROLES.ADMIN]}>
              <ServerConfig />
            </ProtectedRoute>
          }
        />

        {/* User Profile route */}
        <Route path="/dashboard/profile" element={<UserProfile />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
