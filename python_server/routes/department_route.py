from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import logging
from middleware.auth import check_role, verify_token
from utils.db import execute_sqlserver_query

# Logger
logger = logging.getLogger("department")

# Create router
department_router = APIRouter()

# Department schema


class DepartmentBase(BaseModel):
    DepartmentName: str
    Description: Optional[str] = None
    ManagerID: Optional[str] = None


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(DepartmentBase):
    DepartmentName: Optional[str] = None

# Get all departments


@department_router.get("/")
async def get_departments(request: Request):
    """
    Get all departments
    """
    try:
        logger.info("Getting list of all departments")

        query = """
            SELECT 
                d.DepartmentID,
                d.DepartmentName,
                d.Description,
                CAST(d.ManagerID AS NVARCHAR(10)) as ManagerID,
                e.FullName as ManagerName,
                COUNT(emp.EmployeeID) as TotalEmployees
            FROM [HUMAN].[dbo].[Departments] d
            LEFT JOIN [HUMAN].[dbo].[Employees] e ON d.ManagerID = e.EmployeeID
            LEFT JOIN [HUMAN].[dbo].[Employees] emp ON emp.DepartmentID = d.DepartmentID
            GROUP BY d.DepartmentID, d.DepartmentName, d.Description, d.ManagerID, e.FullName
            ORDER BY d.DepartmentName
        """

        results = await execute_sqlserver_query(query)
        return {"Status": True, "Data": results}

    except Exception as e:
        logger.error(f"Error getting departments: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"Status": False, "Error": str(
                e), "Message": "Failed to load departments. Please try again later."}
        )

# Alternative endpoint for department list (to match existing code)


@department_router.get("/list")
async def get_department_list(request: Request):
    """
    Get list of departments (alternative endpoint)
    """
    try:
        return await get_departments(request)
    except Exception as e:
        logger.error(f"Error getting department list: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"Status": False, "Error": str(e)}
        )

# Get department by ID


@department_router.get("/{department_id}")
async def get_department(department_id: int, request: Request):
    """
    Get department details by ID
    """
    try:
        logger.info(f"Getting department details for ID: {department_id}")

        query = """
            SELECT d.DepartmentID, d.DepartmentName, d.Description,
                   e.EmployeeID as ManagerID, e.FullName as ManagerName,
                   COUNT(emp.EmployeeID) as TotalEmployees
            FROM [HUMAN].[dbo].[Departments] d
            LEFT JOIN [HUMAN].[dbo].[Employees] e ON d.ManagerID = e.EmployeeID
            LEFT JOIN [HUMAN].[dbo].[Employees] emp ON emp.DepartmentID = d.DepartmentID
            WHERE d.DepartmentID = @DepartmentID
            GROUP BY d.DepartmentID, d.DepartmentName, d.Description, e.EmployeeID, e.FullName
        """

        results = await execute_sqlserver_query(
            query,
            {"DepartmentID": department_id}
        )

        if not results:
            raise HTTPException(
                status_code=404,
                detail={
                    "Status": False,
                    "Message": f"Department with ID {department_id} not found"
                }
            )

        return {"Status": True, "Data": results[0]}

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Error getting department details: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"Status": False, "Error": str(e)}
        )

# Add a new department


@department_router.post("/add")
async def add_department(
    department: DepartmentCreate,
    request: Request
):
    """
    Add a new department
    """
    try:
        logger.info(f"Adding new department: {department.DepartmentName}")

        # Insert new department
        insert_query = """
            INSERT INTO [HUMAN].[dbo].[Departments] 
            (DepartmentName, Description, ManagerID)
            VALUES 
            (@DepartmentName, @Description, @ManagerID);
            
            SELECT SCOPE_IDENTITY() as DepartmentID;
        """

        # Convert department model to dict
        department_dict = department.dict()

        results = await execute_sqlserver_query(insert_query, department_dict)

        # Get inserted department ID
        department_id = results[0]["DepartmentID"] if results else None

        return {
            "Status": True,
            "Message": "Department added successfully",
            "DepartmentID": department_id
        }

    except Exception as e:
        logger.error(f"Error adding department: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"Status": False, "Error": str(e)}
        )

# Update department


@department_router.put("/update/{department_id}")
async def update_department(
    department_id: int,
    department: DepartmentUpdate,
    request: Request
):
    """
    Update department information
    """
    try:
        logger.info(f"Updating department with ID: {department_id}")

        # Check if department exists
        check_query = """
            SELECT COUNT(*) AS count 
            FROM [HUMAN].[dbo].[Departments] 
            WHERE DepartmentID = @DepartmentID
        """

        result = await execute_sqlserver_query(
            check_query,
            {"DepartmentID": department_id}
        )

        if result[0]["count"] == 0:
            raise HTTPException(
                status_code=404,
                detail={
                    "Status": False,
                    "Message": f"Department with ID {department_id} not found"
                }
            )

        # Build update query based on provided fields
        department_dict = department.dict(exclude_unset=True)

        if not department_dict:
            raise HTTPException(
                status_code=400,
                detail={"Status": False,
                        "Message": "No data provided for update"}
            )

        # Start constructing the query
        update_query = """
            UPDATE [HUMAN].[dbo].[Departments] 
            SET 
        """

        # Add parameters
        update_parts = []
        params = {"DepartmentID": department_id}

        for field, value in department_dict.items():
            if value is not None:  # Skip None values
                update_parts.append(f"{field} = @{field}")
                params[field] = value

        if not update_parts:
            raise HTTPException(
                status_code=400,
                detail={"Status": False,
                        "Message": "No valid fields provided for update"}
            )

        # Complete the query
        update_query += ", ".join(update_parts)
        update_query += " WHERE DepartmentID = @DepartmentID"

        # Execute update
        await execute_sqlserver_query(update_query, params)

        return {
            "Status": True,
            "Message": "Department updated successfully",
            "DepartmentID": department_id
        }

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Error updating department: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"Status": False, "Error": str(e)}
        )

# Delete department


@department_router.delete("/delete/{department_id}")
async def delete_department(department_id: int, request: Request):
    """
    Delete a department
    """
    try:
        logger.info(f"Deleting department with ID: {department_id}")

        # Check if department exists
        check_query = """
            SELECT COUNT(*) AS count 
            FROM [HUMAN].[dbo].[Departments] 
            WHERE DepartmentID = @DepartmentID
        """

        result = await execute_sqlserver_query(
            check_query,
            {"DepartmentID": department_id}
        )

        if result[0]["count"] == 0:
            raise HTTPException(
                status_code=404,
                detail={
                    "Status": False,
                    "Message": f"Department with ID {department_id} not found"
                }
            )

        # Check if department has employees
        check_employees_query = """
            SELECT COUNT(*) AS count 
            FROM [HUMAN].[dbo].[Employees] 
            WHERE DepartmentID = @DepartmentID
        """

        result = await execute_sqlserver_query(
            check_employees_query,
            {"DepartmentID": department_id}
        )

        if result[0]["count"] > 0:
            raise HTTPException(
                status_code=400,
                detail={
                    "Status": False,
                    "Message": f"Cannot delete department with ID {department_id} because it has employees"
                }
            )

        # Delete department
        delete_query = """
            DELETE FROM [HUMAN].[dbo].[Departments] 
            WHERE DepartmentID = @DepartmentID
        """

        await execute_sqlserver_query(
            delete_query,
            {"DepartmentID": department_id}
        )

        return {
            "Status": True,
            "Message": "Department deleted successfully"
        }

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Error deleting department: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"Status": False, "Error": str(e)}
        )


@department_router.get("/all")
async def get_all_departments(request: Request):
    """
    Get all departments with their managers and employee count
    """
    try:
        logger.info("Getting all departments")
        query = """
            SELECT 
                d.DepartmentID,
                d.DepartmentName,
                d.ManagerID,
                e.FirstName + ' ' + e.LastName as ManagerName,
                COUNT(emp.EmployeeID) as EmployeeCount
            FROM [HUMAN].[dbo].[Departments] d
            LEFT JOIN [HUMAN].[dbo].[Employees] e ON d.ManagerID = e.EmployeeID
            LEFT JOIN [HUMAN].[dbo].[Employees] emp ON d.DepartmentID = emp.DepartmentID
            GROUP BY d.DepartmentID, d.DepartmentName, d.ManagerID, e.FirstName, e.LastName
            ORDER BY d.DepartmentName
        """

        results = await execute_sqlserver_query(query)
        return {"Status": True, "Data": results}

    except Exception as e:
        logger.error(f"Error getting departments: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"Status": False, "Error": str(e)}
        )

# Add a simple test endpoint for departments


@department_router.get("/test")
async def test_department_connection():
    """Simple test endpoint for checking Department API connection"""
    try:
        # Return dummy data without database access
        return {
            "Status": True,
            "Message": "Department API test successful",
            "Data": [
                {
                    "id": 1,
                    "name": "IT",
                    "description": "Information Technology Department",
                    "employeeCount": 25
                },
                {
                    "id": 2,
                    "name": "HR",
                    "description": "Human Resources Department",
                    "employeeCount": 10
                },
                {
                    "id": 3,
                    "name": "Finance",
                    "description": "Finance and Accounting Department",
                    "employeeCount": 15
                },
                {
                    "id": 4,
                    "name": "Marketing",
                    "description": "Marketing and Sales Department",
                    "employeeCount": 20
                },
                {
                    "id": 5,
                    "name": "Operations",
                    "description": "Operations and Logistics Department",
                    "employeeCount": 30
                }
            ]
        }
    except Exception as e:
        logger.error(f"Error in test_department_connection: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"Status": False, "Error": str(
                e), "Message": "Test connection failed"}
        )
