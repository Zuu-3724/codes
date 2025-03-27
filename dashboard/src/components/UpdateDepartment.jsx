import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaBuilding,
  FaUsers,
  FaSave,
  FaTimes,
  FaExclamationTriangle,
  FaSpinner,
} from "react-icons/fa";

const UpdateDepartment = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [department, setDepartment] = useState({
    DepartmentID: "",
    DepartmentName: "",
    ManagerID: "",
    Description: "",
    Status: "Active",
  });
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        console.log("Fetching department data for ID:", id); // Debug log

        const [departmentResponse, employeesResponse] = await Promise.all([
          axios.get(`http://localhost:9000/departments/${id}`),
          axios.get("http://localhost:9000/employees/list"),
        ]);

        console.log("Department response:", departmentResponse.data); // Debug log
        console.log("Employees response:", employeesResponse.data); // Debug log

        if (departmentResponse.data.Status) {
          setDepartment(departmentResponse.data.Data);
        } else {
          setError("Department not found");
        }

        if (employeesResponse.data.Status) {
          setEmployees(employeesResponse.data.Data);
        }
      } catch (error) {
        console.error("Error fetching data:", error); // Debug log
        setError(error.response?.data?.Message || "Error loading data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

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

      const response = await axios.put(
        `http://localhost:9000/departments/update/${id}`,
        department
      );

      if (response.data.Status) {
        setSuccess("Department updated successfully!");
        setTimeout(() => {
          navigate("/dashboard/departments");
        }, 1500);
      } else {
        setError(response.data.Message || "Failed to update department");
      }
    } catch (error) {
      setError(error.response?.data?.Message || "Error updating department");
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
                <p>Loading department information...</p>
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
                Update Department
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
                  <label className="form-label">Department ID</label>
                  <input
                    type="text"
                    className="form-control"
                    name="DepartmentID"
                    value={department.DepartmentID}
                    disabled
                  />
                </div>

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
                    required
                  >
                    <option value="">Select department manager</option>
                    {employees.map((employee) => (
                      <option
                        key={employee.EmployeeID}
                        value={employee.EmployeeID}
                      >
                        {employee.EmployeeName}
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
                    required
                  />
                  {validationErrors.Description && (
                    <div className="invalid-feedback">
                      {validationErrors.Description}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <FaSpinner className="fa-spin" />
                  ) : (
                    <FaSave className="me-2" />
                  )}
                  Update Department
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateDepartment;
