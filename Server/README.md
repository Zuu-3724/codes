# HR Management System Server

## Cài đặt

1. Cài đặt dependencies:

```bash
npm install
```

2. Tạo file .env từ mẫu:

```bash
cp .env.example .env
```

3. Cấu hình các biến môi trường trong file .env

4. Chạy server:

```bash
# Development
npm run dev

# Production
npm start
```

## Cấu trúc thư mục

```
server/
├── routes/           # API routes
├── uploads/          # Thư mục lưu file upload
├── .env             # Environment variables
├── .gitignore       # Git ignore rules
├── db.js            # Database configuration
├── index.js         # Server entry point
└── package.json     # Project configuration
```

## Upload File

Hệ thống hỗ trợ upload file ảnh với các giới hạn:

- Chỉ chấp nhận file ảnh (image/\*)
- Kích thước tối đa: 5MB
- Tên file được tự động tạo để tránh trùng lặp
- File được lưu trong thư mục `uploads/`

## API Endpoints

### Authentication

- POST /auth/login
- POST /auth/register
- POST /auth/logout

### User Management

- GET /auth/users
- POST /auth/add-user
- PUT /auth/edit-user/:id
- DELETE /auth/delete-user/:id
- PUT /auth/reset-password/:id

### Employee Management

- GET /auth/employees
- POST /auth/add-employee
- PUT /auth/edit-employee/:id
- DELETE /auth/delete-employee/:id

### Payroll Management

- GET /auth/payroll
- PUT /auth/update-salary/:id
- GET /auth/salary-history/:id

### Attendance Management

- GET /auth/attendance
- GET /auth/leave-requests
- PUT /auth/update-leave/:id

### Reports

- GET /auth/employee-stats
- GET /auth/salary-stats
- GET /auth/dividend-stats
- GET /auth/export-report/:type

### Alerts

- GET /auth/work-anniversaries
- GET /auth/leave-violations
- GET /auth/payroll-discrepancies
- PUT /auth/acknowledge-alert/:id

## Cơ sở dữ liệu

Hệ thống sử dụng hai cơ sở dữ liệu:

1. MySQL (payroll) - Quản lý người dùng
2. SQL Server (HUMAN_2025) - Quản lý nhân viên và các dữ liệu khác
