import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaBirthdayCake,
  FaExclamationTriangle,
  FaCalendarAlt,
  FaCheck,
  FaCalendarTimes,
  FaBell,
} from "react-icons/fa";
import { getAuthConfig } from "../config/api.config";
import { useNavigate } from "react-router-dom";

const Alerts = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAlerts();
  }, [activeTab]);

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);

    try {
      const config = getAuthConfig(navigate);
      if (!config) return;

      // Use the test endpoint instead of the real endpoints
      const response = await axios.get(
        "http://localhost:9000/alerts/test",
        config
      );

      if (response.data.Status) {
        // Get the appropriate alerts data based on the active tab
        let filteredAlerts = [];

        if (activeTab === "all") {
          // Combine all alert types
          filteredAlerts = [
            ...response.data.Data.workAnniversaries,
            ...response.data.Data.leaveViolations,
          ];
        } else if (activeTab === "work_anniversaries") {
          filteredAlerts = response.data.Data.workAnniversaries;
        } else if (activeTab === "leave_violations") {
          filteredAlerts = response.data.Data.leaveViolations;
        }

        setAlerts(filteredAlerts);
      } else {
        setError("Failed to load alerts. Please try again later.");
      }
    } catch (error) {
      console.error("Error loading alerts:", error);
      setError("Connection error. Please try again later");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshAlerts = () => {
    fetchAlerts();
  };

  return (
    <div className="container-fluid px-4">
      <h1 className="mt-4 mb-4">
        <FaBell className="me-2" />
        System Alerts & Notifications
      </h1>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
          <button
            className="btn-close float-end"
            onClick={() => setError(null)}
          ></button>
        </div>
      )}

      <div className="d-flex justify-content-between mb-4">
        <ul className="nav nav-pills">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              All Alerts
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${
                activeTab === "work_anniversaries" ? "active" : ""
              }`}
              onClick={() => setActiveTab("work_anniversaries")}
            >
              Work Anniversaries
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${
                activeTab === "leave_violations" ? "active" : ""
              }`}
              onClick={() => setActiveTab("leave_violations")}
            >
              Leave Violations
            </button>
          </li>
        </ul>

        <button className="btn btn-success" onClick={handleRefreshAlerts}>
          <FaCheck className="me-1" />
          Refresh Alerts
        </button>
      </div>

      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading alerts...</p>
        </div>
      ) : alerts.length > 0 ? (
        <div className="list-group">
          {alerts.map((alert, index) => (
            <div key={index} className="list-group-item list-group-item-action">
              <div className="d-flex w-100 justify-content-between">
                <h5 className="mb-1">
                  {alert.FullName} - {alert.DepartmentName}
                </h5>
                <small>{alert.Date}</small>
              </div>
              {alert.YearsOfService && (
                <p className="mb-1">
                  Work Anniversary: {alert.YearsOfService} years of service
                </p>
              )}
              {alert.LeaveDays && (
                <p className="mb-1">
                  Leave Violation: {alert.LeaveDays} days taken (
                  {alert.ExcessDays} in excess)
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="alert alert-info">
          No alerts found for the selected filter.
        </div>
      )}
    </div>
  );
};

export default Alerts;
