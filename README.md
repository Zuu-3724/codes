# Dashboard HR PAYROLL

Hệ thống quản lý Nhân sự và Lương được phát triển bằng Python FastAPI và React.

## Cấu trúc dự án

<<<<<<< Updated upstream
- **Quản lý nhân viên**: Thêm, sửa, xóa, xem thông tin nhân viên
- **Quản lý phòng ban**: Tổ chức và quản lý cấu trúc phòng ban
- **Hệ thống lương**: Quản lý lương, phụ cấp, và các khoản khấu trừ
- **Báo cáo & Thống kê**: Tạo và xuất báo cáo tổng quan
- **Cảnh báo & Thông báo**: Nhận thông báo về các sự kiện quan trọng
- **Quản lý chấm công**: Theo dõi giờ làm việc và nghỉ phép
- **Bảo mật**: Hệ thống phân quyền và xác thực người dùng

## Công Nghệ Sử Dụng

### Frontend

- React.js
- Vite
- React Router
- Axios
- Bootstrap

### Backend

- Node.js
- Express.js
- MySQL
- JWT Authentication

## Cài Đặt và Chạy

### Yêu Cầu

- Node.js (v14+)
- MySQL
- Git

### Bước 1: Clone Repository

```bash
git clone https://github.com/trunghieu013/Dashboard-HR-PAYROLL.git
cd Dashboard-HR-PAYROLL-
=======
```
dashboard-hr-payroll/
├── python_server/        # Backend API (Python FastAPI)
│   ├── main.py           # Entry point của ứng dụng Python
│   ├── routes/           # Các API endpoints
│   ├── middleware/       # Xác thực và middleware
│   ├── utils/            # Các tiện ích
│   ├── migrations/       # Script khởi tạo database
│   └── tests/            # Unit tests
│
└── dashboard/            # Frontend (React/Vite)
    ├── src/              # Mã nguồn frontend
    └── public/           # Tài nguyên tĩnh
>>>>>>> Stashed changes
```

## Công nghệ sử dụng

### Backend:

- Python FastAPI: Framework API hiệu năng cao và dễ sử dụng
- SQL Server/MySQL: Cơ sở dữ liệu
- JWT Authentication: Xác thực người dùng
- Async/Await: Xử lý đồng thời
- Pydantic: Validation và kiểu dữ liệu

### Frontend:

- React: Thư viện UI
- Vite: Development server và build tool
- React Router: Quản lý routing
- Axios: HTTP Client

## Cài đặt và Chạy

### Backend (Python)

1. Cài đặt môi trường Python:

```bash
# Tạo và kích hoạt môi trường ảo
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Cài đặt dependencies
cd python_server
pip install -r requirements.txt
```

2. Cấu hình database:

- Tạo file `.env` từ `.env.example`
- Cập nhật thông tin kết nối MySQL và SQL Server

3. Chạy migration để tạo bảng:

```bash
python -m migrations.create_tables
```

4. Chạy server:

```bash
uvicorn main:app --reload --port 9000
```

### Frontend (React)

1. Cài đặt Node.js dependencies:

```bash
cd dashboard
npm install
```

2. Chạy development server:

```bash
npm run dev
```

## API Documentation

Truy cập các tài liệu API tự động tại:

- Swagger UI: http://localhost:9000/docs
- ReDoc: http://localhost:9000/redoc

## Tính năng chính

- Đăng nhập/Đăng ký người dùng
- Quản lý nhân viên
- Quản lý phòng ban
- Quản lý lương và thưởng
- Báo cáo và thống kê

## Phát triển

### Thêm API mới

1. Tạo file mới trong thư mục `python_server/routes/`
2. Định nghĩa router và endpoints
3. Import và đăng ký router trong `main.py`

### Thêm tính năng Frontend

1. Tạo component trong `dashboard/src/components/`
2. Thêm route trong `dashboard/src/App.jsx` hoặc router configuration
3. Kết nối với API backend qua HTTP client

## Testing

```bash
# Backend tests
cd python_server
pytest

# Frontend tests
cd dashboard
npm test
```

## Phiên bản

- Phiên bản hiện tại: 1.0.0
- Python: 3.9+
- Node.js: 16+
