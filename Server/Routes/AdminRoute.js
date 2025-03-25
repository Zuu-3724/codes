import express from "express";
import { mysqlCon, connectSQLServer } from "../utils/db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const router = express.Router();

router.post("/adminlogin", (req, res) => {
  const sql = "SELECT * FROM admin WHERE username = ?";
  mysqlCon.query(sql, [req.body.username], (err, result) => {
    // ✅ Use mysqlCon
    if (err) return res.json({ loginStatus: false, Error: "Query error" });

    if (result.length > 0) {
      bcrypt.compare(req.body.password, result[0].password, (err, isMatch) => {
        if (err || !isMatch) {
          return res.json({
            loginStatus: false,
            Error: "Wrong username or password",
          });
        }

        const token = jwt.sign(
          { role: "admin", username: result[0].username },
          "jwt_secret_key",
          { expiresIn: "1d" }
        );
        res.cookie("token", token);
        return res.json({ loginStatus: true });
      });
    } else {
      return res.json({
        loginStatus: false,
        Error: "Wrong username or password",
      });
    }
  });
});

router.post("/add_employee", (req, res) => {
  const {
    EmployeeID,
    ApplicantID,
    DepartmentID,
    HireDate,
    Salary,
    Status,
    password,
  } = req.body;

  const sql =
    "INSERT INTO employees (EmployeeID, ApplicantID, DepartmentID, HireDate, Salary, Status) VALUES (?, ?, ?, ?, ?, ?)";

  bcrypt.hash(password, 10, (err, hash) => {
    if (err) return res.json({ success: false, Error: "Hashing error" });

    mysqlCon.query(
      // ✅ Use mysqlCon instead of con
      sql,
      [EmployeeID, ApplicantID, DepartmentID, HireDate, Salary, Status],
      (err, result) => {
        if (err) return res.json({ success: false, Error: "Query error" });

        return res.json({
          success: true,
          message: "Employee added successfully",
        });
      }
    );
  });
});

export default router;
