from fastapi import APIRouter, Depends, HTTPException, Request
from typing import Dict, Any, List, Optional
from datetime import datetime, date
import logging
from utils.db import execute_sqlserver_query
from middleware.auth import verify_token
from middleware.api_auth import protect_payroll_endpoint
from sqlalchemy.orm import Session
from sqlalchemy import text
from dependencies import get_db

# Configure logger
logger = logging.getLogger("payroll")

# Create router
payroll_router = APIRouter()

# Simple in-memory cache with TTL
cache = {}
CACHE_TTL = 5 * 60  # 5 minutes in seconds

# Helper function for caching
async def get_cached_data(key: str, fetch_data_func):
    """Get data from cache or fetch it and cache it"""
    current_time = datetime.now().timestamp()
    
    if key in cache:
        data, expiry = cache[key]
        if current_time < expiry:
            return data
    
    # Fetch new data
    data = await fetch_data_func()
    
    # Cache the data
    cache[key] = (data, current_time + CACHE_TTL)
    
    return data

# Get salary information
@payroll_router.get("/salary", dependencies=[Depends(protect_payroll_endpoint())])
async def get_salary(request: Request, month: Optional[str] = None):
    """Get salary information for all employees"""
    try:
        cache_key = f"salary-list-{month}" if month else "salary-list"
        
        async def fetch_data():
            logger.info("Fetching salary data from database")
            
            # Base query
            query_base = """
                SELECT 
                    d.DividendID, 
                    d.EmployeeID, 
                    e.FullName,
                    e.Salary as BaseSalary,
                    ISNULL(d.DividendAmount, 0) as Bonus,
                    ISNULL(
                        (SELECT SUM(Amount) 
                         FROM [HUMAN].[dbo].[Deductions] 
                         WHERE EmployeeID = e.EmployeeID 
                         AND CASE 
                             WHEN @Month IS NOT NULL THEN FORMAT(DeductionDate, 'yyyy-MM') = @Month 
                             ELSE 1=1 
                         END),
                        0
                    ) as Deductions,
                    e.Salary + ISNULL(d.DividendAmount, 0) - 
                    ISNULL(
                        (SELECT SUM(Amount) 
                         FROM [HUMAN].[dbo].[Deductions] 
                         WHERE EmployeeID = e.EmployeeID 
                         AND CASE 
                             WHEN @Month IS NOT NULL THEN FORMAT(DeductionDate, 'yyyy-MM') = @Month 
                             ELSE 1=1 
                         END),
                        0
                    ) as NetSalary,
                    d.DividendDate as PayDate, 
                    dept.DepartmentName, 
                    pos.PositionName
                FROM [HUMAN].[dbo].[Employees] e
                LEFT JOIN [HUMAN].[dbo].[Dividends] d 
                    ON d.EmployeeID = e.EmployeeID
                    AND CASE 
                        WHEN @Month IS NOT NULL THEN FORMAT(d.DividendDate, 'yyyy-MM') = @Month 
                        ELSE 1=1 
                    END
                JOIN [HUMAN].[dbo].[Departments] dept ON e.DepartmentID = dept.DepartmentID
                JOIN [HUMAN].[dbo].[Positions] pos ON e.PositionID = pos.PositionID
            """
            
            # Prepare parameters
            params = {"Month": month} if month else {}
            
            # Filter to only show the current employee's data if needed
            if hasattr(request.state, 'self_only') and request.state.self_only:
                employee_id = request.state.id
                logger.info(f"Filtering salary data to only show employee ID: {employee_id}")
                query_base += " WHERE e.EmployeeID = @EmployeeID"
                params["EmployeeID"] = employee_id
            
            query_base += " ORDER BY e.EmployeeID"
            
            # Execute query
            return await execute_sqlserver_query(query_base, params)
        
        data = await get_cached_data(cache_key, fetch_data)
        
        return {"Status": True, "Data": data}
    except Exception as e:
        logger.error(f"Error getting salary information: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail={"Status": False, "Error": str(e), "Message": "Failed to retrieve salary information"}
        )

# Get salary history for an employee
@payroll_router.get("/salary-history/{employee_id}", dependencies=[Depends(protect_payroll_endpoint("employee_id"))])
async def get_salary_history(employee_id: str, request: Request):
    """Get salary history for a specific employee"""
    try:
        cache_key = f"salary-history-{employee_id}"
        
        async def fetch_data():
            logger.info(f"Fetching salary history for employee: {employee_id}")
            query = """
                SELECT 
                    d.DividendID, 
                    d.EmployeeID, 
                    d.DividendAmount as Salary, 
                    d.DividendDate as PayDate,
                    e.FullName, 
                    dept.DepartmentName
                FROM [HUMAN].[dbo].[Dividends] d 
                JOIN [HUMAN].[dbo].[Employees] e ON d.EmployeeID = e.EmployeeID
                JOIN [HUMAN].[dbo].[Departments] dept ON e.DepartmentID = dept.DepartmentID
                WHERE d.EmployeeID = @EmployeeID 
                ORDER BY d.DividendDate DESC
            """
            return await execute_sqlserver_query(query, {"EmployeeID": employee_id})
        
        data = await get_cached_data(cache_key, fetch_data)
        
        return {"Status": True, "Data": data}
    except Exception as e:
        logger.error(f"Error getting salary history for employee {employee_id}: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail={"Status": False, "Error": str(e), "Message": "Failed to retrieve salary history"}
        )

# Get attendance data
@payroll_router.get("/attendance", dependencies=[Depends(protect_payroll_endpoint())])
async def get_attendance(request: Request):
    """Get attendance data"""
    try:
        logger.info("Fetching attendance data from database")
        
        # Base query
        query_base = """
            SELECT 
                a.AttendanceID,
                a.EmployeeID,
                e.FullName,
                d.DepartmentName,
                a.WorkDays,
                a.AbsentDays,
                a.LeaveDays,
                a.AttendanceMonth
            FROM [HUMAN].[dbo].[Attendance] a
            JOIN [HUMAN].[dbo].[Employees] e ON a.EmployeeID = e.EmployeeID
            JOIN [HUMAN].[dbo].[Departments] d ON e.DepartmentID = d.DepartmentID
        """
        
        params = {}
        
        # Filter to only show the current employee's data if needed
        if hasattr(request.state, 'self_only') and request.state.self_only:
            employee_id = request.state.id
            logger.info(f"Filtering attendance data to only show employee ID: {employee_id}")
            query_base += " WHERE a.EmployeeID = @EmployeeID"
            params["EmployeeID"] = employee_id
        
        query_base += " ORDER BY a.AttendanceMonth DESC"
        
        # Execute query
        data = await execute_sqlserver_query(query_base, params)
        return {"Status": True, "Data": data}
        
    except Exception as e:
        logger.error(f"Error getting attendance data: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail={"Status": False, "Error": str(e), "Message": "Failed to retrieve attendance data"}
        )

# Update salary information
@payroll_router.put("/update-salary/{employee_id}", dependencies=[Depends(protect_payroll_endpoint("employee_id"))])
async def update_salary(employee_id: str, data: Dict[str, Any], request: Request):
    """Update salary information for an employee"""
    try:
        salary = data.get("Salary")
        effective_date = data.get("EffectiveDate", datetime.now().isoformat())
        reason = data.get("Reason", "Salary Update")
        
        if not salary or not isinstance(salary, (int, float)) or salary <= 0:
            raise HTTPException(
                status_code=400,
                detail={"Status": False, "Message": "Invalid salary value"}
            )
        
        logger.info(f"Updating salary for employee {employee_id} to {salary}")
        
        # Update employee salary
        update_query = """
            UPDATE [HUMAN].[dbo].[Employees] 
            SET Salary = @Salary 
            WHERE EmployeeID = @EmployeeID
        """
        await execute_sqlserver_query(update_query, {
            "EmployeeID": employee_id,
            "Salary": salary
        })
        
        # Add salary update record
        insert_query = """
            INSERT INTO [HUMAN].[dbo].[Dividends] 
            (EmployeeID, DividendAmount, DividendDate, Reason) 
            VALUES (@EmployeeID, @Salary, @EffectiveDate, @Reason)
        """
        await execute_sqlserver_query(insert_query, {
            "EmployeeID": employee_id,
            "Salary": salary,
            "EffectiveDate": effective_date,
            "Reason": reason
        })
        
        # Clear cache
        if f"salary-history-{employee_id}" in cache:
            del cache[f"salary-history-{employee_id}"]
        
        return {"Status": True, "Message": "Salary updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating salary for employee {employee_id}: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail={"Status": False, "Error": str(e), "Message": "Failed to update salary"}
        )

# Get leave statistics
@payroll_router.get("/leave-statistics/{employee_id}")
async def get_leave_statistics(employee_id: str):
    """Get leave statistics for an employee (currently returns sample data)"""
    try:
        # Sample data for leave statistics
        sample_data = {
            "SickLeaves": 2,
            "AnnualLeaves": 5,
            "UnpaidLeaves": 0,
        }
        
        return {
            "Status": True,
            "Data": sample_data,
            "Source": "Sample data (No Attendance table in SQL Server yet)",
        }
    except Exception as e:
        logger.error(f"Error getting leave statistics for employee {employee_id}: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail={"Status": False, "Error": str(e), "Message": "Failed to retrieve leave statistics"}
        )

@payroll_router.get("/monthly/{year}/{month}")
async def get_monthly_payroll(year: int, month: int):
    """Get monthly payroll information"""
    try:
        logger.info(f"Fetching payroll data for {year}-{month}")
        
        query = """
            SELECT 
                e.EmployeeID,
                e.FullName,
                d.DepartmentName,
                e.Salary as BaseSalary,
                COALESCE(b.BonusAmount, 0) as Bonus,
                COALESCE(dd.DeductionAmount, 0) as Deductions,
                e.Salary + COALESCE(b.BonusAmount, 0) - COALESCE(dd.DeductionAmount, 0) as NetSalary
            FROM [HUMAN].[dbo].[Employees] e
            JOIN [HUMAN].[dbo].[Departments] d ON e.DepartmentID = d.DepartmentID
            LEFT JOIN (
                SELECT EmployeeID, SUM(BonusAmount) as BonusAmount
                FROM [HUMAN].[dbo].[Bonuses]
                WHERE YEAR(BonusDate) = @Year AND MONTH(BonusDate) = @Month
                GROUP BY EmployeeID
            ) b ON e.EmployeeID = b.EmployeeID
            LEFT JOIN (
                SELECT EmployeeID, SUM(DeductionAmount) as DeductionAmount
                FROM [HUMAN].[dbo].[Deductions]
                WHERE YEAR(DeductionDate) = @Year AND MONTH(DeductionDate) = @Month
                GROUP BY EmployeeID
            ) dd ON e.EmployeeID = dd.EmployeeID
            ORDER BY d.DepartmentName, e.FullName
        """
        
        data = await execute_sqlserver_query(query, {
            "Year": year,
            "Month": month
        })
        
        return {"Status": True, "Data": data}
    except Exception as e:
        logger.error(f"Error getting monthly payroll: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"Status": False, "Error": str(e)}
        )

@payroll_router.post("/add-allowance", dependencies=[Depends(protect_payroll_endpoint())])
async def add_allowance(
    employee_id: str,
    amount: float,
    date: date,
    description: str
):
    """Add an allowance for an employee"""
    try:
        logger.info(f"Adding allowance for employee {employee_id}")
        
        query = """
            INSERT INTO [HUMAN].[dbo].[Allowances] 
            (EmployeeID, Amount, AllowanceDate, Description)
            VALUES (@EmployeeID, @Amount, @Date, @Description)
        """
        
        await execute_sqlserver_query(query, {
            "EmployeeID": employee_id,
            "Amount": amount,
            "Date": date,
            "Description": description
        })
        
        return {"Status": True, "Message": "Allowance added successfully"}
        
    except Exception as e:
        logger.error(f"Error adding allowance: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"Status": False, "Error": str(e)}
        )

@payroll_router.post("/add-deduction", dependencies=[Depends(protect_payroll_endpoint())])
async def add_deduction(
    employee_id: str,
    amount: float,
    date: date,
    description: str
):
    """Add a deduction for an employee"""
    try:
        logger.info(f"Adding deduction for employee {employee_id}")
        
        query = """
            INSERT INTO [HUMAN].[dbo].[Deductions] 
            (EmployeeID, Amount, DeductionDate, Description)
            VALUES (@EmployeeID, @Amount, @Date, @Description)
        """
        
        await execute_sqlserver_query(query, {
            "EmployeeID": employee_id,
            "Amount": amount,
            "Date": date,
            "Description": description
        })
        
        return {"Status": True, "Message": "Deduction added successfully"}
        
    except Exception as e:
        logger.error(f"Error adding deduction: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"Status": False, "Error": str(e)}
        )

@payroll_router.get("/employee-allowances/{employee_id}")
async def get_employee_allowances(
    employee_id: str,
    start_date: date = None,
    end_date: date = None
):
    """Get allowances for a specific employee"""
    try:
        logger.info(f"Getting allowances for employee {employee_id}")
        
        query = """
            SELECT 
                AllowanceID,
                EmployeeID,
                Amount,
                AllowanceDate,
                Description
            FROM [HUMAN].[dbo].[Allowances]
            WHERE EmployeeID = @EmployeeID
        """
        
        params = {"EmployeeID": employee_id}
        
        if start_date:
            query += " AND AllowanceDate >= @StartDate"
            params["StartDate"] = start_date
            
        if end_date:
            query += " AND AllowanceDate <= @EndDate"
            params["EndDate"] = end_date
            
        query += " ORDER BY AllowanceDate DESC"
        
        results = await execute_sqlserver_query(query, params)
        return {"Status": True, "Data": results}
        
    except Exception as e:
        logger.error(f"Error getting allowances: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"Status": False, "Error": str(e)}
        )

@payroll_router.get("/employee-deductions/{employee_id}")
async def get_employee_deductions(
    employee_id: str,
    start_date: date = None,
    end_date: date = None
):
    """Get deductions for a specific employee"""
    try:
        logger.info(f"Getting deductions for employee {employee_id}")
        
        query = """
            SELECT 
                DeductionID,
                EmployeeID,
                Amount,
                DeductionDate,
                Description
            FROM [HUMAN].[dbo].[Deductions]
            WHERE EmployeeID = @EmployeeID
        """
        
        params = {"EmployeeID": employee_id}
        
        if start_date:
            query += " AND DeductionDate >= @StartDate"
            params["StartDate"] = start_date
            
        if end_date:
            query += " AND DeductionDate <= @EndDate"
            params["EndDate"] = end_date
            
        query += " ORDER BY DeductionDate DESC"
        
        results = await execute_sqlserver_query(query, params)
        return {"Status": True, "Data": results}
        
    except Exception as e:
        logger.error(f"Error getting deductions: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"Status": False, "Error": str(e)}
        )

@payroll_router.delete("/delete-allowance/{allowance_id}", dependencies=[Depends(protect_payroll_endpoint())])
async def delete_allowance(allowance_id: int):
    """Delete an allowance"""
    try:
        logger.info(f"Deleting allowance {allowance_id}")
        
        query = """
            DELETE FROM [HUMAN].[dbo].[Allowances]
            WHERE AllowanceID = @AllowanceID
        """
        
        await execute_sqlserver_query(query, {"AllowanceID": allowance_id})
        
        return {"Status": True, "Message": "Allowance deleted successfully"}
        
    except Exception as e:
        logger.error(f"Error deleting allowance: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"Status": False, "Error": str(e)}
        )

@payroll_router.delete("/delete-deduction/{deduction_id}", dependencies=[Depends(protect_payroll_endpoint())])
async def delete_deduction(deduction_id: int):
    """Delete a deduction"""
    try:
        logger.info(f"Deleting deduction {deduction_id}")
        
        query = """
            DELETE FROM [HUMAN].[dbo].[Deductions]
            WHERE DeductionID = @DeductionID
        """
        
        await execute_sqlserver_query(query, {"DeductionID": deduction_id})
        
        return {"Status": True, "Message": "Deduction deleted successfully"}
        
    except Exception as e:
        logger.error(f"Error deleting deduction: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"Status": False, "Error": str(e)}
        )

# Add a simple test endpoint
@payroll_router.get("/test")
async def test_payroll_connection():
    """Simple test endpoint for checking Payroll API connection"""
    try:
        # Return dummy data without database access
        return {
            "Status": True,
            "Message": "Payroll API test successful",
            "Data": [
                {
                    "EmployeeID": 1,
                    "FullName": "Test User",
                    "BaseSalary": 10000,
                    "Bonus": 1000,
                    "Deductions": 500,
                    "NetSalary": 10500,
                    "Department": "IT",
                    "Position": "Developer"
                }
            ]
        }
    except Exception as e:
        logger.error(f"Error in test_payroll_connection: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"Status": False, "Error": str(e), "Message": "Test connection failed"}
        ) 