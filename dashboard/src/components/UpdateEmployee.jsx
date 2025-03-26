import axios from "axios";
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const UpdateEmployee = () => {
  const { id } = useParams(); // Get the employee ID from the URL
  const navigate = useNavigate(); // For navigation after update
  const [employee, setEmployee] = useState({
    EmployeeID: "",
    ApplicantID: "",
    DepartmentID: "",
    HireDate: "",
    Salary: "",
    Status: "Active",
  });

  const [departments, setDepartments] = useState([]);

  // Fetch employee details by ID
  useEffect(() => {
    axios
      .get(`http://localhost:3000/auth/employees/${id}`)
      .then((res) => {
        if (res.data.Status) {
          setEmployee(res.data.Data); // Populate the form with employee data
        } else {
          alert(res.data.Error);
        }
      })
      .catch((err) => console.error("Error fetching employee details:", err));
  }, [id]);

  // Fetch departments for the dropdown
  useEffect(() => {
    axios
      .get("http://localhost:3000/api/departments")
      .then((res) => setDepartments(res.data))
      .catch((err) => console.error("Error fetching departments:", err));
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `http://localhost:3000/auth/update_employee/${id}`,
        employee
      );
      alert("Employee updated successfully!");
      navigate("/dashboard/employees"); // Redirect to the employee list
    } catch (error) {
      console.error("Error updating employee:", error);
      alert("Failed to update employee.");
    }
  };

  return (
    <div className="d-flex justify-content-center mt-3">
      <div className="p-3 rounded w-50 border">
        <h2 className="text-center">Update Employee</h2>
        <form className="row g-1" onSubmit={handleSubmit}>
          <div className="col-6">
            <label htmlFor="EmployeeID" className="form-label">
              Employee ID
            </label>
            <input
              type="text"
              className="form-control rounded-0"
              id="EmployeeID"
              value={employee.EmployeeID}
              disabled // Employee ID should not be editable
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
              value={employee.ApplicantID}
              onChange={(e) =>
                setEmployee({ ...employee, ApplicantID: e.target.value })
              }
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
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
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
              value={employee.HireDate}
              onChange={(e) =>
                setEmployee({ ...employee, HireDate: e.target.value })
              }
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
              value={employee.Salary}
              onChange={(e) =>
                setEmployee({ ...employee, Salary: e.target.value })
              }
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
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="col-12">
            <button type="submit" className="btn btn-primary w-100">
              Update Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateEmployee;
