import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaChartBar,
  FaUsers,
  FaMoneyBillWave,
  FaChartLine,
  FaDownload,
} from "react-icons/fa";

const Reports = () => {
  const [employeeStats, setEmployeeStats] = useState(null);
  const [salaryStats, setSalaryStats] = useState(null);
  const [dividendStats, setDividendStats] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchReports();
  }, [selectedYear]);

  const fetchReports = async () => {
    try {
      // Fetch employee statistics
      const employeeResponse = await axios.get(
        `http://localhost:3000/auth/employee-stats?year=${selectedYear}`
      );
      if (employeeResponse.data.Status) {
        setEmployeeStats(employeeResponse.data.Data);
      }

      // Fetch salary statistics
      const salaryResponse = await axios.get(
        `http://localhost:3000/auth/salary-stats?year=${selectedYear}`
      );
      if (salaryResponse.data.Status) {
        setSalaryStats(salaryResponse.data.Data);
      }

      // Fetch dividend statistics
      const dividendResponse = await axios.get(
        `http://localhost:3000/auth/dividend-stats?year=${selectedYear}`
      );
      if (dividendResponse.data.Status) {
        setDividendStats(dividendResponse.data.Data);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  };

  const handleExportReport = async (reportType) => {
    try {
      const response = await axios.get(
        `http://localhost:3000/auth/export-report/${reportType}?year=${selectedYear}`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${reportType}-report-${selectedYear}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error exporting report:", error);
      alert("Failed to export report");
    }
  };

  return (
    <div className="container-fluid px-4">
      <h1 className="mt-4 mb-4">Consolidated Reports</h1>

      {/* Year Selection */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text">
              <FaChartBar />
            </span>
            <select
              className="form-control"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            >
              {Array.from(
                { length: 5 },
                (_, i) => new Date().getFullYear() - i
              ).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Employee Statistics */}
      <div className="card shadow mb-4">
        <div className="card-header py-3 d-flex justify-content-between align-items-center">
          <h6 className="m-0 font-weight-bold text-primary">
            Employee Statistics
          </h6>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => handleExportReport("employee")}
          >
            <FaDownload className="me-1" /> Export
          </button>
        </div>
        <div className="card-body">
          {employeeStats && (
            <div className="row">
              <div className="col-md-4">
                <div className="card border-left-primary shadow h-100 py-2">
                  <div className="card-body">
                    <div className="row no-gutters align-items-center">
                      <div className="col mr-2">
                        <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                          Total Employees
                        </div>
                        <div className="h5 mb-0 font-weight-bold text-gray-800">
                          {employeeStats.totalEmployees}
                        </div>
                      </div>
                      <div className="col-auto">
                        <FaUsers className="fa-2x text-gray-300" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card border-left-success shadow h-100 py-2">
                  <div className="card-body">
                    <div className="row no-gutters align-items-center">
                      <div className="col mr-2">
                        <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                          New Hires
                        </div>
                        <div className="h5 mb-0 font-weight-bold text-gray-800">
                          {employeeStats.newHires}
                        </div>
                      </div>
                      <div className="col-auto">
                        <FaUsers className="fa-2x text-gray-300" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card border-left-danger shadow h-100 py-2">
                  <div className="card-body">
                    <div className="row no-gutters align-items-center">
                      <div className="col mr-2">
                        <div className="text-xs font-weight-bold text-danger text-uppercase mb-1">
                          Turnover Rate
                        </div>
                        <div className="h5 mb-0 font-weight-bold text-gray-800">
                          {employeeStats.turnoverRate}%
                        </div>
                      </div>
                      <div className="col-auto">
                        <FaUsers className="fa-2x text-gray-300" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Salary Statistics */}
      <div className="card shadow mb-4">
        <div className="card-header py-3 d-flex justify-content-between align-items-center">
          <h6 className="m-0 font-weight-bold text-primary">
            Salary Statistics
          </h6>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => handleExportReport("salary")}
          >
            <FaDownload className="me-1" /> Export
          </button>
        </div>
        <div className="card-body">
          {salaryStats && (
            <div className="row">
              <div className="col-md-4">
                <div className="card border-left-primary shadow h-100 py-2">
                  <div className="card-body">
                    <div className="row no-gutters align-items-center">
                      <div className="col mr-2">
                        <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                          Total Payroll
                        </div>
                        <div className="h5 mb-0 font-weight-bold text-gray-800">
                          ${salaryStats.totalPayroll.toLocaleString()}
                        </div>
                      </div>
                      <div className="col-auto">
                        <FaMoneyBillWave className="fa-2x text-gray-300" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card border-left-success shadow h-100 py-2">
                  <div className="card-body">
                    <div className="row no-gutters align-items-center">
                      <div className="col mr-2">
                        <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                          Average Salary
                        </div>
                        <div className="h5 mb-0 font-weight-bold text-gray-800">
                          ${salaryStats.averageSalary.toLocaleString()}
                        </div>
                      </div>
                      <div className="col-auto">
                        <FaMoneyBillWave className="fa-2x text-gray-300" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card border-left-info shadow h-100 py-2">
                  <div className="card-body">
                    <div className="row no-gutters align-items-center">
                      <div className="col mr-2">
                        <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                          Salary Increase
                        </div>
                        <div className="h5 mb-0 font-weight-bold text-gray-800">
                          {salaryStats.salaryIncrease}%
                        </div>
                      </div>
                      <div className="col-auto">
                        <FaChartLine className="fa-2x text-gray-300" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dividend Statistics */}
      <div className="card shadow mb-4">
        <div className="card-header py-3 d-flex justify-content-between align-items-center">
          <h6 className="m-0 font-weight-bold text-primary">
            Dividend Statistics
          </h6>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => handleExportReport("dividend")}
          >
            <FaDownload className="me-1" /> Export
          </button>
        </div>
        <div className="card-body">
          {dividendStats && (
            <div className="row">
              <div className="col-md-4">
                <div className="card border-left-primary shadow h-100 py-2">
                  <div className="card-body">
                    <div className="row no-gutters align-items-center">
                      <div className="col mr-2">
                        <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                          Total Dividends
                        </div>
                        <div className="h5 mb-0 font-weight-bold text-gray-800">
                          ${dividendStats.totalDividends.toLocaleString()}
                        </div>
                      </div>
                      <div className="col-auto">
                        <FaMoneyBillWave className="fa-2x text-gray-300" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card border-left-success shadow h-100 py-2">
                  <div className="card-body">
                    <div className="row no-gutters align-items-center">
                      <div className="col mr-2">
                        <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                          Dividend per Share
                        </div>
                        <div className="h5 mb-0 font-weight-bold text-gray-800">
                          ${dividendStats.dividendPerShare.toLocaleString()}
                        </div>
                      </div>
                      <div className="col-auto">
                        <FaMoneyBillWave className="fa-2x text-gray-300" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card border-left-info shadow h-100 py-2">
                  <div className="card-body">
                    <div className="row no-gutters align-items-center">
                      <div className="col mr-2">
                        <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                          Dividend Yield
                        </div>
                        <div className="h5 mb-0 font-weight-bold text-gray-800">
                          {dividendStats.dividendYield}%
                        </div>
                      </div>
                      <div className="col-auto">
                        <FaChartLine className="fa-2x text-gray-300" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
