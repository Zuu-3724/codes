import React, { useState, useEffect } from "react";
import {
  FaMoneyBillWave,
  FaExclamationTriangle,
  FaRedo,
  FaFilter,
  FaFileInvoiceDollar,
  FaUserTie,
  FaBuilding,
  FaCalendarAlt,
  FaSearch,
  FaChartLine,
} from "react-icons/fa";

const Payroll = () => {
  console.log("Payroll component mounted - rendering basic payroll page");
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState("April");
  const [currentYear, setCurrentYear] = useState("2025");
  const [payrollData, setPayrollData] = useState([
    {
      PayrollID: 1,
      EmployeeID: 1,
      EmployeeName: "John Smith",
      Department: "IT",
      Month: "April",
      Year: "2025",
      BasicSalary: 15000000,
      Allowances: 500000,
      Deductions: 0,
      NetSalary: 16500000,
      Status: "Paid",
    },
    {
      PayrollID: 2,
      EmployeeID: 2,
      EmployeeName: "Mary Johnson",
      Department: "Accounting",
      Month: "April",
      Year: "2025",
      BasicSalary: 18000000,
      Allowances: 600000,
      Deductions: 100000,
      NetSalary: 20200000,
      Status: "Paid",
    },
    {
      PayrollID: 3,
      EmployeeID: 3,
      EmployeeName: "David Wilson",
      Department: "Human Resources",
      Month: "April",
      Year: "2025",
      BasicSalary: 12000000,
      Allowances: 450000,
      Deductions: 50000,
      NetSalary: 13100000,
      Status: "Processing",
    },
  ]);

  useEffect(() => {
    console.log("Payroll useEffect triggered - basic version");
    // Set loading to false after 1 second to test rendering
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleRetry = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1500);
  };

  const statusBadgeColor = (status) => {
    switch (status) {
      case "Paid":
        return "bg-success";
      case "Processing":
        return "bg-warning";
      case "Pending":
        return "bg-secondary";
      default:
        return "bg-info";
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US").format(amount) + " VND";
  };

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const years = ["2023", "2024", "2025", "2026"];

  return (
    <div className="container-fluid px-4 py-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          <FaMoneyBillWave className="text-success me-2" />
          Payroll Management
        </h2>
        <div className="d-flex">
          <button
            className="btn btn-outline-primary me-2"
            onClick={handleRetry}
          >
            <FaRedo className={loading ? "me-2 fa-spin" : "me-2"} /> Refresh
          </button>
        </div>
      </div>

      {/* Server connection notification */}
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

      {/* Payroll Filter Section */}
      <div className="card mb-4 border-0 shadow-sm">
        <div className="card-header bg-primary text-white">
          <FaFilter className="me-2" /> Filter Payroll Data
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <label
                htmlFor="month"
                className="form-label d-flex align-items-center"
              >
                <FaCalendarAlt className="me-2 text-primary" /> Month
              </label>
              <select
                className="form-select"
                id="month"
                value={currentMonth}
                onChange={(e) => setCurrentMonth(e.target.value)}
              >
                {months.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label
                htmlFor="year"
                className="form-label d-flex align-items-center"
              >
                <FaCalendarAlt className="me-2 text-primary" /> Year
              </label>
              <select
                className="form-select"
                id="year"
                value={currentYear}
                onChange={(e) => setCurrentYear(e.target.value)}
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label
                htmlFor="search"
                className="form-label d-flex align-items-center"
              >
                <FaSearch className="me-2 text-primary" /> Search Employees
              </label>
              <input
                type="text"
                className="form-control"
                id="search"
                placeholder="Enter employee name..."
              />
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button className="btn btn-primary w-100">
                <FaSearch className="me-2" /> Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payroll Summary Cards */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6">
          <div
            className="card border-0 shadow-sm mb-3 bg-gradient h-100"
            style={{
              background: "linear-gradient(to right, #4facfe, #00f2fe)",
            }}
          >
            <div className="card-body text-white">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="text-white mb-0">Total Employees</h5>
                  <h2 className="my-2 text-white">{payrollData.length}</h2>
                  <p className="mb-0 small">
                    {currentMonth} {currentYear}
                  </p>
                </div>
                <div>
                  <FaUserTie
                    className="text-white opacity-75"
                    style={{ fontSize: "3rem" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div
            className="card border-0 shadow-sm mb-3 bg-gradient h-100"
            style={{
              background: "linear-gradient(to right, #43e97b, #38f9d7)",
            }}
          >
            <div className="card-body text-white">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="text-white mb-0">Total Base Salary</h5>
                  <h2 className="my-2 text-white">
                    {formatCurrency(
                      payrollData.reduce(
                        (sum, item) => sum + item.BasicSalary,
                        0
                      )
                    )}
                  </h2>
                  <p className="mb-0 small">
                    {currentMonth} {currentYear}
                  </p>
                </div>
                <div>
                  <FaFileInvoiceDollar
                    className="text-white opacity-75"
                    style={{ fontSize: "3rem" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div
            className="card border-0 shadow-sm mb-3 bg-gradient h-100"
            style={{
              background: "linear-gradient(to right, #fa709a, #fee140)",
            }}
          >
            <div className="card-body text-white">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="text-white mb-0">Total Allowances</h5>
                  <h2 className="my-2 text-white">
                    {formatCurrency(
                      payrollData.reduce(
                        (sum, item) => sum + item.Allowances,
                        0
                      )
                    )}
                  </h2>
                  <p className="mb-0 small">
                    {currentMonth} {currentYear}
                  </p>
                </div>
                <div>
                  <FaChartLine
                    className="text-white opacity-75"
                    style={{ fontSize: "3rem" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div
            className="card border-0 shadow-sm mb-3 bg-gradient h-100"
            style={{
              background: "linear-gradient(to right, #6a11cb, #2575fc)",
            }}
          >
            <div className="card-body text-white">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="text-white mb-0">Total Salary</h5>
                  <h2 className="my-2 text-white">
                    {formatCurrency(
                      payrollData.reduce((sum, item) => sum + item.NetSalary, 0)
                    )}
                  </h2>
                  <p className="mb-0 small">
                    {currentMonth} {currentYear}
                  </p>
                </div>
                <div>
                  <FaMoneyBillWave
                    className="text-white opacity-75"
                    style={{ fontSize: "3rem" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0 text-primary">
            <FaMoneyBillWave className="me-2" />
            Salary Information
          </h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>EMPLOYEE</th>
                  <th>DEPARTMENT</th>
                  <th>BASE SALARY</th>
                  <th>TOTAL SALARY</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {payrollData.map((item, index) => (
                  <tr key={item.PayrollID}>
                    <td>{index + 1}</td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="bg-light rounded-circle p-2 me-3">
                          <FaUserTie className="text-primary" />
                        </div>
                        {item.EmployeeName}
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <FaBuilding className="text-secondary me-2" />
                        {item.Department}
                      </div>
                    </td>
                    <td>{formatCurrency(item.BasicSalary)}</td>
                    <td>{formatCurrency(item.NetSalary)}</td>
                    <td>
                      <span
                        className={`badge ${statusBadgeColor(item.Status)}`}
                      >
                        {item.Status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payroll;
