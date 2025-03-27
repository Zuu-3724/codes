import axios from "axios";

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:9000",
  withCredentials: true,
  timeout: 10000,
});

// Request interceptor
instance.interceptors.request.use(
  (config) => {
    // Bỏ qua việc thêm Authorization header cho các endpoint login/register
    const authExemptEndpoints = ["/auth/login", "/auth/register"];
    const isAuthExempt = authExemptEndpoints.some((endpoint) =>
      config.url.includes(endpoint)
    );

    if (!isAuthExempt) {
      // Thêm header Authorization nếu có token trong localStorage
      const storedToken = localStorage.getItem("token");

      if (storedToken) {
        config.headers.Authorization = `Bearer ${storedToken}`;
      }
    } else {
      // Đảm bảo không có Authorization header cho các endpoint login
      delete config.headers.Authorization;
      console.log("Skipping Authorization header for auth endpoint");
    }

    // Logging để debug
    console.log("Request config:", {
      url: config.url,
      method: config.method,
      headers: config.headers,
      withCredentials: config.withCredentials,
    });

    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor
instance.interceptors.response.use(
  (response) => {
    // Logging để debug
    console.log("Response:", {
      status: response.status,
      headers: response.headers,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error("Response error:", error);

    if (error.response) {
      switch (error.response.status) {
        case 401:
          console.log("Unauthorized access detected");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login";
          break;
        case 403:
          alert("You don't have permission to access!");
          break;
        case 404:
          alert("Resource not found!");
          break;
        case 500:
          alert("Server error. Please try again later!");
          break;
        default:
          alert(error.response.data.Message || "An error occurred!");
      }
    } else if (error.request) {
      alert("Could not connect to server. Please check your connection!");
    } else {
      alert("An error occurred while sending the request!");
    }
    return Promise.reject(error);
  }
);

export default instance;
