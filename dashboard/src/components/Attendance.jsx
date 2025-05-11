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
  FaFilter,
  FaSync,
  FaSearch,
  FaCalendarDay,
  FaCalendarWeek,
} from "react-icons/fa";
import {
  getAuthConfig,
  checkServerConnection,
  demoDataAPI,
} from "../config/api.config";
import { useNavigate } from "react-router-dom";
import { PageHeader, NoDataMessage, DashboardCard } from "./UI";

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
  const [attendanceSummary, setAttendanceSummary] = useState({
    present: 0,
    absent: 0,
    late: 0,
    leave: 0,
  });

  useEffect(() => {
    fetchAttendanceData();
    fetchDepartments();
  }, [navigate, month, year, activeTab]);

  useEffect(() => {
    // Calculate summary when records change
    if (attendanceRecords.length > 0) {
      const present = attendanceRecords.filter(
        (r) => r.Status === "Present"
      ).length;
      const absent = attendanceRecords.filter(
        (r) => r.Status === "Absent"
      ).length;
      const late = attendanceRecords.filter((r) => r.Status === "Late").length;
      const leave = attendanceRecords.filter(
        (r) => r.Status === "Leave"
      ).length;

      setAttendanceSummary({
        present,
        absent,
        late,
        leave,
      });
    }
  }, [attendanceRecords]);

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
        setError("Using sample data. The system is currently in development.");
      } else {
        throw new Error("Could not fetch attendance data from database");
      }
    } catch (error) {
      console.error("Error fetching attendance data:", error);

      if (error.response?.status === 401) {
        navigate("/login");
        return;
      }

      // When database connection fails, use demo data
      console.log("Using demo attendance data");
      const demoData = [
        {
          AttendanceID: 1,
          EmployeeID: "E001",
          EmployeeName: "John Smith",
          Date: "2025-05-01",
          TimeIn: "08:02",
          TimeOut: "17:30",
          Status: "Present",
          Department: "IT",
        },
        {
          AttendanceID: 2,
          EmployeeID: "E002",
          EmployeeName: "Mary Johnson",
          Date: "2025-05-01",
          TimeIn: "08:15",
          TimeOut: "17:45",
          Status: "Present",
          Department: "HR",
        },
        {
          AttendanceID: 3,
          EmployeeID: "E003",
          EmployeeName: "David Wilson",
          Date: "2025-05-01",
          TimeIn: "07:58",
          TimeOut: "17:20",
          Status: "Present",
          Department: "Finance",
        },
        {
          AttendanceID: 4,
          EmployeeID: "E002",
          EmployeeName: "Mary Johnson",
          Date: "2025-05-02",
          TimeIn: "09:10",
          TimeOut: "17:15",
          Status: "Late",
          Department: "HR",
        },
        {
          AttendanceID: 5,
          EmployeeID: "E003",
          EmployeeName: "David Wilson",
          Date: "2025-05-02",
          TimeIn: "",
          TimeOut: "",
          Status: "Absent",
          Department: "Finance",
        },
      ];
      setAttendanceRecords(demoData);
      setUsingDemoData(true);
      setError(
        "Using demo data because connection to the database server failed"
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
      // Use demo departments if connection fails
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

  // Actions for PageHeader
  const headerActions = [
    {
      icon: <FaDownload />,
      label: "Export Report",
      onClick: exportAttendanceReport,
      variant: "success",
    },
    {
      icon: <FaSync />,
      label: "Refresh",
      onClick: fetchAttendanceData,
      variant: "outline-primary",
    },
  ];

  return (
    <div className="container-fluid px-4">
      <PageHeader
        icon={<FaCalendarAlt className="me-2" />}
        title="Attendance Management"
        actions={headerActions}
        loading={loading}
      />

      {usingDemoData && (
        <div
          className="alert alert-warning alert-dismissible fade show mb-4"
          role="alert"
        >
          <FaExclamationTriangle className="me-2" />
          Using sample data. The system is currently in development phase.
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="alert"
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <DashboardCard
            icon={<FaCalendarCheck />}
            title="Present"
            value={attendanceSummary.present}
            subtitle={`${(
              (attendanceSummary.present / attendanceRecords.length) * 100 || 0
            ).toFixed(1)}%`}
            colorScheme="green"
          />
        </div>
        <div className="col-md-3">
          <DashboardCard
            icon={<FaCalendarTimes />}
            title="Absent"
            value={attendanceSummary.absent}
            subtitle={`${(
              (attendanceSummary.absent / attendanceRecords.length) * 100 || 0
            ).toFixed(1)}%`}
            colorScheme="red"
          />
        </div>
        <div className="col-md-3">
          <DashboardCard
            icon={<FaUserClock />}
            title="Late"
            value={attendanceSummary.late}
            subtitle={`${(
              (attendanceSummary.late / attendanceRecords.length) * 100 || 0
            ).toFixed(1)}%`}
            colorScheme="orange"
          />
        </div>
        <div className="col-md-3">
          <DashboardCard
            icon={<FaCalendarDay />}
            title="Leave"
            value={attendanceSummary.leave}
            subtitle={`${(
              (attendanceSummary.leave / attendanceRecords.length) * 100 || 0
            ).toFixed(1)}%`}
            colorScheme="blue"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="row mb-4">
        <div className="col-lg-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h5 className="card-title mb-3">
                    <FaFilter className="me-2" />
                    Filter Options
                  </h5>
                </div>
              </div>
              <div className="row">
                <div className="col-md-3 mb-3">
                  <label htmlFor="month" className="form-label">
                    Month
                  </label>
                  <select
                    id="month"
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
                <div className="col-md-3 mb-3">
                  <label htmlFor="year" className="form-label">
                    Year
                  </label>
                  <select
                    id="year"
                    className="form-select"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                  >
                    {[2023, 2024, 2025, 2026].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3 mb-3">
                  <label htmlFor="employeeFilter" className="form-label">
                    <FaSearch className="me-1" /> Search Employee
                  </label>
                  <input
                    type="text"
                    id="employeeFilter"
                    className="form-control"
                    placeholder="Search..."
                    value={employeeFilter}
                    onChange={(e) => setEmployeeFilter(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                </div>
                <div className="col-md-3 mb-3">
                  <label htmlFor="departmentFilter" className="form-label">
                    Department
                  </label>
                  <select
                    id="departmentFilter"
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
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="mb-4">
        <ul className="nav nav-pills">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "daily" ? "active" : ""}`}
              onClick={() => setActiveTab("daily")}
            >
              <FaCalendarDay className="me-1" /> Daily View
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "monthly" ? "active" : ""}`}
              onClick={() => setActiveTab("monthly")}
            >
              <FaCalendarWeek className="me-1" /> Monthly View
            </button>
          </li>
        </ul>
      </div>

      {/* Data Display */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            Attendance Record - {months[month - 1]} {year}
          </h5>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p>Loading attendance data...</p>
            </div>
          ) : filteredRecords.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>EMPLOYEE ID</th>
                    <th>EMPLOYEE NAME</th>
                    <th>DEPARTMENT</th>
                    <th>STATUS</th>
                    <th>WORK HOURS</th>
                    <th>PRESENT DAYS</th>
                    <th>ABSENT DAYS</th>
                    <th>LATE DAYS</th>
                    <th>LEAVE DAYS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => (
                    <tr key={record.AttendanceID}>
                      <td>{record.EmployeeID}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="bg-light rounded-circle p-2 me-2">
                            <FaUserClock className="text-primary" />
                          </div>
                          {record.EmployeeName}
                        </div>
                      </td>
                      <td>{record.Department}</td>
                      <td>
                        <span
                          className={`badge ${getStatusClass(record.Status)}`}
                        >
                          {record.Status}
                        </span>
                      </td>
                      <td>{record.TimeIn && record.TimeOut ? "8.0" : "0.0"}</td>
                      <td>0</td>
                      <td>0</td>
                      <td>0</td>
                      <td>0</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <NoDataMessage
              title="No Attendance Records Found"
              message="No attendance records were found for the selected criteria."
              type="search"
              onAction={fetchAttendanceData}
              actionText="Refresh Data"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Attendance;
