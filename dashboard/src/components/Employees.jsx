import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  getAuthConfig,
  checkServerConnection,
  demoDataAPI,
  API_URL,
} from "../config/api.config";
import {
  FaExclamationTriangle,
  FaEdit,
  FaTrash,
  FaEye,
  FaUserPlus,
  FaSearch,
  FaFilter,
  FaUsers,
  FaSitemap,
  FaUserTie,
  FaUserCog,
  FaRedo,
  FaSortAmountDown,
  FaSortAmountUp,
  FaBuilding,
  FaCalendarAlt,
} from "react-icons/fa";
import { useAuth } from "../config/AuthContext";

const Employees = () => {
  const navigate = useNavigate();
  const { permissions, user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchBy, setSearchBy] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [usingDemoData, setUsingDemoData] = useState(false);
  const [sorting, setSorting] = useState({
    field: "EmployeeID",
    direction: "asc",
  });

  useEffect(() => {
    fetchEmployees();
  }, [retryCount, user]);

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
        useDemoData();
        return;
      }

      console.log(
        "Server is connected, attempting to fetch real data from:",
        `${API_URL}/employees/mysql`
      );
      const config = getAuthConfig(navigate);
      if (!config) return;

      // The backend will filter based on role
      try {
        const response = await axios.get(`${API_URL}/employees/mysql`, config);

        if (response.data.Status) {
          console.log("Successfully fetched employee data from MySQL");
          setEmployees(response.data.Data);
          setFilteredEmployees(response.data.Data);
        } else {
          throw new Error(response.data.Message || "Failed to load employees");
        }
      } catch (err) {
        console.log(
          "Error loading employees from API, using demo data",
          err.message || "Unknown error"
        );
        useDemoData();
      }
    } catch (err) {
      console.log(
        "Error during employee fetch process",
        err.message || "Unknown error"
      );
      useDemoData();
    } finally {
      setLoading(false);
    }
  };

  const useDemoData = () => {
    console.log("Using demo employee data");
    let demoData = demoDataAPI.getEmployees();

    // If employee role, filter to only show their own data
    if (permissions.isRestricted()) {
      demoData = demoData.filter(
        (emp) =>
          String(emp.EmployeeID) === String(permissions.getCurrentUserId())
      );
    }

    setEmployees(demoData);
    setFilteredEmployees(demoData);
    setUsingDemoData(true);
  };

  const handleRetry = () => {
    setLoading(true);
    setRetryCount((prev) => prev + 1);
    setTimeout(() => {
      setLoading(false);
    }, 1500);
  };

  // Search effect
  useEffect(() => {
    handleSearch();
  }, [searchTerm, searchBy, employees]);

  useEffect(() => {
    sortEmployees();
  }, [sorting, filteredEmployees]);

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

  const sortEmployees = () => {
    const sorted = [...filteredEmployees].sort((a, b) => {
      let aValue = a[sorting.field];
      let bValue = b[sorting.field];

      // Handle complex fields like name
      if (sorting.field === "Name") {
        aValue =
          a.FullName || a.Name || `${a.FirstName || ""} ${a.LastName || ""}`;
        bValue =
          b.FullName || b.Name || `${b.FirstName || ""} ${b.LastName || ""}`;
      }

      if (aValue < bValue) {
        return sorting.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sorting.direction === "asc" ? 1 : -1;
      }
      return 0;
    });

    setFilteredEmployees(sorted);
  };

  const handleSort = (field) => {
    setSorting((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleDelete = async (employeeId) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) {
      return;
    }

    try {
      const config = getAuthConfig(navigate);
      if (!config) return;

      const response = await axios.delete(
        `${API_URL}/employees/delete/${employeeId}`,
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

  // Lọc danh sách nhân viên theo phòng ban để tính số lượng
  const getDepartmentCounts = () => {
    const departments = {};
    employees.forEach((emp) => {
      const dept = emp.DepartmentName || "Other";
      departments[dept] = (departments[dept] || 0) + 1;
    });
    return departments;
  };

  // Tìm phòng ban có nhiều nhân viên nhất
  const getLargestDepartment = () => {
    const depts = getDepartmentCounts();
    return Object.entries(depts).reduce(
      (a, b) => (a[1] > b[1] ? a : b),
      ["None", 0]
    )[0];
  };

  // Calculate average salary
  const getAverageSalary = () => {
    if (employees.length === 0) return 0;
    const total = employees.reduce((sum, emp) => sum + (emp.Salary || 0), 0);
    return total / employees.length;
  };

  // Format VND currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US").format(amount) + " VND";
  };

  return (
    <div className="container-fluid px-4 py-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          <FaUsers className="text-primary me-2" />
          Employee Management
        </h2>
        <div className="d-flex">
          <button
            className="btn btn-outline-primary me-2"
            onClick={handleRetry}
          >
            <FaRedo className={loading ? "me-2 fa-spin" : "me-2"} /> Refresh
          </button>
          {/* Only show Add Employee button for Admin and HR Manager */}
          {permissions.canManageEmployees() && (
            <button
              className="btn btn-primary"
              onClick={() => navigate("/dashboard/add_employee")}
            >
              <FaUserPlus className="me-2" /> Add Employee
            </button>
          )}
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
              disabled={loading}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-1"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Retrying...
                </>
              ) : (
                "Retry"
              )}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Employee Stats Cards */}
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
                  <h2 className="my-2 text-white">{employees.length}</h2>
                  <p className="mb-0 small">Currently working</p>
                </div>
                <div>
                  <FaUsers
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
                  <h5 className="text-white mb-0">Department</h5>
                  <h2 className="my-2 text-white">
                    {Object.keys(getDepartmentCounts()).length}
                  </h2>
                  <p className="mb-0 small">Number of departments</p>
                </div>
                <div>
                  <FaSitemap
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
                  <h5 className="text-white mb-0">Largest Department</h5>
                  <h2 className="my-2 text-white">{getLargestDepartment()}</h2>
                  <p className="mb-0 small">Most employees</p>
                </div>
                <div>
                  <FaBuilding
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
                  <h5 className="text-white mb-0">Average Salary</h5>
                  <h2 className="my-2 text-white">
                    {formatCurrency(getAverageSalary())}
                  </h2>
                  <p className="mb-0 small">All employees</p>
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
      </div>

      {/* Search & Filter Section */}
      <div className="card mb-4 border-0 shadow-sm">
        <div className="card-header bg-primary text-white">
          <FaFilter className="me-2" /> Search & Filter Employees
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-8 mb-3">
              <div className="input-group">
                <span className="input-group-text bg-light">
                  <FaSearch className="text-primary" />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                  className="form-select flex-grow-0 w-auto"
                  value={searchBy}
                  onChange={(e) => setSearchBy(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="id">ID</option>
                  <option value="name">Name</option>
                  <option value="department">Department</option>
                  <option value="jobTitle">Position</option>
                </select>
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={clearSearch}
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="col-md-4 mb-3">
              <div className="d-flex justify-content-end">
                <div className="btn-group" role="group">
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={() => handleSort("EmployeeID")}
                  >
                    <FaSortAmountDown className="me-1" /> ID
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={() => handleSort("Name")}
                  >
                    <FaSortAmountUp className="me-1" /> Name
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={() => handleSort("DepartmentName")}
                  >
                    <FaSortAmountDown className="me-1" /> Department
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Employee List */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0 text-primary">
            <FaUsers className="me-2" />
            Employee List
          </h5>
          <span className="badge bg-info text-white">
            {filteredEmployees.length} employees
          </span>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center my-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading employee data...</p>
            </div>
          ) : filteredEmployees.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th
                      scope="col"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleSort("EmployeeID")}
                    >
                      ID{" "}
                      {sorting.field === "EmployeeID" &&
                        (sorting.direction === "asc" ? "▲" : "▼")}
                    </th>
                    <th
                      scope="col"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleSort("Name")}
                    >
                      Employee{" "}
                      {sorting.field === "Name" &&
                        (sorting.direction === "asc" ? "▲" : "▼")}
                    </th>
                    <th
                      scope="col"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleSort("DepartmentName")}
                    >
                      Department{" "}
                      {sorting.field === "DepartmentName" &&
                        (sorting.direction === "asc" ? "▲" : "▼")}
                    </th>
                    <th
                      scope="col"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleSort("PositionName")}
                    >
                      Position{" "}
                      {sorting.field === "PositionName" &&
                        (sorting.direction === "asc" ? "▲" : "▼")}
                    </th>
                    <th
                      scope="col"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleSort("HireDate")}
                    >
                      Hire Date{" "}
                      {sorting.field === "HireDate" &&
                        (sorting.direction === "asc" ? "▲" : "▼")}
                    </th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.EmployeeID || employee.id}>
                      <td>{employee.EmployeeID || employee.id}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="bg-light rounded-circle p-2 me-3">
                            <FaUserTie className="text-primary" />
                          </div>
                          <div>
                            <div className="fw-bold">
                              {employee.FullName ||
                                employee.Name ||
                                `${employee.FirstName || ""} ${
                                  employee.LastName || ""
                                }`}
                            </div>
                            <div className="small text-muted">
                              {employee.Email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <FaBuilding className="text-secondary me-2" />
                          {employee.DepartmentName || "N/A"}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <FaUserCog className="text-secondary me-2" />
                          {employee.PositionName || employee.JobTitle || "N/A"}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <FaCalendarAlt className="text-secondary me-2" />
                          {employee.HireDate || "N/A"}
                        </div>
                      </td>
                      <td>
                        <div className="btn-group" role="group">
                          <Link
                            to={`/dashboard/view_employee/${
                              employee.EmployeeID || employee.id
                            }`}
                            className="btn btn-sm btn-info text-white me-1"
                            title="View Details"
                          >
                            <FaEye />
                          </Link>
                          {permissions.canManageEmployees() && (
                            <>
                              <Link
                                to={`/dashboard/edit_employee/${
                                  employee.EmployeeID || employee.id
                                }`}
                                className="btn btn-sm btn-primary me-1"
                                title="Edit"
                              >
                                <FaEdit />
                              </Link>
                              <button
                                className="btn btn-sm btn-danger"
                                title="Delete"
                                onClick={() =>
                                  handleDelete(
                                    employee.EmployeeID || employee.id
                                  )
                                }
                              >
                                <FaTrash />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4">
              <FaExclamationTriangle
                className="text-warning mb-3"
                style={{ fontSize: "3rem" }}
              />
              <h5>No employees found</h5>
              <p className="text-muted">
                No employees match your search criteria.
              </p>
              <button className="btn btn-outline-primary" onClick={clearSearch}>
                Clear Search
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Employees;
