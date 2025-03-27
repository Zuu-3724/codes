import express from "express";
import { mysql } from "../db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Hàm tạo token JWT
const generateToken = (user) => {
  const token = jwt.sign(
    { role: user.role, username: user.username, id: user.id },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
  console.log("Generated token for user:", {
    id: user.id,
    username: user.username,
    role: user.role,
  });
  return token;
};

// 1. Đăng nhập
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log("Login attempt:", { username });

    // Kiểm tra cả tài khoản người dùng và admin
    const [users] = await mysql.query(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );
    console.log("Database response:", users);

    if (users.length === 0) {
      console.log("Account not found");
      return res.status(401).json({
        Status: false,
        Message: "Account does not exist",
      });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);
    console.log("Password validation:", validPassword);

    if (!validPassword) {
      console.log("Invalid password");
      return res.status(401).json({
        Status: false,
        Message: "Incorrect password",
      });
    }

    const token = generateToken(user);

    // Đặt cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 ngày
    });

    console.log("Login successful for user:", {
      id: user.id,
      username: user.username,
      role: user.role,
    });

    // Trả về token trong body cùng với thông tin user
    return res.status(200).json({
      Status: true,
      token: token,
      Data: { id: user.id, username: user.username, role: user.role },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      Status: false,
      Error: error.message,
    });
  }
});

// 3. Đăng ký tài khoản
router.post("/register", async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const [existingUsers] = await mysql.query(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );

    if (existingUsers.length > 0) {
      return res.json({ Status: false, Message: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await mysql.query(
      "INSERT INTO users (username, password, role, status) VALUES (?, ?, ?, 'Active')",
      [username, hashedPassword, role]
    );

    return res.json({ Status: true, Message: "Registration successful" });
  } catch (error) {
    return res.json({ Status: false, Error: error.message });
  }
});

// 4. Kiểm tra trạng thái đăng nhập
router.get("/check-auth", verifyToken, async (req, res) => {
  try {
    const [users] = await mysql.query(
      "SELECT id, username, role, status FROM users WHERE id = ?",
      [req.id]
    );

    if (users.length === 0) {
      return res.json({
        Status: false,
        Message: "Invalid login session",
      });
    }

    return res.json({ Status: true, Data: users[0] });
  } catch (error) {
    return res.json({ Status: false, Error: error.message });
  }
});

// 5. Đăng xuất
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  return res.json({ Status: true, Message: "Logout successful" });
});

// Get employee list
router.get("/list", verifyToken, async (req, res) => {
  try {
    const { search, department } = req.query;
    let query = `
      SELECT e.*, d.department_name, j.job_title
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN jobs j ON e.job_id = j.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query +=
        " AND (e.first_name LIKE ? OR e.last_name LIKE ? OR e.id LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (department) {
      query += " AND e.department_id = ?";
      params.push(department);
    }

    console.log("Executing employee list query:", query, params);
    const [employees] = await mysql.query(query, params);
    console.log("Employee data:", employees);
    return res.status(200).json({ Status: true, Data: employees });
  } catch (error) {
    console.error("Error in employee list route:", error);
    return res.status(500).json({
      Status: false,
      Message: "Internal Server Error",
      Error: error.message,
    });
  }
});

// Get attendance data
router.get("/attendance", verifyToken, async (req, res) => {
  try {
    const { employeeId, startDate, endDate } = req.query;
    let query = `
      SELECT a.*, e.first_name, e.last_name 
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      WHERE 1=1
    `;
    const params = [];

    if (employeeId) {
      query += " AND a.employee_id = ?";
      params.push(employeeId);
    }
    if (startDate) {
      query += " AND a.date >= ?";
      params.push(startDate);
    }
    if (endDate) {
      query += " AND a.date <= ?";
      params.push(endDate);
    }

    console.log("Executing attendance query:", query, params);
    const [attendance] = await mysql.query(query, params);
    console.log("Attendance data:", attendance);
    return res.status(200).json({ Status: true, Data: attendance });
  } catch (error) {
    console.error("Error in attendance route:", error);
    return res.status(500).json({
      Status: false,
      Message: "Internal Server Error",
      Error: error.message,
    });
  }
});

// Get payroll data
router.get("/payroll", verifyToken, async (req, res) => {
  try {
    const { employeeId, startDate, endDate } = req.query;
    let query = `
      SELECT p.*, e.EmployeeID, a.FirstName, a.LastName, d.DepartmentName, j.JobTitle
      FROM [HUMAN_2025].[dbo].[Payroll] p
      JOIN [HUMAN_2025].[dbo].[Employees] e ON p.EmployeeID = e.EmployeeID
      JOIN [HUMAN_2025].[dbo].[Applicants] a ON e.ApplicantID = a.ApplicantID
      JOIN [HUMAN_2025].[dbo].[Departments] d ON e.DepartmentID = d.DepartmentID
      JOIN [HUMAN_2025].[dbo].[Jobs] j ON e.JobID = j.JobID
      WHERE 1=1
    `;
    const params = [];

    if (employeeId) {
      query += " AND p.EmployeeID = ?";
      params.push(employeeId);
    }
    if (startDate) {
      query += " AND p.PayDate >= ?";
      params.push(startDate);
    }
    if (endDate) {
      query += " AND p.PayDate <= ?";
      params.push(endDate);
    }

    console.log("Executing payroll query:", query, params);
    const [payroll] = await mysql.query(query, params);
    console.log("Payroll data:", payroll);
    return res.status(200).json({ Status: true, Data: payroll });
  } catch (error) {
    console.error("Error in payroll route:", error);
    return res.status(500).json({
      Status: false,
      Message: "Internal Server Error",
      Error: error.message,
    });
  }
});

// Get reports
router.get("/reports", verifyToken, async (req, res) => {
  try {
    const { reportType, startDate, endDate } = req.query;

    let query = "";
    switch (reportType) {
      case "HR":
        query =
          "SELECT * FROM HUMAN_2025.dbo.HRReports WHERE Date BETWEEN ? AND ?";
        break;
      case "Payroll":
        query =
          "SELECT * FROM PAYROLL.dbo.PayrollReports WHERE Date BETWEEN ? AND ?";
        break;
      case "Shareholder":
        query =
          "SELECT * FROM PAYROLL.dbo.ShareholderReports WHERE Date BETWEEN ? AND ?";
        break;
      default:
        return res
          .status(400)
          .json({ Status: false, Message: "Invalid report type" });
    }

    const [reports] = await mysql.query(query, [startDate, endDate]);
    return res.status(200).json({ Status: true, Data: reports });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ Status: false, Message: "Internal Server Error" });
  }
});

// Send alerts
router.post("/alerts", verifyToken, async (req, res) => {
  try {
    const { type, message, recipients } = req.body;

    // Insert alert into database
    await mysql.query(
      "INSERT INTO Alerts (Type, Message, Recipients) VALUES (?, ?, ?)",
      [type, message, JSON.stringify(recipients)]
    );

    return res
      .status(200)
      .json({ Status: true, Message: "Alert sent successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ Status: false, Message: "Failed to send alert" });
  }
});

// Get all departments
router.get("/departments", verifyToken, async (req, res) => {
  try {
    const [departments] = await mysql.query("SELECT * FROM departments");
    return res.status(200).json({
      Status: true,
      Data: departments,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      Status: false,
      Message: "Internal Server Error",
    });
  }
});

// Add new department
router.post("/departments/add", verifyToken, async (req, res) => {
  try {
    const { DepartmentName, ManagerID } = req.body;

    if (!DepartmentName || !ManagerID) {
      return res.status(400).json({
        Status: false,
        Message: "Department name and manager ID are required",
      });
    }

    const [result] = await mysql.query(
      "INSERT INTO departments (DepartmentName, ManagerID) VALUES (?, ?)",
      [DepartmentName, ManagerID]
    );

    return res.status(201).json({
      Status: true,
      Message: "Department added successfully",
      Data: { id: result.insertId, DepartmentName, ManagerID },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      Status: false,
      Message: "Failed to add department",
    });
  }
});

// Get employee statistics
router.get("/employee-stats", verifyToken, async (req, res) => {
  try {
    const { year } = req.query;
    const query = `
      SELECT 
        COUNT(*) as totalEmployees,
        SUM(CASE WHEN YEAR(HireDate) = ? THEN 1 ELSE 0 END) as newHires,
        ROUND(
          (SELECT COUNT(*) FROM [HUMAN_2025].[dbo].[Employees] WHERE Status = 'Terminated' AND YEAR(HireDate) = ?) * 100.0 / 
          NULLIF(COUNT(*), 0),
          2
        ) as turnoverRate
      FROM [HUMAN_2025].[dbo].[Employees]
    `;
    console.log("Executing employee stats query:", query, [year, year]);
    const [stats] = await mysql.query(query, [year, year]);
    console.log("Employee stats:", stats);
    return res.json({ Status: true, Data: stats[0] });
  } catch (error) {
    console.error("Error in employee stats route:", error);
    return res.json({
      Status: false,
      Error: error.message,
      Message: "Failed to fetch employee statistics",
    });
  }
});

// Get salary statistics
router.get("/salary-stats", verifyToken, async (req, res) => {
  try {
    const { year } = req.query;
    const query = `
      SELECT 
        SUM(BaseSalary + ISNULL(Bonus, 0) - ISNULL(Deductions, 0)) as totalPayroll,
        AVG(BaseSalary + ISNULL(Bonus, 0) - ISNULL(Deductions, 0)) as averageSalary,
        ROUND(
          ((SUM(BaseSalary + ISNULL(Bonus, 0) - ISNULL(Deductions, 0)) - (
            SELECT SUM(BaseSalary + ISNULL(Bonus, 0) - ISNULL(Deductions, 0))
            FROM [HUMAN_2025].[dbo].[Payroll]
            WHERE YEAR(PayDate) = ? - 1
          )) / NULLIF((
            SELECT SUM(BaseSalary + ISNULL(Bonus, 0) - ISNULL(Deductions, 0))
            FROM [HUMAN_2025].[dbo].[Payroll]
            WHERE YEAR(PayDate) = ? - 1
          ), 0) * 100), 
          2
        ) as salaryIncrease
      FROM [HUMAN_2025].[dbo].[Payroll]
      WHERE YEAR(PayDate) = ?
    `;
    console.log("Executing salary stats query:", query, [year, year, year]);
    const [stats] = await mysql.query(query, [year, year, year]);
    console.log("Salary stats:", stats);
    return res.json({ Status: true, Data: stats[0] });
  } catch (error) {
    console.error("Error in salary stats route:", error);
    return res.json({
      Status: false,
      Error: error.message,
      Message: "Failed to fetch salary statistics",
    });
  }
});

// Get dividend statistics
router.get("/dividend-stats", verifyToken, async (req, res) => {
  try {
    const { year } = req.query;
    const query = `
      SELECT 
        SUM(DividendAmount) as totalDividends,
        COUNT(DISTINCT ShareholderID) as totalShareholders,
        AVG(DividendAmount) as averageDividend
      FROM [HUMAN_2025].[dbo].[Dividends]
      WHERE YEAR(PaymentDate) = ?
      GROUP BY YEAR(PaymentDate)
    `;
    console.log("Executing dividend stats query:", query, [year]);
    const [stats] = await mysql.query(query, [year]);
    console.log("Dividend stats:", stats);
    return res.json({ Status: true, Data: stats[0] });
  } catch (error) {
    console.error("Error in dividend stats route:", error);
    return res.json({
      Status: false,
      Error: error.message,
      Message: "Failed to fetch dividend statistics",
    });
  }
});

// Export employee report
router.get("/export-report/employee", verifyToken, async (req, res) => {
  try {
    const { year } = req.query;
    const query = `
      SELECT e.*, d.department_name, j.job_title
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN jobs j ON e.job_id = j.id
      WHERE YEAR(e.hire_date) = ?
    `;
    console.log("Executing employee export query:", query, [year]);
    const [data] = await mysql.query(query, [year]);
    console.log("Employee export data:", data);
    return res.json({ Status: true, Data: data });
  } catch (error) {
    console.error("Error in employee export route:", error);
    return res.json({
      Status: false,
      Error: error.message,
      Message: "Failed to export employee report",
    });
  }
});

// Export report
router.get("/export-report/:reportType", verifyToken, async (req, res) => {
  try {
    const { reportType } = req.params;
    const { year } = req.query;
    let data;

    switch (reportType) {
      case "employee":
        [data] = await mysql.query(
          "SELECT * FROM HUMAN_2025.dbo.Employees WHERE YEAR(HireDate) = ?",
          [year]
        );
        break;
      case "salary":
        [data] = await mysql.query(
          "SELECT * FROM PAYROLL.dbo.PayrollData WHERE YEAR(PayDate) = ?",
          [year]
        );
        break;
      case "dividend":
        [data] = await mysql.query(
          "SELECT * FROM PAYROLL.dbo.Dividends WHERE YEAR(PaymentDate) = ?",
          [year]
        );
        break;
      default:
        return res
          .status(400)
          .json({ Status: false, Message: "Invalid report type" });
    }

    // Convert data to Excel format (you'll need to implement this)
    // For now, just return JSON
    return res.json({ Status: true, Data: data });
  } catch (error) {
    return res.json({ Status: false, Error: error.message });
  }
});

// Update salary
router.put("/update-salary/:employeeId", verifyToken, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { base_salary, bonus, deductions } = req.body;

    // Get current salary
    const [currentSalary] = await mysql.query(
      "SELECT base_salary, bonus, deductions FROM payroll WHERE employee_id = ? ORDER BY pay_date DESC LIMIT 1",
      [employeeId]
    );

    // Calculate net salary
    const net_salary = (base_salary || 0) + (bonus || 0) - (deductions || 0);

    // Insert new payroll record
    await mysql.query(
      "INSERT INTO payroll (employee_id, pay_date, base_salary, bonus, deductions, net_salary) VALUES (?, NOW(), ?, ?, ?, ?)",
      [employeeId, base_salary, bonus, deductions, net_salary]
    );

    // Log salary history
    await mysql.query(
      "INSERT INTO salary_history (employee_id, previous_salary, new_salary, update_date, updated_by) VALUES (?, ?, ?, NOW(), ?)",
      [
        employeeId,
        currentSalary ? currentSalary.base_salary : 0,
        base_salary,
        req.id,
      ]
    );

    return res.json({ Status: true, Message: "Salary updated successfully" });
  } catch (error) {
    console.error("Error updating salary:", error);
    return res.json({ Status: false, Error: error.message });
  }
});

// Get salary history
router.get("/salary-history/:employeeId", verifyToken, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const [history] = await mysql.query(
      "SELECT * FROM salary_history WHERE employee_id = ? ORDER BY update_date DESC",
      [employeeId]
    );
    return res.json({ Status: true, Data: history });
  } catch (error) {
    return res.json({ Status: false, Error: error.message });
  }
});

// 1. Employee Management
// Add new employee
router.post("/employees/add", verifyToken, async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      phone,
      department_id,
      job_id,
      salary,
      status,
    } = req.body;

    // Begin transaction
    await mysql.query("START TRANSACTION");

    // Add employee record
    const [employeeResult] = await mysql.query(
      `INSERT INTO employees (first_name, last_name, email, phone, department_id, job_id, hire_date, salary, status)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?)`,
      [
        first_name,
        last_name,
        email,
        phone,
        department_id,
        job_id,
        salary,
        status || "Active",
      ]
    );

    const employee_id = employeeResult.insertId;

    // Initialize payroll record
    await mysql.query(
      `INSERT INTO payroll (employee_id, pay_date, base_salary, bonus, deductions, net_salary)
       VALUES (?, NOW(), ?, 0, 0, ?)`,
      [employee_id, salary, salary]
    );

    // Commit transaction
    await mysql.query("COMMIT");

    return res.json({
      Status: true,
      Message: "Employee added successfully",
      Data: { id: employee_id },
    });
  } catch (error) {
    // Rollback transaction in case of error
    await mysql.query("ROLLBACK");
    console.error("Error adding employee:", error);
    return res.json({ Status: false, Error: error.message });
  }
});

// Update employee
router.put("/employees/:employeeId", verifyToken, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const {
      first_name,
      last_name,
      email,
      phone,
      department_id,
      job_id,
      salary,
      status,
    } = req.body;

    // Begin transaction
    await mysql.query("START TRANSACTION");

    // Update employee info
    await mysql.query(
      `UPDATE employees 
       SET first_name = ?, 
           last_name = ?, 
           email = ?,
           phone = ?,
           department_id = ?,
           job_id = ?,
           ${salary ? "salary = ?," : ""}
           status = ?
       WHERE id = ?`,
      salary
        ? [
            first_name,
            last_name,
            email,
            phone,
            department_id,
            job_id,
            salary,
            status,
            employeeId,
          ]
        : [
            first_name,
            last_name,
            email,
            phone,
            department_id,
            job_id,
            status,
            employeeId,
          ]
    );

    // Add new payroll record if salary changed
    if (salary) {
      // Get current salary
      const [currentSalaryResult] = await mysql.query(
        "SELECT salary FROM employees WHERE id = ?",
        [employeeId]
      );

      const currentSalary = currentSalaryResult[0]?.salary || 0;

      // Add payroll record
      await mysql.query(
        `INSERT INTO payroll (employee_id, pay_date, base_salary, bonus, deductions, net_salary)
         VALUES (?, NOW(), ?, 0, 0, ?)`,
        [employeeId, salary, salary]
      );

      // Log salary change
      await mysql.query(
        `INSERT INTO salary_history (employee_id, previous_salary, new_salary, update_date, updated_by)
         VALUES (?, ?, ?, NOW(), ?)`,
        [employeeId, currentSalary, salary, req.id]
      );
    }

    // Commit transaction
    await mysql.query("COMMIT");

    return res.json({ Status: true, Message: "Employee updated successfully" });
  } catch (error) {
    // Rollback transaction in case of error
    await mysql.query("ROLLBACK");
    console.error("Error updating employee:", error);
    return res.json({ Status: false, Error: error.message });
  }
});

// Delete employee
router.delete("/employees/:employeeId", verifyToken, async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Check for payroll records
    const [payrollRecords] = await mysql.query(
      `SELECT COUNT(*) as count FROM payroll WHERE employee_id = ?`,
      [employeeId]
    );

    if (payrollRecords[0].count > 0) {
      return res.json({
        Status: false,
        Message:
          "Cannot delete employee with existing payroll records. Consider changing their status to 'Terminated' instead.",
      });
    }

    // Begin transaction
    await mysql.query("START TRANSACTION");

    // Option 1: Hard delete if no dependent records
    // await mysql.query(
    //   `DELETE FROM employees WHERE id = ?`,
    //   [employeeId]
    // );

    // Option 2: Soft delete (safer)
    await mysql.query(
      `UPDATE employees SET status = 'Terminated' WHERE id = ?`,
      [employeeId]
    );

    // Commit transaction
    await mysql.query("COMMIT");

    return res.json({ Status: true, Message: "Employee deleted successfully" });
  } catch (error) {
    // Rollback transaction in case of error
    await mysql.query("ROLLBACK");
    console.error("Error deleting employee:", error);
    return res.json({ Status: false, Error: error.message });
  }
});

// 2. Payroll & Attendance Management
// Update attendance
router.post("/attendance", verifyToken, async (req, res) => {
  try {
    const { EmployeeID, Date, Status } = req.body;

    await mysql.query(
      `
      INSERT INTO [HUMAN_2025].[dbo].[Attendance]
      (EmployeeID, Date, Status)
      VALUES (?, ?, ?)
    `,
      [EmployeeID, Date, Status]
    );

    return res.json({
      Status: true,
      Message: "Attendance recorded successfully",
    });
  } catch (error) {
    console.error("Error recording attendance:", error);
    return res.json({ Status: false, Error: error.message });
  }
});

// Get attendance summary
router.get("/attendance/summary/:employeeId", verifyToken, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;

    const [summary] = await mysql.query(
      `
      SELECT 
        COUNT(*) as totalDays,
        SUM(CASE WHEN Status = 'Present' THEN 1 ELSE 0 END) as workingDays,
        SUM(CASE WHEN Status = 'Absent' THEN 1 ELSE 0 END) as absences,
        SUM(CASE WHEN Status = 'Leave' THEN 1 ELSE 0 END) as leaveDays
      FROM [HUMAN_2025].[dbo].[Attendance]
      WHERE EmployeeID = ?
      AND Date BETWEEN ? AND ?
    `,
      [employeeId, startDate, endDate]
    );

    return res.json({ Status: true, Data: summary[0] });
  } catch (error) {
    console.error("Error getting attendance summary:", error);
    return res.json({ Status: false, Error: error.message });
  }
});

// 3. Department & Job Management
// Add job title
router.post("/jobs/add", verifyToken, async (req, res) => {
  try {
    const { JobTitle, MinSalary, MaxSalary } = req.body;

    await mysql.query(
      `
      INSERT INTO [HUMAN_2025].[dbo].[Jobs]
      (JobTitle, MinSalary, MaxSalary)
      VALUES (?, ?, ?)
    `,
      [JobTitle, MinSalary, MaxSalary]
    );

    return res.json({ Status: true, Message: "Job title added successfully" });
  } catch (error) {
    console.error("Error adding job title:", error);
    return res.json({ Status: false, Error: error.message });
  }
});

// Delete department
router.delete("/departments/:departmentId", verifyToken, async (req, res) => {
  try {
    const { departmentId } = req.params;

    // Check for linked employees
    const [employees] = await mysql.query(
      `
      SELECT COUNT(*) as count 
      FROM [HUMAN_2025].[dbo].[Employees] 
      WHERE DepartmentID = ? AND Status = 'Active'
    `,
      [departmentId]
    );

    if (employees[0].count > 0) {
      return res.json({
        Status: false,
        Message: "Cannot delete department with active employees",
      });
    }

    await mysql.query(
      `
      DELETE FROM [HUMAN_2025].[dbo].[Departments]
      WHERE DepartmentID = ?
    `,
      [departmentId]
    );

    return res.json({
      Status: true,
      Message: "Department deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting department:", error);
    return res.json({ Status: false, Error: error.message });
  }
});

// 4. Reports & Analytics
// Employee summary report
router.get("/reports/employee-summary", verifyToken, async (req, res) => {
  try {
    const [summary] = await mysql.query(`
      SELECT 
        d.DepartmentName,
        COUNT(*) as totalEmployees,
        AVG(e.Salary) as avgSalary,
        MIN(e.HireDate) as earliestHire,
        MAX(e.HireDate) as latestHire
      FROM [HUMAN_2025].[dbo].[Employees] e
      JOIN [HUMAN_2025].[dbo].[Departments] d ON e.DepartmentID = d.DepartmentID
      WHERE e.Status = 'Active'
      GROUP BY d.DepartmentID, d.DepartmentName
    `);

    return res.json({ Status: true, Data: summary });
  } catch (error) {
    console.error("Error generating employee summary:", error);
    return res.json({ Status: false, Error: error.message });
  }
});

// 5. Alerts & Notifications
// Work anniversary alerts
router.get("/alerts/work-anniversary", verifyToken, async (req, res) => {
  try {
    const [anniversaries] = await mysql.query(`
      SELECT 
        e.EmployeeID,
        a.FirstName,
        a.LastName,
        e.HireDate,
        DATEDIFF(year, e.HireDate, GETDATE()) as yearsOfService
      FROM [HUMAN_2025].[dbo].[Employees] e
      JOIN [HUMAN_2025].[dbo].[Applicants] a ON e.ApplicantID = a.ApplicantID
      WHERE 
        MONTH(e.HireDate) = MONTH(GETDATE())
        AND DAY(e.HireDate) = DAY(GETDATE())
        AND e.Status = 'Active'
    `);

    return res.json({ Status: true, Data: anniversaries });
  } catch (error) {
    console.error("Error getting work anniversaries:", error);
    return res.json({ Status: false, Error: error.message });
  }
});

export default router;
