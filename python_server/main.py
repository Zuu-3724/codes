from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
# Comment out dotenv import
# from dotenv import load_dotenv
import os

# Comment out dotenv loading
# load_dotenv()

# Set environment variables directly
# os.environ["FORCE_DEMO_DATA"] = "false"
# os.environ["JWT_SECRET"] = "hrmanagementsystem2023secretkey"
# os.environ["JWT_ALGORITHM"] = "HS256"
# os.environ["JWT_EXPIRATION_MINUTES"] = "60"
# os.environ["MYSQL_HOST"] = "localhost"
# os.environ["MYSQL_USER"] = "root"
# os.environ["MYSQL_PASSWORD"] = "Nhat@2004"
# os.environ["MYSQL_DATABASE"] = "payroll"
# os.environ["SQLSERVER_HOST"] = "localhost"
# os.environ["SQLSERVER_DATABASE"] = "HUMAN"
# os.environ["SQLSERVER_USER"] = "sa"
# os.environ["SQLSERVER_PASSWORD"] = "trunghieu013"

# Import routers
from routes.payroll_route import payroll_router
from routes.employee_route import employee_router
from routes.auth_route import auth_router
from routes.department_route import department_router
from routes.attendance_route import attendance_router
from routes.alerts_route import alerts_router
from routes.reports_route import reports_router
from middleware.auth import verify_token
from middleware.api_auth import protect_employee_endpoint, protect_payroll_endpoint, admin_only

# Create FastAPI app
app = FastAPI(
    title="HR Payroll API",
    description="API for HR and Payroll Management System",
    version="1.0.0"
)

# Configure CORS - Expanded to handle multiple origins and proper credentials
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("CORS_ORIGIN", "http://localhost:5173"),
        "http://localhost:5174",  # Vite might use different ports
        "http://localhost:5175",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Root endpoint


@app.get("/")
async def root():
    return {"message": "HR Payroll API is running"}

# Health check endpoint


@app.get("/health")
async def health_check():
    from utils.db import check_mysql_health, check_sqlserver_health
    import time

    start_time = time.time()
    mysql_health = check_mysql_health()
    sqlserver_health = check_sqlserver_health()
    response_time = time.time() - start_time

    health = {
        "status": "healthy" if mysql_health["status"] == "healthy" and sqlserver_health["status"] == "healthy" else "unhealthy",
        "uptime": time.time(),  # This would be replaced with actual uptime in a real app
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "responseTime": response_time,
        "databases": {
            "mysql": mysql_health,
            "sqlServer": sqlserver_health
        },
        "environment": os.getenv("ENV", "development")
    }

    return health

# Include routers with prefix
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(employee_router, prefix="/employees", tags=["Employees"])
app.include_router(payroll_router, prefix="/payroll", tags=["Payroll"])
app.include_router(department_router, prefix="/departments",
                   tags=["Departments"], dependencies=[Depends(protect_employee_endpoint())])
app.include_router(attendance_router, prefix="/attendance",
                   tags=["Attendance"], dependencies=[Depends(protect_employee_endpoint())])
app.include_router(alerts_router, prefix="/alerts",
                   tags=["Alerts"], dependencies=[Depends(verify_token)])
app.include_router(reports_router, prefix="/reports",
                   tags=["Reports"], dependencies=[Depends(verify_token)])

# Run the app
if __name__ == "__main__":
    port = int(os.getenv("PORT", 9000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
