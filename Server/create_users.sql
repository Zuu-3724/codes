-- Sử dụng database payroll
USE payroll;

-- Tạo bảng users nếu chưa tồn tại
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('Admin', 'Employee', 'HR Manager', 'Manager') NOT NULL,
  `status` ENUM('Active', 'Inactive', 'Suspended') NOT NULL DEFAULT 'Active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Thêm tài khoản admin (mật khẩu: admin123 được hash bằng bcrypt)
INSERT INTO `users` (`username`, `password`, `role`, `status`) VALUES
('admin', '$2b$10$3euPcmQFCiblsZeEu5s7p.9MzdH0UXvUl8JBkJLD5xGizJGVMOdQe', 'Admin', 'Active');

-- Thêm tài khoản HR Manager (mật khẩu: hr123 được hash bằng bcrypt)
INSERT INTO `users` (`username`, `password`, `role`, `status`) VALUES
('hrmanager', '$2b$10$D5PJMi4.YOBkXcsaq8sl3OEu0T8MhMBfAWJfn7YxNtL3M9CmmWK9G', 'HR Manager', 'Active');

-- Thêm tài khoản employee1 (mật khẩu: employee123 được hash bằng bcrypt)
INSERT INTO `users` (`username`, `password`, `role`, `status`) VALUES
('employee1', '$2b$10$Dj4A0/Hgq3yLLHzHDZBAWebS5rQCwpVXOcaYYLJJbjMBVBGBtBvxO', 'Employee', 'Active'); 