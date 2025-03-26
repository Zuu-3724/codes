import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaSearch, FaEdit, FaHistory } from "react-icons/fa";

const Payroll = () => {
  const [payroll, setPayroll] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchPayroll();
  }, []);

  const fetchPayroll = async () => {
    try {
      const response = await axios.get("http://localhost:3000/auth/payroll");
      if (response.data.Status) {
        setPayroll(response.data.Data);
      }
    } catch (error) {
      console.error("Error fetching payroll:", error);
    }
  };

  const handleSalaryUpdate = async (employeeId, newSalary) => {
    try {
      const response = await axios.put(
        `http://localhost:3000/auth/update-salary/${employeeId}`,
        {
          salary: newSalary,
        }
      );
      if (response.data.Status) {
        alert("Salary updated successfully!");
        fetchPayroll();
      }
    } catch (error) {
      console.error("Error updating salary:", error);
      alert("Failed to update salary");
    }
  };

  const fetchSalaryHistory = async (employeeId) => {
    try {
      const response = await axios.get(
        `http://localhost:3000/auth/salary-history/${employeeId}`
      );
      if (response.data.Status) {
        setSalaryHistory(response.data.Data);
        setSelectedEmployee(employeeId);
        setShowHistory(true);
      }
    } catch (error) {
      console.error("Error fetching salary history:", error);
    }
  };

  const filteredPayroll = payroll.filter(
    (employee) =>
      employee.EmployeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.EmployeeID.toString().includes(searchTerm)
  );

  return (
    <div className="container-fluid px-4">
      <h1 className="mt-4 mb-4">Payroll Management</h1>

      {/* Search Bar */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text">
              <FaSearch />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by employee name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="card shadow mb-4">
        <div className="card-header py-3">
          <h6 className="m-0 font-weight-bold text-primary">Current Payroll</h6>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Position</th>
                  <th>Current Salary</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayroll.map((employee) => (
                  <tr key={employee.EmployeeID}>
                    <td>{employee.EmployeeID}</td>
                    <td>{employee.EmployeeName}</td>
                    <td>{employee.DepartmentName}</td>
                    <td>{employee.Position}</td>
                    <td>${employee.Salary.toLocaleString()}</td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm me-2"
                        onClick={() => {
                          const newSalary = prompt(
                            "Enter new salary:",
                            employee.Salary
                          );
                          if (newSalary && !isNaN(newSalary)) {
                            handleSalaryUpdate(
                              employee.EmployeeID,
                              parseFloat(newSalary)
                            );
                          }
                        }}
                      >
                        <FaEdit /> Update
                      </button>
                      <button
                        className="btn btn-info btn-sm"
                        onClick={() => fetchSalaryHistory(employee.EmployeeID)}
                      >
                        <FaHistory /> History
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Salary History Modal */}
      {showHistory && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Salary History</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowHistory(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Previous Salary</th>
                        <th>New Salary</th>
                        <th>Change Amount</th>
                        <th>Updated By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salaryHistory.map((record, index) => (
                        <tr key={index}>
                          <td>
                            {new Date(record.UpdateDate).toLocaleDateString()}
                          </td>
                          <td>${record.PreviousSalary.toLocaleString()}</td>
                          <td>${record.NewSalary.toLocaleString()}</td>
                          <td>
                            $
                            {(
                              record.NewSalary - record.PreviousSalary
                            ).toLocaleString()}
                          </td>
                          <td>{record.UpdatedBy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payroll;
