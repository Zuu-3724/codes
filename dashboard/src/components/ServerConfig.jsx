import React, { useState } from "react";
import axios from "axios";
import { API_URL } from "../config/api.config";
import {
  FaServer,
  FaDatabase,
  FaClock,
  FaSave,
  FaRedo,
  FaInfoCircle,
} from "react-icons/fa";

const ServerConfig = () => {
  const [serverInfo, setServerInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    apiUrl: localStorage.getItem("apiUrl") || API_URL,
    useDemoData: localStorage.getItem("useDemoData") === "true",
    apiTimeout: parseInt(localStorage.getItem("apiTimeout") || "5000"),
    useProxy: localStorage.getItem("useProxy") === "true",
  });
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [testingConnection, setTestingConnection] = useState(false);

  const fetchServerInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/health`, {
        timeout: formData.apiTimeout,
      });
      setServerInfo(response.data);
      setConnectionStatus("connected");
    } catch (error) {
      console.error("Error fetching server info:", error);
      setError("Could not connect to server. Using demo data.");
      setConnectionStatus("disconnected");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Save settings to localStorage
      localStorage.setItem("apiUrl", formData.apiUrl);
      localStorage.setItem("useDemoData", formData.useDemoData.toString());
      localStorage.setItem("apiTimeout", formData.apiTimeout.toString());
      localStorage.setItem("useProxy", formData.useProxy.toString());

      // Test connection with new settings
      await testConnection();

      // Show success message
      alert(
        "Settings saved successfully! Please refresh the page for changes to take effect."
      );
    } catch (error) {
      setError("Failed to save settings: " + error.message);
    }
  };

  const testConnection = async () => {
    setTestingConnection(true);
    setError(null);

    try {
      const response = await axios.get(`${formData.apiUrl}/health`, {
        timeout: parseInt(formData.apiTimeout),
      });
      setConnectionStatus("connected");
      setServerInfo(response.data);
      return true;
    } catch (error) {
      console.error("Connection test failed:", error);
      setConnectionStatus("disconnected");
      setError("Connection test failed. " + error.message);
      return false;
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div className="container-fluid px-4">
      <h1 className="mt-4 mb-4">Server Configuration</h1>

      <div className="row">
        <div className="col-lg-6">
          <div className="card mb-4">
            <div className="card-header bg-primary text-white">
              <FaServer className="me-2" /> Server Settings
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="apiUrl" className="form-label">
                    API URL
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="apiUrl"
                    name="apiUrl"
                    value={formData.apiUrl}
                    onChange={handleInputChange}
                    placeholder="http://localhost:9000"
                  />
                  <small className="text-muted">
                    The base URL for the backend API
                  </small>
                </div>

                <div className="mb-3">
                  <label htmlFor="apiTimeout" className="form-label">
                    API Timeout (ms)
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="apiTimeout"
                    name="apiTimeout"
                    value={formData.apiTimeout}
                    onChange={handleInputChange}
                    min="1000"
                    step="500"
                  />
                  <small className="text-muted">
                    Maximum time to wait for API responses
                  </small>
                </div>

                <div className="mb-3 form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="useDemoData"
                    name="useDemoData"
                    checked={formData.useDemoData}
                    onChange={handleInputChange}
                  />
                  <label className="form-check-label" htmlFor="useDemoData">
                    Force Demo Data Mode
                  </label>
                  <p className="text-muted small">
                    <FaInfoCircle className="me-1" />
                    When enabled, the application will use demo data instead of
                    connecting to the backend
                  </p>
                </div>

                <div className="mb-3 form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="useProxy"
                    name="useProxy"
                    checked={formData.useProxy}
                    onChange={handleInputChange}
                  />
                  <label className="form-check-label" htmlFor="useProxy">
                    Use API Proxy
                  </label>
                  <p className="text-muted small">
                    <FaInfoCircle className="me-1" />
                    Enable this if you're using a proxy (e.g., Vite's proxy or
                    Nginx)
                  </p>
                </div>

                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-primary">
                    <FaSave className="me-1" /> Save Settings
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={testConnection}
                    disabled={testingConnection}
                  >
                    <FaRedo
                      className={`me-1 ${testingConnection ? "fa-spin" : ""}`}
                    />
                    Test Connection
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card mb-4">
            <div className="card-header bg-info text-white">
              <FaDatabase className="me-2" /> Server Status
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Checking server status...</p>
                </div>
              ) : connectionStatus === "connected" && serverInfo ? (
                <>
                  <div className="alert alert-success d-flex align-items-center">
                    <FaServer className="me-2" />
                    <div>Server is online and responding</div>
                  </div>

                  <h5 className="mt-4">Server Information</h5>
                  <div className="table-responsive">
                    <table className="table table-bordered">
                      <tbody>
                        <tr>
                          <th>Status</th>
                          <td>
                            <span className="badge bg-success">
                              {serverInfo.status}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <th>Environment</th>
                          <td>{serverInfo.environment}</td>
                        </tr>
                        <tr>
                          <th>Response Time</th>
                          <td>
                            {serverInfo.responseTime
                              ? `${(serverInfo.responseTime * 1000).toFixed(
                                  2
                                )} ms`
                              : "N/A"}
                          </td>
                        </tr>
                        <tr>
                          <th>MySQL Status</th>
                          <td>
                            <span
                              className={`badge ${
                                serverInfo.databases?.mysql?.status ===
                                "healthy"
                                  ? "bg-success"
                                  : "bg-danger"
                              }`}
                            >
                              {serverInfo.databases?.mysql?.status || "Unknown"}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <th>SQL Server Status</th>
                          <td>
                            <span
                              className={`badge ${
                                serverInfo.databases?.sqlServer?.status ===
                                "healthy"
                                  ? "bg-success"
                                  : "bg-danger"
                              }`}
                            >
                              {serverInfo.databases?.sqlServer?.status ||
                                "Unknown"}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <th>Last Updated</th>
                          <td>{serverInfo.timestamp || "N/A"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="alert alert-danger d-flex align-items-center">
                  <FaServer className="me-2" />
                  <div>
                    <strong>Server is not responding.</strong> Check your
                    connection settings or ensure the server is running.
                    {error && (
                      <p className="mt-2 mb-0">
                        <small>{error}</small>
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-4">
                <h5>How to connect to the server</h5>
                <ol className="small">
                  <li>
                    Ensure the Python server is running (
                    <code>python main.py</code> in the python_server directory)
                  </li>
                  <li>
                    Check that the server port matches your API URL
                    configuration (default: 9000)
                  </li>
                  <li>
                    Verify database connections in the <code>.env</code> file
                  </li>
                  <li>
                    If you're having CORS issues, enable the API Proxy option
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerConfig;
