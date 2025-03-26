import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import db from "../db.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware để kiểm tra token
const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json({ Status: false, Message: "Token không tồn tại" });
  }
  jwt.verify(token, "jwt-secret-key", (err, decoded) => {
    if (err) {
      return res.json({ Status: false, Message: "Token không hợp lệ" });
    }
    req.role = decoded.role;
    req.id = decoded.id;
    next();
  });
};

// Middleware để kiểm tra quyền admin
const isAdmin = (req, res, next) => {
  if (req.role !== "Admin") {
    return res.json({ Status: false, Message: "Không có quyền truy cập" });
  }
  next();
};

// Cấu hình multer cho upload file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// 1. Quản lý người dùng
router.get("/users", verifyToken, isAdmin, async (req, res) => {
  try {
    const [users] = await db.query("SELECT * FROM users");
    return res.json({ Status: true, Data: users });
  } catch (error) {
    return res.json({ Status: false, Message: error.message });
  }
});

router.post("/add-user", verifyToken, isAdmin, async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      "INSERT INTO users (username, email, password, role, status) VALUES (?, ?, ?, ?, ?)",
      [username, email, hashedPassword, role, "Active"]
    );

    return res.json({ Status: true, Message: "Thêm người dùng thành công" });
  } catch (error) {
    return res.json({ Status: false, Message: error.message });
  }
});

router.put("/update-user/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const { username, email, role, password } = req.body;
    let updateQuery = "UPDATE users SET username = ?, email = ?, role = ?";
    let params = [username, email, role];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery += ", password = ?";
      params.push(hashedPassword);
    }

    updateQuery += " WHERE id = ?";
    params.push(req.params.id);

    await db.query(updateQuery, params);
    return res.json({
      Status: true,
      Message: "Cập nhật người dùng thành công",
    });
  } catch (error) {
    return res.json({ Status: false, Message: error.message });
  }
});

router.delete("/delete-user/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    await db.query("DELETE FROM users WHERE id = ?", [req.params.id]);
    return res.json({ Status: true, Message: "Xóa người dùng thành công" });
  } catch (error) {
    return res.json({ Status: false, Message: error.message });
  }
});

router.post("/reset-password/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const defaultPassword = "123456";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    await db.query("UPDATE users SET password = ? WHERE id = ?", [
      hashedPassword,
      req.params.id,
    ]);
    return res.json({ Status: true, Message: "Đặt lại mật khẩu thành công" });
  } catch (error) {
    return res.json({ Status: false, Message: error.message });
  }
});

// 2. Quản lý nhân viên
router.get("/employees", verifyToken, async (req, res) => {
  try {
    const [employees] = await db.query("SELECT * FROM HUMAN_2025");
    return res.json({ Status: true, Data: employees });
  } catch (error) {
    return res.json({ Status: false, Message: error.message });
  }
});

router.post(
  "/add-employee",
  verifyToken,
  isAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      const { EmployeeID, EmployeeName, DepartmentName, Position, Salary } =
        req.body;
      const image = req.file ? req.file.filename : null;

      await db.query(
        "INSERT INTO HUMAN_2025 (EmployeeID, EmployeeName, DepartmentName, Position, Salary, image) VALUES (?, ?, ?, ?, ?, ?)",
        [EmployeeID, EmployeeName, DepartmentName, Position, Salary, image]
      );

      return res.json({ Status: true, Message: "Thêm nhân viên thành công" });
    } catch (error) {
      return res.json({ Status: false, Message: error.message });
    }
  }
);

router.put(
  "/update-employee/:id",
  verifyToken,
  isAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      const { EmployeeName, DepartmentName, Position, Salary } = req.body;
      let updateQuery =
        "UPDATE HUMAN_2025 SET EmployeeName = ?, DepartmentName = ?, Position = ?, Salary = ?";
      let params = [EmployeeName, DepartmentName, Position, Salary];

      if (req.file) {
        updateQuery += ", image = ?";
        params.push(req.file.filename);
      }

      updateQuery += " WHERE EmployeeID = ?";
      params.push(req.params.id);

      await db.query(updateQuery, params);
      return res.json({
        Status: true,
        Message: "Cập nhật nhân viên thành công",
      });
    } catch (error) {
      return res.json({ Status: false, Message: error.message });
    }
  }
);

router.delete(
  "/delete-employee/:id",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      // Kiểm tra xem nhân viên có bản ghi lương không
      const [payroll] = await db.query(
        "SELECT * FROM payroll WHERE EmployeeID = ?",
        [req.params.id]
      );
      if (payroll.length > 0) {
        return res.json({
          Status: false,
          Message: "Không thể xóa nhân viên đã có bản ghi lương",
        });
      }

      await db.query("DELETE FROM HUMAN_2025 WHERE EmployeeID = ?", [
        req.params.id,
      ]);
      return res.json({ Status: true, Message: "Xóa nhân viên thành công" });
    } catch (error) {
      return res.json({ Status: false, Message: error.message });
    }
  }
);

// 3. Quản lý lương
router.get("/payroll", verifyToken, async (req, res) => {
  try {
    const [payroll] = await db.query(`
      SELECT h.*, p.Salary as CurrentSalary 
      FROM HUMAN_2025 h 
      LEFT JOIN payroll p ON h.EmployeeID = p.EmployeeID 
      WHERE p.id IN (SELECT MAX(id) FROM payroll GROUP BY EmployeeID)
    `);
    return res.json({ Status: true, Data: payroll });
  } catch (error) {
    return res.json({ Status: false, Message: error.message });
  }
});

router.put("/update-salary/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const { salary } = req.body;
    const employeeId = req.params.id;

    // Lấy lương hiện tại
    const [currentSalary] = await db.query(
      "SELECT Salary FROM payroll WHERE EmployeeID = ? ORDER BY id DESC LIMIT 1",
      [employeeId]
    );

    // Thêm bản ghi lương mới
    await db.query(
      "INSERT INTO payroll (EmployeeID, Salary, UpdateDate, UpdatedBy) VALUES (?, ?, NOW(), ?)",
      [employeeId, salary, req.id]
    );

    return res.json({ Status: true, Message: "Cập nhật lương thành công" });
  } catch (error) {
    return res.json({ Status: false, Message: error.message });
  }
});

router.get("/salary-history/:id", verifyToken, async (req, res) => {
  try {
    const [history] = await db.query(
      "SELECT p.*, u.username as UpdatedBy FROM payroll p LEFT JOIN users u ON p.UpdatedBy = u.id WHERE p.EmployeeID = ? ORDER BY p.UpdateDate DESC",
      [req.params.id]
    );
    return res.json({ Status: true, Data: history });
  } catch (error) {
    return res.json({ Status: false, Message: error.message });
  }
});

// 4. Quản lý chấm công
router.get("/attendance", verifyToken, async (req, res) => {
  try {
    const { month } = req.query;
    const [attendance] = await db.query(
      `
      SELECT h.EmployeeID, h.EmployeeName, h.DepartmentName,
             COUNT(CASE WHEN a.Status = 'Present' THEN 1 END) as PresentDays,
             COUNT(CASE WHEN a.Status = 'Leave' THEN 1 END) as LeaveDays,
             COUNT(CASE WHEN a.Status = 'Late' THEN 1 END) as LateDays,
             MAX(a.Status) as Status
      FROM HUMAN_2025 h
      LEFT JOIN attendance a ON h.EmployeeID = a.EmployeeID
      WHERE DATE_FORMAT(a.Date, '%Y-%m') = ?
      GROUP BY h.EmployeeID, h.EmployeeName, h.DepartmentName
    `,
      [month]
    );
    return res.json({ Status: true, Data: attendance });
  } catch (error) {
    return res.json({ Status: false, Message: error.message });
  }
});

router.get("/leave-requests", verifyToken, async (req, res) => {
  try {
    const [requests] = await db.query(`
      SELECT l.*, h.EmployeeName 
      FROM leave_requests l
      JOIN HUMAN_2025 h ON l.EmployeeID = h.EmployeeID
      WHERE l.Status = 'Pending'
      ORDER BY l.RequestDate DESC
    `);
    return res.json({ Status: true, Data: requests });
  } catch (error) {
    return res.json({ Status: false, Message: error.message });
  }
});

router.put(
  "/update-leave-request/:id",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const { status } = req.body;
      await db.query(
        "UPDATE leave_requests SET Status = ?, UpdatedBy = ?, UpdateDate = NOW() WHERE RequestID = ?",
        [status, req.id, req.params.id]
      );
      return res.json({
        Status: true,
        Message: "Cập nhật yêu cầu nghỉ phép thành công",
      });
    } catch (error) {
      return res.json({ Status: false, Message: error.message });
    }
  }
);

// 5. Báo cáo
router.get("/employee-stats", verifyToken, async (req, res) => {
  try {
    const { year } = req.query;
    const [stats] = await db.query(
      `
      SELECT 
        COUNT(*) as totalEmployees,
        COUNT(CASE WHEN YEAR(JoinDate) = ? THEN 1 END) as newHires,
        COUNT(CASE WHEN YEAR(LeaveDate) = ? THEN 1 END) * 100.0 / COUNT(*) as turnoverRate
      FROM HUMAN_2025
    `,
      [year, year]
    );
    return res.json({ Status: true, Data: stats[0] });
  } catch (error) {
    return res.json({ Status: false, Message: error.message });
  }
});

router.get("/salary-stats", verifyToken, async (req, res) => {
  try {
    const { year } = req.query;
    const [stats] = await db.query(
      `
      SELECT 
        SUM(Salary) as totalPayroll,
        AVG(Salary) as averageSalary,
        (MAX(Salary) - MIN(Salary)) * 100.0 / MIN(Salary) as salaryIncrease
      FROM payroll
      WHERE YEAR(UpdateDate) = ?
    `,
      [year]
    );
    return res.json({ Status: true, Data: stats[0] });
  } catch (error) {
    return res.json({ Status: false, Message: error.message });
  }
});

router.get("/dividend-stats", verifyToken, async (req, res) => {
  try {
    const { year } = req.query;
    const [stats] = await db.query(
      `
      SELECT 
        SUM(Amount) as totalDividends,
        AVG(Amount) as dividendPerShare,
        SUM(Amount) * 100.0 / SUM(SharePrice) as dividendYield
      FROM dividends
      WHERE YEAR(DistributionDate) = ?
    `,
      [year]
    );
    return res.json({ Status: true, Data: stats[0] });
  } catch (error) {
    return res.json({ Status: false, Message: error.message });
  }
});

// 6. Cảnh báo
router.get("/work-anniversaries", verifyToken, async (req, res) => {
  try {
    const [anniversaries] = await db.query(`
      SELECT h.EmployeeID, h.EmployeeName, h.JoinDate,
             DATEDIFF(CURDATE(), h.JoinDate) / 365 as YearsOfService
      FROM HUMAN_2025 h
      WHERE MONTH(h.JoinDate) = MONTH(CURDATE())
      AND DATEDIFF(CURDATE(), h.JoinDate) % 365 = 0
    `);
    return res.json({ Status: true, Data: anniversaries });
  } catch (error) {
    return res.json({ Status: false, Message: error.message });
  }
});

router.get("/leave-violations", verifyToken, async (req, res) => {
  try {
    const [violations] = await db.query(`
      SELECT h.EmployeeID, h.EmployeeName,
             COUNT(CASE WHEN a.Status = 'Leave' THEN 1 END) as LeaveDays
      FROM HUMAN_2025 h
      JOIN attendance a ON h.EmployeeID = a.EmployeeID
      WHERE MONTH(a.Date) = MONTH(CURDATE())
      GROUP BY h.EmployeeID, h.EmployeeName
      HAVING LeaveDays > 12
    `);
    return res.json({ Status: true, Data: violations });
  } catch (error) {
    return res.json({ Status: false, Message: error.message });
  }
});

router.get("/payroll-discrepancies", verifyToken, async (req, res) => {
  try {
    const [discrepancies] = await db.query(`
      SELECT h.EmployeeID, h.EmployeeName,
             p1.Salary as CurrentSalary,
             p2.Salary as PreviousSalary
      FROM HUMAN_2025 h
      JOIN payroll p1 ON h.EmployeeID = p1.EmployeeID
      JOIN payroll p2 ON h.EmployeeID = p2.EmployeeID
      WHERE p1.id IN (SELECT MAX(id) FROM payroll GROUP BY EmployeeID)
      AND p2.id IN (SELECT MAX(id) - 1 FROM payroll GROUP BY EmployeeID)
      AND ABS(p1.Salary - p2.Salary) > 1000
    `);
    return res.json({ Status: true, Data: discrepancies });
  } catch (error) {
    return res.json({ Status: false, Message: error.message });
  }
});

router.put("/acknowledge-alert/:id", verifyToken, async (req, res) => {
  try {
    const { type } = req.body;
    await db.query(
      "INSERT INTO alert_history (AlertID, Type, AcknowledgedBy, AcknowledgeDate) VALUES (?, ?, ?, NOW())",
      [req.params.id, type, req.id]
    );
    return res.json({ Status: true, Message: "Đã xác nhận cảnh báo" });
  } catch (error) {
    return res.json({ Status: false, Message: error.message });
  }
});

// 7. Xuất báo cáo
router.get("/export-report/:type", verifyToken, async (req, res) => {
  try {
    const { type, year } = req.query;
    let query = "";

    switch (type) {
      case "employee":
        query = `
          SELECT h.*, 
                 COUNT(CASE WHEN a.Status = 'Present' THEN 1 END) as PresentDays,
                 COUNT(CASE WHEN a.Status = 'Leave' THEN 1 END) as LeaveDays
          FROM HUMAN_2025 h
          LEFT JOIN attendance a ON h.EmployeeID = a.EmployeeID
          WHERE YEAR(a.Date) = ?
          GROUP BY h.EmployeeID
        `;
        break;
      case "salary":
        query = `
          SELECT h.EmployeeID, h.EmployeeName, h.DepartmentName,
                 p.Salary, p.UpdateDate, u.username as UpdatedBy
          FROM HUMAN_2025 h
          JOIN payroll p ON h.EmployeeID = p.EmployeeID
          JOIN users u ON p.UpdatedBy = u.id
          WHERE YEAR(p.UpdateDate) = ?
          ORDER BY p.UpdateDate DESC
        `;
        break;
      case "dividend":
        query = `
          SELECT d.*, s.SharePrice
          FROM dividends d
          JOIN shares s ON d.ShareID = s.ShareID
          WHERE YEAR(d.DistributionDate) = ?
          ORDER BY d.DistributionDate DESC
        `;
        break;
    }

    const [data] = await db.query(query, [year]);

    // Tạo file Excel
    const ExcelJS = require("exceljs");
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Report");

    // Thêm headers
    const headers = Object.keys(data[0]);
    worksheet.addRow(headers);

    // Thêm data
    data.forEach((row) => {
      worksheet.addRow(Object.values(row));
    });

    // Gửi file
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${type}-report-${year}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    return res.json({ Status: false, Message: error.message });
  }
});

export default router;
