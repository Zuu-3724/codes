import React, { useState } from "react";
import axios from "axios";
import { FaEdit } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const UpdatePayroll = ({ employee, onUpdateSuccess }) => {
  const [salary, setSalary] = useState(employee.Salary);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSalaryChange = (e) => {
    setSalary(e.target.value);
  };

  const handleSalaryUpdate = async (e) => {
    e.preventDefault();

    if (!salary || isNaN(salary) || parseFloat(salary) <= 0) {
      setError("Please enter a valid salary amount");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.put(
        `http://localhost:9000/auth/update-salary/${employee.EmployeeID}`,
        {
          salary: parseFloat(salary),
        }
      );

      if (response.data.Status) {
        onUpdateSuccess();
      } else {
        setError(response.data.Error || "Failed to update salary");
      }
    } catch (error) {
      console.error("Error updating salary:", error);
      if (error.response) {
        if (error.response.status === 401) {
          navigate("/login");
        } else {
          setError(error.response.data?.Error || "Server error during update");
        }
      } else {
        setError("Network error. Please check your connection");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal show d-block" tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Update Salary</h5>
            <button
              type="button"
              className="btn-close"
              onClick={() => onUpdateSuccess()}
            ></button>
          </div>
          <div className="modal-body">
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
                <button
                  className="btn-close float-end"
                  onClick={() => setError(null)}
                ></button>
              </div>
            )}

            <form onSubmit={handleSalaryUpdate}>
              <div className="mb-3">
                <label className="form-label">Employee</label>
                <input
                  type="text"
                  className="form-control"
                  value={`${employee.EmployeeName} (ID: ${employee.EmployeeID})`}
                  readOnly
                  disabled
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Current Position</label>
                <input
                  type="text"
                  className="form-control"
                  value={`${employee.Position} - ${employee.DepartmentName}`}
                  readOnly
                  disabled
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Current Salary</label>
                <div className="input-group">
                  <span className="input-group-text">$</span>
                  <input
                    type="text"
                    className="form-control"
                    value={employee.Salary.toLocaleString()}
                    readOnly
                    disabled
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">New Salary</label>
                <div className="input-group">
                  <span className="input-group-text">$</span>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Enter new salary amount"
                    value={salary}
                    onChange={handleSalaryChange}
                    min="0"
                    step="0.01"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end">
                <button
                  type="button"
                  className="btn btn-secondary me-2"
                  onClick={() => onUpdateSuccess()}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-1"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Updating...
                    </>
                  ) : (
                    <>
                      <FaEdit className="me-1" /> Update Salary
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdatePayroll;
