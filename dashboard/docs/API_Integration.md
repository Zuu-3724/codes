# Kế hoạch Tích hợp API - Hệ thống Quản lý Nhân sự

## 1. Quản lý Người dùng

### 1.1 Xác thực

```http
POST /auth/login
Content-Type: application/json
{
  "username": "string",
  "password": "string"
}

Response:
{
  "Status": true,
  "Data": {
    "token": "string",
    "user": {
      "id": "number",
      "username": "string",
      "role": "string"
    }
  }
}
```

### 1.2 Quản lý Người dùng

```http
GET /auth/users
Authorization: Bearer {token}

Response:
{
  "Status": true,
  "Data": [
    {
      "id": "number",
      "username": "string",
      "email": "string",
      "role": "string",
      "status": "string"
    }
  ]
}

POST /auth/add-user
Authorization: Bearer {token}
Content-Type: application/json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "role": "string"
}

PUT /auth/update-user/:id
Authorization: Bearer {token}
Content-Type: application/json
{
  "username": "string",
  "email": "string",
  "role": "string",
  "password": "string" // optional
}

DELETE /auth/delete-user/:id
Authorization: Bearer {token}

POST /auth/reset-password/:id
Authorization: Bearer {token}
```

## 2. Quản lý Nhân viên

### 2.1 Danh sách Nhân viên

```http
GET /auth/employees
Authorization: Bearer {token}
Query Parameters:
  - search: string (optional)
  - department: string (optional)
  - position: string (optional)
  - status: string (optional)

Response:
{
  "Status": true,
  "Data": [
    {
      "EmployeeID": "string",
      "EmployeeName": "string",
      "DepartmentName": "string",
      "Position": "string",
      "Salary": "number",
      "Status": "string",
      "image": "string"
    }
  ]
}
```

### 2.2 Thêm/Sửa/Xóa Nhân viên

```http
POST /auth/add-employee
Authorization: Bearer {token}
Content-Type: multipart/form-data
{
  "EmployeeID": "string",
  "EmployeeName": "string",
  "DepartmentName": "string",
  "Position": "string",
  "Salary": "number",
  "image": "file"
}

PUT /auth/update-employee/:id
Authorization: Bearer {token}
Content-Type: multipart/form-data
{
  "EmployeeName": "string",
  "DepartmentName": "string",
  "Position": "string",
  "Salary": "number",
  "image": "file" // optional
}

DELETE /auth/delete-employee/:id
Authorization: Bearer {token}
```

## 3. Quản lý Lương

### 3.1 Danh sách Lương

```http
GET /auth/payroll
Authorization: Bearer {token}
Query Parameters:
  - month: string (YYYY-MM)
  - department: string (optional)

Response:
{
  "Status": true,
  "Data": [
    {
      "EmployeeID": "string",
      "EmployeeName": "string",
      "DepartmentName": "string",
      "CurrentSalary": "number",
      "Allowance": "number",
      "Deduction": "number",
      "NetSalary": "number"
    }
  ]
}
```

### 3.2 Cập nhật Lương

```http
PUT /auth/update-salary/:id
Authorization: Bearer {token}
Content-Type: application/json
{
  "salary": "number",
  "allowance": "number",
  "deduction": "number"
}

GET /auth/salary-history/:id
Authorization: Bearer {token}
Query Parameters:
  - year: string (YYYY)

Response:
{
  "Status": true,
  "Data": [
    {
      "UpdateDate": "string",
      "Salary": "number",
      "UpdatedBy": "string"
    }
  ]
}
```

## 4. Quản lý Chấm công

### 4.1 Chấm công

```http
GET /auth/attendance
Authorization: Bearer {token}
Query Parameters:
  - month: string (YYYY-MM)
  - department: string (optional)

Response:
{
  "Status": true,
  "Data": [
    {
      "EmployeeID": "string",
      "EmployeeName": "string",
      "DepartmentName": "string",
      "PresentDays": "number",
      "LeaveDays": "number",
      "LateDays": "number",
      "Status": "string"
    }
  ]
}
```

### 4.2 Quản lý Nghỉ phép

```http
GET /auth/leave-requests
Authorization: Bearer {token}

Response:
{
  "Status": true,
  "Data": [
    {
      "RequestID": "number",
      "EmployeeID": "string",
      "EmployeeName": "string",
      "LeaveType": "string",
      "StartDate": "string",
      "EndDate": "string",
      "Reason": "string",
      "Status": "string"
    }
  ]
}

PUT /auth/update-leave-request/:id
Authorization: Bearer {token}
Content-Type: application/json
{
  "status": "string"
}
```

## 5. Báo cáo

### 5.1 Thống kê Nhân sự

```http
GET /auth/employee-stats
Authorization: Bearer {token}
Query Parameters:
  - year: string (YYYY)

Response:
{
  "Status": true,
  "Data": {
    "totalEmployees": "number",
    "newHires": "number",
    "turnoverRate": "number"
  }
}
```

### 5.2 Thống kê Lương

```http
GET /auth/salary-stats
Authorization: Bearer {token}
Query Parameters:
  - year: string (YYYY)

Response:
{
  "Status": true,
  "Data": {
    "totalPayroll": "number",
    "averageSalary": "number",
    "salaryIncrease": "number"
  }
}
```

### 5.3 Thống kê Cổ tức

```http
GET /auth/dividend-stats
Authorization: Bearer {token}
Query Parameters:
  - year: string (YYYY)

Response:
{
  "Status": true,
  "Data": {
    "totalDividends": "number",
    "dividendPerShare": "number",
    "dividendYield": "number"
  }
}
```

## 6. Cảnh báo

### 6.1 Danh sách Cảnh báo

```http
GET /auth/work-anniversaries
Authorization: Bearer {token}

Response:
{
  "Status": true,
  "Data": [
    {
      "EmployeeID": "string",
      "EmployeeName": "string",
      "JoinDate": "string",
      "YearsOfService": "number"
    }
  ]
}

GET /auth/leave-violations
Authorization: Bearer {token}

Response:
{
  "Status": true,
  "Data": [
    {
      "EmployeeID": "string",
      "EmployeeName": "string",
      "LeaveDays": "number"
    }
  ]
}

GET /auth/payroll-discrepancies
Authorization: Bearer {token}

Response:
{
  "Status": true,
  "Data": [
    {
      "EmployeeID": "string",
      "EmployeeName": "string",
      "CurrentSalary": "number",
      "PreviousSalary": "number"
    }
  ]
}
```

### 6.2 Xác nhận Cảnh báo

```http
PUT /auth/acknowledge-alert/:id
Authorization: Bearer {token}
Content-Type: application/json
{
  "type": "string"
}
```

## 7. Xuất Báo cáo

### 7.1 Xuất Báo cáo

```http
GET /auth/export-report/:type
Authorization: Bearer {token}
Query Parameters:
  - year: string (YYYY)

Response:
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename={type}-report-{year}.xlsx
```

## 8. Quy tắc Chung

### 8.1 Xác thực

- Tất cả API yêu cầu token trong header
- Token được lấy từ API đăng nhập
- Token hết hạn sau 24 giờ

### 8.2 Phân quyền

- Admin: Truy cập tất cả API
- HR Manager: Truy cập API quản lý nhân viên
- Payroll Manager: Truy cập API quản lý lương
- Employee: Chỉ truy cập API xem thông tin cá nhân

### 8.3 Xử lý Lỗi

```json
{
  "Status": false,
  "Message": "string"
}
```

### 8.4 Rate Limiting

- Giới hạn 100 request/phút cho mỗi IP
- Giới hạn 1000 request/giờ cho mỗi user

### 8.5 Caching

- Cache kết quả API trong 5 phút
- Không cache các API cập nhật dữ liệu
