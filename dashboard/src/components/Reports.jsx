import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaChartBar,
  FaUsers,
  FaMoneyBillWave,
  FaChartLine,
  FaDownload,
  FaSitemap,
  FaExclamationTriangle,
  FaExclamationCircle,
  FaBusinessTime,
  FaPercentage,
  FaFilter,
  FaSync,
  FaFileExport,
  FaRegCalendarAlt,
} from "react-icons/fa";
import { getAuthConfig } from "../config/api.config";
import { useNavigate } from "react-router-dom";
import { PageHeader, NoDataMessage, DashboardCard } from "./UI";

const Reports = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [usingDemoData, setUsingDemoData] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchReportData();
  }, [year, activeTab]);

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);

    try {
      const config = getAuthConfig(navigate);
      if (!config) return;

      // Use the test endpoint instead of the real endpoints
      const response = await axios.get(
        `http://localhost:9000/reports/test`,
        config
      );

      if (response.data.Status) {
        setReportData(response.data.Data);
        setUsingDemoData(true);
      } else {
        setError("Failed to load reports. Please try again later.");
      }
    } catch (error) {
      console.error("Failed to load reports:", error);
      // Use demo data when server connection fails
      setReportData(getDemoReportData());
      setUsingDemoData(true);
    } finally {
      setLoading(false);
    }
  };

  const getDemoReportData = () => {
    return {
      overall: {
        totalEmployees: 43,
        totalNewHires: 5,
        turnoverRate: 8.2,
        averageSalary: 9837209,
      },
      byDepartment: [
        { name: "HR", count: 8 },
        { name: "Finance", count: 12 },
        { name: "IT", count: 15 },
        { name: "Sales", count: 8 },
      ],
      monthlySalary: [
        { month: "Jan", amount: 410000000 },
        { month: "Feb", amount: 415000000 },
        { month: "Mar", amount: 418000000 },
        { month: "Apr", amount: 420000000 },
        { month: "May", amount: 422000000 },
        { month: "Jun", amount: 423000000 },
      ],
    };
  };

  const handleExportReport = async (reportType) => {
    try {
      const config = getAuthConfig(navigate);
      if (!config) return;

      config.responseType = "blob";
      const response = await axios.get(
        `http://localhost:9000/reports/export/${reportType}?year=${year}`,
        config
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${reportType}-report-${year}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error exporting report:", error);
      setError("Failed to export report. Please try again later.");
    }
  };

  // Header actions for PageHeader component
  const headerActions = [
    {
      icon: <FaFileExport />,
      label: "Export All Reports",
      onClick: () => handleExportReport("all"),
      variant: "success",
    },
    {
      icon: <FaSync />,
      label: "Refresh",
      onClick: fetchReportData,
      variant: "outline-primary",
    },
  ];

  return (
    <div className="container-fluid px-4">
      <PageHeader
        icon={<FaChartBar className="me-2" />}
        title="Reports & Statistics"
        actions={headerActions}
        loading={loading}
      />

      {usingDemoData && (
        <div className="alert alert-warning d-flex align-items-center mb-4">
          <FaExclamationTriangle className="me-2" />
          <div>
            <strong>Using sample data.</strong> The system is currently in
            development phase.
          </div>
        </div>
      )}

      {error && (
        <div
          className="alert alert-danger alert-dismissible fade show"
          role="alert"
        >
          <FaExclamationCircle className="me-2" />
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError(null)}
          ></button>
        </div>
      )}

      {/* Time period selector */}
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
                      value={year}
                      onChange={(e) => setYear(parseInt(e.target.value))}
                    >
                      {Array.from(
                        { length: 5 },
                        (_, i) => new Date().getFullYear() - 2 + i
                      ).map((y) => (
                        <option key={y} value={y}>
                          {y}
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

      {/* Tab Navigation */}
      <ul className="nav nav-pills mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <FaChartBar className="me-1" /> Overview
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${
              activeTab === "human_reports" ? "active" : ""
            }`}
            onClick={() => setActiveTab("human_reports")}
          >
            <FaUsers className="me-1" /> HR Reports
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${
              activeTab === "payroll_reports" ? "active" : ""
            }`}
            onClick={() => setActiveTab("payroll_reports")}
          >
            <FaMoneyBillWave className="me-1" /> Payroll Reports
          </button>
        </li>
      </ul>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading report data...</p>
        </div>
      ) : reportData ? (
        <div className="row">
          {/* Summary Cards */}
          <div className="col-12 mb-4">
            <div className="row">
              <div className="col-md-3">
                <DashboardCard
                  icon={<FaUsers />}
                  title="Total Employees"
                  value={reportData.overall.totalEmployees}
                  subtitle="Current staff count"
                  colorScheme="blue"
                />
              </div>
              <div className="col-md-3">
                <DashboardCard
                  icon={<FaBusinessTime />}
                  title="New Hires"
                  value={reportData.overall.totalNewHires}
                  subtitle={`${year}`}
                  colorScheme="green"
                />
              </div>
              <div className="col-md-3">
                <DashboardCard
                  icon={<FaPercentage />}
                  title="Turnover Rate"
                  value={`${reportData.overall.turnoverRate}%`}
                  subtitle="Annual rate"
                  colorScheme="orange"
                />
              </div>
              <div className="col-md-3">
                <DashboardCard
                  icon={<FaMoneyBillWave />}
                  title="Average Salary"
                  value={new Intl.NumberFormat("en-US").format(
                    reportData.overall.averageSalary
                  )}
                  subtitle="VND / month"
                  colorScheme="purple"
                />
              </div>
            </div>
          </div>

          {/* Employee Statistics & Department Distribution */}
          {activeTab === "overview" && (
            <>
              {/* Department Distribution */}
              <div className="col-12 mb-4">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">
                      <FaSitemap className="me-2" />
                      Department Distribution
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-hover align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>Department</th>
                            <th>Employees</th>
                            <th>Percentage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.byDepartment.map((dept, index) => {
                            const percentage =
                              (dept.count / reportData.overall.totalEmployees) *
                              100;
                            return (
                              <tr key={index}>
                                <td>{dept.name}</td>
                                <td>{dept.count}</td>
                                <td>
                                  <div
                                    className="progress"
                                    style={{ height: "20px" }}
                                  >
                                    <div
                                      className="progress-bar bg-success"
                                      role="progressbar"
                                      style={{ width: `${percentage}%` }}
                                      aria-valuenow={percentage}
                                      aria-valuemin="0"
                                      aria-valuemax="100"
                                    >
                                      {percentage.toFixed(1)}%
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly Salary Chart */}
              <div className="col-12 mb-4">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">
                      <FaMoneyBillWave className="me-2" />
                      Monthly Salary Expenditure
                    </h5>
                  </div>
                  <div className="card-body">
                    <div
                      className="chart-container"
                      style={{ height: "300px" }}
                    >
                      <div className="text-center fw-bold mb-3">
                        Salary Expenditure for {year}
                      </div>
                      <div className="progress-stacked">
                        {reportData.monthlySalary.map((monthData, index) => (
                          <div key={index} className="progress-month">
                            <div className="month-label">{monthData.month}</div>
                            <div
                              className="progress mb-3"
                              style={{ height: "30px" }}
                            >
                              <div
                                className="progress-bar bg-success"
                                style={{
                                  width: `${
                                    (monthData.amount / 450000000) * 100
                                  }%`,
                                }}
                              >
                                {new Intl.NumberFormat("en-US").format(
                                  monthData.amount
                                )}{" "}
                                VND
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Specific Report Sections */}
          {activeTab === "human_reports" && (
            <div className="col-12 mb-4">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <FaUsers className="me-2" />
                    Human Resources Reports
                  </h5>
                  <button
                    className="btn btn-sm btn-light"
                    onClick={() => handleExportReport("hr")}
                  >
                    <FaDownload className="me-2" /> Export HR Reports
                  </button>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-3 mb-3">
                      <div className="card h-100 shadow-sm">
                        <div className="card-body text-center">
                          <div className="display-4 mb-3 text-primary">
                            <FaUsers />
                          </div>
                          <h4>Employee List</h4>
                          <p className="text-muted">
                            Complete list of all employees with details
                          </p>
                          <button
                            className="btn btn-primary"
                            onClick={() => handleExportReport("employees")}
                          >
                            <FaDownload className="me-2" /> Generate
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3 mb-3">
                      <div className="card h-100 shadow-sm">
                        <div className="card-body text-center">
                          <div className="display-4 mb-3 text-success">
                            <FaSitemap />
                          </div>
                          <h4>Department Report</h4>
                          <p className="text-muted">
                            Employees grouped by department
                          </p>
                          <button
                            className="btn btn-success"
                            onClick={() => handleExportReport("departments")}
                          >
                            <FaDownload className="me-2" /> Generate
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3 mb-3">
                      <div className="card h-100 shadow-sm">
                        <div className="card-body text-center">
                          <div className="display-4 mb-3 text-warning">
                            <FaChartLine />
                          </div>
                          <h4>Turnover Report</h4>
                          <p className="text-muted">
                            Employee turnover statistics
                          </p>
                          <button
                            className="btn btn-warning text-white"
                            onClick={() => handleExportReport("turnover")}
                          >
                            <FaDownload className="me-2" /> Generate
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3 mb-3">
                      <div className="card h-100 shadow-sm">
                        <div className="card-body text-center">
                          <div className="display-4 mb-3 text-info">
                            <FaUsers />
                          </div>
                          <h4>New Hires</h4>
                          <p className="text-muted">
                            Report of new employees for selected year
                          </p>
                          <button
                            className="btn btn-info text-white"
                            onClick={() => handleExportReport("new-hires")}
                          >
                            <FaDownload className="me-2" /> Generate
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "payroll_reports" && (
            <div className="col-12 mb-4">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <FaMoneyBillWave className="me-2" />
                    Payroll Reports
                  </h5>
                  <button
                    className="btn btn-sm btn-light"
                    onClick={() => handleExportReport("payroll")}
                  >
                    <FaDownload className="me-2" /> Export Payroll Reports
                  </button>
                </div>
                <div className="card-body">
                  <div className="row mb-4">
                    <div className="col-md-3 mb-3">
                      <div className="card h-100 shadow-sm">
                        <div className="card-body text-center">
                          <div className="display-4 mb-3 text-success">
                            <FaMoneyBillWave />
                          </div>
                          <h4>Salary Report</h4>
                          <p className="text-muted">
                            Full payroll report for all employees
                          </p>
                          <button
                            className="btn btn-success"
                            onClick={() => handleExportReport("salary")}
                          >
                            <FaDownload className="me-2" /> Generate
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3 mb-3">
                      <div className="card h-100 shadow-sm">
                        <div className="card-body text-center">
                          <div className="display-4 mb-3 text-primary">
                            <FaChartBar />
                          </div>
                          <h4>Department Costs</h4>
                          <p className="text-muted">
                            Salary costs by department
                          </p>
                          <button
                            className="btn btn-primary"
                            onClick={() =>
                              handleExportReport("department-costs")
                            }
                          >
                            <FaDownload className="me-2" /> Generate
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3 mb-3">
                      <div className="card h-100 shadow-sm">
                        <div className="card-body text-center">
                          <div className="display-4 mb-3 text-warning">
                            <FaMoneyBillWave />
                          </div>
                          <h4>Bonuses Report</h4>
                          <p className="text-muted">
                            All bonuses paid in the selected year
                          </p>
                          <button
                            className="btn btn-warning text-white"
                            onClick={() => handleExportReport("bonuses")}
                          >
                            <FaDownload className="me-2" /> Generate
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3 mb-3">
                      <div className="card h-100 shadow-sm">
                        <div className="card-body text-center">
                          <div className="display-4 mb-3 text-info">
                            <FaChartLine />
                          </div>
                          <h4>Annual Summary</h4>
                          <p className="text-muted">
                            Annual payroll summary statistics
                          </p>
                          <button
                            className="btn btn-info text-white"
                            onClick={() => handleExportReport("annual-summary")}
                          >
                            <FaDownload className="me-2" /> Generate
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Monthly Salary Chart */}
                  <div className="card mb-4 shadow-sm">
                    <div className="card-header bg-light">
                      <h5 className="mb-0">Monthly Salary Expenditure</h5>
                    </div>
                    <div className="card-body">
                      <div
                        className="chart-container"
                        style={{ height: "300px" }}
                      >
                        <div className="text-center fw-bold mb-3">
                          Salary Expenditure for {year}
                        </div>
                        <div className="progress-stacked">
                          {reportData.monthlySalary.map((monthData, index) => (
                            <div key={index} className="progress-month">
                              <div className="month-label">
                                {monthData.month}
                              </div>
                              <div
                                className="progress mb-3"
                                style={{ height: "30px" }}
                              >
                                <div
                                  className="progress-bar bg-success"
                                  style={{
                                    width: `${
                                      (monthData.amount / 450000000) * 100
                                    }%`,
                                  }}
                                >
                                  {new Intl.NumberFormat("en-US").format(
                                    monthData.amount
                                  )}{" "}
                                  VND
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <NoDataMessage
          title="No Report Data Available"
          message="We couldn't load the report data. Please try again later."
          type="warning"
          onAction={fetchReportData}
          actionText="Try Again"
        />
      )}
    </div>
  );
};

export default Reports;
