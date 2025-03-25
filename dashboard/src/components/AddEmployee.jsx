import React, { useState, useEffect } from "react";
import axios from "axios";

const AddEmployee = () => {
  const [employee, setEmployee] = useState({
    EmployeeID: "",
    ApplicantID: "",
    DepartmentID: "",
    HireDate: "",
    Salary: "",
    Status: "Active",
  });

  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    // Fetch departments
    axios
      .get("http://localhost:3000/api/departments")
      .then((res) => setDepartments(res.data))
      .catch((err) => console.log("Error fetching departments:", err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post("http://localhost:3000/api/add_employee", employee);

      alert("Employee added successfully!");
    } catch (error) {
      console.error("Error adding employee:", error);
      alert("Failed to add employee.");
    }
  };

  return (
    <div className="d-flex justify-content-center mt-3">
      <div className="p-3 rounded w-50 border">
        <h2>Add Employee</h2>
        <form className="row g-2 " onSubmit={handleSubmit}>
          <div className="col-6">
            <label htmlFor="EmployeeID" className="form-label">
              Employee ID
            </label>
            <input
              type="text"
              className="form-control"
              id="EmployeeID"
              placeholder="Enter Employee ID"
              onChange={(e) =>
                setEmployee({ ...employee, EmployeeID: e.target.value })
              }
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
              placeholder="Enter Applicant ID"
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
              placeholder="Enter Salary"
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
              Add Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployee;
