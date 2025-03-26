import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaBirthdayCake,
  FaExclamationTriangle,
  FaMoneyBillWave,
  FaCheck,
} from "react-icons/fa";

const Alerts = () => {
  const [alerts, setAlerts] = useState({
    workAnniversaries: [],
    leaveViolations: [],
    payrollIssues: [],
  });
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      // Fetch work anniversary alerts
      const anniversaryResponse = await axios.get(
        "http://localhost:3000/auth/work-anniversaries"
      );
      if (anniversaryResponse.data.Status) {
        setAlerts((prev) => ({
          ...prev,
          workAnniversaries: anniversaryResponse.data.Data,
        }));
      }

      // Fetch leave violation alerts
      const leaveResponse = await axios.get(
        "http://localhost:3000/auth/leave-violations"
      );
      if (leaveResponse.data.Status) {
        setAlerts((prev) => ({
          ...prev,
          leaveViolations: leaveResponse.data.Data,
        }));
      }

      // Fetch payroll discrepancy alerts
      const payrollResponse = await axios.get(
        "http://localhost:3000/auth/payroll-discrepancies"
      );
      if (payrollResponse.data.Status) {
        setAlerts((prev) => ({
          ...prev,
          payrollIssues: payrollResponse.data.Data,
        }));
      }
    } catch (error) {
      console.error("Error fetching alerts:", error);
    }
  };

  const handleAcknowledgeAlert = async (alertId, alertType) => {
    try {
      const response = await axios.put(
        `http://localhost:3000/auth/acknowledge-alert/${alertId}`,
        {
          type: alertType,
        }
      );
      if (response.data.Status) {
        // Update local state to remove acknowledged alert
        setAlerts((prev) => ({
          ...prev,
          [alertType]: prev[alertType].filter((alert) => alert.id !== alertId),
        }));
      }
    } catch (error) {
      console.error("Error acknowledging alert:", error);
      alert("Failed to acknowledge alert");
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case "workAnniversaries":
        return <FaBirthdayCake className="text-warning" />;
      case "leaveViolations":
        return <FaExclamationTriangle className="text-danger" />;
      case "payrollIssues":
        return <FaMoneyBillWave className="text-primary" />;
      default:
        return null;
    }
  };

  const getAlertTitle = (type) => {
    switch (type) {
      case "workAnniversaries":
        return "Work Anniversary Reminders";
      case "leaveViolations":
        return "Leave Policy Violations";
      case "payrollIssues":
        return "Payroll Discrepancies";
      default:
        return "";
    }
  };

  const renderAlerts = (type) => {
    const alertsList = alerts[type];
    if (!alertsList || alertsList.length === 0) {
      return (
        <div className="text-center py-4">
          <p className="text-muted">No alerts to display</p>
        </div>
      );
    }

    return alertsList.map((alert) => (
      <div key={alert.id} className="alert-item border-bottom py-3">
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <div className="me-3">{getAlertIcon(type)}</div>
            <div>
              <h6 className="mb-1">{alert.title}</h6>
              <p className="mb-0 text-muted">{alert.description}</p>
            </div>
          </div>
          <div>
            <button
              className="btn btn-sm btn-outline-success"
              onClick={() => handleAcknowledgeAlert(alert.id, type)}
            >
              <FaCheck className="me-1" /> Acknowledge
            </button>
          </div>
        </div>
      </div>
    ));
  };

  return (
    <div className="container-fluid px-4">
      <h1 className="mt-4 mb-4">Alert System</h1>

      {/* Alert Filter */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="btn-group">
            <button
              className={`btn btn-outline-primary ${
                filter === "all" ? "active" : ""
              }`}
              onClick={() => setFilter("all")}
            >
              All Alerts
            </button>
            <button
              className={`btn btn-outline-warning ${
                filter === "workAnniversaries" ? "active" : ""
              }`}
              onClick={() => setFilter("workAnniversaries")}
            >
              Work Anniversaries
            </button>
            <button
              className={`btn btn-outline-danger ${
                filter === "leaveViolations" ? "active" : ""
              }`}
              onClick={() => setFilter("leaveViolations")}
            >
              Leave Violations
            </button>
            <button
              className={`btn btn-outline-info ${
                filter === "payrollIssues" ? "active" : ""
              }`}
              onClick={() => setFilter("payrollIssues")}
            >
              Payroll Issues
            </button>
          </div>
        </div>
      </div>

      {/* Alerts Display */}
      <div className="row">
        <div className="col-12">
          <div className="card shadow mb-4">
            <div className="card-header py-3">
              <h6 className="m-0 font-weight-bold text-primary">
                Active Alerts
              </h6>
            </div>
            <div className="card-body">
              {filter === "all" ? (
                <>
                  {/* Work Anniversary Alerts */}
                  <div className="mb-4">
                    <h5 className="mb-3">Work Anniversary Reminders</h5>
                    {renderAlerts("workAnniversaries")}
                  </div>

                  {/* Leave Violation Alerts */}
                  <div className="mb-4">
                    <h5 className="mb-3">Leave Policy Violations</h5>
                    {renderAlerts("leaveViolations")}
                  </div>

                  {/* Payroll Issue Alerts */}
                  <div>
                    <h5 className="mb-3">Payroll Discrepancies</h5>
                    {renderAlerts("payrollIssues")}
                  </div>
                </>
              ) : (
                <div>
                  <h5 className="mb-3">{getAlertTitle(filter)}</h5>
                  {renderAlerts(filter)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Alerts;
