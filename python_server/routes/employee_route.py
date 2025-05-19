from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, validator, EmailStr
from datetime import date, datetime
import logging
from middleware.auth import verify_token
from middleware.api_auth import protect_employee_endpoint
from utils.db import execute_sqlserver_query, execute_mysql_query

# Logger
logger = logging.getLogger("employee")

# Create router
employee_router = APIRouter()

# Schema for employee validation


class EmployeeCreate(BaseModel):
    EmployeeID: str
    ApplicantID: Optional[str] = None
    DepartmentID: int
    PositionID: int
    FullName: str
    Email: Optional[str] = None
    PhoneNumber: Optional[str] = None
    Gender: Optional[str] = None
    DateOfBirth: Optional[date] = None
    HireDate: date
    Salary: float
    Status: str

    @validator('Status')
    def status_must_be_valid(cls, v):
        if v not in ["Active", "Inactive"]:
            raise ValueError('Status must be either "Active" or "Inactive"')
        return v

    @validator('Salary')
    def salary_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Salary must be positive')
        return v

    @validator('Email')
    def validate_email(cls, v):
        if v is None:
            return v

        # Basic email validation
        if '@' not in v:
            raise ValueError('Invalid email format')
        return v

# Get all employees with department and position info


@employee_router.get("/", dependencies=[Depends(protect_employee_endpoint())])
async def get_employees(request: Request):
    """
    Get all employees with their department and position information
    """
    try:
        logger.info("Getting list of all employees")

        # Check if we should filter to only show the current employee's data
        if hasattr(request.state, 'self_only') and request.state.self_only:
            employee_id = request.state.id
            logger.info(
                f"Filtering employee list to only show employee ID: {employee_id}")

            query = """
                SELECT e.EmployeeID, e.FullName, e.DateOfBirth, e.Gender, 
                       e.PhoneNumber, e.Email, e.HireDate, e.Status, 
                       d.DepartmentName, p.PositionName 
                FROM [HUMAN].[dbo].[Employees] e
                JOIN [HUMAN].[dbo].[Departments] d ON e.DepartmentID = d.DepartmentID
                JOIN [HUMAN].[dbo].[Positions] p ON e.PositionID = p.PositionID
                WHERE e.EmployeeID = @EmployeeID
            """

            results = await execute_sqlserver_query(query, {"EmployeeID": employee_id})
        else:
            # Regular query for admins, HR managers, and payroll managers
            query = """
                SELECT e.EmployeeID, e.FullName, e.DateOfBirth, e.Gender, 
                       e.PhoneNumber, e.Email, e.HireDate, e.Status, 
                       d.DepartmentName, p.PositionName 
                FROM [HUMAN].[dbo].[Employees] e
                JOIN [HUMAN].[dbo].[Departments] d ON e.DepartmentID = d.DepartmentID
                JOIN [HUMAN].[dbo].[Positions] p ON e.PositionID = p.PositionID
            """

            results = await execute_sqlserver_query(query)

        return {"Status": True, "Data": results}

    except Exception as e:
        logger.error(f"Error getting employees: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"Status": False, "Error": str(e)}
        )

# Get all employees from MySQL database


@employee_router.get("/mysql", dependencies=[Depends(protect_employee_endpoint())])
async def get_employees_mysql(request: Request):
    """
    Get all employees with their department and position information from MySQL
    """
    try:
        logger.info("Getting list of all employees from MySQL")

        # Check if we should filter to only show the current employee's data
        if hasattr(request.state, 'self_only') and request.state.self_only:
            employee_id = request.state.id
            logger.info(
                f"Filtering employee list to only show employee ID: {employee_id}")

            query = """
                SELECT 
                    e.EmployeeID,  
                    e.FullName, 
                    e.Gender, 
                    e.DateOfBirth, 
                    e.Email, 
                    e.PhoneNumber, 
                    e.HireDate, 
                    e.Status,
                    e.Salary, 
                    d.DepartmentName, 
                    p.PositionName 
                FROM employee e
                JOIN department d ON e.DepartmentID = d.DepartmentID
                JOIN position p ON e.PositionID = p.PositionID
                WHERE e.EmployeeID = %s
            """

            results = await execute_mysql_query(query, (employee_id,))
        else:
            # Regular query for admins, HR managers, and payroll managers
            query = """
                SELECT 
                    e.EmployeeID, 
                    e.FullName, 
                    e.Gender, 
                    e.DateOfBirth, 
                    e.Email, 
                    e.PhoneNumber, 
                    e.HireDate, 
                    e.Status,
                    e.Salary, 
                    d.DepartmentName, 
                    p.PositionName 
                FROM employee e
                JOIN department d ON e.DepartmentID = d.DepartmentID
                JOIN position p ON e.PositionID = p.PositionID
            """

            results = await execute_mysql_query(query)

        # Format the results to match the frontend expectations
        formatted_results = []
        for employee in results:
            # Convert datetime objects to string format
            if employee.get('DateOfBirth'):
                employee['DateOfBirth'] = employee['DateOfBirth'].strftime(
                    '%Y-%m-%d')
            if employee.get('HireDate'):
                employee['HireDate'] = employee['HireDate'].strftime(
                    '%Y-%m-%d')

            # Format name fields
            employee['FullName'] = f"{employee.get('FirstName', '')} {employee.get('LastName', '')}".strip(
            )

            formatted_results.append(employee)

        return {"Status": True, "Data": formatted_results}

    except Exception as e:
        logger.error(f"Error getting employees from MySQL: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"Status": False, "Error": str(e)}
        )

# Alternative endpoint for employee list with more detailed error handling


@employee_router.get("/list", dependencies=[Depends(protect_employee_endpoint())])
async def get_employee_list(request: Request,
                            department_id: Optional[int] = None,
                            status: Optional[str] = None):
    """
    Get list of employees with optional filtering
    """
    try:
        logger.info("Getting employee list with filters")

        # Build base query with parameters
        query_base = """
            SELECT e.EmployeeID, e.FullName, e.DateOfBirth, e.Gender, 
                   e.PhoneNumber, e.Email, e.HireDate, e.Status, 
                   d.DepartmentName, p.PositionName 
            FROM [HUMAN].[dbo].[Employees] e
            JOIN [HUMAN].[dbo].[Departments] d ON e.DepartmentID = d.DepartmentID
            JOIN [HUMAN].[dbo].[Positions] p ON e.PositionID = p.PositionID
            WHERE 1=1
        """

        params = {}

        # Add filters if provided
        if department_id:
            query_base += " AND e.DepartmentID = @DepartmentID"
            params["DepartmentID"] = department_id

        if status:
            query_base += " AND e.Status = @Status"
            params["Status"] = status

        # Check if we should filter to only show the current employee's data
        if hasattr(request.state, 'self_only') and request.state.self_only:
            employee_id = request.state.id
            logger.info(
                f"Filtering employee list to only show employee ID: {employee_id}")

            query_base += " AND e.EmployeeID = @EmployeeID"
            params["EmployeeID"] = employee_id

        # Execute query
        results = await execute_sqlserver_query(query_base, params)
        return {"Status": True, "Data": results}

    except Exception as e:
        logger.error(f"Error getting employee list: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"Status": False, "Error": str(e)}
        )

# Add a new employee


@employee_router.post("/add", dependencies=[Depends(protect_employee_endpoint())])
async def add_employee(employee: EmployeeCreate,
                       request: Request):
    """
    Add a new employee
    """
    try:
        logger.info(
            f"Adding new employee: {employee.EmployeeID} - {employee.FullName}")

        # Check if employee ID already exists
        check_query = """
            SELECT COUNT(*) AS count 
            FROM [HUMAN].[dbo].[Employees] 
            WHERE EmployeeID = @EmployeeID
        """

        result = await execute_sqlserver_query(
            check_query,
            {"EmployeeID": employee.EmployeeID}
        )

        if result[0]["count"] > 0:
            raise HTTPException(
                status_code=409,
                detail={
                    "Status": False,
                    "Message": f"Employee with ID {employee.EmployeeID} already exists"
                }
            )

        # Insert new employee
        insert_query = """
            INSERT INTO [HUMAN].[dbo].[Employees] 
            (EmployeeID, DepartmentID, PositionID, FullName, Email, 
             PhoneNumber, Gender, DateOfBirth, HireDate, Salary, Status)
            VALUES 
            (@EmployeeID, @DepartmentID, @PositionID, @FullName, @Email,
             @PhoneNumber, @Gender, @DateOfBirth, @HireDate, @Salary, @Status)
        """

        # Convert employee model to dict and prepare parameters
        employee_dict = employee.dict()

        await execute_sqlserver_query(insert_query, employee_dict)

        return {
            "Status": True,
            "Message": "Employee added successfully",
            "EmployeeID": employee.EmployeeID
        }

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Error adding employee: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"Status": False, "Error": str(e)}
        )

# Get employee by ID


@employee_router.get("/{employee_id}", dependencies=[Depends(protect_employee_endpoint("employee_id"))])
async def get_employee(employee_id: str, request: Request):
    """
    Get employee details by ID
    """
    try:
        logger.info(f"Getting employee details for ID: {employee_id}")

        query = """
            SELECT e.EmployeeID, e.ApplicantID, e.FullName, e.DateOfBirth, e.Gender, 
                   e.PhoneNumber, e.Email, e.HireDate, e.Status, e.Salary, 
                   e.DepartmentID, d.DepartmentName, 
                   e.PositionID, p.PositionName 
            FROM [HUMAN].[dbo].[Employees] e
            JOIN [HUMAN].[dbo].[Departments] d ON e.DepartmentID = d.DepartmentID
            JOIN [HUMAN].[dbo].[Positions] p ON e.PositionID = p.PositionID
            WHERE e.EmployeeID = @EmployeeID
        """

        results = await execute_sqlserver_query(
            query,
            {"EmployeeID": employee_id}
        )

        if not results:
            raise HTTPException(
                status_code=404,
                detail={
                    "Status": False,
                    "Message": f"Employee with ID {employee_id} not found"
                }
            )

        return {"Status": True, "Data": results[0]}

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Error getting employee details: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"Status": False, "Error": str(e)}
        )

# Update employee


@employee_router.put("/update/{employee_id}", dependencies=[Depends(protect_employee_endpoint("employee_id"))])
async def update_employee(
    employee_id: str,
    employee_data: Dict[str, Any],
    request: Request
):
    """
    Update employee information
    """
    try:
        logger.info(f"Updating employee with ID: {employee_id}")

        # Check if employee exists
        check_query = """
            SELECT COUNT(*) AS count 
            FROM [HUMAN].[dbo].[Employees] 
            WHERE EmployeeID = @EmployeeID
        """

        result = await execute_sqlserver_query(
            check_query,
            {"EmployeeID": employee_id}
        )

        if result[0]["count"] == 0:
            raise HTTPException(
                status_code=404,
                detail={
                    "Status": False,
                    "Message": f"Employee with ID {employee_id} not found"
                }
            )

        # Build update query based on provided fields
        if not employee_data:
            raise HTTPException(
                status_code=400,
                detail={"Status": False,
                        "Message": "No data provided for update"}
            )

        # Start constructing the query
        update_query = """
            UPDATE [HUMAN].[dbo].[Employees] 
            SET 
        """

        # Add parameters
        update_parts = []
        params = {"EmployeeID": employee_id}

        valid_fields = [
            "DepartmentID", "PositionID", "FullName", "Email",
            "PhoneNumber", "Gender", "DateOfBirth", "Salary", "Status"
        ]

        for field in valid_fields:
            if field in employee_data:
                update_parts.append(f"{field} = @{field}")
                params[field] = employee_data[field]

        if not update_parts:
            raise HTTPException(
                status_code=400,
                detail={"Status": False,
                        "Message": "No valid fields provided for update"}
            )

        # Complete the query
        update_query += ", ".join(update_parts)
        update_query += " WHERE EmployeeID = @EmployeeID"

        # Execute update
        await execute_sqlserver_query(update_query, params)

        return {
            "Status": True,
            "Message": "Employee updated successfully",
            "EmployeeID": employee_id
        }

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Error updating employee: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"Status": False, "Error": str(e)}
        )
