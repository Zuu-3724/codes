import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaCalendarAlt,
  FaUserClock,
  FaCalendarCheck,
  FaCalendarTimes,
  FaSpinner,
  FaDownload,
  FaExclamationTriangle,
} from "react-icons/fa";
import {
  getAuthConfig,
  checkServerConnection,
  demoDataAPI,
} from "../config/api.config";
import { useNavigate } from "react-router-dom";

const Attendance = () => {
  const navigate = useNavigate();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [departments, setDepartments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [activeTab, setActiveTab] = useState("monthly");
  const [usingDemoData, setUsingDemoData] = useState(false);

  useEffect(() => {
    fetchAttendanceData();
    fetchDepartments();
  }, [navigate, month, year, activeTab]);

  const fetchAttendanceData = async () => {
    setLoading(true);
    setError(null);

    const config = getAuthConfig(navigate);
    if (!config) return;

    try {
      // Use test endpoint instead of trying to access the database
      const response = await axios.get(
        `http://localhost:9000/payroll/test`,
        config
      );

      if (response.data.Status) {
        setAttendanceRecords(response.data.Data);
        setUsingDemoData(true);
        setError(
          "Đang sử dụng dữ liệu mẫu. Hệ thống đang trong giai đoạn phát triển."
        );
      } else {
        throw new Error("Could not fetch attendance data from database");
      }
    } catch (error) {
      console.error("Error fetching attendance data:", error);

      if (error.response?.status === 401) {
        navigate("/login");
        return;
      }

      // Khi không kết nối được database, sử dụng demo data
      console.log("Using demo attendance data");
      const demoData = [
        {
          AttendanceID: 1,
          EmployeeID: "E001",
          EmployeeName: "Nguyễn Văn A",
          Date: "2025-04-27",
          TimeIn: "08:02",
          TimeOut: "17:30",
          Status: "Present",
          Department: "IT",
        },
        {
          AttendanceID: 2,
          EmployeeID: "E002",
          EmployeeName: "Trần Thị B",
          Date: "2025-04-27",
          TimeIn: "08:15",
          TimeOut: "17:45",
          Status: "Present",
          Department: "HR",
        },
        {
          AttendanceID: 3,
          EmployeeID: "E003",
          EmployeeName: "Lê Văn C",
          Date: "2025-04-27",
          TimeIn: "07:58",
          TimeOut: "17:20",
          Status: "Present",
          Department: "Finance",
        },
        {
          AttendanceID: 4,
          EmployeeID: "E002",
          EmployeeName: "Trần Thị B",
          Date: "2025-04-28",
          TimeIn: "09:10",
          TimeOut: "17:15",
          Status: "Late",
          Department: "HR",
        },
        {
          AttendanceID: 5,
          EmployeeID: "E003",
          EmployeeName: "Lê Văn C",
          Date: "2025-04-28",
          TimeIn: "",
          TimeOut: "",
          Status: "Absent",
          Department: "Finance",
        },
      ];
      setAttendanceRecords(demoData);
      setUsingDemoData(true);
      setError(
        "Đang sử dụng dữ liệu demo do không kết nối được tới máy chủ cơ sở dữ liệu"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    const config = getAuthConfig(navigate);
    if (!config) return;

    try {
      // Use the test endpoint instead of trying to access the real database
      const response = await axios.get(
        "http://localhost:9000/departments/test",
        config
      );

      if (response.data.Status) {
        // Transform the data to match the expected format
        const deptData = response.data.Data.map((dept) => ({
          id: dept.id,
          name: dept.name,
        }));
        setDepartments(deptData);
      } else {
        throw new Error("Failed to fetch departments");
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      // Sử dụng demo departments nếu không kết nối được
      const demoDepts = [
        { id: 1, name: "IT" },
        { id: 2, name: "HR" },
        { id: 3, name: "Finance" },
        { id: 4, name: "Sales" },
        { id: 5, name: "Marketing" },
      ];
      setDepartments(demoDepts);
    }
  };

  const exportAttendanceReport = async () => {
    const config = getAuthConfig(navigate);
    if (!config) return;

    try {
      const response = await axios.get(
        `http://localhost:9000/attendance/export/${year}/${month}`,
        {
          ...config,
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `attendance-report-${year}-${month}.xlsx`);
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      alert("Attendance report downloaded successfully");
    } catch (error) {
      console.error("Error exporting attendance report:", error);
      alert("Failed to export attendance report. Please try again later.");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      fetchAttendanceData();
    }
  };

  const getFilteredRecords = () => {
    return attendanceRecords.filter((record) => {
      const matchesEmployee =
        record.EmployeeName?.toLowerCase().includes(
          employeeFilter.toLowerCase()
        ) ||
        (typeof record.EmployeeID === "string" &&
          record.EmployeeID.toLowerCase().includes(
            employeeFilter.toLowerCase()
          )) ||
        (record.EmployeeID !== undefined &&
          record.EmployeeID.toString().includes(employeeFilter));
      const matchesDepartment =
        departmentFilter === "" || record.Department === departmentFilter;

      return matchesEmployee && matchesDepartment;
    });
  };

  const filteredRecords = getFilteredRecords();

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "present":
        return "bg-success";
      case "absent":
        return "bg-danger";
      case "late":
        return "bg-warning";
      case "leave":
        return "bg-info";
      default:
        return "bg-secondary";
    }
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

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - 2 + i
  );

  return (
    <div className="container-fluid px-4">
      <h1 className="mt-4 mb-4">
        <FaCalendarAlt className="me-2" />
        Attendance Management
      </h1>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
          <button
            className="btn-close float-end"
            onClick={() => setError(null)}
          ></button>
        </div>
      )}

      {usingDemoData && (
        <div className="alert alert-warning d-flex align-items-center">
          <FaExclamationTriangle className="me-2" />
          <div>
            Sử dụng dữ liệu mẫu. Một số tính năng có thể không hoạt động đầy đủ.
            <button
              className="btn btn-sm btn-outline-secondary ms-3"
              onClick={() => {
                fetchAttendanceData();
                fetchDepartments();
              }}
            >
              Thử lại kết nối
            </button>
          </div>
        </div>
      )}

      {/* Filter Controls */}
      <div className="row mb-4">
        <div className="col-md-9">
          <div className="card shadow">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-md-3">
                  <select
                    className="form-select"
                    value={month}
                    onChange={(e) => setMonth(parseInt(e.target.value))}
                  >
                    {months.map((name, index) => (
                      <option key={index} value={index + 1}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <select
                    className="form-select"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search Employee"
                    value={employeeFilter}
                    onChange={(e) => setEmployeeFilter(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                </div>
                <div className="col-md-3">
                  <select
                    className="form-select"
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                  >
                    <option value="">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-1">
                  <button
                    className="btn btn-primary w-100"
                    onClick={fetchAttendanceData}
                  >
                    <FaCalendarCheck />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <button
            className="btn btn-success w-100 h-100"
            onClick={exportAttendanceReport}
          >
            <FaDownload className="me-2" /> Export Report
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "monthly" ? "active" : ""}`}
            onClick={() => setActiveTab("monthly")}
          >
            <FaCalendarAlt className="me-2" /> Monthly View
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "daily" ? "active" : ""}`}
            onClick={() => setActiveTab("daily")}
          >
            <FaUserClock className="me-2" /> Daily View
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "summary" ? "active" : ""}`}
            onClick={() => setActiveTab("summary")}
          >
            <FaCalendarCheck className="me-2" /> Summary
          </button>
        </li>
      </ul>

      {loading ? (
        <div className="text-center py-5">
          <FaSpinner className="fa-spin me-2" size={24} />
          <p className="mt-2">Loading attendance data...</p>
        </div>
      ) : activeTab === "summary" ? (
        <div className="row">
          {/* Summary View */}
          {summary && (
            <>
              <div className="col-md-12 mb-4">
                <div className="card shadow">
                  <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">
                      Overall Attendance Summary - {months[month - 1]} {year}
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-3 text-center">
                        <div className="card bg-light p-3">
                          <h2>{summary.overallStats.totalEmployees}</h2>
                          <p className="mb-0">Total Employees</p>
                        </div>
                      </div>
                      <div className="col-md-3 text-center">
                        <div className="card bg-success text-white p-3">
                          <h2>
                            {summary.overallStats.averagePresentRate.toFixed(1)}
                            %
                          </h2>
                          <p className="mb-0">Average Presence</p>
                        </div>
                      </div>
                      <div className="col-md-3 text-center">
                        <div className="card bg-danger text-white p-3">
                          <h2>
                            {summary.overallStats.averageAbsentRate.toFixed(1)}%
                          </h2>
                          <p className="mb-0">Average Absence</p>
                        </div>
                      </div>
                      <div className="col-md-3 text-center">
                        <div className="card bg-warning text-dark p-3">
                          <h2>
                            {summary.overallStats.averageLateRate.toFixed(1)}%
                          </h2>
                          <p className="mb-0">Average Late</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-12">
                <div className="card shadow">
                  <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">Department Attendance Statistics</h5>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-striped">
                        <thead>
                          <tr>
                            <th>Department</th>
                            <th>Present Rate</th>
                            <th>Absent Rate</th>
                            <th>Late Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summary.departmentStats.map((dept, index) => (
                            <tr key={index}>
                              <td>{dept.department}</td>
                              <td>
                                <div className="progress">
                                  <div
                                    className="progress-bar bg-success"
                                    role="progressbar"
                                    style={{ width: `${dept.presentRate}%` }}
                                    aria-valuenow={dept.presentRate}
                                    aria-valuemin="0"
                                    aria-valuemax="100"
                                  >
                                    {dept.presentRate}%
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="progress">
                                  <div
                                    className="progress-bar bg-danger"
                                    role="progressbar"
                                    style={{ width: `${dept.absentRate}%` }}
                                    aria-valuenow={dept.absentRate}
                                    aria-valuemin="0"
                                    aria-valuemax="100"
                                  >
                                    {dept.absentRate}%
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="progress">
                                  <div
                                    className="progress-bar bg-warning"
                                    role="progressbar"
                                    style={{ width: `${dept.lateRate}%` }}
                                    aria-valuenow={dept.lateRate}
                                    aria-valuemin="0"
                                    aria-valuemax="100"
                                  >
                                    {dept.lateRate}%
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
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="card shadow">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">
              {activeTab === "monthly"
                ? "Monthly Attendance Record"
                : "Daily Attendance Record"}{" "}
              - {months[month - 1]} {year}
            </h5>
          </div>
          <div className="card-body">
            {filteredRecords.length === 0 ? (
              <div className="alert alert-info">
                No attendance records found for the selected criteria.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Employee ID</th>
                      <th>Employee Name</th>
                      <th>Department</th>
                      {activeTab === "daily" && <th>Date</th>}
                      <th>Status</th>
                      {activeTab === "daily" && (
                        <>
                          <th>Check In</th>
                          <th>Check Out</th>
                        </>
                      )}
                      <th>Work Hours</th>
                      {activeTab === "daily" ? (
                        <>
                          <th>Late (min)</th>
                          <th>OT (hrs)</th>
                        </>
                      ) : (
                        <>
                          <th>Present Days</th>
                          <th>Absent Days</th>
                          <th>Late Days</th>
                          <th>Leave Days</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((record) => (
                      <tr key={record.AttendanceID}>
                        <td>{record.EmployeeID}</td>
                        <td>{record.EmployeeName}</td>
                        <td>{record.Department}</td>
                        {activeTab === "daily" && (
                          <td>{new Date(record.Date).toLocaleDateString()}</td>
                        )}
                        <td>
                          <span
                            className={`badge ${getStatusClass(record.Status)}`}
                          >
                            {record.Status}
                          </span>
                        </td>
                        {activeTab === "daily" && (
                          <>
                            <td>{record.TimeIn || "N/A"}</td>
                            <td>{record.TimeOut || "N/A"}</td>
                          </>
                        )}
                        <td>{record.WorkHours?.toFixed(1) || "0.0"}</td>
                        {activeTab === "daily" ? (
                          <>
                            <td>{record.LateMinutes || "0"}</td>
                            <td>{record.Overtime || "0"}</td>
                          </>
                        ) : (
                          <>
                            <td>{record.PresentDays || "0"}</td>
                            <td>{record.AbsentDays || "0"}</td>
                            <td>{record.LateDays || "0"}</td>
                            <td>{record.LeaveDays || "0"}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
