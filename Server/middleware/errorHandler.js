import config from "../config.js";

const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // Xử lý lỗi JWT
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      Status: false,
      Error: config.ERRORS.AUTH.TOKEN_INVALID,
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      Status: false,
      Error: config.ERRORS.AUTH.TOKEN_EXPIRED,
    });
  }

  // Xử lý lỗi validation
  if (err.name === "ValidationError") {
    return res.status(400).json({
      Status: false,
      Error: config.ERRORS.SERVER.VALIDATION_ERROR,
    });
  }

  // Xử lý lỗi database
  if (err.code === "ER_DUP_ENTRY") {
    return res.status(400).json({
      Status: false,
      Error: "Dữ liệu đã tồn tại",
    });
  }

  if (err.code === "ER_NO_SUCH_TABLE") {
    return res.status(500).json({
      Status: false,
      Error: config.ERRORS.SERVER.DB_ERROR,
    });
  }

  // Xử lý lỗi mặc định
  return res.status(500).json({
    Status: false,
    Error: config.ERRORS.SERVER.INTERNAL_ERROR,
  });
};

export default errorHandler;
