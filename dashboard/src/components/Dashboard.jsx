import React from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import axios from "axios";
import { TokenManager, API_URL } from "../config/api.config";
import { useAuth } from "../config/AuthContext";
// Import modern React icons
import {
  FaUsers,
  FaUserTie,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaSitemap,
  FaChartBar,
  FaBell,
  FaShieldAlt,
  FaUserCircle,
  FaServer,
  FaSignOutAlt,
  FaTachometerAlt,
} from "react-icons/fa";

const Dashboard = () => {
  const navigate = useNavigate();
  const { logout, user, permissions } = useAuth();

  const handleLogout = async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/logout`, {
        withCredentials: true,
      });

      if (response.data.Status) {
        TokenManager.removeToken();
        logout();
        navigate("/login");
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Remove token regardless of error
      TokenManager.removeToken();
      logout();
      navigate("/login");
    }
  };

  const getUserRoleLabel = () => {
    if (!user || !user.role) return "Guest";
    return user.role;
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
    <div className="container-fluid dashboard-container">
      <div className="row">
        {/* Enhanced Sidebar with better styling and modern icons */}
        <div className="col-auto col-md-3 col-xl-2 px-sm-2 px-0 bg-dark sidebar-container">
          <div className="d-flex flex-column align-items-center align-items-sm-start px-2 pt-2 text-white h-100">
            <Link
              to="/dashboard"
              className="d-flex align-items-center pb-2 mb-md-1 mt-md-2 me-md-auto text-white text-decoration-none"
            >
              <FaTachometerAlt className="fs-4 me-2" />
              <span className="fs-5 fw-bolder d-none d-sm-inline">
                HR & Payroll
              </span>
            </Link>

            <hr className="bg-light d-sm-none w-100 my-2" />

            <ul
              className="nav nav-pills flex-column mb-0 align-items-center align-items-sm-start w-100"
              id="menu"
            >
              {/* All users can view employees, but with role-based filtering */}
              {permissions.canViewEmployees() && (
                <li className="nav-item w-100">
                  <Link
                    to="/dashboard/employees"
                    className="nav-link text-white px-2 align-middle d-flex align-items-center"
                  >
                    <FaUsers className="fs-5 ms-1 me-2" />
                    <span className="ms-1 d-none d-sm-inline">
                      Employee Management
                    </span>
                  </Link>
                </li>
              )}

              {/* All users can view payroll, but with role-based filtering */}
              {permissions.canViewPayroll() && (
                <li className="nav-item w-100">
                  <Link
                    to="/dashboard/payroll"
                    className="nav-link text-white px-2 align-middle d-flex align-items-center"
                  >
                    <FaMoneyBillWave className="fs-5 ms-1 me-2" />
                    <span className="ms-1 d-none d-sm-inline">
                      Payroll Management
                    </span>
                  </Link>
                </li>
              )}

              {/* All users can view attendance, but with role-based filtering */}
              <li className="nav-item w-100">
                <Link
                  to="/dashboard/attendance"
                  className="nav-link text-white px-2 align-middle d-flex align-items-center"
                >
                  <FaCalendarAlt className="fs-5 ms-1 me-2" />
                  <span className="ms-1 d-none d-sm-inline">
                    Attendance Tracking
                  </span>
                </Link>
              </li>

              {/* Only Admin and HR Manager can view departments */}
              {permissions.canManageEmployees() && (
                <li className="nav-item w-100">
                  <Link
                    to="/dashboard/departments"
                    className="nav-link text-white px-2 align-middle d-flex align-items-center"
                  >
                    <FaSitemap className="fs-5 ms-1 me-2" />
                    <span className="ms-1 d-none d-sm-inline">
                      Departments & Positions
                    </span>
                  </Link>
                </li>
              )}

              {/* All users can view reports */}
              {permissions.canViewReports() && (
                <li className="nav-item w-100">
                  <Link
                    to="/dashboard/reports"
                    className="nav-link text-white px-2 align-middle d-flex align-items-center"
                  >
                    <FaChartBar className="fs-5 ms-1 me-2" />
                    <span className="ms-1 d-none d-sm-inline">
                      Reports & Statistics
                    </span>
                  </Link>
                </li>
              )}

              {/* All users can view alerts */}
              <li className="nav-item w-100">
                <Link
                  to="/dashboard/alerts"
                  className="nav-link text-white px-2 align-middle d-flex align-items-center"
                >
                  <FaBell className="fs-5 ms-1 me-2" />
                  <span className="ms-1 d-none d-sm-inline">
                    Alerts & Notifications
                  </span>
                </Link>
              </li>

              {/* Only Admin can view security settings */}
              {permissions.canManageSecurity() && (
                <li className="nav-item w-100">
                  <Link
                    to="/dashboard/security"
                    className="nav-link text-white px-2 align-middle d-flex align-items-center"
                  >
                    <FaShieldAlt className="fs-5 ms-1 me-2" />
                    <span className="ms-1 d-none d-sm-inline">
                      Security & Permissions
                    </span>
                  </Link>
                </li>
              )}

              {/* Only Admin can view server status */}
              {permissions.isAdmin() && (
                <li className="nav-item w-100">
                  <Link
                    to="/dashboard/server"
                    className="nav-link text-white px-2 align-middle d-flex align-items-center"
                  >
                    <FaServer className="fs-5 ms-1 me-2" />
                    <span className="ms-1 d-none d-sm-inline">
                      Server Config
                    </span>
                  </Link>
                </li>
              )}
            </ul>

            <hr className="bg-light w-100 my-2" />

            <div className="dropdown pb-3 w-100">
              <a
                href="#"
                className="d-flex align-items-center text-white text-decoration-none dropdown-toggle"
                id="dropdownUser1"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <FaUserCircle className="rounded-circle me-2 fs-4" />
                <span className="d-none d-sm-inline mx-1">
                  {user?.username || "User"}
                </span>
              </a>
              <ul
                className="dropdown-menu dropdown-menu-dark text-small shadow"
                aria-labelledby="dropdownUser1"
              >
                <li>
                  <Link className="dropdown-item" to="/dashboard/profile">
                    <span className="me-2">👤</span> Profile
                  </Link>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <a className="dropdown-item" href="#" onClick={handleLogout}>
                    <FaSignOutAlt className="me-2" /> Sign out
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="col py-3 content-area">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
