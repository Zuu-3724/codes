import React, { useState } from "react";
import "./style.css";
import axios from "../config/axios";
import { API_ENDPOINTS } from "../config/api";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [values, setValues] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    axios
      .post(API_ENDPOINTS.adminLogin, values)
      .then((result) => {
        if (result.data.Status) {
          localStorage.setItem("token", result.data.token);
          navigate("/dashboard");
        } else {
          setError(result.data.Message);
        }
      })
      .catch((err) => {
        console.log(err);
        setError(err.response?.data?.Message || "Có lỗi xảy ra khi đăng nhập");
      });
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 loginPage">
      <div className="p-3 rounded w-25 border loginForm">
        <div className="text-warning">{error && error}</div>
        <h2>Login Page</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="username">
              <strong>Username:</strong>
            </label>
            <input
              type="username"
              name="username"
              autoComplete="off"
              placeholder="Enter Username"
              onChange={(e) =>
                setValues({ ...values, username: e.target.value })
              }
              className="form-control rounded-0"
            />
          </div>
          <div className="mb-3">
            <label htmlFor="password">
              <strong>Password:</strong>
            </label>
            <input
              type="password"
              name="password"
              placeholder="Enter Password"
              onChange={(e) =>
                setValues({ ...values, password: e.target.value })
              }
              className="form-control rounded-0"
            />
          </div>
          <button className="btn btn-success w-100 rounded-0 mb-2">
            Login
          </button>
          <div className="mb-1">
            <input type="checkbox" name="tick" id="tick" className="me-2" />
            <label htmlFor="password">
              You are Agree with terms & condition
            </label>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
