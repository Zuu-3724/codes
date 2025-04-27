import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getAuthConfig } from "../config/api.config";

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("departments"); // 'departments' or 'positions'
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
    try {
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
        }));
        setDepartments(departmentsData);
      } else {
        throw new Error(response.data.Message || "Failed to load departments");
      }
    } catch (err) {
      console.error("Error loading departments:", err);
      setError("Connection error to server. Please try again later");
      setDepartments([]); // Clear departments on error
    } finally {
      setLoading(false);
    }
  };

  const fetchPositions = async () => {
    setLoading(true);
    setError(null);
    try {
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
      setError("Connection error to server. Please try again later");
      setPositions([]); // Clear positions on error
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="container-fluid px-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mt-4">Organization Structure from HUMAN</h1>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/dashboard/add_department")}
        >
          Add Department
        </button>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${
              activeTab === "departments" ? "active" : ""
            }`}
            onClick={() => setActiveTab("departments")}
          >
            Departments
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "positions" ? "active" : ""}`}
            onClick={() => setActiveTab("positions")}
          >
            Positions
          </button>
        </li>
      </ul>

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

      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading {activeTab}...</p>
        </div>
      ) : (
        <div className="card mb-4">
          <div className="card-header">
            <i className="fas fa-table me-1"></i>
            {activeTab === "departments"
              ? "Departments List"
              : "Positions List"}
          </div>
          <div className="card-body">
            <div className="table-responsive">
              {activeTab === "departments" ? (
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>Department ID</th>
                      <th>Department Name</th>
                      <th>Manager ID</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map((dept) => (
                      <tr key={dept.DepartmentID}>
                        <td>{dept.DepartmentID}</td>
                        <td>{dept.DepartmentName}</td>
                        <td>{dept.ManagerID || "Not assigned"}</td>
                        <td>
                          <button
                            className="btn btn-warning btn-sm me-2"
                            onClick={() =>
                              navigate(
                                `/dashboard/update_department/${dept.DepartmentID}`
                              )
                            }
                          >
                            Update
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(dept.DepartmentID)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>Position ID</th>
                      <th>Position Name</th>
                      <th>Department</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((pos) => (
                      <tr key={pos.PositionID}>
                        <td>{pos.PositionID}</td>
                        <td>{pos.PositionName}</td>
                        <td>{pos.DepartmentName || "Not assigned"}</td>
                        <td>
                          <button
                            className="btn btn-warning btn-sm me-2"
                            onClick={() =>
                              navigate(
                                `/dashboard/update_position/${pos.PositionID}`
                              )
                            }
                          >
                            Update
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handlePositionDelete(pos.PositionID)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;
