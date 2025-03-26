import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const Employees = () => {
  const [employee, setEmployee] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:3000/auth/employees")
      .then((result) => {
        if (result.data.Status) {
          setEmployee(result.data.Data); // Ensure the correct key is used
        } else {
          alert(result.data.Error);
        }
      })
      .catch((err) => console.error("Error fetching employees:", err));
  }, []);

  const handleDelete = (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa nhân viên này?")) {
      axios
        .delete(`http://localhost:3000/auth/delete_employee/${id}`)
        .then((result) => {
          if (result.data.Status) {
            alert("Xóa nhân viên thành công!");
            setEmployee(employee.filter((e) => e.EmployeeID !== id));
          } else {
            alert(result.data.Error);
          }
        })
        .catch((err) => console.error("Lỗi khi xóa nhân viên:", err));
    }
  };

  return (
    <div className="px-5 mt-3">
      <div className="d-flex justify-content-center">
        <h3>Employee List</h3>
      </div>
      <Link to="/dashboard/add_employee" className="btn btn-success">
        Add Employee
      </Link>
      <div className="mt-3">
        <table className="table">
          <thead>
            <tr>
              <th>EmployeeID</th>
              <th>ApplicantID</th>
              <th>DepartmentID</th>
              <th>HireDate</th>
              <th>Salary</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employee.map((e) => (
              <tr key={e.EmployeeID}>
                <td>{e.EmployeeID}</td>
                <td>{e.ApplicantID}</td>
                <td>{e.DepartmentID}</td>
                <td>{e.HireDate}</td>
                <td>{e.Salary}</td>
                <td>{e.Status}</td>
                <td>
                  <Link
                    to={`/dashboard/update_employee/${e.EmployeeID}`}
                    className="btn btn-info btn-sm me-2"
                  >
                    Update
                  </Link>
                  <button
                    className="btn btn-warning btn-sm"
                    onClick={() => handleDelete(e.EmployeeID)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Employees;
