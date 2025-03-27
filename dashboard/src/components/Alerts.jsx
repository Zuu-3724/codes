import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaBirthdayCake,
  FaExclamationTriangle,
  FaMoneyBillWave,
  FaCheck,
} from "react-icons/fa";
import { TokenManager } from "../config/api.config";

// Tạo cấu hình bảo mật cục bộ thay vì import từ file không tồn tại
const SECURITY_CONFIG = {
  API: {
    BASE_URL: "http://localhost:9000",
  },
};

const Alerts = () => {
  const [alerts, setAlerts] = useState({
    workAnniversaries: [],
    leaveViolations: [],
    payrollIssues: [],
  });
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);

    try {
      const API_BASE = SECURITY_CONFIG.API.BASE_URL;
      const token = TokenManager.getToken();
      const config = {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      };

      // Fetch work anniversary alerts
      const anniversaryResponse = await axios.get(
        `${API_BASE}/auth/work-anniversaries`,
        config
      );
      if (anniversaryResponse.data.Status) {
        setAlerts((prev) => ({
          ...prev,
          workAnniversaries: anniversaryResponse.data.Data,
        }));
      }

      // Fetch leave violation alerts
      const leaveResponse = await axios.get(
        `${API_BASE}/auth/leave-violations`,
        config
      );
      if (leaveResponse.data.Status) {
        setAlerts((prev) => ({
          ...prev,
          leaveViolations: leaveResponse.data.Data,
        }));
      }

      // Fetch payroll discrepancy alerts
      const payrollResponse = await axios.get(
        `${API_BASE}/auth/payroll-discrepancies`,
        config
      );
      if (payrollResponse.data.Status) {
        setAlerts((prev) => ({
          ...prev,
          payrollIssues: payrollResponse.data.Data,
        }));
      }
    } catch (error) {
      console.error("Error fetching alerts:", error);
      setError("Unable to load notifications. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId, alertType) => {
    try {
      const API_BASE = SECURITY_CONFIG.API.BASE_URL;
      const token = TokenManager.getToken();
      const config = {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      };

      const response = await axios.put(
        `${API_BASE}/auth/acknowledge-alert/${alertId}`,
        {
          type: alertType,
        },
        config
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
      alert("Unable to acknowledge notification. Please try again.");
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
        return "Payroll Issues";
      default:
        return "";
    }
  };

  const renderAlerts = (type) => {
    const alertsList = alerts[type];
    if (!alertsList || alertsList.length === 0) {
      return (
        <div className="text-center py-4">
          <p className="text-muted">No notifications available</p>
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
      <h1 className="mt-4 mb-4">Notification System</h1>

      {error && (
        <div className="alert alert-danger mb-4" role="alert">
          {error}
          <button
            type="button"
            className="btn-close float-end"
            onClick={() => setError(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

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
              All Notifications
            </button>
            <button
              className={`btn btn-outline-warning ${
                filter === "workAnniversaries" ? "active" : ""
              }`}
              onClick={() => setFilter("workAnniversaries")}
            >
              Anniversaries
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
        <div className="col-md-6 text-end">
          <button
            className="btn btn-primary"
            onClick={fetchAlerts}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Alerts Display */}
      <div className="row">
        <div className="col-12">
          <div className="card shadow mb-4">
            <div className="card-header py-3">
              <h6 className="m-0 font-weight-bold text-primary">
                Active Notifications
              </h6>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Loading notifications...</p>
                </div>
              ) : filter === "all" ? (
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
                    <h5 className="mb-3">Payroll Issues</h5>
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
