import jwt from "jsonwebtoken";
import config from "../config.js";

// Middleware kiểm tra token
export const verifyToken = (req, res, next) => {
  try {
    console.log("Auth Headers:", req.headers);
    console.log("Cookies:", req.cookies);

    let token = req.cookies.token;

    // Kiểm tra token từ Authorization header nếu không có trong cookies
    if (!token && req.headers.authorization) {
      console.log("Using Authorization header for token");
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }

    console.log("Token found:", !!token);

    if (!token) {
      return res
        .status(401)
        .json({ Status: false, Message: "Token not found" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error("JWT Verification Error:", err);
        return res
          .status(401)
          .json({ Status: false, Message: "Invalid token" });
      }
      console.log("Decoded token:", decoded);
      req.role = decoded.role;
      req.id = decoded.id;
      next();
    });
  } catch (error) {
    console.error("Token verification error:", error);
    return res
      .status(500)
      .json({ Status: false, Message: "Authentication error" });
  }
};

// Middleware kiểm tra quyền admin
export const isAdmin = (req, res, next) => {
  console.log("Checking admin role:", req.role);
  if (req.role !== "Admin") {
    return res.status(403).json({ Status: false, Message: "Access denied" });
  }
  next();
};

// Middleware kiểm tra quyền theo role
export const checkRole = (roles) => {
  return (req, res, next) => {
    console.log("Checking roles:", { userRole: req.role, allowedRoles: roles });
    if (!roles.includes(req.role)) {
      return res.status(403).json({ Status: false, Message: "Access denied" });
    }
    next();
  };
};

// Thêm vào cuối file
export const handleErrors = (err, req, res, next) => {
  console.error("Error Stack:", err.stack);

  // Xử lý các loại lỗi cụ thể
  if (err.name === "ValidationError") {
    return res.status(400).json({
      Status: false,
      Message: "Invalid data",
      Error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }

  if (err.name === "UnauthorizedError") {
    return res.status(401).json({
      Status: false,
      Message: "Access denied",
      Error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }

  // Lỗi mặc định
  res.status(500).json({
    Status: false,
    Message: "Server error",
    Error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
};

export const checkEnvironment = (req, res, next) => {
  if (process.env.NODE_ENV === "production") {
    // Thêm các kiểm tra bảo mật cho môi trường production
    if (!req.secure) {
      return res.status(403).json({
        Status: false,
        Message: "HTTPS is required in production environment",
      });
    }
  }
  next();
};

export const auth = (req, res, next) => {
  try {
    // Lấy token từ header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        Status: false,
        Error: config.ERRORS.AUTH.TOKEN_INVALID,
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        Status: false,
        Error: config.ERRORS.AUTH.TOKEN_INVALID,
      });
    }

    // Verify token
    const decoded = jwt.verify(token, config.JWT.secret);

    // Thêm thông tin user vào request
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        Status: false,
        Error: config.ERRORS.AUTH.TOKEN_EXPIRED,
      });
    }

    return res.status(401).json({
      Status: false,
      Error: config.ERRORS.AUTH.TOKEN_INVALID,
    });
  }
};

// Middleware kiểm tra quyền admin
export const adminAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        Status: false,
        Error: config.ERRORS.AUTH.TOKEN_INVALID,
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        Status: false,
        Error: config.ERRORS.AUTH.TOKEN_INVALID,
      });
    }

    const decoded = jwt.verify(token, config.JWT.secret);

    // Kiểm tra role admin
    if (decoded.role !== "admin") {
      return res.status(403).json({
        Status: false,
        Error: config.ERRORS.AUTH.UNAUTHORIZED,
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error("Admin auth middleware error:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        Status: false,
        Error: config.ERRORS.AUTH.TOKEN_EXPIRED,
      });
    }

    return res.status(401).json({
      Status: false,
      Error: config.ERRORS.AUTH.TOKEN_INVALID,
    });
  }
};
