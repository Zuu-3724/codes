import mysql from "mysql2";
import sql from "mssql";

// Kết nối MySQL
const mysqlCon = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "YES",
  database: "payroll",
});

mysqlCon.connect(function (err) {
  if (err) {
    console.log("MySQL connection error:", err);
  } else {
    console.log("Connected to MySQL");
  }
});

// Cấu hình kết nối SQL Server
const sqlServerConfig = {
  user: "sa",
  password: "trunghieu013",
  server: "DESKTOP-74S139L",
  database: "HUMAN_2025",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

// Kết nối SQL Server
async function connectSQLServer() {
  try {
    const pool = await sql.connect(sqlServerConfig);
    console.log("Connected to SQL Server");
    return pool;
  } catch (err) {
    console.log("SQL Server connection error:", err);
    throw err;
  }
}

// Gọi kết nối SQL Server
connectSQLServer();

export { mysqlCon, connectSQLServer };
