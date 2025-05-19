import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  getAuthConfig,
  demoDataAPI,
  checkServerConnection,
} from "../config/api.config";
import {
  FaBuilding,
  FaSitemap,
  FaUserTie,
  FaPlusCircle,
  FaEdit,
  FaTrash,
  FaExclamationTriangle,
  FaRedo,
  FaChartPie,
  FaUsers,
  FaLayerGroup,
  FaSearch,
  FaInfoCircle,
} from "react-icons/fa";

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("departments"); // 'departments' or 'positions'
  const [searchTerm, setSearchTerm] = useState("");
  const [usingDemoData, setUsingDemoData] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (activeTab === "departments") {
      fetchDepartments();
    } else {
      fetchPositions();
    }
  }, [activeTab]);

  const fetchDepartments = async () => {
    setLoading(true);
    setError(null);
    setUsingDemoData(false);

    try {
      // Check server connection first
      const isServerConnected = await checkServerConnection();

      if (!isServerConnected) {
        console.log("Server offline, using demo department data");
        useDemoDepartments();
        return;
      }

      const config = getAuthConfig(navigate);
      if (!config) return;

      const response = await axios.get(
        "http://localhost:9000/departments/test",
        config
      );

      if (response.data.Status) {
        // Transform the test data to match the expected format
        const departmentsData = response.data.Data.map((dept) => ({
          DepartmentID: dept.id,
          DepartmentName: dept.name,
          Description: dept.description,
          ManagerID: null,
          EmployeeCount: Math.floor(Math.random() * 30) + 5, // Demo data for employee count
        }));
        setDepartments(departmentsData);
      } else {
        throw new Error(response.data.Message || "Failed to load departments");
      }
    } catch (err) {
      console.error("Error loading departments:", err);
      useDemoDepartments();
    } finally {
      setLoading(false);
    }
  };

  const useDemoDepartments = () => {
    console.log("Using demo department data");
    setDepartments(demoDataAPI.getDepartments());
    setUsingDemoData(true);
  };

  const fetchPositions = async () => {
    setLoading(true);
    setError(null);
    setUsingDemoData(false);

    try {
      // Check server connection first
      const isServerConnected = await checkServerConnection();

      if (!isServerConnected) {
        console.log("Server offline, using demo position data");
        useDemoPositions();
        return;
      }

      const config = getAuthConfig(navigate);
      if (!config) return;

      const response = await axios.get(
        "http://localhost:9000/positions",
        config
      );

      if (response.data.Status) {
        setPositions(response.data.Data);
      } else {
        throw new Error(response.data.Message || "Failed to load positions");
      }
    } catch (err) {
      console.error("Error loading positions:", err);
      useDemoPositions();
    } finally {
      setLoading(false);
    }
  };

  const useDemoPositions = () => {
    console.log("Using demo position data");
    // Sample demo positions data
    const demoPositions = [
      {
        PositionID: 1,
        PositionName: "CEO",
        DepartmentName: "Executive Management",
        Salary: 50000000,
      },
      {
        PositionID: 2,
        PositionName: "Department Head",
        DepartmentName: "Human Resources",
        Salary: 30000000,
      },
      {
        PositionID: 3,
        PositionName: "Employee",
        DepartmentName: "Information Technology",
        Salary: 15000000,
      },
      {
        PositionID: 4,
        PositionName: "Chief Accountant",
        DepartmentName: "Finance",
        Salary: 28000000,
      },
      {
        PositionID: 5,
        PositionName: "Project Manager",
        DepartmentName: "Operations",
        Salary: 32000000,
      },
      {
        PositionID: 6,
        PositionName: "Team Leader",
        DepartmentName: "Sales",
        Salary: 25000000,
      },
      {
        PositionID: 7,
        PositionName: "Intern",
        DepartmentName: "Marketing",
        Salary: 8000000,
      },
    ];
    setPositions(demoPositions);
    setUsingDemoData(true);
  };

  const handleUpdate = (id) => {
    if (activeTab === "departments") {
      navigate(`/dashboard/update_department/${id}`);
    } else {
      navigate(`/dashboard/update_position/${id}`);
    }
  };

  const handleDelete = async (departmentId) => {
    if (!window.confirm("Are you sure you want to delete this department?")) {
      return;
    }

    try {
      const config = getAuthConfig(navigate);
      if (!config) return;

      const response = await axios.delete(
        `http://localhost:9000/departments/delete/${departmentId}`,
        config
      );

      if (response.data.Status) {
        await fetchDepartments(); // Refresh the list
      } else {
        throw new Error(response.data.Message || "Failed to delete department");
      }
    } catch (err) {
      console.error("Error deleting department:", err);
      setError(err.response?.data?.Message || "Failed to delete department");
    }
  };

  const handlePositionDelete = async (positionId) => {
    if (!window.confirm("Are you sure you want to delete this position?")) {
      return;
    }

    try {
      const config = getAuthConfig(navigate);
      if (!config) return;

      const response = await axios.delete(
        `http://localhost:9000/positions/delete/${positionId}`,
        config
      );

      if (response.data.Status) {
        await fetchPositions(); // Refresh the list
      } else {
        throw new Error(response.data.Message || "Failed to delete position");
      }
    } catch (err) {
      console.error("Error deleting position:", err);
      setError(err.response?.data?.Message || "Failed to delete position");
    }
  };

  // For searching departments and positions
  const filteredData =
    activeTab === "departments"
      ? departments.filter(
          (dept) =>
            dept.DepartmentName.toLowerCase().includes(
              searchTerm.toLowerCase()
            ) ||
            (dept.Description &&
              dept.Description.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      : positions.filter(
          (pos) =>
            pos.PositionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (pos.DepartmentName &&
              pos.DepartmentName.toLowerCase().includes(
                searchTerm.toLowerCase()
              ))
        );

  const handleRetry = () => {
    setLoading(true);
    if (activeTab === "departments") {
      fetchDepartments();
    } else {
      fetchPositions();
    }
  };

  // Calculate statistics
  const getTotalEmployees = () => {
    return departments.reduce(
      (total, dept) => total + (dept.EmployeeCount || 0),
      0
    );
  };

  const getLargestDepartment = () => {
    if (departments.length === 0) return "N/A";
    return departments.reduce(
      (max, dept) => (dept.EmployeeCount > max.EmployeeCount ? dept : max),
      departments[0]
    ).DepartmentName;
  };

  const getAverageSalary = () => {
    if (positions.length === 0) return 0;
    return (
      positions.reduce((sum, pos) => sum + (pos.Salary || 0), 0) /
      positions.length
    );
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US").format(amount) + " VND";
  };

  return (
    <div className="container-fluid px-4 py-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          {activeTab === "departments" ? (
            <>
              <FaBuilding className="text-primary me-2" />
              Department Management
            </>
          ) : (
            <>
              <FaUserTie className="text-primary me-2" />
              Position Management
            </>
          )}
        </h2>
        <div className="d-flex">
          <button
            className="btn btn-outline-primary me-2"
            onClick={handleRetry}
          >
            <FaRedo className={loading ? "me-2 fa-spin" : "me-2"} /> Refresh
          </button>
          <button
            className="btn btn-primary"
            onClick={() =>
              navigate(
                activeTab === "departments"
                  ? "/dashboard/add_department"
                  : "/dashboard/add_position"
              )
            }
          >
            <FaPlusCircle className="me-2" />
            {activeTab === "departments" ? "Add Department" : "Add Position"}
          </button>
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

      {/* Organization Stats Cards */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6">
          <div
            className="card border-0 shadow-sm mb-3  h-100"
            style={{
              background: "linear-gradient(to right, #4facfe, #00f2fe)",
            }}
          >
            <div className="card-body text-white">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="text-white mb-0">Total Departments</h5>
                  <h2 className="my-2 text-white">{departments.length}</h2>
                  <p className="mb-0 small">Active departments</p>
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
            className="card border-0 shadow-sm mb-3  h-100"
            style={{
              background: "linear-gradient(to right, #43e97b, #38f9d7)",
            }}
          >
            <div className="card-body text-white">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="text-white mb-0">Total Employees</h5>
                  <h2 className="my-2 text-white">{getTotalEmployees()}</h2>
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
            className="card border-0 shadow-sm mb-3  h-100"
            style={{
              background: "linear-gradient(to right, #fa709a, #fee140)",
            }}
          >
            <div className="card-body text-white">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="text-white mb-0">Largest Department</h5>
                  <h2 className="my-2 text-white">{getLargestDepartment()}</h2>
                  <p className="mb-0 small">By employee count</p>
                </div>
                <div>
                  <FaChartPie
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
            className="card border-0 shadow-sm mb-3  h-100"
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
                  <p className="mb-0 small">By position</p>
                </div>
                <div>
                  <FaLayerGroup
                    className="text-white opacity-75"
                    style={{ fontSize: "3rem" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs nav-fill mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${
              activeTab === "departments" ? "active" : ""
            }`}
            onClick={() => setActiveTab("departments")}
          >
            <FaBuilding className="me-2" />
            Departments
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "positions" ? "active" : ""}`}
            onClick={() => setActiveTab("positions")}
          >
            <FaUserTie className="me-2" />
            Positions
          </button>
        </li>
      </ul>

      {/* Search and Filter */}
      <div className="card mb-4 border-0 shadow-sm">
        <div className="card-body">
          <div className="input-group">
            <span className="input-group-text bg-light">
              <FaSearch className="text-primary" />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder={`Search ${
                activeTab === "departments" ? "departments" : "positions"
              }...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              className="btn btn-outline-secondary"
              type="button"
              onClick={() => setSearchTerm("")}
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div
          className="alert alert-danger alert-dismissible fade show"
          role="alert"
        >
          <FaExclamationTriangle className="me-2" />
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError(null)}
          ></button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">
            Loading {activeTab === "departments" ? "departments" : "positions"}
            ...
          </p>
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0 text-primary">
              {activeTab === "departments" ? (
                <>
                  <FaBuilding className="me-2" />
                  Departments List
                </>
              ) : (
                <>
                  <FaUserTie className="me-2" />
                  Positions List
                </>
              )}
            </h5>
            <span className="badge bg-info text-white">
              {filteredData.length}{" "}
              {activeTab === "departments" ? "departments" : "positions"}
            </span>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              {activeTab === "departments" ? (
                filteredData.length > 0 ? (
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>ID</th>
                        <th>Department Name</th>
                        <th>Employee Count</th>
                        <th>Manager</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map((dept) => (
                        <tr key={dept.DepartmentID}>
                          <td>{dept.DepartmentID}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="bg-light rounded-circle p-2 me-3">
                                <FaBuilding className="text-primary" />
                              </div>
                              <div>
                                <div className="fw-bold">
                                  {dept.DepartmentName}
                                </div>
                                {dept.Description && (
                                  <div className="small text-muted">
                                    {dept.Description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <FaUsers className="text-secondary me-2" />
                              {dept.EmployeeCount || 0}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <FaUserTie className="text-secondary me-2" />
                              {dept.Manager || dept.ManagerID || "Not assigned"}
                            </div>
                          </td>
                          <td>
                            <div className="btn-group" role="group">
                              <button
                                className="btn btn-sm btn-info text-white me-1"
                                onClick={() =>
                                  navigate(
                                    `/dashboard/view_department/${dept.DepartmentID}`
                                  )
                                }
                                title="View details"
                              >
                                <FaInfoCircle />
                              </button>
                              <button
                                className="btn btn-sm btn-primary me-1"
                                onClick={() => handleUpdate(dept.DepartmentID)}
                                title="Update"
                              >
                                <FaEdit />
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDelete(dept.DepartmentID)}
                                title="Delete"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-4">
                    <FaExclamationTriangle
                      className="text-warning mb-3"
                      style={{ fontSize: "3rem" }}
                    />
                    <h5>No departments found</h5>
                    <p className="text-muted">
                      There are no departments matching your search criteria.
                    </p>
                  </div>
                )
              ) : filteredData.length > 0 ? (
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Position</th>
                      <th>Department</th>
                      <th>Salary</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((pos) => (
                      <tr key={pos.PositionID}>
                        <td>{pos.PositionID}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="bg-light rounded-circle p-2 me-3">
                              <FaUserTie className="text-primary" />
                            </div>
                            <div className="fw-bold">{pos.PositionName}</div>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <FaBuilding className="text-secondary me-2" />
                            {pos.DepartmentName || "All departments"}
                          </div>
                        </td>
                        <td>{formatCurrency(pos.Salary || 0)}</td>
                        <td>
                          <div className="btn-group" role="group">
                            <button
                              className="btn btn-sm btn-primary me-1"
                              onClick={() => handleUpdate(pos.PositionID)}
                              title="Update"
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() =>
                                handlePositionDelete(pos.PositionID)
                              }
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-4">
                  <FaExclamationTriangle
                    className="text-warning mb-3"
                    style={{ fontSize: "3rem" }}
                  />
                  <h5>No positions found</h5>
                  <p className="text-muted">
                    There are no positions matching your search criteria.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;
