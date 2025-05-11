import React, { useState, useEffect } from "react";
import "./style.css";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../config/AuthContext";
import { checkServerConnection, API_URL } from "../config/api.config";
import axios from "axios";
// Import icons
import {
  FaUser,
  FaLock,
  FaSignInAlt,
  FaServer,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSpinner,
  FaCode,
} from "react-icons/fa";

// Cấu hình bảo mật
const SECURITY_CONFIG = {
  CORS: {
    CREDENTIALS: true,
  },
  AUTH: {
    USER_KEY: "user",
  },
};

const Login = () => {
  const [values, setValues] = useState({
    // Default to test credentials to make testing easier
    username: "admin",
    password: "admin123",
  });
  const [loginError, setLoginError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState(null);
  const [checkingServer, setCheckingServer] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user, error: authError, loading: authLoading } = useAuth();

  // Forward to dashboard if already logged in
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from);
    }
  }, [user, navigate, location]);

  // Show auth errors
  useEffect(() => {
    if (authError) {
      setLoginError(authError);
    }
  }, [authError]);

  // Server status check functions are kept but not automatically called
  const checkServerStatus = async () => {
    setCheckingServer(true);
    try {
      const isConnected = await checkServerConnection();
      setServerStatus({
        connected: isConnected,
        message: isConnected ? "Server is running" : "Cannot connect to server",
      });
    } catch (error) {
      setServerStatus({
        connected: false,
        message: `Connection error: ${error.message}`,
      });
    } finally {
      setCheckingServer(false);
    }
  };

  const testApiEndpoint = async () => {
    setCheckingServer(true);
    try {
      const response = await axios.get(`${API_URL}/health`, {
        timeout: 3000,
      });
      setServerStatus({
        connected: true,
        message: `Server is operational. Response: ${JSON.stringify(
          response.data
        )}`,
        data: response.data,
      });
    } catch (error) {
      console.error("API test error:", error);
      setServerStatus({
        connected: false,
        message: `API Error: ${error.message}`,
        error: error,
      });
    } finally {
      setCheckingServer(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setLoginError(null);

    // Validate input
    if (!values.username || !values.password) {
      setLoginError("Please enter complete login information");
      setIsLoading(false);
      return;
    }

    try {
      console.log("Attempting login with:", values.username);

      const success = await login({
        username: values.username,
        password: values.password,
      });

      if (success) {
        console.log("Login successful");
        navigate("/dashboard");
      } else {
        console.log("Login failed");
        setLoginError("Login failed. Please check your credentials.");
      }
    } catch (err) {
      console.error("Login error:", err);
      // Detailed error display
      let errorMessage = "An error occurred during login";

      // Check for server error details
      if (err?.data?.Message) {
        errorMessage = err.data.Message;
      } else if (err?.data?.detail) {
        errorMessage = err.data.detail;
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setLoginError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 loginPage">
      <div className="p-3 rounded border loginForm" style={{ width: "420px" }}>
        <h2 className="text-center mb-4 fw-bold">HR & Payroll System</h2>

        {loginError && (
          <div className="alert alert-danger" role="alert">
            {loginError}
          </div>
        )}

        <h4 className="mb-3">Login</h4>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="username" className="form-label">
              <strong>Username:</strong>
            </label>
            <input
              type="text"
              name="username"
              id="username"
              autoComplete="username"
              placeholder="Enter username"
              value={values.username}
              onChange={(e) =>
                setValues({ ...values, username: e.target.value })
              }
              className="form-control rounded-0"
              disabled={isLoading || authLoading}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="form-label">
              <strong>Password:</strong>
            </label>
            <input
              type="password"
              name="password"
              id="password"
              autoComplete="current-password"
              placeholder="Enter password"
              value={values.password}
              onChange={(e) =>
                setValues({ ...values, password: e.target.value })
              }
              className="form-control rounded-0"
              disabled={isLoading || authLoading}
            />
          </div>
          <button
            type="submit"
            className="btn btn-success w-100 rounded-0 mb-2"
            disabled={isLoading || authLoading}
          >
            {isLoading || authLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <small>API URL: {API_URL}</small>
          <p className="mt-2 mb-0">© 2025 HR & Payroll Management System</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
