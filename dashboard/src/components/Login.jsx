import React, { useState, useEffect } from "react";
import "./style.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { TokenManager, authAPI } from "../config/api.config";

// Cấu hình bảo mật và API
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
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Kiểm tra xem người dùng đã đăng nhập chưa
  useEffect(() => {
    if (TokenManager.isAuthenticated()) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate input
    if (!values.username || !values.password) {
      setError("Please enter complete login information");
      setIsLoading(false);
      return;
    }

    try {
      console.log("Attempting login with:", values.username);

      // Using authAPI.login instead of direct axios call
      const response = await authAPI.login({
        username: values.username,
        password: values.password,
      });

      console.log("Login response:", response);

      if (response && response.Status) {
        console.log("Login successful");
        // TokenManager.setToken is already called in authAPI.login
        localStorage.setItem(
          SECURITY_CONFIG.AUTH.USER_KEY,
          JSON.stringify(response.Data)
        );
        navigate("/dashboard");
      } else {
        console.log("Login failed:", response.Message);
        setError(response.Message || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);

      // Handle direct error responses (non-HTTP errors)
      if (err.response && err.response.data) {
        const errorData = err.response.data;
        if (errorData.Message) {
          setError(errorData.Message);
          setIsLoading(false);
          return;
        }
      }

      // Detailed error display
      let errorMessage = "An error occurred during login";

      // Check for server error details
      if (err.data && err.data.Message) {
        errorMessage = err.data.Message;
      } else if (err.data && err.data.detail) {
        errorMessage = err.data.detail;
      } else if (err.message) {
        errorMessage = err.message;
      }

      // Xử lý các loại lỗi cụ thể
      if (err.status) {
        // Server trả về lỗi
        switch (err.status) {
          case 401:
            setError("Username or password is incorrect");
            break;
          case 403:
            setError("You don't have permission to access");
            break;
          case 404:
            setError("Account not found");
            break;
          case 422:
            setError("Invalid request format. Please try again.");
            break;
          case 429:
            setError("Too many login attempts. Please try again later");
            break;
          case 500:
            setError(`Server error: ${errorMessage}`);
            break;
          default:
            setError(errorMessage);
        }
      } else if (err.originalError?.code === "ECONNABORTED") {
        setError("Login request timed out. Please try again");
      } else if (err.isConnectionError) {
        setError(
          "Cannot connect to the server. Please check your network connection"
        );
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 loginPage">
      <div className="p-3 rounded w-25 border loginForm">
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="username">
              <strong>Username:</strong>
            </label>
            <input
              type="text"
              name="username"
              autoComplete="username"
              placeholder="Enter username"
              value={values.username}
              onChange={(e) =>
                setValues({ ...values, username: e.target.value })
              }
              className="form-control rounded-0"
              disabled={isLoading}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="password">
              <strong>Password:</strong>
            </label>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="Enter password"
              value={values.password}
              onChange={(e) =>
                setValues({ ...values, password: e.target.value })
              }
              className="form-control rounded-0"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            className="btn btn-success w-100 rounded-0 mb-2"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
          <div className="mb-1">
            <input
              type="checkbox"
              name="tick"
              id="tick"
              className="me-2"
              disabled={isLoading}
            />
            <label htmlFor="password">
              You agree to the terms and conditions
            </label>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
