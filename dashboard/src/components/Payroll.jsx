import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaSearch, FaEdit, FaHistory } from "react-icons/fa";
import UpdatePayroll from "./UpdatePayroll";
import { getAuthConfig } from "../config/api.config";
import { useNavigate } from "react-router-dom";

const Payroll = () => {
  const navigate = useNavigate();
  const [payroll, setPayroll] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [employeeToUpdate, setEmployeeToUpdate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  useEffect(() => {
    fetchPayroll();
  }, [currentMonth]);

  const fetchPayroll = async () => {
    setLoading(true);
    setError(null);
    const config = getAuthConfig(navigate);
    if (!config) return;

    try {
      // Thử kết nối trực tiếp với database trước
      const response = await axios.get(
        `http://localhost:9000/payroll/salary?month=${currentMonth}`,
        config
      );

      if (response.data.Status) {
        setPayroll(response.data.Data);
      } else {
        // Nếu không thành công, thử endpoint test
        const testResponse = await axios.get(
          `http://localhost:9000/payroll/test`,
          config
        );

        if (testResponse.data.Status) {
          setPayroll(testResponse.data.Data);
          setError(
            "Đang sử dụng dữ liệu test do không thể kết nối tới database chính"
          );
        } else {
          setError(response.data.Error || "Could not load payroll data");
        }
      }
    } catch (error) {
      console.error("Error fetching payroll:", error);
      if (error.response?.status === 401) {
        navigate("/login");
      } else {
        try {
          // Thử kết nối với endpoint test
          const testResponse = await axios.get(
            `http://localhost:9000/payroll/test`,
            config
          );

          if (testResponse.data.Status) {
            setPayroll(testResponse.data.Data);
            setError(
              "Đang sử dụng dữ liệu test do lỗi kết nối tới database chính"
            );
          } else {
            // Nếu cả hai đều thất bại, dùng demo data
            console.log("Using demo payroll data");
            setPayroll([
              {
                EmployeeID: 1,
                FullName: "Nguyễn Văn A",
                BaseSalary: 15000000,
                Bonus: 2000000,
                Deductions: 500000,
                NetSalary: 16500000,
                Department: "IT",
                Position: "Developer",
              },
              {
                EmployeeID: 2,
                FullName: "Trần Thị B",
                BaseSalary: 18000000,
                Bonus: 3000000,
                Deductions: 800000,
                NetSalary: 20200000,
                Department: "HR",
                Position: "Manager",
              },
              {
                EmployeeID: 3,
                FullName: "Lê Văn C",
                BaseSalary: 12000000,
                Bonus: 1500000,
                Deductions: 400000,
                NetSalary: 13100000,
                Department: "Finance",
                Position: "Accountant",
              },
            ]);
            setError(
              "Đang sử dụng dữ liệu demo do không kết nối được tới máy chủ cơ sở dữ liệu"
            );
          }
        } catch (innerError) {
          // Nếu cả hai đều thất bại, dùng demo data cuối cùng
          console.log("Using demo payroll data after all attempts failed");
          setPayroll([
            {
              EmployeeID: 1,
              FullName: "Nguyễn Văn A",
              BaseSalary: 15000000,
              Bonus: 2000000,
              Deductions: 500000,
              NetSalary: 16500000,
              Department: "IT",
              Position: "Developer",
            },
            {
              EmployeeID: 2,
              FullName: "Trần Thị B",
              BaseSalary: 18000000,
              Bonus: 3000000,
              Deductions: 800000,
              NetSalary: 20200000,
              Department: "HR",
              Position: "Manager",
            },
            {
              EmployeeID: 3,
              FullName: "Lê Văn C",
              BaseSalary: 12000000,
              Bonus: 1500000,
              Deductions: 400000,
              NetSalary: 13100000,
              Department: "Finance",
              Position: "Accountant",
            },
          ]);
          setError(
            "Đang sử dụng dữ liệu demo do không kết nối được tới máy chủ cơ sở dữ liệu"
          );
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShowUpdateModal = (employee) => {
    setEmployeeToUpdate(employee);
    setShowUpdateModal(true);
  };

  const handleUpdateSuccess = () => {
    fetchPayroll();
    setShowUpdateModal(false);
    setEmployeeToUpdate(null);
  };

  const fetchSalaryHistory = async (employeeId) => {
    setLoading(true);
    setError(null);
    const config = getAuthConfig(navigate);
    if (!config) return;

    try {
      const response = await axios.get(
        `http://localhost:9000/payroll/salary-history/${employeeId}`,
        config
      );
      if (response.data.Status) {
        setSalaryHistory(response.data.Data);
        setSelectedEmployee(employeeId);
        setShowHistory(true);
      } else {
        setError(response.data.Error || "Could not load salary history");
      }
    } catch (error) {
      console.error("Error fetching salary history:", error);
      if (error.response?.status === 401) {
        navigate("/login");
      } else {
        setError("Connection error. Please try again later");
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredPayroll = payroll.filter(
    (employee) =>
      employee.FullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.EmployeeID.toString().includes(searchTerm)
  );

  return (
    <div className="container-fluid px-4">
      <h1 className="mt-4 mb-4">Payroll Management</h1>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
          <button
            className="btn-close float-end"
            onClick={() => setError(null)}
          ></button>
        </div>
      )}

      {/* Search and Month Selection */}
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
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text">Month</span>
            <input
              type="month"
              className="form-control"
              value={currentMonth}
              onChange={(e) => setCurrentMonth(e.target.value)}
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
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading payroll data...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Name</th>
                    <th>Base Salary</th>
                    <th>Bonus</th>
                    <th>Deductions</th>
                    <th>Net Salary</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayroll.map((employee) => (
                    <tr key={employee.EmployeeID}>
                      <td>{employee.EmployeeID}</td>
                      <td>{employee.FullName}</td>
                      <td>${employee.BaseSalary.toLocaleString()}</td>
                      <td>${employee.Bonus.toLocaleString()}</td>
                      <td>${employee.Deductions.toLocaleString()}</td>
                      <td>${employee.NetSalary.toLocaleString()}</td>
                      <td>
                        <button
                          className="btn btn-primary btn-sm me-2"
                          onClick={() => handleShowUpdateModal(employee)}
                        >
                          <FaEdit /> Update
                        </button>
                        <button
                          className="btn btn-info btn-sm"
                          onClick={() =>
                            fetchSalaryHistory(employee.EmployeeID)
                          }
                        >
                          <FaHistory /> History
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
                        <th>Month</th>
                        <th>Base Salary</th>
                        <th>Bonus</th>
                        <th>Deductions</th>
                        <th>Net Salary</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salaryHistory.map((record) => (
                        <tr key={record.SalaryID}>
                          <td>
                            {new Date(record.SalaryMonth).toLocaleDateString(
                              undefined,
                              {
                                year: "numeric",
                                month: "long",
                              }
                            )}
                          </td>
                          <td>${record.BaseSalary.toLocaleString()}</td>
                          <td>${record.Bonus.toLocaleString()}</td>
                          <td>${record.Deductions.toLocaleString()}</td>
                          <td>${record.NetSalary.toLocaleString()}</td>
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

      {/* Update Salary Modal */}
      {showUpdateModal && employeeToUpdate && (
        <UpdatePayroll
          employee={employeeToUpdate}
          onUpdateSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  );
};

export default Payroll;
