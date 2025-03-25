import express from "express";
import con from "../utils/db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const router = express.Router();

router.post("/adminlogin", (req, res) => {
  const sql = "SELECT * from admin Where username = ? and password = ?";
  con.query(sql, [req.body.username, req.body.password], (err, result) => {
    if (err) return res.json({ loginStatus: false, Error: "Query error" });
    if (result.length > 0) {
      const username = result[0].username;
      const token = jwt.sign(
        { role: "admin", username: username },
        "jwt_secret_key",
        { expiresIn: "1d" }
      );
      res.cookie("token", token);
      return res.json({ loginStatus: true });
    } else {
      return res.json({
        loginStatus: false,
        Error: "wrong username or password",
      });
    }
  });
});

router.post("/add_employee", (req, res) => {
  const { EmployeeID, ApplicantID, DepartmentID, HireDate, Salary, Status } =
    req.body;

  const sql =
    "INSERT INTO employees (EmployeeID, ApplicantID, DepartmentID, HireDate, Salary, Status) VALUES (?, ?, ?, ?, ?, ?)";
  bcrypt.hash(req.body.password, 10, (err, hash) => {
    if (err) return res.json({ Status: false, Error: "Query Error" });
    con.query(sql, [
      EmployeeID,
      ApplicantID,
      DepartmentID,
      HireDate,
      Salary,
      Status,
    ]);
    (err, result) => {
      if (err) return res.json({ success: false, Error: "Query error" });
      return res.json({
        success: true,
        message: "Employee added successfully",
      });
    };
  });
});

export { Router as adminRouter };
