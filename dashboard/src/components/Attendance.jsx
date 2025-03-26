import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaSearch,
  FaCalendarAlt,
  FaUserClock,
  FaUserTimes,
} from "react-icons/fa";

const Attendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [leaveRequests, setLeaveRequests] = useState([]);

  useEffect(() => {
    fetchAttendance();
    fetchLeaveRequests();
  }, [selectedMonth]);

  const fetchAttendance = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3000/auth/attendance?month=${selectedMonth}`
      );
      if (response.data.Status) {
        setAttendance(response.data.Data);
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3000/auth/leave-requests"
      );
      if (response.data.Status) {
        setLeaveRequests(response.data.Data);
      }
    } catch (error) {
      console.error("Error fetching leave requests:", error);
    }
  };

  const handleLeaveRequest = async (requestId, status) => {
    try {
      const response = await axios.put(
        `http://localhost:3000/auth/update-leave-request/${requestId}`,
        {
          status: status,
        }
      );
      if (response.data.Status) {
        alert("Leave request updated successfully!");
        fetchLeaveRequests();
        fetchAttendance();
      }
    } catch (error) {
      console.error("Error updating leave request:", error);
      alert("Failed to update leave request");
    }
  };

  const filteredAttendance = attendance.filter(
    (record) =>
      record.EmployeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.EmployeeID.toString().includes(searchTerm)
  );

  return (
    <div className="container-fluid px-4">
      <h1 className="mt-4 mb-4">Attendance Management</h1>

      {/* Search and Filter Section */}
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
            <span className="input-group-text">
              <FaCalendarAlt />
            </span>
            <input
              type="month"
              className="form-control"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Attendance Summary Cards */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6">
          <div className="card border-left-primary shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Present Days
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {attendance.reduce(
                      (sum, record) => sum + record.PresentDays,
                      0
                    )}
                  </div>
                </div>
                <div className="col-auto">
                  <FaUserClock className="fa-2x text-gray-300" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div className="card border-left-danger shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-danger text-uppercase mb-1">
                    Leave Days
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {attendance.reduce(
                      (sum, record) => sum + record.LeaveDays,
                      0
                    )}
                  </div>
                </div>
                <div className="col-auto">
                  <FaUserTimes className="fa-2x text-gray-300" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="card shadow mb-4">
        <div className="card-header py-3">
          <h6 className="m-0 font-weight-bold text-primary">
            Monthly Attendance
          </h6>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Present Days</th>
                  <th>Leave Days</th>
                  <th>Late Days</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendance.map((record) => (
                  <tr key={record.EmployeeID}>
                    <td>{record.EmployeeID}</td>
                    <td>{record.EmployeeName}</td>
                    <td>{record.DepartmentName}</td>
                    <td>{record.PresentDays}</td>
                    <td>{record.LeaveDays}</td>
                    <td>{record.LateDays}</td>
                    <td>
                      <span
                        className={`badge bg-${
                          record.Status === "Active" ? "success" : "warning"
                        }`}
                      >
                        {record.Status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Leave Requests */}
      <div className="card shadow mb-4">
        <div className="card-header py-3">
          <h6 className="m-0 font-weight-bold text-primary">
            Pending Leave Requests
          </h6>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Leave Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Reason</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests.map((request) => (
                  <tr key={request.RequestID}>
                    <td>{request.EmployeeID}</td>
                    <td>{request.EmployeeName}</td>
                    <td>{request.LeaveType}</td>
                    <td>{new Date(request.StartDate).toLocaleDateString()}</td>
                    <td>{new Date(request.EndDate).toLocaleDateString()}</td>
                    <td>{request.Reason}</td>
                    <td>
                      <button
                        className="btn btn-success btn-sm me-2"
                        onClick={() =>
                          handleLeaveRequest(request.RequestID, "Approved")
                        }
                      >
                        Approve
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() =>
                          handleLeaveRequest(request.RequestID, "Rejected")
                        }
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
