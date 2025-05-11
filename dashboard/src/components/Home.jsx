import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { TokenManager, dashboardAPI } from "../config/api.config";
import {
  FaUsers,
  FaUserTie,
  FaMoneyBillWave,
  FaChartLine,
  FaSitemap,
  FaSync,
  FaDatabase,
  FaTachometerAlt,
  FaChartBar,
  FaExclamationTriangle,
  FaRegCalendarAlt,
  FaBriefcase,
  FaPercentage,
  FaBuilding,
  FaCoins,
  FaDollarSign,
  FaAward,
  FaUsersCog,
  FaFilter,
} from "react-icons/fa";
import { PageHeader, DashboardCard, NoDataMessage } from "./UI";

const Home = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isRetrying, setIsRetrying] = useState(false);
  const [usingDemoData, setUsingDemoData] = useState(false);
  const [dataSource, setDataSource] = useState("mysql"); // "mysql" or "sqlserver"

  // Helper function to safely access structure properties
  const getStructureValue = (key) => {
    if (!stats?.structure) return "-";
    const value = stats.structure[key];

    // Handle different types of values
    if (value === null || value === undefined) return "-";
    if (typeof value === "number") return value;
    if (typeof value === "string") return value;
    if (typeof value === "object") {
      // If it's an object and has a count or length property, use that
      if (value.count !== undefined) return value.count;
      if (value.length !== undefined) return value.length;
      if (value.total !== undefined) return value.total;
      if (value.value !== undefined) return value.value;
      // If we have totalDepartments in the object, use that for 'departments' key
      if (
        key === "departments" &&
        stats.structure.totalDepartments !== undefined
      ) {
        return stats.structure.totalDepartments;
      }
      // Return a number if possible, otherwise fall back to a dash
      return "-";
    }
    return "-";
  };

  // Create demo stats - make it a separate function
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
      console.log("Fetching real dashboard stats for year:", selectedYear);
      setDataSource("mysql"); // Default to MySQL as we're now using MySQL data

      // Fetch actual data from server
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
  }, [selectedYear, createDemoStats]);

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

  // Header actions for PageHeader
  const headerActions = [
    {
      icon: <FaSync />,
      label: "Refresh",
      onClick: handleRetry,
      variant: "outline-primary",
      disabled: isRetrying,
    },
  ];

  return (
    <div className="container-fluid px-4">
      <PageHeader
        icon={<FaTachometerAlt className="me-2" />}
        title="Dashboard Overview"
        actions={headerActions}
        loading={loading}
      />

      {/* Period selector */}
      <div className="row mb-4">
        <div className="col-lg-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h5 className="card-title mb-3">
                    <FaFilter className="me-2" />
                    Report Period
                  </h5>
                </div>
              </div>
              <div className="row">
                <div className="col-md-3">
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaRegCalendarAlt />
                    </span>
                    <select
                      className="form-select"
                      value={selectedYear}
                      onChange={handleYearChange}
                    >
                      {[2022, 2023, 2024, 2025].map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {usingDemoData && (
        <div className="alert alert-warning d-flex align-items-center mb-4">
          <FaExclamationTriangle className="me-2" />
          <div>
            <strong>Cannot connect to the database server.</strong> Displaying
            sample data so you can view and test the interface.
            <button
              className="btn btn-sm btn-outline-warning ms-3"
              onClick={handleRetry}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading dashboard data...</p>
        </div>
      ) : error ? (
        <NoDataMessage
          title="Error Loading Dashboard Data"
          message={error}
          type="warning"
          onAction={handleRetry}
          actionText="Try Again"
        />
      ) : stats ? (
        <>
          {/* Employee Statistics */}
          <section className="mb-4 fade-in">
            <h5 className="text-primary mb-3">
              <FaUsers className="me-2" />
              Employee Statistics
            </h5>
            <div className="row">
              <div className="col-md-3">
                <DashboardCard
                  icon={<FaUsers />}
                  title="Total Employees"
                  value={stats.employees.overall.totalEmployees}
                  subtitle="Current staff count"
                  colorScheme="blue"
                />
              </div>
              <div className="col-md-3">
                <DashboardCard
                  icon={<FaBriefcase />}
                  title="New Hires"
                  value={stats.employees.overall.totalNewHires}
                  subtitle={`${selectedYear}`}
                  colorScheme="green"
                />
              </div>
              <div className="col-md-3">
                <DashboardCard
                  icon={<FaPercentage />}
                  title="Turnover Rate"
                  value={`${stats.employees.overall.turnoverRate}%`}
                  subtitle="Annual rate"
                  colorScheme="orange"
                />
              </div>
              <div className="col-md-3">
                <DashboardCard
                  icon={<FaBuilding />}
                  title="Departments"
                  value={getStructureValue("departments")}
                  subtitle="Total count"
                  colorScheme="purple"
                />
              </div>
            </div>
          </section>

          {/* Salary Statistics */}
          <section className="mb-4 fade-in">
            <h5 className="text-success mb-3">
              <FaMoneyBillWave className="me-2" />
              Payroll Statistics
            </h5>
            <div className="row">
              <div className="col-md-3">
                <DashboardCard
                  icon={<FaCoins />}
                  title="Total Payroll"
                  value={new Intl.NumberFormat("en-US", {
                    notation: "compact",
                    compactDisplay: "short",
                  }).format(stats.salary.totalPayroll)}
                  subtitle="VND / month"
                  colorScheme="green"
                />
              </div>
              <div className="col-md-3">
                <DashboardCard
                  icon={<FaMoneyBillWave />}
                  title="Average Salary"
                  value={new Intl.NumberFormat("en-US", {
                    notation: "compact",
                    compactDisplay: "short",
                  }).format(stats.salary.averageSalary)}
                  subtitle="VND / month"
                  colorScheme="teal"
                />
              </div>
              <div className="col-md-3">
                <DashboardCard
                  icon={<FaDollarSign />}
                  title="Highest Salary"
                  value={new Intl.NumberFormat("en-US", {
                    notation: "compact",
                    compactDisplay: "short",
                  }).format(stats.salary.highestSalary)}
                  subtitle="VND / month"
                  colorScheme="indigo"
                />
              </div>
              <div className="col-md-3">
                <DashboardCard
                  icon={<FaAward />}
                  title="Total Bonuses"
                  value={new Intl.NumberFormat("en-US", {
                    notation: "compact",
                    compactDisplay: "short",
                  }).format(stats.salary.totalBonuses)}
                  subtitle="VND / year"
                  colorScheme="pink"
                />
              </div>
            </div>
          </section>

          {/* Organization Structure */}
          <section className="mb-4 fade-in">
            <h5 className="text-info mb-3">
              <FaSitemap className="me-2" />
              Organization Structure
            </h5>
            <div className="row">
              <div className="col-md-4">
                <DashboardCard
                  icon={<FaSitemap />}
                  title="Total Departments"
                  value={getStructureValue("totalDepartments")}
                  colorScheme="blue"
                />
              </div>
              <div className="col-md-4">
                <DashboardCard
                  icon={<FaUserTie />}
                  title="Total Positions"
                  value={getStructureValue("totalPositions")}
                  colorScheme="purple"
                />
              </div>
              <div className="col-md-4">
                <DashboardCard
                  icon={<FaUsersCog />}
                  title="Average Team Size"
                  value={getStructureValue("avgTeamSize")}
                  colorScheme="indigo"
                />
              </div>
            </div>
          </section>

          {/* Department Breakdown */}
          <div className="card border-0 shadow-sm mb-4 fade-in">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <FaChartBar className="me-2" /> Department Employee Distribution
              </h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Department</th>
                      <th>Employees</th>
                      <th>Distribution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.employees.byDepartment.map((dept) => (
                      <tr key={dept.name}>
                        <td className="fw-medium">{dept.name}</td>
                        <td>{dept.count}</td>
                        <td style={{ width: "50%" }}>
                          <div className="progress" style={{ height: "20px" }}>
                            <div
                              className="progress-bar bg-success"
                              role="progressbar"
                              style={{
                                width: `${Math.round(
                                  (dept.count /
                                    stats.employees.overall.totalEmployees) *
                                    100
                                )}%`,
                              }}
                              aria-valuenow={dept.count}
                              aria-valuemin="0"
                              aria-valuemax={
                                stats.employees.overall.totalEmployees
                              }
                            >
                              {Math.round(
                                (dept.count /
                                  stats.employees.overall.totalEmployees) *
                                  100
                              )}
                              %
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default Home;
