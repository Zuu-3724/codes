import mysql from "mysql2";
import sql from "mssql";
import dotenv from "dotenv";
dotenv.config();

// MySQL Configuration
const mysqlConfig = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

console.log("MySQL Config:", {
  host: mysqlConfig.host,
  user: mysqlConfig.user,
  database: mysqlConfig.database,
  password: mysqlConfig.password ? "****" : undefined,
});

// Create MySQL connection pool
const mysqlPool = mysql.createPool(mysqlConfig);
const mysqlPromisePool = mysqlPool.promise();

// Test MySQL connection
mysqlPool.getConnection((err, connection) => {
  if (err) {
    console.error("MySQL Connection Error:", err);
    console.error("Error Code:", err.code);
    console.error("Error State:", err.sqlState);
    console.error("Error Message:", err.sqlMessage);
    console.error("Error Stack:", err.stack);
  } else {
    console.log("MySQL Connected Successfully");
    connection.release();
  }
});

// SQL Server Configuration
const sqlServerConfig = {
  user: process.env.SQL_SERVER_USER,
  password: process.env.SQL_SERVER_PASSWORD,
  server: process.env.SQL_SERVER_HOST,
  database: process.env.SQL_SERVER_DATABASE,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// Create SQL Server connection pool
const sqlServerPool = new sql.ConnectionPool(sqlServerConfig);

// Test SQL Server connection
sqlServerPool
  .connect()
  .then(() => {
    console.log("SQL Server Connected Successfully");
    return sqlServerPool.request().query("SELECT @@VERSION");
  })
  .then((result) => {
    console.log("SQL Server Version:", result.recordset[0]);
  })
  .catch((err) => {
    console.error("SQL Server Connection Error:", err);
    console.error("Error Code:", err.code);
    console.error("Error State:", err.state);
  });

// Function to get MySQL connection
const getMySQLConnection = async () => {
  try {
    const connection = await mysqlPromisePool.getConnection();
    return connection;
  } catch (error) {
    console.error("MySQL Connection Error:", error);
    console.error("Error Code:", error.code);
    console.error("Error State:", error.sqlState);
    throw error;
  }
};

// Function to get SQL Server connection
const getSQLServerConnection = async () => {
  try {
    await sqlServerPool.connect();
    return sqlServerPool;
  } catch (error) {
    console.error("SQL Server Connection Error:", error);
    console.error("Error Code:", error.code);
    console.error("Error State:", error.state);
    throw error;
  }
};

// Export connections and functions
export {
  mysqlPromisePool as mysql,
  sqlServerPool as sqlServer,
  getMySQLConnection,
  getSQLServerConnection,
};
