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
