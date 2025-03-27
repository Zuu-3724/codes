import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import Login from "./components/Login";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Home from "./components/Home";
import Employees from "./components/Employees";
import Payroll from "./components/Payroll";
import Departments from "./components/Departments";
import Reports from "./components/Reports";
import Alerts from "./components/Alerts";
import Security from "./components/Security";
import AddEmployee from "./components/AddEmployee";
import UpdateEmployee from "./components/UpdateEmployee";
import UpdateDepartment from "./components/UpdateDepartment";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />}></Route>
          <Route path="/dashboard" element={<Dashboard />}>
            <Route path="" element={<Home />}></Route>
            <Route path="/dashboard/employees" element={<Employees />}></Route>
            <Route
              path="/dashboard/add_employee"
              element={<AddEmployee />}
            ></Route>
            <Route
              path="/dashboard/update_employee/:id"
              element={<UpdateEmployee />}
            ></Route>
            <Route path="/dashboard/payroll" element={<Payroll />}></Route>
            <Route
              path="/dashboard/departments"
              element={<Departments />}
            ></Route>
            <Route
              path="/dashboard/update_department/:id"
              element={<UpdateDepartment />}
            ></Route>
            <Route path="/dashboard/reports" element={<Reports />}></Route>
            <Route path="/dashboard/alerts" element={<Alerts />}></Route>
            <Route path="/dashboard/security" element={<Security />}></Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
