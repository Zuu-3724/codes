import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { getAuthConfig, TokenManager } from "../config/api.config";

const Employees = () => {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchBy, setSearchBy] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Debug function to log API calls
  const debugApiCall = (endpoint, method, data = null) => {
    const debugData = {
      timestamp: new Date().toISOString(),
      endpoint: `http://localhost:9000/employees${endpoint}`,
      method,
      data,
      token: TokenManager.getToken() ? "Present" : "Missing",
    };
    console.log("API Debug:", debugData);
    setDebugInfo(debugData);
  };

  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);

    const config = getAuthConfig(navigate);
    if (!config) return;

    try {
      debugApiCall("/list", "GET");
      const result = await axios.get("http://localhost:9000/auth/list", config);

      if (result.data.Status) {
        setEmployee(result.data.Data);
        setFilteredEmployees(result.data.Data);
        console.log("Successfully fetched employees:", result.data.Data.length);
      } else {
        setError(result.data.Error || "Could not load employee list");
        console.error("API Error:", result.data.Error);
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
      debugApiCall("/list", "GET", {
        error: err.message,
      });

      if (err.response) {
        // Handle different error status codes
        if (err.response.status === 401) {
          console.warn("Unauthorized access, redirecting to login");
          TokenManager.removeToken();
          navigate("/login");
          return;
        } else if (err.response.status === 403) {
          setError("You don't have permission to view employee data");
        } else {
          setError(err.response.data?.Error || "Error connecting to server");
        }
      } else {
        setError("Network error. Please check your connection");
      }
    } finally {
      setLoading(false);
    }
  };

  // Search effect
  useEffect(() => {
    handleSearch();
  }, [searchTerm, searchBy, employee]);

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredEmployees(employee);
      return;
    }

    const term = searchTerm.toLowerCase();

    const filtered = employee.filter((emp) => {
      switch (searchBy) {
        case "id":
          return emp.EmployeeID?.toString().toLowerCase().includes(term);
        case "name":
          // Assuming employee might have a name field or related fields
          return (
            emp.FullName ||
            emp.Name ||
            `${emp.FirstName || ""} ${emp.LastName || ""}`
          )
            .toLowerCase()
            .includes(term);
        case "department":
          // Check if department information is available as ID or name
          return (emp.DepartmentName || emp.DepartmentID?.toString() || "")
            .toLowerCase()
            .includes(term);
        case "jobTitle":
          // Check if job title information is available
          return (emp.JobTitle || emp.Position || "")
            .toLowerCase()
            .includes(term);
        case "all":
        default:
          // Search in all fields
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
            (emp.JobTitle || emp.Position || "").toLowerCase().includes(term) ||
            emp.ApplicantID?.toString().toLowerCase().includes(term)
          );
      }
    });

    setFilteredEmployees(filtered);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      setLoading(true);

      const config = getAuthConfig(navigate);
      if (!config) return;

      try {
        debugApiCall(`/${id}`, "DELETE");
        const result = await axios.delete(
          `http://localhost:9000/auth/employees/${id}`,
          config
        );

        if (result.data.Status) {
          setEmployee(employee.filter((e) => e.EmployeeID !== id));
          setFilteredEmployees(
            filteredEmployees.filter((e) => e.EmployeeID !== id)
          );
          console.log("Successfully deleted employee:", id);
          alert("Employee deleted successfully!");
        } else {
          setError(result.data.Error || "Could not delete employee");
          console.error("Delete Error:", result.data.Error);
        }
      } catch (err) {
        console.error("Error deleting employee:", err);
        debugApiCall(`/${id}`, "DELETE", {
          error: err.message,
        });

        if (err.response) {
          if (err.response.status === 401) {
            console.warn(
              "Unauthorized access during delete, redirecting to login"
            );
            TokenManager.removeToken();
            navigate("/login");
            return;
          } else if (err.response.status === 403) {
            setError("You don't have permission to delete employees");
          } else {
            setError(err.response.data?.Error || "Error connecting to server");
          }
        } else {
          setError("Network error. Please check your connection");
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSearchBy("all");
  };

  return (
    <div className="px-5 mt-3">
      <div className="d-flex justify-content-center">
        <h3>Employee List</h3>
      </div>

      {/* Debug Information Panel */}
      {process.env.NODE_ENV === "development" && debugInfo && (
        <div className="alert alert-info" role="alert">
          <h5 className="alert-heading">API Debug Information</h5>
          <hr />
          <p className="mb-1">
            <strong>Endpoint:</strong> {debugInfo.endpoint}
          </p>
          <p className="mb-1">
            <strong>Method:</strong> {debugInfo.method}
          </p>
          <p className="mb-1">
            <strong>Time:</strong> {debugInfo.timestamp}
          </p>
          <p className="mb-1">
            <strong>Auth Token:</strong> {debugInfo.token}
          </p>
          {debugInfo.data && (
            <p className="mb-0">
              <strong>Data:</strong> {JSON.stringify(debugInfo.data)}
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
          <button
            className="btn-close float-end"
            onClick={() => setError(null)}
          ></button>
        </div>
      )}

      <div className="d-flex justify-content-between mb-3">
        <Link to="/dashboard/add_employee" className="btn btn-success">
          Add Employee
        </Link>

        {/* Search Bar */}
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

      {loading ? (
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading employee data...</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Department</th>
                <th>Position</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((employee, index) => {
                  return (
                    <tr key={index}>
                      <td>{employee.EmployeeID || employee.id}</td>
                      <td>
                        {employee.FirstName
                          ? `${employee.FirstName} ${employee.LastName || ""}`
                          : employee.EmployeeName || "N/A"}
                      </td>
                      <td>{employee.Email || "N/A"}</td>
                      <td>{employee.Phone || "N/A"}</td>
                      <td>{employee.DepartmentName || "N/A"}</td>
                      <td>{employee.JobTitle || employee.Position || "N/A"}</td>
                      <td>
                        <Link
                          to={`/dashboard/update_employee/${
                            employee.EmployeeID || employee.id
                          }`}
                          className="btn btn-primary btn-sm me-2"
                          disabled={loading}
                        >
                          Update
                        </Link>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() =>
                            handleDelete(employee.EmployeeID || employee.id)
                          }
                          disabled={loading}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="text-center">
                    No employee data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Employees;
