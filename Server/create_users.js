import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();

// Thông tin kết nối MySQL
const dbConfig = {
  host: process.env.MYSQL_HOST || "localhost",
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "YES",
  database: process.env.MYSQL_DATABASE || "payroll",
};

async function setupDatabase() {
  let connection;

  try {
    // Connect to MySQL
    console.log("Connecting to MySQL...");
    console.log("MySQL Config:", {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      password: dbConfig.password ? "****" : undefined,
    });

    // Tạo kết nối đến MySQL
    connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
    });

    // Tạo database nếu chưa tồn tại
    console.log("Creating database if not exists...");
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`
    );

    // Sử dụng database
    await connection.query(`USE ${dbConfig.database}`);

    // Tạo bảng users
    console.log("Creating users table...");
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('Admin', 'Employee', 'HR Manager', 'Manager') NOT NULL,
        status ENUM('Active', 'Inactive', 'Suspended') NOT NULL DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Kiểm tra xem đã có admin chưa
    const [rows] = await connection.query(
      "SELECT * FROM users WHERE username = ?",
      ["admin"]
    );

    if (rows.length === 0) {
      // Hash mật khẩu
      console.log("Adding default users...");

      // Admin user
      const adminPassword = await bcrypt.hash("admin123", 10);
      await connection.query(
        "INSERT INTO users (username, password, role, status) VALUES (?, ?, ?, ?)",
        ["admin", adminPassword, "Admin", "Active"]
      );

      // HR Manager user
      const hrPassword = await bcrypt.hash("hr123", 10);
      await connection.query(
        "INSERT INTO users (username, password, role, status) VALUES (?, ?, ?, ?)",
        ["hrmanager", hrPassword, "HR Manager", "Active"]
      );

      // Employee user
      const employeePassword = await bcrypt.hash("employee123", 10);
      await connection.query(
        "INSERT INTO users (username, password, role, status) VALUES (?, ?, ?, ?)",
        ["employee1", employeePassword, "Employee", "Active"]
      );

      console.log("Default users added successfully!");
    } else {
      console.log("Default users already exist.");
    }

    console.log("Database setup completed successfully!");
  } catch (error) {
    console.error("Error setting up database:", error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the setup
setupDatabase();
