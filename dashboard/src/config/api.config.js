// Cấu hình API và các endpoint

import axios from "axios";

// Đọc cấu hình từ localStorage
const getLocalConfig = (key, defaultValue) => {
  const value = localStorage.getItem(key);
  return value !== null ? value : defaultValue;
};

// Base API Configuration
// Trường hợp không thể kết nối đến server thực, sẽ tự động sử dụng demo data
const FORCE_DEMO_DATA = getLocalConfig("useDemoData", "false") === "true"; // Sử dụng từ localStorage
const USE_PROXY = getLocalConfig("useProxy", "false") === "true"; // Sử dụng từ localStorage
const API_TIMEOUT = parseInt(getLocalConfig("apiTimeout", "2500")); // Thời gian chờ từ localStorage

// Danh sách các cổng có thể thử kết nối, theo thứ tự ưu tiên
const POSSIBLE_PORTS = [9000, 3000, 8080, 5000];
const API_PORT = import.meta.env.VITE_API_PORT || POSSIBLE_PORTS[0];
const API_HOST = import.meta.env.VITE_API_HOST || "localhost";
const SAVED_API_URL = getLocalConfig("apiUrl", null);

const API_BASE = USE_PROXY
  ? "/api"
  : SAVED_API_URL ||
    import.meta.env.VITE_API_URL ||
    `http://${API_HOST}:${API_PORT}`;
const API_URL = API_BASE;
const API_URL_HEALTH = `${API_URL}/health`;

// Token management
export const TokenManager = {
  getToken: () => {
    return localStorage.getItem("authToken");
  },
  setToken: (token) => {
    localStorage.setItem("authToken", token);
  },
  removeToken: () => {
    localStorage.removeItem("authToken");
  },
  isAuthenticated: () => {
    return !!localStorage.getItem("authToken");
  },
};

// Authentication configuration for requests
export const getAuthConfig = (navigate = null) => {
  const token = TokenManager.getToken();

  if (!token && navigate) {
    navigate("/login");
    return null;
  }

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// Server Connection check
export async function checkServerConnection() {
  // Nếu đang phát triển và muốn dùng demo data, trả về false luôn
  if (FORCE_DEMO_DATA) {
    console.log("Forced demo data mode is ON. Simulating server offline...");
    return false;
  }

  console.log("Checking server connection...");
  console.log("API URL:", API_URL);
  console.log("Health endpoint:", API_URL_HEALTH);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    // Thêm timestamp để tránh cache
    const timestamp = new Date().getTime();
    const response = await axios.get(`${API_URL_HEALTH}?t=${timestamp}`, {
      signal: controller.signal,
      timeout: API_TIMEOUT,
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        Expires: "0",
      },
    });

    clearTimeout(timeoutId);

    console.log("Server connection response:", response.data);
    // Handle both possible response formats (Status:true or status:"healthy")
    return response.data.Status === true || response.data.status === "healthy";
  } catch (error) {
    console.error("Server connection check failed:", error.message);
    console.log("Error details:", error);

    if (error.name === "AbortError" || error.code === "ECONNABORTED") {
      console.log("Connection timed out");
    } else if (error.response) {
      console.log("Server responded with status:", error.response.status);
      console.log("Response data:", error.response.data);
    } else if (error.request) {
      console.log("No response received from server");
    } else {
      console.log("Connection error:", error.message);
    }
    return false; // Trả về false để ứng dụng sử dụng dữ liệu demo
  }
}

// Dashboard API methods
export const dashboardAPI = {
  // SQL Server endpoints
  getEmployeeStats: async (year) => {
    try {
      const token = TokenManager.getToken();
      const response = await axios.get(
        `${API_URL}/reports/employee-stats?year=${year}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.Status) {
        return response.data.Data;
      } else {
        throw new Error(
          response.data.Message || "Failed to load employee statistics"
        );
      }
    } catch (error) {
      console.error("Error getting employee stats:", error);
      throw error;
    }
  },

  getSalaryStats: async (year) => {
    try {
      const token = TokenManager.getToken();
      const response = await axios.get(
        `${API_URL}/reports/salary-stats?year=${year}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.Status) {
        return response.data.Data;
      } else {
        throw new Error(
          response.data.Message || "Failed to load salary statistics"
        );
      }
    } catch (error) {
      console.error("Error getting salary stats:", error);
      throw error;
    }
  },

  getOrganizationStats: async () => {
    try {
      const token = TokenManager.getToken();
      const response = await axios.get(
        `${API_URL}/reports/organization-stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.Status) {
        return response.data.Data;
      } else {
        throw new Error(
          response.data.Message || "Failed to load organization statistics"
        );
      }
    } catch (error) {
      console.error("Error getting organization stats:", error);
      throw error;
    }
  },

  // MySQL database endpoints
  getEmployeeStatsMysql: async (year) => {
    try {
      const token = TokenManager.getToken();
      const response = await axios.get(
        `${API_URL}/reports/mysql/employee-stats?year=${year}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.Status) {
        return response.data.Data;
      } else {
        throw new Error(
          response.data.Message || "Failed to load MySQL employee statistics"
        );
      }
    } catch (error) {
      console.error("Error getting MySQL employee stats:", error);
      throw error;
    }
  },

  getSalaryStatsMysql: async (year) => {
    try {
      const token = TokenManager.getToken();
      const response = await axios.get(
        `${API_URL}/reports/mysql/salary-stats?year=${year}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.Status) {
        return response.data.Data;
      } else {
        throw new Error(
          response.data.Message || "Failed to load MySQL salary statistics"
        );
      }
    } catch (error) {
      console.error("Error getting MySQL salary stats:", error);
      throw error;
    }
  },

  getOrganizationStatsMysql: async () => {
    try {
      const token = TokenManager.getToken();
      const response = await axios.get(
        `${API_URL}/reports/mysql/organization-stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.Status) {
        return response.data.Data;
      } else {
        throw new Error(
          response.data.Message ||
            "Failed to load MySQL organization statistics"
        );
      }
    } catch (error) {
      console.error("Error getting MySQL organization stats:", error);
      throw error;
    }
  },
};

export const authAPI = {
  login: async (credentials) => {
    try {
      console.log("Attempting login with credentials:", {
        username: credentials.username,
        password: "******", // Don't log actual password
      });

      // Use the JSON endpoint instead of form data
      const response = await axios.post(
        `${API_URL}/auth/login-json`,
        {
          username: credentials.username,
          password: credentials.password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Login response:", response.data);

      if (response.data.token) {
        TokenManager.setToken(response.data.token);
        return response.data;
      } else if (response.data.Status === true && response.data.token) {
        TokenManager.setToken(response.data.token);
        return response.data;
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Login error details:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw error;
    }
  },
  logout: () => {
    console.log("Logging out...");
    TokenManager.removeToken();
  },
};

// Demo data for when backend is not available
export const demoDataAPI = {
  getEmployees: () => {
    return [
      {
        EmployeeID: 1,
        FirstName: "Anh",
        LastName: "Nguyen",
        Email: "anh.nguyen@company.com",
        Phone: "0901234567",
        DepartmentName: "Human Resources",
        PositionName: "HR Manager",
        HireDate: "2022-01-15",
        Salary: 25000000,
      },
      {
        EmployeeID: 2,
        FirstName: "Binh",
        LastName: "Tran",
        Email: "binh.tran@company.com",
        Phone: "0912345678",
        DepartmentName: "Human Resources",
        PositionName: "Finance Manager",
        HireDate: "2022-02-20",
        Salary: 23500000,
      },
      {
        EmployeeID: 3,
        FirstName: "Cuong",
        LastName: "Le",
        Email: "cuong.le@company.com",
        Phone: "0923456789",
        DepartmentName: "Finance",
        PositionName: "HR Manager",
        HireDate: "2022-03-10",
        Salary: 22000000,
      },
      {
        EmployeeID: 4,
        FirstName: "Duyen",
        LastName: "Pham",
        Email: "duyen.pham@company.com",
        Phone: "0934567890",
        DepartmentName: "Finance",
        PositionName: "Finance Manager",
        HireDate: "2022-04-05",
        Salary: 21000000,
      },
      {
        EmployeeID: 5,
        FirstName: "Dat",
        LastName: "Hoang",
        Email: "dat.hoang@company.com",
        Phone: "0945678901",
        DepartmentName: "Information Technology",
        PositionName: "HR Manager",
        HireDate: "2022-05-12",
        Salary: 24000000,
      },
      {
        EmployeeID: 6,
        FirstName: "Huong",
        LastName: "Vu",
        Email: "huong.vu@company.com",
        Phone: "0956789012",
        DepartmentName: "Information Technology",
        PositionName: "Finance Manager",
        HireDate: "2022-05-18",
        Salary: 22500000,
      },
      {
        EmployeeID: 7,
        FirstName: "Khanh",
        LastName: "Tran",
        Email: "khanh.tran@company.com",
        Phone: "0967890123",
        DepartmentName: "Sales",
        PositionName: "HR Manager",
        HireDate: "2022-06-01",
        Salary: 23000000,
      },
      {
        EmployeeID: 8,
        FirstName: "Linh",
        LastName: "Nguyen",
        Email: "linh.nguyen@company.com",
        Phone: "0978901234",
        DepartmentName: "Sales",
        PositionName: "Finance Manager",
        HireDate: "2022-06-15",
        Salary: 21500000,
      },
      {
        EmployeeID: 9,
        FirstName: "Minh",
        LastName: "Phan",
        Email: "minh.phan@company.com",
        Phone: "0989012345",
        DepartmentName: "Operations",
        PositionName: "HR Manager",
        HireDate: "2022-07-01",
        Salary: 22800000,
      },
    ];
  },

  getDepartments: () => {
    return [
      {
        DepartmentID: 1,
        DepartmentName: "Human Resources",
        EmployeeCount: 8,
        Manager: "Anh Nguyen",
      },
      {
        DepartmentID: 2,
        DepartmentName: "Finance",
        EmployeeCount: 12,
        Manager: "Cuong Le",
      },
      {
        DepartmentID: 3,
        DepartmentName: "Information Technology",
        EmployeeCount: 15,
        Manager: "Dat Hoang",
      },
      {
        DepartmentID: 4,
        DepartmentName: "Sales",
        EmployeeCount: 10,
        Manager: "Khanh Tran",
      },
      {
        DepartmentID: 5,
        DepartmentName: "Operations",
        EmployeeCount: 6,
        Manager: "Minh Phan",
      },
      {
        DepartmentID: 6,
        DepartmentName: "Marketing",
        EmployeeCount: 7,
        Manager: "Hoang Vu",
      },
    ];
  },

  getAttendance: (employeeId = null) => {
    const baseData = [
      {
        AttendanceID: 1,
        EmployeeID: 1,
        EmployeeName: "Anh Nguyen",
        Date: "2025-04-25",
        TimeIn: "08:02",
        TimeOut: "17:30",
        Status: "Present",
      },
      {
        AttendanceID: 2,
        EmployeeID: 2,
        EmployeeName: "Binh Tran",
        Date: "2025-04-25",
        TimeIn: "08:15",
        TimeOut: "17:45",
        Status: "Present",
      },
      {
        AttendanceID: 3,
        EmployeeID: 3,
        EmployeeName: "Cuong Le",
        Date: "2025-04-25",
        TimeIn: "07:58",
        TimeOut: "17:20",
        Status: "Present",
      },
      {
        AttendanceID: 4,
        EmployeeID: 4,
        EmployeeName: "Duyen Pham",
        Date: "2025-04-25",
        TimeIn: "09:10",
        TimeOut: "17:15",
        Status: "Late",
      },
      {
        AttendanceID: 5,
        EmployeeID: 5,
        EmployeeName: "Dat Hoang",
        Date: "2025-04-25",
        TimeIn: "",
        TimeOut: "",
        Status: "Absent",
      },
      {
        AttendanceID: 6,
        EmployeeID: 1,
        EmployeeName: "Anh Nguyen",
        Date: "2025-04-26",
        TimeIn: "08:05",
        TimeOut: "17:35",
        Status: "Present",
      },
      {
        AttendanceID: 7,
        EmployeeID: 2,
        EmployeeName: "Binh Tran",
        Date: "2025-04-26",
        TimeIn: "08:10",
        TimeOut: "17:40",
        Status: "Present",
      },
      {
        AttendanceID: 8,
        EmployeeID: 3,
        EmployeeName: "Cuong Le",
        Date: "2025-04-26",
        TimeIn: "08:30",
        TimeOut: "17:00",
        Status: "Present",
      },
      {
        AttendanceID: 9,
        EmployeeID: 4,
        EmployeeName: "Duyen Pham",
        Date: "2025-04-26",
        TimeIn: "08:00",
        TimeOut: "17:30",
        Status: "Present",
      },
      {
        AttendanceID: 10,
        EmployeeID: 5,
        EmployeeName: "Dat Hoang",
        Date: "2025-04-26",
        TimeIn: "08:20",
        TimeOut: "17:25",
        Status: "Present",
      },
    ];

    return employeeId
      ? baseData.filter((item) => item.EmployeeID === employeeId)
      : baseData;
  },

  getPayroll: () => {
    return [
      {
        PayrollID: 1,
        EmployeeID: 1,
        EmployeeName: "Anh Nguyen",
        Month: "April",
        Year: "2025",
        BasicSalary: 25000000,
        Allowances: 2000000,
        Deductions: 500000,
        NetSalary: 26500000,
        Status: "Paid",
      },
      {
        PayrollID: 2,
        EmployeeID: 2,
        EmployeeName: "Binh Tran",
        Month: "April",
        Year: "2025",
        BasicSalary: 23500000,
        Allowances: 1800000,
        Deductions: 450000,
        NetSalary: 24850000,
        Status: "Paid",
      },
      {
        PayrollID: 3,
        EmployeeID: 3,
        EmployeeName: "Cuong Le",
        Month: "April",
        Year: "2025",
        BasicSalary: 22000000,
        Allowances: 1700000,
        Deductions: 400000,
        NetSalary: 23300000,
        Status: "Processing",
      },
      {
        PayrollID: 4,
        EmployeeID: 4,
        EmployeeName: "Duyen Pham",
        Month: "April",
        Year: "2025",
        BasicSalary: 21000000,
        Allowances: 1600000,
        Deductions: 380000,
        NetSalary: 22220000,
        Status: "Processing",
      },
      {
        PayrollID: 5,
        EmployeeID: 5,
        EmployeeName: "Dat Hoang",
        Month: "April",
        Year: "2025",
        BasicSalary: 24000000,
        Allowances: 1900000,
        Deductions: 470000,
        NetSalary: 25430000,
        Status: "Pending",
      },
    ];
  },
};

export default {
  API_URL,
  API_URL_HEALTH,
  TokenManager,
  getAuthConfig,
  checkServerConnection,
  dashboardAPI,
  authAPI,
  demoDataAPI,
};
