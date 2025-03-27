import dotenv from "dotenv";
dotenv.config();

const config = {
  // Server config
  PORT: process.env.PORT || 9000,
  NODE_ENV: process.env.NODE_ENV || "development",

  // Database config
  DB: {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "hrms",
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  },

  // JWT config
  JWT: {
    secret: process.env.JWT_SECRET || "your-secret-key",
    expiresIn: "24h",
    refreshExpiresIn: "7d",
  },

  // CORS config
  CORS: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },

  // API endpoints
  API: {
    AUTH: {
      LOGIN: "/auth/login",
      REGISTER: "/auth/register",
      LOGOUT: "/auth/logout",
      CHECK_AUTH: "/auth/check-auth",
    },
    USERS: {
      LIST: "/users",
      ADD: "/users/add",
      UPDATE: "/users/update",
      DELETE: "/users/delete",
      RESET_PASSWORD: "/users/reset-password",
    },
    EMPLOYEES: {
      LIST: "/employees/list",
      ADD: "/employees/add",
      UPDATE: "/employees/update",
      DELETE: "/employees/delete",
    },
    DEPARTMENTS: {
      LIST: "/departments/list",
      ADD: "/departments/add",
      UPDATE: "/departments/update",
      DELETE: "/departments/delete",
    },
    ATTENDANCE: {
      LIST: "/attendance/list",
      LEAVE_REQUESTS: "/attendance/leave-requests",
      UPDATE_LEAVE: "/attendance/update-leave",
    },
  },

  // Error messages
  ERRORS: {
    AUTH: {
      INVALID_CREDENTIALS: "Invalid username or password",
      UNAUTHORIZED: "You do not have access permission",
      TOKEN_EXPIRED: "Login session has expired",
      TOKEN_INVALID: "Invalid token",
    },
    SERVER: {
      INTERNAL_ERROR: "Server error, please try again later",
      DB_ERROR: "Database connection error",
      VALIDATION_ERROR: "Invalid data",
    },
  },
};

export default config;
