# HR Payroll Dashboard

This is a dashboard for managing HR and Payroll data. It provides interfaces for employee management, payroll, attendance tracking, and more.

## Features

- Employee Management: Add, edit, and view employee information
- Payroll Management: Manage salaries, allowances, and deductions
- Attendance Tracking: Track employee attendance and leaves
- Departments & Positions: Manage organizational structure
- Reports & Statistics: Generate various HR and payroll reports
- Alerts & Notifications: Get notified about important events

## Role-Based Authorization

The system implements role-based access control with the following roles:

### Admin

- Full access to all system features
- Can manage all data including security settings
- Can add/modify all users and their permissions

### HR Manager

- Can manage employee data but cannot modify payroll
- Access to employee profiles, departments, and positions
- View-only access to payroll information

### Payroll Manager

- Can manage payroll data but cannot modify employee information
- Access to salary, allowances, and deductions
- View-only access to employee data

### Employee

- Limited access to own data only
- Can view personal information and salary details
- Cannot access data of other employees

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- npm or yarn

### Installation

1. Clone the repository

```
git clone <repository-url>
cd dashboard
```

2. Install dependencies

```
npm install
```

3. Start the development server

```
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Testing Role-Based Authorization

To test the role-based authorization system:

1. Log in with one of the following test accounts:

   - Admin: username: `admin`, password: `admin123`
   - HR Manager: username: `hr_manager`, password: `hr123`
   - Payroll Manager: username: `payroll_manager`, password: `payroll123`
   - Employee: username: `employee`, password: `employee123`

2. Observe the different UI elements and access levels for each role:

   - Admin will see all menu items and can access all functions
   - HR Manager can manage employees but not payroll data
   - Payroll Manager can manage payroll but not employee data
   - Employee can only view their own information

3. Try accessing restricted URLs directly:
   - `/dashboard/security` - Admin only
   - `/dashboard/add_employee` - Admin and HR Manager only
   - `/dashboard/update_payroll/1` - Admin and Payroll Manager only

## API Integration

The dashboard connects to a Python FastAPI backend that implements the same role-based security model. API endpoints authenticate users and filter data based on the user's role.

- Admin → Full access to all API endpoints
- HR Manager → Can manage employee data but not modify payroll
- Payroll Manager → Can manage payroll data but not modify employee data
- Employee → Can only view their own personal information and salary

## Technologies Used

- React 18
- React Router v6
- Bootstrap 5
- Axios for API requests
- Context API for state management

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
