import React, { createContext, useState, useEffect, useContext } from "react";
import { authAPI, TokenManager, API_URL } from "./api.config";
import { useNavigate } from "react-router-dom";

// Role definitions (must match backend)
export const ROLES = {
  ADMIN: "Admin",
  HR_MANAGER: "HR Manager",
  PAYROLL_MANAGER: "Payroll Manager",
  EMPLOYEE: "Employee",
};

// Create the Authentication Context
export const AuthContext = createContext(null);

// Hook for easily using the auth context
export const useAuth = () => useContext(AuthContext);

// AuthProvider component to wrap the app with
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);

      try {
        // Check if token exists
        if (TokenManager.isAuthenticated()) {
          // Get user from localStorage if available
          const storedUser = localStorage.getItem("user");

          if (storedUser) {
            setUser(JSON.parse(storedUser));
          } else {
            // If no user in localStorage but token exists, try to get user info
            await refreshUserInfo();
          }
        }
      } catch (err) {
        console.error("Error loading user", err);
        setError("Failed to load user information");
        // Clear invalid authentication
        TokenManager.removeToken();
        localStorage.removeItem("user");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Function to refresh user information from the backend
  const refreshUserInfo = async () => {
    try {
      if (!TokenManager.isAuthenticated()) {
        return false;
      }

      const response = await fetch(`${API_URL}/auth/test-auth`, {
        headers: {
          Authorization: `Bearer ${TokenManager.getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to refresh user info");
      }

      const data = await response.json();

      if (data.Status) {
        const userData = data.Data;
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        return true;
      }

      return false;
    } catch (err) {
      console.error("Error refreshing user info", err);
      setError("Failed to refresh user information");
      return false;
    }
  };

  // Login function
  const login = async (credentials) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authAPI.login(credentials);

      if (response && response.Status) {
        // Set user data
        setUser(response.Data);
        localStorage.setItem("user", JSON.stringify(response.Data));
        return true;
      } else {
        throw new Error(response?.Message || "Login failed");
      }
    } catch (err) {
      console.error("Login error", err);
      setError(err.message || "Login failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    authAPI.logout();
    setUser(null);
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Check if user has a specific role
  const hasRole = (role) => {
    if (!user) return false;
    return user.role === role;
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  // Role-specific permission checks
  const permissions = {
    // Admin has full access
    canViewEmployees: () => {
      return !!user; // Any authenticated user can view employees list
    },

    // Only Admin and HR Manager can add/edit employees
    canManageEmployees: () => {
      return (
        user && (user.role === ROLES.ADMIN || user.role === ROLES.HR_MANAGER)
      );
    },

    // Only Admin and Payroll Manager can edit payroll data
    canManagePayroll: () => {
      return (
        user &&
        (user.role === ROLES.ADMIN || user.role === ROLES.PAYROLL_MANAGER)
      );
    },

    // HR Manager can view but not edit payroll
    canViewPayroll: () => {
      return !!user; // Any authenticated user can view payroll info
    },

    // Only Admin can manage roles and security settings
    canManageSecurity: () => {
      return user && user.role === ROLES.ADMIN;
    },

    // Check if user is an admin
    isAdmin: () => {
      return user && user.role === ROLES.ADMIN;
    },

    // Any authenticated user can view reports
    canViewReports: () => {
      return !!user;
    },

    // Employees can only view their own data
    isRestricted: () => {
      return user && user.role === ROLES.EMPLOYEE;
    },

    // Get the current user's ID for filtering own data
    getCurrentUserId: () => {
      return user ? user.id : null;
    },
  };

  // Value to provide to consuming components
  const contextValue = {
    user,
    loading,
    error,
    login,
    logout,
    hasRole,
    hasAnyRole,
    permissions,
    refreshUserInfo,
    ROLES,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
