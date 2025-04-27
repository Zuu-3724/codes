import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  TokenManager,
  checkServerConnection,
  dashboardAPI,
} from "../config/api.config";
import {
  FaUsers,
  FaUserTie,
  FaMoneyBillWave,
  FaChartLine,
  FaSitemap,
  FaSync,
  FaServer,
  FaExclamationTriangle,
  FaDatabase,
} from "react-icons/fa";
import ServerStatus from "./ServerStatus";

const Home = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isRetrying, setIsRetrying] = useState(false);
  const [serverStatus, setServerStatus] = useState("checking"); // "checking", "online", "offline"
  const [usingDemoData, setUsingDemoData] = useState(false);
  const [dataSource, setDataSource] = useState("mysql"); // "mysql" or "sqlserver"

  // Check server connection
  const checkBackendStatus = useCallback(async () => {
    try {
      setServerStatus("checking");
      const isConnected = await checkServerConnection();
      setServerStatus(isConnected ? "online" : "offline");
      return isConnected;
    } catch (error) {
      console.error("Server status check failed:", error);
      setServerStatus("offline");
      return false;
    }
  }, []);

  // Create demo stats - di chuyển thành function riêng
  const createDemoStats = useCallback(() => {
    return {
      employees: {
        overall: {
          totalEmployees: 43,
          totalNewHires: 5,
          turnoverRate: 8.2,
        },
        byDepartment: [
          { name: "HR", count: 8 },
          { name: "Finance", count: 12 },
          { name: "IT", count: 15 },
          { name: "Sales", count: 8 },
        ],
      },
      salary: {
        totalPayroll: 423000000,
        averageSalary: 9837209,
        highestSalary: 24500000,
        totalBonuses: 37890000,
      },
      structure: {
        departments: 6,
        positions: 12,
        totalDepartments: 6,
        totalPositions: 12,
        totalManagers: 6,
        avgTeamSize: 7.2,
      },
    };
  }, []);

  // Fetch dashboard stats
  const fetchDashboardStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUsingDemoData(false);

    try {
      // Kiểm tra kết nối server
      const isServerConnected = await checkBackendStatus();

      // Nếu server không kết nối được, sử dụng dữ liệu demo
      if (!isServerConnected) {
        console.log("Server offline, using demo data");
        setUsingDemoData(true);
        setStats(createDemoStats());
        setLoading(false);
        return;
      }

      console.log("Fetching real dashboard stats for year:", selectedYear);
      setDataSource("mysql"); // Default to MySQL as we're now using MySQL data

      // Fetch dữ liệu thực từ server
      try {
        const [employeeStats, salaryStats, structureStats] = await Promise.all([
          dashboardAPI.getEmployeeStatsMysql(selectedYear),
          dashboardAPI.getSalaryStatsMysql(selectedYear),
          dashboardAPI.getOrganizationStatsMysql(),
        ]);

        console.log("MySQL stats loaded:", {
          employeeStats,
          salaryStats,
          structureStats,
        });

        // Combine stats into single structure
        setStats({
          employees: employeeStats,
          salary: salaryStats,
          structure: structureStats,
        });
      } catch (error) {
        console.error("Error loading MySQL stats:", error);

        // Try SQL Server data as fallback if MySQL failed
        console.log("Trying SQL Server data instead...");
        setDataSource("sqlserver");

        try {
          const [employeeStats, salaryStats, structureStats] =
            await Promise.all([
              dashboardAPI.getEmployeeStats(selectedYear),
              dashboardAPI.getSalaryStats(selectedYear),
              dashboardAPI.getOrganizationStats(),
            ]);

          console.log("SQL Server stats loaded as fallback");

          // Combine stats into single structure
          setStats({
            employees: employeeStats,
            salary: salaryStats,
            structure: structureStats,
          });
        } catch (sqlError) {
          console.error("SQL Server data also failed:", sqlError);
          throw new Error("Failed to load data from both MySQL and SQL Server");
        }
      }
    } catch (error) {
      console.error("Error in fetchDashboardStats:", error);
      setError(error.message || "Failed to load dashboard data");
      setUsingDemoData(true);
      setStats(createDemoStats());
    } finally {
      setLoading(false);
    }
  }, [selectedYear, checkBackendStatus, createDemoStats]);

  // Kiểm tra kết nối server định kỳ
  useEffect(() => {
    const checkConnectionInterval = setInterval(async () => {
      if (serverStatus === "offline") {
        console.log("Kiểm tra kết nối tự động...");
        const isConnected = await checkBackendStatus();
        if (isConnected && serverStatus === "offline") {
          console.log("Kết nối server đã được khôi phục!");
          setRetryCount((prev) => prev + 1); // Kích hoạt tải lại dữ liệu
        }
      }
    }, 30000); // Kiểm tra mỗi 30 giây

    return () => clearInterval(checkConnectionInterval);
  }, [serverStatus, checkBackendStatus]);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats, selectedYear, retryCount]);

  const handleRetry = () => {
    setIsRetrying(true);
    setRetryCount((prev) => prev + 1);
    setTimeout(() => setIsRetrying(false), 2000);
  };

  const handleYearChange = (e) => {
    setSelectedYear(parseInt(e.target.value));
  };

  return (
    <div className="container-fluid mt-3 px-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Dashboard</h2>
        <div className="d-flex align-items-center">
          {serverStatus === "online" && !usingDemoData && (
            <span className="me-3">
              <FaDatabase className="text-primary me-1" />
              <small>
                Data Source: {dataSource === "mysql" ? "MySQL" : "SQL Server"}
              </small>
            </span>
          )}

          <select
            className="form-select form-select-sm me-2"
            value={selectedYear}
            onChange={handleYearChange}
            style={{ width: "auto" }}
          >
            {[2022, 2023, 2024, 2025].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <button
            className="btn btn-sm btn-outline-secondary d-flex align-items-center"
            onClick={handleRetry}
            disabled={isRetrying}
          >
            <FaSync
              className={`me-1 ${isRetrying ? "rotate-animation" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      <ServerStatus />

      {serverStatus === "checking" && (
        <div className="alert alert-info">
          <div className="spinner-border spinner-border-sm me-2" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          Checking server connection...
        </div>
      )}

      {serverStatus === "offline" && (
        <div className="alert alert-danger d-flex align-items-center">
          <FaServer className="me-2" />
          <div>
            Server connection unavailable. Cannot load dashboard data.
            <button
              className="btn btn-sm btn-outline-secondary ms-3"
              onClick={handleRetry}
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {usingDemoData && (
        <div className="alert alert-warning d-flex align-items-center">
          <FaExclamationTriangle className="me-2" />
          <div>
            Sử dụng dữ liệu mẫu. Một số tính năng có thể không hoạt động đầy đủ.
            <button
              className="btn btn-sm btn-outline-secondary ms-3"
              onClick={handleRetry}
            >
              Thử kết nối đến máy chủ
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading dashboard statistics...</p>
        </div>
      ) : (
        stats && (
          <div>
            {/* Employee Stats Row */}
            <div className="row mb-4">
              <div className="col-md-12">
                <div className="card">
                  <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">
                      <FaUsers className="me-2" /> Employee Overview
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-9">
                        <div className="row">
                          <div className="col-md-4">
                            <div className="border rounded p-3 text-center mb-3">
                              <h6 className="text-muted">Total Employees</h6>
                              <h3>{stats.employees.overall.totalEmployees}</h3>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="border rounded p-3 text-center mb-3">
                              <h6 className="text-muted">
                                New Hires ({selectedYear})
                              </h6>
                              <h3>{stats.employees.overall.totalNewHires}</h3>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="border rounded p-3 text-center mb-3">
                              <h6 className="text-muted">Turnover Rate</h6>
                              <h3>{stats.employees.overall.turnoverRate}%</h3>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <h6>Department Distribution</h6>
                        <ul className="list-group">
                          {stats.employees.byDepartment.map((dept, index) => (
                            <li
                              key={index}
                              className="list-group-item d-flex justify-content-between align-items-center"
                            >
                              {dept.name}
                              <span className="badge bg-primary rounded-pill">
                                {dept.count}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Salary and Structure Stats Row */}
            <div className="row">
              <div className="col-md-6 mb-4">
                <div className="card h-100">
                  <div className="card-header bg-success text-white">
                    <h5 className="mb-0">
                      <FaMoneyBillWave className="me-2" /> Payroll Overview
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="border rounded p-3 text-center mb-3">
                          <h6 className="text-muted">Total Payroll</h6>
                          <h3>
                            {new Intl.NumberFormat("en-US").format(
                              stats.salary.totalPayroll
                            )}{" "}
                            VND
                          </h3>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="border rounded p-3 text-center mb-3">
                          <h6 className="text-muted">Average Salary</h6>
                          <h3>
                            {new Intl.NumberFormat("en-US").format(
                              stats.salary.averageSalary
                            )}{" "}
                            VND
                          </h3>
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="border rounded p-3 text-center">
                          <h6 className="text-muted">Highest Salary</h6>
                          <h3>
                            {new Intl.NumberFormat("en-US").format(
                              stats.salary.highestSalary
                            )}{" "}
                            VND
                          </h3>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="border rounded p-3 text-center">
                          <h6 className="text-muted">Total Bonuses</h6>
                          <h3>
                            {new Intl.NumberFormat("en-US").format(
                              stats.salary.totalBonuses
                            )}{" "}
                            VND
                          </h3>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-6 mb-4">
                <div className="card h-100">
                  <div className="card-header bg-info text-white">
                    <h5 className="mb-0">
                      <FaSitemap className="me-2" /> Organization Structure
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="border rounded p-3 text-center mb-3">
                          <h6 className="text-muted">Total Departments</h6>
                          <h3>{stats.structure.totalDepartments}</h3>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="border rounded p-3 text-center mb-3">
                          <h6 className="text-muted">Total Positions</h6>
                          <h3>{stats.structure.totalPositions}</h3>
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="border rounded p-3 text-center">
                          <h6 className="text-muted">Total Managers</h6>
                          <h3>{stats.structure.totalManagers}</h3>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="border rounded p-3 text-center">
                          <h6 className="text-muted">Avg Team Size</h6>
                          <h3>{stats.structure.avgTeamSize}</h3>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default Home;
