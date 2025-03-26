# Tài liệu Thiết kế UI/UX - Hệ thống Quản lý Nhân sự

## 1. Tổng quan Dashboard

### 1.1 Layout Chính

- **Header**: Logo công ty, tên người dùng, menu dropdown cho cài đặt và đăng xuất
- **Sidebar**: Menu điều hướng chính với các icon trực quan
- **Main Content**: Khu vực hiển thị nội dung chính
- **Footer**: Thông tin liên hệ và bản quyền

### 1.2 Dashboard Overview

- **Thống kê tổng quan**:
  - Tổng số nhân viên
  - Số nhân viên mới trong tháng
  - Tỷ lệ nghỉ việc
  - Tổng quỹ lương
  - Số ngày nghỉ phép đang chờ duyệt
- **Biểu đồ thống kê**:
  - Biểu đồ tròn: Phân bố nhân viên theo phòng ban
  - Biểu đồ cột: Xu hướng tuyển dụng theo tháng
  - Biểu đồ đường: Chi phí lương theo tháng
- **Cảnh báo gần đây**:
  - Kỷ niệm ngày làm việc
  - Vi phạm chính sách nghỉ phép
  - Bất thường về lương

## 2. Màn hình Quản lý Nhân viên

### 2.1 Danh sách Nhân viên

- **Bảng hiển thị**:
  - ID nhân viên
  - Ảnh đại diện
  - Họ tên
  - Phòng ban
  - Chức vụ
  - Trạng thái
  - Thao tác (Sửa/Xóa)
- **Thanh công cụ**:
  - Nút thêm nhân viên mới
  - Thanh tìm kiếm (tìm theo ID, tên, phòng ban, chức vụ)
  - Bộ lọc (theo phòng ban, chức vụ, trạng thái)
  - Nút xuất Excel

### 2.2 Form Thêm/Sửa Nhân viên

- **Thông tin cơ bản**:
  - ID nhân viên (tự động)
  - Họ tên
  - Ngày sinh
  - Giới tính
  - Email
  - Số điện thoại
- **Thông tin công việc**:
  - Phòng ban
  - Chức vụ
  - Ngày vào làm
  - Mức lương cơ bản
- **Thông tin khác**:
  - Ảnh đại diện
  - Ghi chú

## 3. Màn hình Quản lý Lương

### 3.1 Danh sách Lương

- **Bảng hiển thị**:
  - ID nhân viên
  - Họ tên
  - Phòng ban
  - Lương cơ bản
  - Phụ cấp
  - Khấu trừ
  - Lương thực lĩnh
  - Thao tác (Xem lịch sử/Cập nhật)
- **Thanh công cụ**:
  - Nút cập nhật lương hàng loạt
  - Thanh tìm kiếm
  - Bộ lọc theo tháng
  - Nút xuất bảng lương

### 3.2 Lịch sử Lương

- **Biểu đồ đường**: Xu hướng lương theo thời gian
- **Bảng chi tiết**:
  - Tháng
  - Lương cơ bản
  - Phụ cấp
  - Khấu trừ
  - Lương thực lĩnh
  - Người cập nhật
  - Ghi chú

## 4. Màn hình Chấm công

### 4.1 Bảng Chấm công

- **Lịch tháng**:
  - Hiển thị theo dạng lịch
  - Màu sắc phân biệt: Có mặt (xanh), Nghỉ phép (vàng), Vắng mặt (đỏ)
- **Thống kê**:
  - Số ngày làm việc
  - Số ngày nghỉ phép
  - Số ngày vắng mặt
  - Số lần đi muộn
- **Thanh công cụ**:
  - Chọn tháng
  - Nút chấm công hàng loạt
  - Nút xuất báo cáo

### 4.2 Quản lý Nghỉ phép

- **Danh sách yêu cầu**:
  - ID yêu cầu
  - Nhân viên
  - Loại nghỉ
  - Thời gian
  - Lý do
  - Trạng thái
  - Thao tác (Duyệt/Từ chối)
- **Form yêu cầu nghỉ phép**:
  - Loại nghỉ
  - Ngày bắt đầu
  - Ngày kết thúc
  - Lý do
  - File đính kèm

## 5. Màn hình Báo cáo

### 5.1 Báo cáo Nhân sự

- **Thống kê nhân viên**:
  - Tổng số nhân viên
  - Số nhân viên mới
  - Tỷ lệ nghỉ việc
  - Phân bố theo phòng ban
  - Phân bố theo chức vụ
- **Biểu đồ**:
  - Biểu đồ tròn: Phân bố theo phòng ban
  - Biểu đồ cột: Xu hướng tuyển dụng
  - Biểu đồ đường: Tỷ lệ nghỉ việc

### 5.2 Báo cáo Lương

- **Thống kê lương**:
  - Tổng quỹ lương
  - Lương trung bình
  - Tỷ lệ tăng lương
  - Chi phí phụ cấp
- **Biểu đồ**:
  - Biểu đồ cột: Chi phí lương theo tháng
  - Biểu đồ đường: Xu hướng tăng lương
  - Biểu đồ tròn: Phân bố chi phí

### 5.3 Báo cáo Cổ tức

- **Thống kê cổ tức**:
  - Tổng cổ tức
  - Cổ tức trên mỗi cổ phiếu
  - Tỷ suất cổ tức
- **Biểu đồ**:
  - Biểu đồ cột: Cổ tức theo tháng
  - Biểu đồ đường: Xu hướng cổ tức

## 6. Hệ thống Cảnh báo

### 6.1 Cảnh báo Chung

- **Icon thông báo**:
  - Số lượng cảnh báo chưa đọc
  - Màu sắc phân biệt mức độ
- **Danh sách cảnh báo**:
  - Loại cảnh báo
  - Nội dung
  - Thời gian
  - Trạng thái
  - Thao tác (Xem chi tiết/Xác nhận)

### 6.2 Các loại Cảnh báo

- **Kỷ niệm ngày làm việc**:
  - Icon: 🎂
  - Màu: Xanh dương
- **Vi phạm nghỉ phép**:
  - Icon: ⚠️
  - Màu: Đỏ
- **Bất thường về lương**:
  - Icon: 💰
  - Màu: Vàng

## 7. Bảo mật và Phân quyền

### 7.1 Đăng nhập

- **Form đăng nhập**:
  - Tên đăng nhập
  - Mật khẩu
  - Nút "Ghi nhớ đăng nhập"
  - Link "Quên mật khẩu"

### 7.2 Phân quyền

- **Admin**:
  - Truy cập toàn bộ chức năng
  - Quản lý người dùng
  - Cấu hình hệ thống
- **HR Manager**:
  - Quản lý nhân viên
  - Quản lý phòng ban
  - Xem báo cáo
- **Payroll Manager**:
  - Quản lý lương
  - Quản lý chấm công
  - Xuất báo cáo
- **Employee**:
  - Xem thông tin cá nhân
  - Xem lịch sử lương
  - Yêu cầu nghỉ phép

## 8. Responsive Design

### 8.1 Desktop (>= 1024px)

- Hiển thị đầy đủ sidebar
- Bảng hiển thị nhiều cột
- Biểu đồ kích thước lớn

### 8.2 Tablet (768px - 1023px)

- Sidebar thu gọn
- Bảng có thể cuộn ngang
- Biểu đồ kích thước vừa

### 8.3 Mobile (< 768px)

- Sidebar ẩn, hiện qua menu
- Bảng chuyển sang dạng card
- Biểu đồ kích thước nhỏ
