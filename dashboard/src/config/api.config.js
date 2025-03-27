// Cấu hình API và các endpoint

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:9000";

// Các hàm helpers cho việc xác thực
export const getAuthConfig = (navigate) => {
  const token = localStorage.getItem("token");

  if (!token) {
    console.error("Authentication token not found");
    navigate && navigate("/login");
    return null;
  }

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const TokenManager = {
  getToken: () => localStorage.getItem("token"),
  setToken: (token) => localStorage.setItem("token", token),
  removeToken: () => localStorage.removeItem("token"),
  isAuthenticated: () => !!localStorage.getItem("token"),
};
