import React, { useState } from "react";
import { checkServerConnection } from "../config/api.config";
import { FaServer, FaCheck, FaTimes, FaSync } from "react-icons/fa";

const ServerStatus = () => {
  const [status, setStatus] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  const [checking, setChecking] = useState(false);

  const checkStatus = async () => {
    setChecking(true);
    setStatus("checking");
    try {
      const isConnected = await checkServerConnection();
      setStatus(isConnected ? "online" : "offline");
      setLastChecked(new Date());
    } catch (error) {
      setStatus("error");
      console.error("Error checking server status:", error);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="server-status-box p-3 mb-4 border rounded">
      <h5 className="mb-3">
        <FaServer className="me-2" />
        Server Status
      </h5>
      <div className="d-flex align-items-center justify-content-between">
        <div>
          {!status && (
            <span className="text-secondary">Connection not checked</span>
          )}
          {status === "checking" && (
            <span className="text-secondary">Checking...</span>
          )}
          {status === "online" && (
            <span className="text-success">
              <FaCheck className="me-1" /> Server online
            </span>
          )}
          {status === "offline" && (
            <span className="text-danger">
              <FaTimes className="me-1" /> Server offline
            </span>
          )}
          {status === "error" && (
            <span className="text-danger">
              <FaTimes className="me-1" /> Connection check error
            </span>
          )}
          {lastChecked && (
            <div className="text-muted small mt-1">
              Last checked: {lastChecked.toLocaleTimeString()}
            </div>
          )}
        </div>
        <button
          className="btn btn-sm btn-outline-primary"
          onClick={checkStatus}
          disabled={checking}
        >
          <FaSync className={checking ? "spin-animation me-1" : "me-1"} />
          Check Connection
        </button>
      </div>

      <style jsx="true">{`
        .spin-animation {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default ServerStatus;
