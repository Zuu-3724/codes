import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from the correct path
dotenv.config({ path: path.join(__dirname, "../.env") });

async function createDatabase() {
  try {
    console.log("Connecting to MySQL with config:", {
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      database: process.env.MYSQL_DATABASE,
      password: process.env.MYSQL_PASSWORD ? "****" : undefined,
    });

    // Kết nối MySQL không chọn database
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
    });

    console.log("Connected to MySQL successfully");

    // Tạo database nếu chưa tồn tại
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${process.env.MYSQL_DATABASE}`
    );
    console.log(`Database ${process.env.MYSQL_DATABASE} created successfully`);

    // Chọn database
    await connection.query(`USE ${process.env.MYSQL_DATABASE}`);
    console.log(`Selected database ${process.env.MYSQL_DATABASE}`);

    // Tạo bảng users
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL,
        status VARCHAR(20) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Table users created successfully");

    await connection.end();
    console.log("Database setup completed");
  } catch (error) {
    console.error("Error creating database:", error);
    console.error("Error Code:", error.code);
    console.error("Error State:", error.sqlState);
    console.error("Error Message:", error.sqlMessage);
    process.exit(1);
  }
}

createDatabase();
