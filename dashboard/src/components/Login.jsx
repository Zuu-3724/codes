import React, { useState, useEffect } from "react";
import "./style.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { TokenManager } from "../config/api.config";

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
    username: "",
    password: "",
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
      const response = await axios({
        method: "post",
        url: "http://localhost:9000/auth/login",
        data: values,
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: SECURITY_CONFIG.CORS.CREDENTIALS,
        timeout: 10000,
      });

      if (response.data.Status) {
        console.log("Login successful");
        // Lưu token và thông tin user
        if (response.data.token) {
          TokenManager.setToken(response.data.token);
        }
        localStorage.setItem(
          SECURITY_CONFIG.AUTH.USER_KEY,
          JSON.stringify(response.data.Data)
        );
        navigate("/dashboard");
      } else {
        console.log("Login failed:", response.data.Message);
        setError(response.data.Message || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);

      // Xử lý các loại lỗi cụ thể
      if (err.response) {
        // Server trả về lỗi
        switch (err.response.status) {
          case 401:
            setError("Username or password is incorrect");
            break;
          case 403:
            setError("You don't have permission to access");
            break;
          case 404:
            setError("Account not found");
            break;
          case 429:
            setError("Too many login attempts. Please try again later");
            break;
          case 500:
            setError("Server error, please try again later");
            break;
          default:
            setError(
              err.response.data?.Message || "An error occurred during login"
            );
        }
      } else if (err.code === "ECONNABORTED") {
        setError("Login request timed out. Please try again");
      } else if (err.request) {
        setError(
          "Cannot connect to the server. Please check your network connection"
        );
      } else {
        setError("An error occurred while sending the login request");
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
