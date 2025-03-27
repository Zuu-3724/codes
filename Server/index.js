import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import config from "./config.js";
import errorHandler from "./middleware/errorHandler.js";
import authRoutes from "./routes/authRoute.js";
import adminRoutes from "./routes/adminRoute.js";
import employeeRoutes from "./routes/employeeRoute.js";

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS configuration
app.use(cors(config.CORS));

// Routes
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/employees", employeeRoutes);

// Thêm route departments tạm thời
app.get("/departments/list", (req, res) => {
  console.log("Received request for departments list");
  res.status(200).json({
    Status: true,
    Data: [
      { DepartmentID: 1, DepartmentName: "IT", ManagerID: "M001" },
      { DepartmentID: 2, DepartmentName: "HR", ManagerID: "M002" },
      { DepartmentID: 3, DepartmentName: "Finance", ManagerID: "M003" },
      { DepartmentID: 4, DepartmentName: "Marketing", ManagerID: "M004" },
    ],
  });
});

app.get("/departments/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const departments = [
    { DepartmentID: 1, DepartmentName: "IT", ManagerID: "M001" },
    { DepartmentID: 2, DepartmentName: "HR", ManagerID: "M002" },
    { DepartmentID: 3, DepartmentName: "Finance", ManagerID: "M003" },
    { DepartmentID: 4, DepartmentName: "Marketing", ManagerID: "M004" },
  ];

  const department = departments.find((d) => d.DepartmentID === id);

  if (department) {
    res.status(200).json({
      Status: true,
      Data: department,
    });
  } else {
    res.status(404).json({
      Status: false,
      Message: "Department not found",
    });
  }
});

// API endpoint để cập nhật phòng ban
app.put("/departments/update/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const updatedDepartment = req.body;

  console.log(
    `Received update request for department ID: ${id}`,
    updatedDepartment
  );

  // Trả về response thành công giả lập
  res.status(200).json({
    Status: true,
    Message: "Department updated successfully",
    Data: {
      ...updatedDepartment,
      DepartmentID: id,
    },
  });
});

// Error handling
app.use(errorHandler);

// Start server
const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${config.NODE_ENV}`);
});
