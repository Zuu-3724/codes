# Tài liệu Ánh xạ Dữ liệu - Hệ thống Quản lý Nhân sự

## 1. Ánh xạ Bảng HUMAN_2025

### 1.1 Cấu trúc Bảng

```sql
CREATE TABLE HUMAN_2025 (
    EmployeeID VARCHAR(10) PRIMARY KEY,
    EmployeeName VARCHAR(100),
    DepartmentName VARCHAR(50),
    Position VARCHAR(50),
    Salary DECIMAL(10,2),
    JoinDate DATE,
    LeaveDate DATE,
    Status VARCHAR(20),
    image VARCHAR(255),
    Email VARCHAR(100),
    Phone VARCHAR(20),
    Gender VARCHAR(10),
    BirthDate DATE,
    Address TEXT,
    Notes TEXT
);
```

### 1.2 Ánh xạ với PAYROLL

- **EmployeeID**: Liên kết với bảng `payroll.EmployeeID`
- **Salary**: Đồng bộ với `payroll.CurrentSalary`
- **Status**: Ảnh hưởng đến `payroll.ActiveStatus`

## 2. Ánh xạ Bảng PAYROLL

### 2.1 Cấu trúc Bảng

```sql
CREATE TABLE payroll (
    id INT AUTO_INCREMENT PRIMARY KEY,
    EmployeeID VARCHAR(10),
    Salary DECIMAL(10,2),
    Allowance DECIMAL(10,2),
    Deduction DECIMAL(10,2),
    NetSalary DECIMAL(10,2),
    UpdateDate DATETIME,
    UpdatedBy INT,
    ActiveStatus BOOLEAN,
    FOREIGN KEY (EmployeeID) REFERENCES HUMAN_2025(EmployeeID),
    FOREIGN KEY (UpdatedBy) REFERENCES users(id)
);
```

### 2.2 Ánh xạ với HUMAN_2025

- **EmployeeID**: Liên kết với `HUMAN_2025.EmployeeID`
- **Salary**: Đồng bộ với `HUMAN_2025.Salary`
- **ActiveStatus**: Phụ thuộc vào `HUMAN_2025.Status`

## 3. Ánh xạ Bảng Attendance

### 3.1 Cấu trúc Bảng

```sql
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    EmployeeID VARCHAR(10),
    Date DATE,
    Status VARCHAR(20),
    CheckIn TIME,
    CheckOut TIME,
    LateMinutes INT,
    Notes TEXT,
    FOREIGN KEY (EmployeeID) REFERENCES HUMAN_2025(EmployeeID)
);
```

### 3.2 Ánh xạ với HUMAN_2025

- **EmployeeID**: Liên kết với `HUMAN_2025.EmployeeID`
- **Status**: Ảnh hưởng đến `HUMAN_2025.Status`

## 4. Ánh xạ Bảng Leave_Requests

### 4.1 Cấu trúc Bảng

```sql
CREATE TABLE leave_requests (
    RequestID INT AUTO_INCREMENT PRIMARY KEY,
    EmployeeID VARCHAR(10),
    LeaveType VARCHAR(20),
    StartDate DATE,
    EndDate DATE,
    Reason TEXT,
    Status VARCHAR(20),
    RequestDate DATETIME,
    UpdatedBy INT,
    UpdateDate DATETIME,
    FOREIGN KEY (EmployeeID) REFERENCES HUMAN_2025(EmployeeID),
    FOREIGN KEY (UpdatedBy) REFERENCES users(id)
);
```

### 4.2 Ánh xạ với HUMAN_2025

- **EmployeeID**: Liên kết với `HUMAN_2025.EmployeeID`
- **Status**: Ảnh hưởng đến `attendance.Status`

## 5. Ánh xạ Bảng Dividends

### 5.1 Cấu trúc Bảng

```sql
CREATE TABLE dividends (
    DividendID INT AUTO_INCREMENT PRIMARY KEY,
    ShareID VARCHAR(10),
    Amount DECIMAL(10,2),
    DistributionDate DATE,
    Status VARCHAR(20),
    CreatedBy INT,
    CreatedDate DATETIME,
    FOREIGN KEY (ShareID) REFERENCES shares(ShareID),
    FOREIGN KEY (CreatedBy) REFERENCES users(id)
);
```

### 5.2 Ánh xạ với HUMAN_2025

- **ShareID**: Liên kết với `shares.ShareID`
- **Amount**: Tính toán dựa trên `payroll.Salary`

## 6. Ánh xạ Bảng Users

### 6.1 Cấu trúc Bảng

```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50),
    email VARCHAR(100),
    password VARCHAR(255),
    role VARCHAR(20),
    status VARCHAR(20),
    CreatedDate DATETIME,
    LastLogin DATETIME
);
```

### 6.2 Ánh xạ với Các Bảng Khác

- **id**: Liên kết với `payroll.UpdatedBy`
- **id**: Liên kết với `leave_requests.UpdatedBy`
- **id**: Liên kết với `dividends.CreatedBy`

## 7. Quy tắc Đồng bộ Dữ liệu

### 7.1 Khi Thêm Nhân viên Mới

1. Thêm vào `HUMAN_2025`
2. Tạo bản ghi lương trong `payroll`
3. Tạo tài khoản người dùng trong `users` (nếu cần)

### 7.2 Khi Cập nhật Thông tin Nhân viên

1. Cập nhật `HUMAN_2025`
2. Nếu thay đổi lương:
   - Thêm bản ghi mới vào `payroll`
   - Cập nhật `HUMAN_2025.Salary`

### 7.3 Khi Xóa Nhân viên

1. Kiểm tra ràng buộc:
   - Không có bản ghi lương
   - Không có yêu cầu nghỉ phép đang chờ
   - Không có cổ tức chưa thanh toán
2. Nếu thỏa mãn:
   - Xóa khỏi `HUMAN_2025`
   - Cập nhật trạng thái trong `users`

## 8. Quy tắc Tính toán

### 8.1 Tính Lương

```sql
NetSalary = Salary + Allowance - Deduction
```

### 8.2 Tính Cổ tức

```sql
DividendPerShare = TotalDividendAmount / TotalShares
```

### 8.3 Tính Tỷ lệ Nghỉ việc

```sql
TurnoverRate = (EmployeesLeft / TotalEmployees) * 100
```

## 9. Quy tắc Bảo mật

### 9.1 Mã hóa Dữ liệu

- Mật khẩu: Hash với bcrypt
- Thông tin nhạy cảm: Mã hóa AES

### 9.2 Phân quyền Truy cập

- Admin: Toàn quyền
- HR Manager: Quản lý HUMAN_2025
- Payroll Manager: Quản lý payroll
- Employee: Xem thông tin cá nhân
