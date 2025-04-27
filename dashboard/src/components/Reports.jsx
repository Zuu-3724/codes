import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaChartBar,
  FaUsers,
  FaMoneyBillWave,
  FaChartLine,
  FaDownload,
  FaSitemap,
} from "react-icons/fa";
import { getAuthConfig } from "../config/api.config";
import { useNavigate } from "react-router-dom";

const Reports = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
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
      } else {
        setError("Failed to load reports. Please try again later.");
      }
    } catch (error) {
      console.error("Failed to load reports:", error);
      setError("Failed to load reports. Please try again later.");
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="container-fluid px-4">
      <h1 className="mt-4 mb-4">Reports & Statistics</h1>

      {error && (
        <div
          className="alert alert-danger alert-dismissible fade show"
          role="alert"
        >
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError(null)}
          ></button>
        </div>
      )}

      {/* Tab Navigation */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${
              activeTab === "human_reports" ? "active" : ""
            }`}
            onClick={() => setActiveTab("human_reports")}
          >
            HUMAN Reports
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${
              activeTab === "payroll_reports" ? "active" : ""
            }`}
            onClick={() => setActiveTab("payroll_reports")}
          >
            PAYROLL Reports
          </button>
        </li>
      </ul>

      {/* Year Filter */}
      <div className="row mb-4">
        <div className="col-md-2">
          <div className="input-group">
            <span className="input-group-text">
              <i className="bi bi-calendar-event"></i>
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

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading report data...</p>
        </div>
      ) : (
        reportData && (
          <div className="row">
            {/* Employee Statistics */}
            <div className="col-md-6 mb-4">
              <div className="card h-100">
                <div className="card-header">
                  <h5 className="mb-0">Employee Statistics</h5>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="card bg-primary text-white">
                        <div className="card-body text-center">
                          <h2>{reportData.overall.totalEmployees}</h2>
                          <p className="mb-0">Total Employees</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="card bg-success text-white">
                        <div className="card-body text-center">
                          <h2>{reportData.overall.totalNewHires}</h2>
                          <p className="mb-0">New Hires</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="card bg-warning text-dark">
                        <div className="card-body text-center">
                          <h2>{reportData.overall.turnoverRate}%</h2>
                          <p className="mb-0">Turnover Rate</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="card bg-info text-white">
                        <div className="card-body text-center">
                          <h2>
                            {reportData.overall.averageSalary.toLocaleString()}
                          </h2>
                          <p className="mb-0">Average Salary</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Department Distribution */}
            <div className="col-md-6 mb-4">
              <div className="card h-100">
                <div className="card-header">
                  <h5 className="mb-0">Department Distribution</h5>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
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
                                <div className="progress">
                                  <div
                                    className="progress-bar"
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

            {/* Salary Statistics */}
            <div className="col-md-12 mb-4">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Payroll Statistics</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-3">
                      <div className="card bg-dark text-white">
                        <div className="card-body text-center">
                          <h2>
                            {reportData.salaryStats.totalPayroll.toLocaleString()}
                          </h2>
                          <p className="mb-0">Total Payroll</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card bg-secondary text-white">
                        <div className="card-body text-center">
                          <h2>
                            {reportData.salaryStats.averageSalary.toLocaleString()}
                          </h2>
                          <p className="mb-0">Average Salary</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card bg-danger text-white">
                        <div className="card-body text-center">
                          <h2>
                            {reportData.salaryStats.highestSalary.toLocaleString()}
                          </h2>
                          <p className="mb-0">Highest Salary</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card bg-primary text-white">
                        <div className="card-body text-center">
                          <h2>
                            {reportData.salaryStats.totalBonuses.toLocaleString()}
                          </h2>
                          <p className="mb-0">Total Bonuses</p>
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

export default Reports;
