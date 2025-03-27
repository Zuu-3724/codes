import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getAuthConfig } from "../config/api.config";

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("Loading department list...");
      const config = getAuthConfig(navigate);
      if (!config) return;

      const response = await axios.get(
        "http://localhost:9000/auth/departments",
        config
      );

      console.log("Department results:", response.data);

      if (response.data.Status) {
        setDepartments(response.data.Data || []);
      } else {
        console.warn("Could not load departments:", response.data.Message);
        setError(response.data.Message || "Could not load department list");
        // Create sample departments if API doesn't work
        setDepartments([
          { id: 1, DepartmentName: "IT" },
          { id: 2, DepartmentName: "HR" },
          { id: 3, DepartmentName: "Finance" },
          { id: 4, DepartmentName: "Marketing" },
        ]);
      }
    } catch (err) {
      console.error("Error loading department list:", err);
      setError("Connection error to server. Please try again later");
      // Create sample departments if API doesn't work
      setDepartments([
        { id: 1, DepartmentName: "IT" },
        { id: 2, DepartmentName: "HR" },
        { id: 3, DepartmentName: "Finance" },
        { id: 4, DepartmentName: "Marketing" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (id) => {
    navigate(`/dashboard/update_department/${id}`);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this department?")) {
      setLoading(true);
      try {
        const config = getAuthConfig(navigate);
        if (!config) return;

        const response = await axios.delete(
          `http://localhost:9000/auth/departments/${id}`,
          config
        );

        if (response.data.Status) {
          setDepartments(
            departments.filter((dept) => dept.DepartmentID !== id)
          );
          alert("Department deleted successfully!");
        } else {
          setError(response.data.Message || "Could not delete department");
        }
      } catch (error) {
        console.error("Error when deleting department:", error);
        setError("Error deleting department. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="text-center">Department List</h2>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
          <button
            className="btn-close float-end"
            onClick={() => setError(null)}
          ></button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading department list...</p>
        </div>
      ) : (
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
            {departments.length > 0 ? (
              departments.map((dept) => (
                <tr key={dept.DepartmentID || dept.id}>
                  <td>{dept.DepartmentID || dept.id}</td>
                  <td>{dept.DepartmentName}</td>
                  <td>{dept.ManagerID || "N/A"}</td>
                  <td>
                    <button
                      className="btn btn-warning me-2"
                      onClick={() => handleUpdate(dept.DepartmentID || dept.id)}
                      disabled={loading}
                    >
                      Update
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(dept.DepartmentID || dept.id)}
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center">
                  No department data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Departments;
