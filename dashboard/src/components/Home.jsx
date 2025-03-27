import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getAuthConfig } from "../config/api.config";
import {
  FaUserTie,
  FaUsers,
  FaBuilding,
  FaMoneyBillWave,
  FaCalendarAlt,
} from "react-icons/fa";

const Home = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    employeeCount: 0,
    departmentCount: 0,
    activeJobCount: 0,
    averageSalary: 0,
    anniversaries: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const config = getAuthConfig(navigate);
      if (!config) return;

      // Get employee count
      const employeesResponse = await axios.get(
        "http://localhost:9000/auth/list",
        config
      );

      // Get department list
      const departmentsResponse = await axios.get(
        "http://localhost:9000/auth/departments",
        config
      );

      // Calculate statistics
      let totalSalary = 0;
      let employeeCount = 0;

      if (employeesResponse.data.Status && employeesResponse.data.Data) {
        employeeCount = employeesResponse.data.Data.length;
        totalSalary = employeesResponse.data.Data.reduce(
          (sum, emp) => sum + (parseFloat(emp.salary) || 0),
          0
        );

        // Log data to console for debugging
        console.log(
          "Employee data sample:",
          employeesResponse.data.Data.length > 0
            ? employeesResponse.data.Data[0]
            : "No data"
        );
        console.log(
          "Department data sample:",
          departmentsResponse.data.Data.length > 0
            ? departmentsResponse.data.Data[0]
            : "No data"
        );
      }

      const averageSalary = employeeCount > 0 ? totalSalary / employeeCount : 0;

      setStats({
        employeeCount: employeeCount,
        departmentCount: departmentsResponse.data.Status
          ? departmentsResponse.data.Data.length
          : 0,
        activeJobCount: [
          ...new Set(
            employeesResponse.data.Data?.map((emp) => emp.job_id) || []
          ),
        ].length,
        averageSalary: averageSalary.toLocaleString("en-US"),
        anniversaries: [],
      });
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError("Unable to load overview data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon, title, value, color }) => (
    <div className={`card border-left-${color} shadow h-100 py-2`}>
      <div className="card-body">
        <div className="row no-gutters align-items-center">
          <div className="col mr-2">
            <div
              className={`text-xs font-weight-bold text-${color} text-uppercase mb-1`}
            >
              {title}
            </div>
            <div className="h5 mb-0 font-weight-bold text-gray-800">
              {value}
            </div>
          </div>
          <div className="col-auto">{icon}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container-fluid px-4">
      <h1 className="mt-4 mb-4">Overview</h1>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
          <button
            className="btn-close float-end"
            onClick={() => setError(null)}
          ></button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading data...</p>
        </div>
      ) : (
        <>
          <div className="row">
            <div className="col-xl-3 col-md-6 mb-4">
              <StatCard
                icon={<FaUsers className="fa-2x text-gray-300" />}
                title="Total Employees"
                value={stats.employeeCount}
                color="primary"
              />
            </div>

            <div className="col-xl-3 col-md-6 mb-4">
              <StatCard
                icon={<FaBuilding className="fa-2x text-gray-300" />}
                title="Departments"
                value={stats.departmentCount}
                color="success"
              />
            </div>

            <div className="col-xl-3 col-md-6 mb-4">
              <StatCard
                icon={<FaUserTie className="fa-2x text-gray-300" />}
                title="Job Positions"
                value={stats.activeJobCount}
                color="info"
              />
            </div>

            <div className="col-xl-3 col-md-6 mb-4">
              <StatCard
                icon={<FaMoneyBillWave className="fa-2x text-gray-300" />}
                title="Average Salary"
                value={`$${stats.averageSalary}`}
                color="warning"
              />
            </div>
          </div>

          <div className="row">
            <div className="col-lg-6">
              <div className="card shadow mb-4">
                <div className="card-header py-3">
                  <h6 className="m-0 font-weight-bold text-primary">
                    Employee Statistics by Department
                  </h6>
                </div>
                <div className="card-body">
                  <p>Chart will be displayed here</p>
                  <div
                    className="chart-area"
                    style={{ height: "300px", backgroundColor: "#f8f9fc" }}
                  >
                    {/* Add chart here after installing Chart.js or Recharts */}
                    <div className="d-flex justify-content-center align-items-center h-100 text-muted">
                      Chart data is being updated...
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="card shadow mb-4">
                <div className="card-header py-3 d-flex justify-content-between align-items-center">
                  <h6 className="m-0 font-weight-bold text-primary">
                    Work Anniversaries
                  </h6>
                  <div className="small text-gray-600">
                    <FaCalendarAlt className="mr-1" /> Today
                  </div>
                </div>
                <div className="card-body">
                  {stats.anniversaries && stats.anniversaries.length > 0 ? (
                    <ul className="list-group">
                      {stats.anniversaries.map((anniversary, index) => (
                        <li
                          key={index}
                          className="list-group-item d-flex justify-content-between align-items-center"
                        >
                          {anniversary.firstName} {anniversary.lastName}
                          <span className="badge bg-primary rounded-pill">
                            {anniversary.yearsOfService} years
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-4 text-muted">
                      No work anniversaries today
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-12">
              <div className="card shadow mb-4">
                <div className="card-header py-3">
                  <h6 className="m-0 font-weight-bold text-primary">
                    Recent New Employees
                  </h6>
                </div>
                <div className="card-body">
                  <p>New employees table will be displayed here</p>
                  {/* You can add the new employees table here */}
                  <div className="text-center py-4 text-muted">
                    No new employee data
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Home;
