import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  getAuthConfig,
  checkServerConnection,
  demoDataAPI,
} from "../config/api.config";
import { FaExclamationTriangle } from "react-icons/fa";

const Employees = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchBy, setSearchBy] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [usingDemoData, setUsingDemoData] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, [retryCount]);

  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    setUsingDemoData(false);

    try {
      // Check server connection first
      console.log("Checking server connection before fetching employees data");
      const isServerConnected = await checkServerConnection();

      if (!isServerConnected) {
        console.log("Server offline, using demo employee data");
        const demoData = demoDataAPI.getEmployees();
        setEmployees(demoData);
        setFilteredEmployees(demoData);
        setUsingDemoData(true);
        setLoading(false);
        return;
      }

      console.log(
        "Server is connected, attempting to fetch real data from:",
        "http://localhost:9000/employees/mysql"
      );
      const config = getAuthConfig(navigate);
      if (!config) return;

      const response = await axios.get(
        "http://localhost:9000/employees/mysql",
        config
      );

      if (response.data.Status) {
        console.log("Successfully fetched employee data from MySQL");
        setEmployees(response.data.Data);
        setFilteredEmployees(response.data.Data);
      } else {
        throw new Error(response.data.Message || "Failed to load employees");
      }
    } catch (err) {
      console.error("Error loading employees:", err);
      console.log("Using demo employee data instead");
      const demoData = demoDataAPI.getEmployees();
      setEmployees(demoData);
      setFilteredEmployees(demoData);
      setUsingDemoData(true);
      setError("Lỗi khi tải dữ liệu: " + (err.message || "Lỗi không xác định"));
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  // Search effect
  useEffect(() => {
    handleSearch();
  }, [searchTerm, searchBy, employees]);

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredEmployees(employees);
      return;
    }

    const term = searchTerm.toLowerCase();

    const filtered = employees.filter((emp) => {
      switch (searchBy) {
        case "id":
          return emp.EmployeeID?.toString().toLowerCase().includes(term);
        case "name":
          return (
            emp.FullName ||
            emp.Name ||
            `${emp.FirstName || ""} ${emp.LastName || ""}`
          )
            .toLowerCase()
            .includes(term);
        case "department":
          return (emp.DepartmentName || emp.DepartmentID?.toString() || "")
            .toLowerCase()
            .includes(term);
        case "jobTitle":
          return (emp.JobTitle || emp.PositionName || emp.Position || "")
            .toLowerCase()
            .includes(term);
        case "all":
        default:
          return (
            emp.EmployeeID?.toString().toLowerCase().includes(term) ||
            (
              emp.FullName ||
              emp.Name ||
              `${emp.FirstName || ""} ${emp.LastName || ""}`
            )
              .toLowerCase()
              .includes(term) ||
            (emp.DepartmentName || emp.DepartmentID?.toString() || "")
              .toLowerCase()
              .includes(term) ||
            (emp.JobTitle || emp.PositionName || emp.Position || "")
              .toLowerCase()
              .includes(term) ||
            emp.ApplicantID?.toString().toLowerCase().includes(term)
          );
      }
    });

    setFilteredEmployees(filtered);
  };

  const handleDelete = async (employeeId) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) {
      return;
    }

    try {
      const config = getAuthConfig(navigate);
      if (!config) return;

      const response = await axios.delete(
        `http://localhost:9000/employees/delete/${employeeId}`,
        config
      );

      if (response.data.Status) {
        await fetchEmployees(); // Refresh the list
      } else {
        throw new Error(response.data.Message || "Failed to delete employee");
      }
    } catch (err) {
      console.error("Error deleting employee:", err);
      setError(err.response?.data?.Message || "Failed to delete employee");
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSearchBy("all");
  };

  return (
    <div className="container-fluid px-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mt-4">Employee Management</h1>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/dashboard/employees/add")}
        >
          Add Employee
        </button>
      </div>

      {usingDemoData && (
        <div className="alert alert-warning" role="alert">
          <h4 className="alert-heading">
            <FaExclamationTriangle className="me-2" />
            Sử dụng dữ liệu mẫu
          </h4>
          <p>
            Không thể kết nối đến máy chủ dữ liệu. Đang hiển thị dữ liệu mẫu để
            bạn có thể xem và thử nghiệm giao diện.
          </p>
          <hr />
          <div className="d-flex justify-content-end">
            <button
              className="btn btn-primary"
              onClick={handleRetry}
              disabled={loading}
            >
              Thử lại kết nối
            </button>
          </div>
        </div>
      )}

      {error && !usingDemoData && (
        <div
          className="alert alert-danger alert-dismissible fade show"
          role="alert"
        >
          {error}
          <div className="mt-2">
            <button
              className="btn btn-sm btn-outline-danger me-2"
              onClick={handleRetry}
            >
              Retry Connection
            </button>
            <button
              type="button"
              className="btn btn-sm btn-close"
              onClick={() => setError(null)}
            ></button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading employees...</p>
        </div>
      ) : (
        <div className="card mb-4">
          <div className="card-header">
            <i className="fas fa-table me-1"></i>
            Employees List
          </div>
          <div className="card-body">
            <div className="d-flex justify-content-between mb-3">
              <div className="d-flex" style={{ width: "60%" }}>
                <select
                  className="form-select me-2"
                  style={{ width: "150px" }}
                  value={searchBy}
                  onChange={(e) => setSearchBy(e.target.value)}
                >
                  <option value="all">All Fields</option>
                  <option value="id">ID</option>
                  <option value="name">Name</option>
                  <option value="department">Department</option>
                  <option value="jobTitle">Job Title</option>
                </select>
                <input
                  type="text"
                  className="form-control me-2"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button
                  className="btn btn-outline-secondary"
                  onClick={clearSearch}
                  disabled={!searchTerm}
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="table-responsive">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Department</th>
                    <th>Position</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((emp) => (
                    <tr key={emp.EmployeeID}>
                      <td>{emp.EmployeeID}</td>
                      <td>{`${emp.FirstName} ${emp.LastName}`}</td>
                      <td>{emp.Email}</td>
                      <td>{emp.Phone}</td>
                      <td>{emp.DepartmentName}</td>
                      <td>{emp.PositionName}</td>
                      <td>
                        <button
                          className="btn btn-info btn-sm me-2"
                          onClick={() =>
                            navigate(
                              `/dashboard/employees/view/${emp.EmployeeID}`
                            )
                          }
                        >
                          View
                        </button>
                        <button
                          className="btn btn-warning btn-sm me-2"
                          onClick={() =>
                            navigate(
                              `/dashboard/employees/edit/${emp.EmployeeID}`
                            )
                          }
                        >
                          Update
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(emp.EmployeeID)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
