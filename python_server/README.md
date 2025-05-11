# HR Payroll API

This is a Python implementation of the HR Payroll system API using FastAPI.

## Prerequisites

- Python 3.9+
- SQL Server with ODBC driver
- MySQL Server

## Installation

1. Clone the repository:

```
git clone <repository_url>
cd python_server
```

2. Create a virtual environment and activate it:

```
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/macOS
python -m venv venv
source venv/bin/activate
```

3. Install dependencies:

```
pip install -r requirements.txt
```

4. Configure the environment variables by creating a `.env` file:

```
# Server configuration
PORT=9000
ENV=development

# JWT configuration
JWT_SECRET=your-secret-key

# MySQL configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your-password
DB_NAME=hrms
DB_PORT=3306

# SQL Server configuration
SQLSERVER_HOST=localhost\SQLEXPRESS
SQLSERVER_DATABASE=HUMAN
SQLSERVER_USER=sa
SQLSERVER_PASSWORD=your-password
SQLSERVER_PORT=1433

# CORS configuration
CORS_ORIGIN=http://localhost:5173
```

## Running the Application

1. Start the application:

```
# Development mode with auto-reload
uvicorn main:app --reload --port 9000

# Or directly with Python
python main.py
```

2. Access the API documentation:

- Swagger UI: `http://localhost:9000/docs`
- ReDoc: `http://localhost:9000/redoc`

## API Endpoints

- **Authentication**:

  - `POST /auth/login`: Log in
  - `POST /auth/register`: Register a new user
  - `GET /auth/check-auth`: Check login status
  - `POST /auth/logout`: Log out

- **Employees**:

  - `GET /employees`: Get all employees
  - `GET /employees/list`: Alternative endpoint to get employees
  - `POST /employees/add`: Add a new employee
  - `PUT /employees/update/{id}`: Update an employee

- **Payroll**:
  - `GET /payroll/salary`: Get all salary information
  - `GET /payroll/salary-history/{employee_id}`: Get salary history for an employee
  - `PUT /payroll/update-salary/{employee_id}`: Update salary information
  - `GET /payroll/attendance`: Get attendance data
  - `GET /payroll/leave-statistics/{employee_id}`: Get leave statistics

## Development

### Project Structure

```
python_server/
├── main.py                  # Main application entry point
├── middleware/
│   └── auth.py              # Authentication middleware
├── routes/
│   ├── auth_route.py        # Authentication routes
│   ├── employee_route.py    # Employee management routes
│   └── payroll_route.py     # Payroll management routes
├── utils/
│   ├── db.py                # Database utilities
│   └── logger.py            # Logging configuration
├── .env                     # Environment variables (not in git)
└── requirements.txt         # Python dependencies
```

### Adding New Routes

1. Create a new file in the `routes` directory
2. Define a router using `APIRouter()`
3. Add your route handlers
4. Import and include your router in `main.py`

## Testing

Run tests using pytest:

```
pytest
```

## Deployment

For production deployment:

1. Set environment variables appropriately
2. Use a production ASGI server like Uvicorn or Hypercorn behind Nginx
3. Set up proper database connection pooling
4. Enable HTTPS/TLS

Example production command:

```
uvicorn main:app --host 0.0.0.0 --port 9000 --workers 4
```

## Differences from Node.js Version

The Python FastAPI implementation offers several advantages:

1. **Automatic API documentation**: FastAPI generates OpenAPI documentation automatically
2. **Type validation**: Pydantic models provide built-in validation
3. **Async support**: Native async/await support for database operations
4. **Performance**: FastAPI is one of the fastest Python frameworks

## License

[MIT License](LICENSE)

## Role-Based Authorization System

The system implements role-based access control (RBAC) with the following roles and permissions:

### Roles and Permissions

1. **Admin**

   - Has full access to all system features and APIs
   - Can manage all users, roles, and permissions
   - Can view and modify all HR and payroll data

2. **HR Manager**

   - Can manage employee data from HUMAN_2025 database
   - Can add, update, and view employee information
   - Can manage departments and positions
   - Cannot modify payroll data (view-only access)

3. **Payroll Manager**

   - Can manage payroll data from PAYROLL database
   - Can update salaries, add allowances and deductions
   - Can view employee information (read-only)
   - Cannot modify employee data

4. **Employee**
   - Can only view their own personal information
   - Can view their own salary and payment history
   - Cannot access data of other employees

### API Access Protection

The API endpoints are protected by middleware that enforces the following rules:

1. **Employee Data Access**

   - Admin & HR Manager: Full access
   - Payroll Manager: View-only access
   - Employee: Access only to their own data

2. **Payroll Data Access**
   - Admin & Payroll Manager: Full access
   - HR Manager: View-only access
   - Employee: Access only to their own salary data

### Implementation

The authorization system is implemented through custom middleware:

- `middleware/auth.py`: Core authentication middleware
- `middleware/api_auth.py`: Role-based API access control

Each API endpoint is protected using dependency injection with the appropriate middleware function:

```python
# For employee data endpoints
@router.get("/example", dependencies=[Depends(protect_employee_endpoint())])

# For payroll data endpoints
@router.get("/example", dependencies=[Depends(protect_payroll_endpoint())])

# For admin-only endpoints
@router.get("/example", dependencies=[Depends(admin_only())])
```

### Testing the Authorization

You can test the authorization system using the following endpoints:

- `/auth/test-auth`: Tests basic authentication
- `/auth/test-admin`: Tests Admin-only access
- `/auth/test-employee`: Tests employee data access
- `/auth/test-payroll`: Tests payroll data access

## Authentication

The system uses JWT (JSON Web Tokens) for authentication. To access protected endpoints:

1. Login via `/auth/login` to get a JWT token
2. Include the token in the Authorization header for subsequent requests:
   - `Authorization: Bearer your_token_here`

## Development

### Prerequisites

- Python 3.8+
- MySQL Server
- SQL Server
- Virtual environment

### Setup

1. Clone the repository
2. Create a virtual environment: `python -m venv venv`
3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Unix/MacOS: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Create `.env` file with required environment variables
6. Run the server: `python main.py`

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Server settings
PORT=9000
CORS_ORIGIN=http://localhost:5173

# JWT settings
JWT_SECRET=your-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# MySQL Database
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your-password
MYSQL_DATABASE=hr_payroll

# SQL Server Database
SQLSERVER_HOST=localhost
SQLSERVER_PORT=1433
SQLSERVER_USER=sa
SQLSERVER_PASSWORD=your-password
SQLSERVER_DATABASE=HUMAN
```
