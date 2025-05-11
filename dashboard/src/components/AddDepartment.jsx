import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaBuilding,
  FaUsers,
  FaSave,
  FaTimes,
  FaExclamationTriangle,
  FaSpinner,
} from "react-icons/fa";
import { getAuthConfig } from "../config/api.config";

const AddDepartment = () => {
  const navigate = useNavigate();
  const [department, setDepartment] = useState({
    DepartmentName: "",
    ManagerID: "",
    Description: "",
  });
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const config = getAuthConfig(navigate);
      if (!config) return;

      const response = await axios.get(
        "http://localhost:9000/employees/list",
        config
      );

      if (response.data.Status) {
        setEmployees(response.data.Data);
      }
    } catch (error) {
      setError(error.response?.data?.Message || "Error loading employees");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!department.DepartmentName.trim()) {
      errors.DepartmentName = "Department name is required";
    }

    if (!department.ManagerID) {
      errors.ManagerID = "Department manager is required";
    }

    if (department.Description && department.Description.length > 500) {
      errors.Description = "Description cannot exceed 500 characters";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const config = getAuthConfig(navigate);
      if (!config) return;

      const response = await axios.post(
        "http://localhost:9000/departments/add",
        department,
        config
      );

      if (response.data.Status) {
        setSuccess("Department added successfully!");
        setTimeout(() => {
          navigate("/dashboard/departments");
        }, 1500);
      } else {
        setError(response.data.Message || "Failed to add department");
      }
    } catch (error) {
      setError(error.response?.data?.Message || "Error adding department");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDepartment((prev) => ({ ...prev, [name]: value }));

    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card">
              <div className="card-body text-center">
                <FaSpinner className="fa-spin fa-2x mb-3" />
                <p>Loading employee information...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">
                <FaBuilding className="me-2" />
                Add New Department
              </h4>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger">
                  <FaExclamationTriangle className="me-2" />
                  {error}
                </div>
              )}
              {success && (
                <div className="alert alert-success">
                  <FaSave className="me-2" />
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Department Name</label>
                  <input
                    type="text"
                    className={`form-control ${
                      validationErrors.DepartmentName ? "is-invalid" : ""
                    }`}
                    name="DepartmentName"
                    value={department.DepartmentName}
                    onChange={handleChange}
                    required
                  />
                  {validationErrors.DepartmentName && (
                    <div className="invalid-feedback">
                      {validationErrors.DepartmentName}
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">Department Manager</label>
                  <select
                    className={`form-select ${
                      validationErrors.ManagerID ? "is-invalid" : ""
                    }`}
                    name="ManagerID"
                    value={department.ManagerID}
                    onChange={handleChange}
                  >
                    <option value="">Select Manager</option>
                    {employees.map((employee) => (
                      <option
                        key={employee.EmployeeID}
                        value={employee.EmployeeID}
                      >
                        {employee.FullName}
                      </option>
                    ))}
                  </select>
                  {validationErrors.ManagerID && (
                    <div className="invalid-feedback">
                      {validationErrors.ManagerID}
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className={`form-control ${
                      validationErrors.Description ? "is-invalid" : ""
                    }`}
                    name="Description"
                    value={department.Description}
                    onChange={handleChange}
                    rows="3"
                  />
                  {validationErrors.Description && (
                    <div className="invalid-feedback">
                      {validationErrors.Description}
                    </div>
                  )}
                </div>

                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => navigate("/dashboard/departments")}
                    disabled={submitting}
                  >
                    <FaTimes className="me-2" />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <FaSpinner className="fa-spin me-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FaSave className="me-2" />
                        Save Department
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddDepartment;
