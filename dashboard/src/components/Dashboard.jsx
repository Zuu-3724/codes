import React from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import axios from "axios";
import { TokenManager } from "../config/api.config";

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const response = await axios.get("http://localhost:9000/auth/logout", {
        withCredentials: true,
      });

      if (response.data.Status) {
        TokenManager.removeToken();
        navigate("/login");
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Remove token regardless of error
      TokenManager.removeToken();
      navigate("/login");
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    const config = getAuthConfig(navigate);
    if (!config) return;

    try {
      // Thử kết nối với database để lấy dữ liệu dashboard
      const response = await axios.get(
        "http://localhost:9000/dashboard",
        config
      );

      if (response.data.Status) {
        const data = response.data.Data;
        setStatsData({
          employees: data.totalEmployees || 0,
          departments: data.totalDepartments || 0,
          attendance: data.attendanceRate || 0,
          payroll: data.totalPayroll || 0,
        });

        setChartData({
          attendanceData: data.attendanceChart || demoAttendanceData,
          departmentData: data.departmentChart || demoDepartmentData,
        });

        setRecentActivity(data.recentActivities || []);
        setError(null);
        setUsingDemoData(false);
      } else {
        throw new Error("Could not fetch dashboard data from database");
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);

      if (error.response?.status === 401) {
        navigate("/login");
        return;
      }

      // Nếu không kết nối được database, sử dụng demo data
      setStatsData({
        employees: 145,
        departments: 8,
        attendance: 92,
        payroll: 450000000,
      });

      setChartData({
        attendanceData: demoAttendanceData,
        departmentData: demoDepartmentData,
      });

      setRecentActivity([
        {
          id: 1,
          type: "employee",
          action: "added",
          name: "Nguyễn Văn A",
          timestamp: "2023-04-28T09:30:00",
          department: "IT",
        },
        {
          id: 2,
          type: "payroll",
          action: "processed",
          name: "Payroll April 2023",
          timestamp: "2023-04-27T15:20:00",
        },
        {
          id: 3,
          type: "attendance",
          action: "updated",
          name: "Trần Thị B",
          timestamp: "2023-04-27T10:15:00",
          department: "HR",
        },
        {
          id: 4,
          type: "employee",
          action: "updated",
          name: "Lê Văn C",
          timestamp: "2023-04-26T14:45:00",
          department: "Finance",
        },
        {
          id: 5,
          type: "department",
          action: "added",
          name: "Marketing",
          timestamp: "2023-04-25T11:30:00",
        },
      ]);

      setUsingDemoData(true);
      setError(
        "Đang sử dụng dữ liệu demo do không kết nối được tới máy chủ cơ sở dữ liệu"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid">
      <div className="row flex-nowrap">
        <div className="col-auto col-md-3 col-xl-2 px-sm-2 px-0 bg-dark">
          <div className="d-flex flex-column align-items-center align-items-sm-start px-3 pt-2 text-white min-vh-100">
            <Link
              to="/dashboard"
              className="d-flex align-items-center pb-3 mb-md-1 mt-md-3 me-md-auto text-white text-decoration-none"
            >
              <span className="fs-5 fw-bolder d-none d-sm-inline">
                Dashboard
              </span>
            </Link>
            <ul
              className="nav nav-pills flex-column mb-sm-auto mb-0 align-items-center align-items-sm-start"
              id="menu"
            >
              <li className="w-100">
                <Link
                  to="/dashboard/employees"
                  className="nav-link text-white px-0 align-middle"
                >
                  <i className="fs-4 bi-people ms-2"></i>
                  <span className="ms-2 d-none d-sm-inline">
                    Employee Management
                  </span>
                </Link>
              </li>
              <li className="w-100">
                <Link
                  to="/dashboard/payroll"
                  className="nav-link text-white px-0 align-middle"
                >
                  <i className="fs-4 bi-cash ms-2"></i>
                  <span className="ms-2 d-none d-sm-inline">
                    Payroll Management
                  </span>
                </Link>
              </li>
              <li className="w-100">
                <Link
                  to="/dashboard/attendance"
                  className="nav-link text-white px-0 align-middle"
                >
                  <i className="fs-4 bi-calendar-check ms-2"></i>
                  <span className="ms-2 d-none d-sm-inline">
                    Attendance Tracking
                  </span>
                </Link>
              </li>
              <li className="w-100">
                <Link
                  to="/dashboard/departments"
                  className="nav-link text-white px-0 align-middle"
                >
                  <i className="fs-4 bi-diagram-3 ms-2"></i>
                  <span className="ms-2 d-none d-sm-inline">
                    Departments & Positions
                  </span>
                </Link>
              </li>
              <li className="w-100">
                <Link
                  to="/dashboard/reports"
                  className="nav-link text-white px-0 align-middle"
                >
                  <i className="fs-4 bi-bar-chart ms-2"></i>
                  <span className="ms-2 d-none d-sm-inline">
                    Reports & Analytics
                  </span>
                </Link>
              </li>
              <li className="w-100">
                <Link
                  to="/dashboard/alerts"
                  className="nav-link text-white px-0 align-middle"
                >
                  <i className="fs-4 bi-bell ms-2"></i>
                  <span className="ms-2 d-none d-sm-inline">
                    Alerts & Notifications
                  </span>
                </Link>
              </li>
              <li className="w-100">
                <Link
                  to="/dashboard/security"
                  className="nav-link text-white px-0 align-middle"
                >
                  <i className="fs-4 bi-shield-lock ms-2"></i>
                  <span className="ms-2 d-none d-sm-inline">
                    Security & Permissions
                  </span>
                </Link>
              </li>
              <li className="w-100" onClick={handleLogout}>
                <button className="nav-link px-0 align-middle text-white border-0 bg-transparent">
                  <i className="fs-4 bi-power ms-2"></i>
                  <span className="ms-2 d-none d-sm-inline">Logout</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div className="col p-0 m-0">
          <div className="p-2 d-flex justify-content-center shadow">
            <h4>HR & Payroll Management System</h4>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
