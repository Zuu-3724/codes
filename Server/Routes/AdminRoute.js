import express from "express";
import { mysql, sqlServer } from "../db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { verifyToken, isAdmin } from "../middleware/auth.js";

const router = express.Router();

// ======================== 1. ADMIN LOGIN ========================
router.post("/adminlogin", async (req, res) => {
  try {
    const { username, password } = req.body;
    const [[user]] = await mysql.query(
      "SELECT id, username, password FROM users WHERE username = ? AND role = 'Admin'",
      [username]
    );

    if (!user) {
      return res
        .status(401)
        .json({ loginStatus: false, Error: "Incorrect username or password" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res
        .status(401)
        .json({ loginStatus: false, Error: "Incorrect username or password" });
    }

    const token = jwt.sign(
      { role: "Admin", username: user.username, id: user.id },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.cookie("token", token);
    return res.json({ loginStatus: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ loginStatus: false, Error: "Server error" });
  }
});

// ======================== 2. EMPLOYEE MANAGEMENT ========================
// Get all employees
router.get("/employees", verifyToken, isAdmin, async (req, res) => {
  try {
    const [employees] = await mysql.query(
      "SELECT id, username, role, status FROM employees"
    );
    return res.json({ Status: true, Data: employees });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ Status: false, Error: "Error fetching employee list" });
  }
});

// Add new employee
router.post("/add-employee", verifyToken, isAdmin, async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Check if username exists
    const [[existingEmployee]] = await mysql.query(
      "SELECT id FROM employees WHERE username = ?",
      [username]
    );
    if (existingEmployee) {
      return res
        .status(400)
        .json({ Status: false, Message: "Username already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await mysql.query(
      "INSERT INTO employees (username, password, role, status) VALUES (?, ?, ?, 'Active')",
      [username, hashedPassword, role]
    );

    return res.json({ Status: true, Message: "Employee added successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ Status: false, Error: "Error adding employee" });
  }
});

// Update employee
router.put("/update-employee/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const { username, role, password } = req.body;
    const { id } = req.params;

    // Check if username exists for another employee
    const [[existingEmployee]] = await mysql.query(
      "SELECT id FROM employees WHERE username = ? AND id != ?",
      [username, id]
    );
    if (existingEmployee) {
      return res
        .status(400)
        .json({ Status: false, Message: "Username already in use" });
    }

    let updateQuery = "UPDATE employees SET username = ?, role = ?";
    let params = [username, role];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery += ", password = ?";
      params.push(hashedPassword);
    }

    updateQuery += " WHERE id = ?";
    params.push(id);

    await mysql.query(updateQuery, params);
    return res.json({ Status: true, Message: "Employee updated successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ Status: false, Error: "Error updating employee" });
  }
});

// Delete employee
router.delete(
  "/delete-employee/:id",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Check if employee is linked to logs or transactions
      const [[employeeLog]] = await mysql.query(
        "SELECT id FROM system_logs WHERE employee_id = ?",
        [id]
      );
      if (employeeLog) {
        return res.status(400).json({
          Status: false,
          Message: "Cannot delete, employee has related data",
        });
      }

      await mysql.query("DELETE FROM employees WHERE id = ?", [id]);
      return res.json({
        Status: true,
        Message: "Employee deleted successfully",
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ Status: false, Error: "Error deleting employee" });
    }
  }
);

// ======================== 3. DASHBOARD STATISTICS ========================
router.get("/dashboard-stats", verifyToken, async (req, res) => {
  try {
    const pool = await sqlServer.connect();
    const result = await pool.request().query(`
      SELECT 
        (SELECT COUNT(*) FROM HUMAN_2025) AS totalEmployees,
        (SELECT COUNT(*) FROM HUMAN_2025 WHERE DepartmentName = 'IT') AS itEmployees,
        (SELECT COUNT(*) FROM HUMAN_2025 WHERE DepartmentName = 'HR') AS hrEmployees,
        (SELECT COUNT(*) FROM HUMAN_2025 WHERE DepartmentName = 'Finance') AS financeEmployees,
        (SELECT AVG(Salary) FROM HUMAN_2025) AS averageSalary
    `);
    return res.json({ Status: true, Data: result.recordset[0] });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ Status: false, Error: "Error fetching statistics" });
  }
});

// ======================== 4. SYSTEM CONFIGURATION ========================
router.put("/system-config", verifyToken, isAdmin, async (req, res) => {
  try {
    const { key, value } = req.body;
    await mysql.query(
      "INSERT INTO system_config (config_key, config_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_value = ?",
      [key, value, value]
    );
    return res.json({
      Status: true,
      Message: "Configuration updated successfully",
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ Status: false, Error: "Error updating configuration" });
  }
});

// Logout
router.get("/logout", (req, res) => {
  res.clearCookie("token");
  return res.json({ Status: true });
});

// ======================== 5. PAYROLL & ATTENDANCE MANAGEMENT ========================

// Get payroll data
router.get("/payroll", verifyToken, isAdmin, async (req, res) => {
  try {
    const { employeeId, startDate, endDate } = req.query;
    let query = "SELECT * FROM PAYROLL WHERE 1=1";
    const params = [];

    if (employeeId) {
      query += " AND EmployeeID = ?";
      params.push(employeeId);
    }
    if (startDate) {
      query += " AND PayDate >= ?";
      params.push(startDate);
    }
    if (endDate) {
      query += " AND PayDate <= ?";
      params.push(endDate);
    }

    const [payroll] = await mysql.query(query, params);
    return res.status(200).json({ Status: true, Data: payroll });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ Status: false, Message: "Internal Server Error" });
  }
});

// Get salary history by month
router.get(
  "/payroll/history/:employeeId",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const { employeeId } = req.params;
      const { month, year } = req.query;

      const [history] = await mysql.query(
        `SELECT 
        p.*,
        e.FirstName,
        e.LastName,
        e.Department
      FROM PAYROLL p
      JOIN HUMAN_2025.dbo.Employees e ON p.EmployeeID = e.EmployeeID
      WHERE p.EmployeeID = ? 
      AND MONTH(p.PayDate) = ? 
      AND YEAR(p.PayDate) = ?
      ORDER BY p.PayDate DESC`,
        [employeeId, month, year]
      );

      return res.status(200).json({ Status: true, Data: history });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ Status: false, Message: "Internal Server Error" });
    }
  }
);

// Update salary information
router.put(
  "/payroll/update/:employeeId",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const { employeeId } = req.params;
      const { BasicSalary, Allowances, Deductions, Bonus, EffectiveDate } =
        req.body;

      // Start transaction
      await mysql.query("START TRANSACTION");

      // Update current salary
      await mysql.query(
        `UPDATE PAYROLL 
       SET BasicSalary = ?,
           Allowances = ?,
           Deductions = ?,
           Bonus = ?,
           NetSalary = ? + ? - ?
       WHERE EmployeeID = ?`,
        [
          BasicSalary,
          Allowances,
          Deductions,
          Bonus,
          BasicSalary,
          Allowances,
          Deductions,
          employeeId,
        ]
      );

      // Add to salary history
      await mysql.query(
        `INSERT INTO salary_history 
       (EmployeeID, OldSalary, NewSalary, Allowances, Deductions, Bonus, EffectiveDate)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          employeeId,
          req.body.oldSalary,
          BasicSalary,
          Allowances,
          Deductions,
          Bonus,
          EffectiveDate,
        ]
      );

      await mysql.query("COMMIT");
      return res
        .status(200)
        .json({ Status: true, Message: "Salary updated successfully" });
    } catch (error) {
      await mysql.query("ROLLBACK");
      console.error(error);
      return res
        .status(500)
        .json({ Status: false, Message: "Failed to update salary" });
    }
  }
);

// Get attendance records
router.get("/attendance", verifyToken, isAdmin, async (req, res) => {
  try {
    const { employeeId, startDate, endDate } = req.query;
    let query = "SELECT * FROM attendance WHERE 1=1";
    const params = [];

    if (employeeId) {
      query += " AND EmployeeID = ?";
      params.push(employeeId);
    }
    if (startDate) {
      query += " AND Date >= ?";
      params.push(startDate);
    }
    if (endDate) {
      query += " AND Date <= ?";
      params.push(endDate);
    }

    const [attendance] = await mysql.query(query, params);
    return res.status(200).json({ Status: true, Data: attendance });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ Status: false, Message: "Internal Server Error" });
  }
});

// Get attendance summary
router.get("/attendance/summary", verifyToken, isAdmin, async (req, res) => {
  try {
    const { employeeId, month, year } = req.query;

    const [summary] = await mysql.query(
      `SELECT 
        COUNT(*) as totalDays,
        SUM(CASE WHEN Status = 'Present' THEN 1 ELSE 0 END) as workingDays,
        SUM(CASE WHEN Status = 'Absent' THEN 1 ELSE 0 END) as absences,
        SUM(CASE WHEN Status = 'Leave' THEN 1 ELSE 0 END) as leaveDays
      FROM attendance
      WHERE EmployeeID = ?
      AND MONTH(Date) = ?
      AND YEAR(Date) = ?`,
      [employeeId, month, year]
    );

    return res.status(200).json({ Status: true, Data: summary[0] });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ Status: false, Message: "Internal Server Error" });
  }
});

export default router;
