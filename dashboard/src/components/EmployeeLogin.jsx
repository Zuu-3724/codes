import React, { useState } from "react";
import "./style.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const EmployeeLogin = () => {
  const [values, setValues] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  axios.defaults.withCredentials = true;

  const handleSubmit = (event) => {
    event.preventDefault();
    axios
      .post("http://localhost:3000/auth/login", values)
      .then((result) => {
        if (result.data.success) {
          localStorage.setItem("token", result.data.token); // Lưu token thay vì valid
          localStorage.setItem("user", JSON.stringify(result.data.user)); // Lưu thông tin user
          navigate("/dashboard"); // Chuyển đến trang dashboard
        } else {
          setError(result.data.message);
        }
      })
      .catch((err) => {
        console.log(err);
        setError(err.response?.data?.message || "An error occurred");
      });
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 loginPage">
      <div className="p-3 rounded w-25 border loginForm">
        {error && <div className="alert alert-danger">{error}</div>}
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="username">
              <strong>Username:</strong>
            </label>
            <input
              type="text" // Đổi type từ email sang text
              name="username"
              autoComplete="off"
              placeholder="Enter username"
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
              placeholder="Enter password"
              onChange={(e) =>
                setValues({ ...values, password: e.target.value })
              }
              className="form-control rounded-0"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary w-100 rounded-0 mb-2"
            disabled={!values.username || !values.password} // Disable nút khi chưa nhập đủ thông tin
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default EmployeeLogin;
