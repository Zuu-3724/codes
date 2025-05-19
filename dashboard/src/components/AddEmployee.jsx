import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getAuthConfig } from "../config/api.config";

const AddEmployee = () => {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState({
    DateOfBirth: "",
    PositionID: "",
    FullName: "",
    EmployeeID: "",
    ApplicantID: "",
    DepartmentID: "",
    HireDate: "",
    Salary: "",
    Status: "Active",
  });

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    setError(null);

    try {
      const config = getAuthConfig(navigate);
      if (!config) return;

      const response = await axios.get(
        "http://localhost:9000/departments/list",
        config
      );

      if (response.data.Status) {
        setDepartments(response.data.Data);
      } else {
        setError(response.data.Error || "Unable to load department list");
      }
    } catch (err) {
      console.error("Error loading department list:", err);
      setError("Unable to connect to server. Please try again later");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const config = getAuthConfig(navigate);
      if (!config) return;

      const response = await axios.post(
        "http://localhost:9000/employees/add",
        {
          DateOfBirth: employee.DateOfBirth,
          FullName: employee.FullName,
          PositionID: employee.PositionID,
          EmployeeID: employee.EmployeeID,
          ApplicantID: employee.ApplicantID,
          DepartmentID: parseInt(employee.DepartmentID),
          HireDate: employee.HireDate,
          Salary: parseFloat(employee.Salary),
          Status: employee.Status,
        },
        config
      );

      if (response.data.Status) {
        alert(response.data.Message || "Employee added successfully");
        navigate("/dashboard/employees");
      } else {
        setError(response.data.Error || "Unable to add employee");
      }
    } catch (error) {
      console.error("Error adding employee:", error);
      if (error.response) {
        if (error.response.status === 401) {
          navigate("/login");
        } else {
          setError(error.response.data?.Error || "Connection error to server");
        }
      } else {
        setError("Network error. Please check your connection");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center mt-3">
      <div className="p-3 rounded w-50 border">
        <h2 className="text-center">Add New Employee</h2>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
            <button
              className="btn-close float-end"
              onClick={() => setError(null)}
            ></button>
          </div>
        )}

        <form className="row g-1" onSubmit={handleSubmit}>
          <div className="col-6">
            <label htmlFor="EmployeeID" className="form-label">
              Employee ID
            </label>
            <input
              type="text"
              className="form-control rounded-0"
              id="EmployeeID"
              placeholder="Enter employee ID"
              onChange={(e) =>
                setEmployee({ ...employee, EmployeeID: e.target.value })
              }
              required
              disabled={loading}
            />
          </div><div className="col-6">
            <label htmlFor="FullName" className="form-label">
              FullName
            </label>
            <input
              type="text"
              className="form-control rounded-0"
              id="FullName"
              placeholder="Enter FullName"
              onChange={(e) =>
                setEmployee({ ...employee, FullName: e.target.value })
              }
              required
              disabled={loading}
            />
          </div>
          <div className="col-6">
            <label htmlFor="PositionID" className="form-label">
              PositionID
            </label>
            <input
              type="text"
              className="form-control rounded-0"
              id="PositionID"
              placeholder="Enter PositionID"
              onChange={(e) =>
                setEmployee({ ...employee, PositionID: e.target.value })
              }
              required
              disabled={loading}
            />
          </div>
           <div className="col-6">
            <label htmlFor="DateOfBirthID" className="form-label">
              DateOfBirth
            </label>
            <input
              type="date"
              className="form-control rounded-0"
              id="DateOfBirth"
              placeholder="Enter DateOfBirth"
              onChange={(e) =>
                setEmployee({ ...employee, DateOfBirth: e.target.value })
              }
              required
              disabled={loading}
            />
          </div>

          <div className="col-6">
            <label htmlFor="ApplicantID" className="form-label">
              Applicant ID
            </label>
            <input
              type="text"
              className="form-control"
              id="ApplicantID"
              placeholder="Enter applicant ID"
              onChange={(e) =>
                setEmployee({ ...employee, ApplicantID: e.target.value })
              }
              required
              disabled={loading}
            />
          </div>

          <div className="col-6">
            <label htmlFor="DepartmentID" className="form-label">
              Department
            </label>
            <select
              id="DepartmentID"
              className="form-select"
              value={employee.DepartmentID}
              onChange={(e) =>
                setEmployee({ ...employee, DepartmentID: e.target.value })
              }
              required
              disabled={loading}
            >
              <option value="">Select department</option>
              {departments.map((dept) => (
                <option key={dept.DepartmentID} value={dept.DepartmentID}>
                  {dept.DepartmentName}
                </option>
              ))}
            </select>
          </div>

          <div className="col-6">
            <label htmlFor="HireDate" className="form-label">
              Hire Date
            </label>
            <input
              type="date"
              className="form-control"
              id="HireDate"
              onChange={(e) =>
                setEmployee({ ...employee, HireDate: e.target.value })
              }
              required
              disabled={loading}
            />
          </div>

          <div className="col-6">
            <label htmlFor="Salary" className="form-label">
              Salary
            </label>
            <input
              type="number"
              className="form-control"
              id="Salary"
              placeholder="Enter salary amount"
              step="0.01"
              min="0"
              onChange={(e) =>
                setEmployee({ ...employee, Salary: e.target.value })
              }
              required
              disabled={loading}
            />
          </div>

          <div className="col-6">
            <label htmlFor="Status" className="form-label">
              Status
            </label>
            <select
              id="Status"
              className="form-select"
              value={employee.Status}
              onChange={(e) =>
                setEmployee({ ...employee, Status: e.target.value })
              }
              required
              disabled={loading}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="col-12 mt-3">
            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={loading}
            >
              {loading ? "Processing..." : "Add Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployee;
