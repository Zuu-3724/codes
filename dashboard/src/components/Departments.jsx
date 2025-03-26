import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/departments");
      setDepartments(response.data);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const handleUpdate = (id) => {
    navigate(`/dashboard/update_department/${id}`);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this department?")) {
      try {
        await axios.delete(`http://localhost:3000/api/departments/${id}`);
        setDepartments(departments.filter((dept) => dept.DepartmentID !== id));
      } catch (error) {
        console.error("Error deleting department:", error);
      }
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="text-center">Department List</h2>
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Department ID</th>
            <th>Department Name</th>
            <th>Manager ID</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {departments.map((dept) => (
            <tr key={dept.DepartmentID}>
              <td>{dept.DepartmentID}</td>
              <td>{dept.DepartmentName}</td>
              <td>{dept.ManagerID}</td>
              <td>
                <button
                  className="btn btn-warning me-2"
                  onClick={() => handleUpdate(dept.DepartmentID)}
                >
                  Update
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDelete(dept.DepartmentID)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Departments;
