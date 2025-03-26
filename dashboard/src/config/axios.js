import axios from "axios";

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001",
  withCredentials: true,
  timeout: 10000,
});

// Request interceptor
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
          localStorage.removeItem("token");
          window.location.href = "/login";
          break;
        case 403:
          alert("Bạn không có quyền truy cập!");
          break;
        case 404:
          alert("Không tìm thấy tài nguyên!");
          break;
        case 500:
          alert("Lỗi server. Vui lòng thử lại sau!");
          break;
        default:
          alert(error.response.data.Message || "Có lỗi xảy ra!");
      }
    } else if (error.request) {
      alert("Không thể kết nối đến server. Vui lòng kiểm tra kết nối!");
    } else {
      alert("Có lỗi xảy ra khi gửi yêu cầu!");
    }
    return Promise.reject(error);
  }
);

export default instance;
