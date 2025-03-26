import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import adminRoutes from "./Routes/AdminRoute.js";
import authRoutes from "./Routes/AuthRoute.js";
import employeeRoutes from "./Routes/EmployeeRoute.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Create uploads directory if it doesn't exist
import fs from "fs";
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use("/uploads", express.static(uploadsDir));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/employees", employeeRoutes);

// Test route
app.get("/test", (req, res) => {
  res.json({ message: "Server đang hoạt động" });
});

// 404 handler
app.use((req, res) => {
  console.log(`404 - Not Found: ${req.url}`);
  res.status(404).json({ Status: false, Message: "Không tìm thấy trang" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  console.error("Stack:", err.stack);
  res.status(500).json({
    Status: false,
    Message: "Lỗi server",
    Error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start server with error handling
const PORT = process.env.PORT || 3001;
const server = app
  .listen(PORT)
  .on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `Port ${PORT} is already in use. Trying port ${PORT + 1}...`
      );
      server.close();
      app.listen(PORT + 1, () => {
        console.log(`Server is running on port ${PORT + 1}`);
        console.log(`Upload directory: ${uploadsDir}`);
      });
    } else {
      console.error("Server error:", err);
    }
  })
  .on("listening", () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Upload directory: ${uploadsDir}`);
  });
