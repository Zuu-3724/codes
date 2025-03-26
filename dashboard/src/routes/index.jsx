import { createBrowserRouter } from "react-router-dom";
import Login from "../components/Login";
import Dashboard from "../components/Dashboard";
import Employees from "../components/Employees";
import Payroll from "../components/Payroll";
import Departments from "../components/Departments";
import Reports from "../components/Reports";
import Alerts from "../components/Alerts";
import Security from "../components/Security";
import AddEmployee from "../components/AddEmployee";
import UpdateEmployee from "../components/UpdateEmployee";
import UpdateDepartment from "../components/UpdateDepartment";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/adminlogin",
    element: <Login />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
    children: [
      {
        path: "employees",
        element: <Employees />,
      },
      {
        path: "add_employee",
        element: <AddEmployee />,
      },
      {
        path: "update_employee",
        element: <UpdateEmployee />,
      },
      {
        path: "payroll",
        element: <Payroll />,
      },
      {
        path: "departments",
        element: <Departments />,
      },
      {
        path: "update_department/:id",
        element: <UpdateDepartment />,
      },
      {
        path: "reports",
        element: <Reports />,
      },
      {
        path: "alerts",
        element: <Alerts />,
      },
      {
        path: "security",
        element: <Security />,
      },
    ],
  },
]);

export default router;
