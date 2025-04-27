from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List, Dict, Any, Optional
import logging
from middleware.auth import verify_token
from utils.db import execute_sqlserver_query, check_sqlserver_health, execute_mysql_query

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("reports")

# Create router
reports_router = APIRouter()

async def check_db_connection():
    """Check database connection before executing queries"""
    health = await check_sqlserver_health()
    if health["status"] != "healthy":
        logger.error(f"Database connection error: {health}")
        raise HTTPException(
            status_code=503,
            detail={"Status": False, "Message": "Database connection error. Please try again later."}
        )

@reports_router.get("/employee-stats")
async def get_employee_stats(year: int, request: Request):
    """
    Get employee statistics grouped by department for a specific year
    """
    try:
        await check_db_connection()
        logger.info(f"Getting employee statistics for year {year}")
        
        # Get overall employee stats
        stats_query = """
            SELECT COUNT(*) as TotalEmployees,
            SUM(CASE WHEN YEAR(HireDate) = @Year THEN 1 ELSE 0 END) as NewHires,
            CAST(SUM(CASE WHEN Status = 'Inactive' AND YEAR(EndDate) = @Year THEN 1 ELSE 0 END) AS FLOAT) / 
            NULLIF(COUNT(*), 0) * 100 as TurnoverRate,
            AVG(Salary) as AvgSalary
            FROM [HUMAN].[dbo].[Employees]
        """
        
        stats_results = await execute_sqlserver_query(stats_query, {"Year": year})
        
        # Get department counts
        dept_query = """
            SELECT d.DepartmentName as name, COUNT(e.EmployeeID) as count
            FROM [HUMAN].[dbo].[Departments] d
            LEFT JOIN [HUMAN].[dbo].[Employees] e ON d.DepartmentID = e.DepartmentID
            GROUP BY d.DepartmentName
            ORDER BY count DESC
        """
        
        dept_results = await execute_sqlserver_query(dept_query)
        
        # Format results
        total_employees = stats_results[0]["TotalEmployees"] if stats_results else 0
        total_new_hires = stats_results[0]["NewHires"] if stats_results else 0
        turnover_rate = round(stats_results[0]["TurnoverRate"] or 0, 1) if stats_results else 0
        avg_salary = stats_results[0]["AvgSalary"] if stats_results else 0
        
        return {
            "Status": True,
            "Data": {
                "byDepartment": dept_results or [],
                "overall": {
                    "totalEmployees": total_employees,
                    "totalNewHires": total_new_hires,
                    "turnoverRate": turnover_rate,
                    "averageSalary": avg_salary
                }
            }
        }
    
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error getting employee statistics: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"Status": False, "Error": str(e), "Message": "Failed to load employee statistics. Please try again later."}
        )

@reports_router.get("/mysql/employee-stats")
async def get_employee_stats_mysql(year: int, request: Request):
    """
    Get employee statistics from MySQL database grouped by department for a specific year
    """
    try:
        logger.info(f"Getting employee statistics from MySQL for year {year}")
        
        # Get overall employee stats from MySQL
        stats_query = """
            SELECT 
                COUNT(*) as TotalEmployees,
                SUM(CASE WHEN YEAR(JoinDate) = %s THEN 1 ELSE 0 END) as NewHires,
                CAST(SUM(CASE WHEN Status = 'Inactive' AND YEAR(EndDate) = %s THEN 1 ELSE 0 END) AS FLOAT) / 
                NULLIF(COUNT(*), 0) * 100 as TurnoverRate,
                AVG(Salary) as AvgSalary
            FROM employee
        """
        
        stats_results = await execute_mysql_query(stats_query, (year, year))
        
        # Get department counts from MySQL
        dept_query = """
            SELECT d.DepartmentName as name, COUNT(e.EmployeeID) as count
            FROM department d
            LEFT JOIN employee e ON d.DepartmentID = e.DepartmentID
            GROUP BY d.DepartmentName
            ORDER BY count DESC
        """
        
        dept_results = await execute_mysql_query(dept_query)
        
        # Format results
        total_employees = stats_results[0]["TotalEmployees"] if stats_results else 0
        total_new_hires = stats_results[0]["NewHires"] if stats_results else 0
        turnover_rate = round(stats_results[0]["TurnoverRate"] or 0, 1) if stats_results else 0
        avg_salary = stats_results[0]["AvgSalary"] if stats_results else 0
        
        return {
            "Status": True,
            "Data": {
                "byDepartment": dept_results or [],
                "overall": {
                    "totalEmployees": total_employees,
                    "totalNewHires": total_new_hires,
                    "turnoverRate": turnover_rate,
                    "averageSalary": avg_salary
                }
            }
        }
    
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error getting MySQL employee statistics: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"Status": False, "Error": str(e), "Message": "Failed to load MySQL employee statistics. Please try again later."}
        )

@reports_router.get("/salary-stats")
async def get_salary_stats(year: int, request: Request):
    """
    Get salary statistics for a specific year
    """
    try:
        await check_db_connection()
        logger.info(f"Getting salary statistics for year {year}")
        
        # Sample SQL Server query for salary stats
        query = """
            SELECT 
                SUM(Salary) as TotalPayroll,
                AVG(Salary) as AverageSalary,
                MAX(Salary) as HighestSalary,
                SUM(Salary) * 0.1 as TotalBonuses  -- Just a placeholder calculation
            FROM [HUMAN].[dbo].[Employees]
            WHERE Status = 'Active'
        """
        
        results = await execute_sqlserver_query(query)
        
        if not results:
            return {
                "Status": True,
                "Data": {
                    "totalPayroll": 0,
                    "averageSalary": 0,
                    "highestSalary": 0,
                    "totalBonuses": 0
                }
            }
        
        return {
            "Status": True,
            "Data": {
                "totalPayroll": results[0]["TotalPayroll"] or 0,
                "averageSalary": results[0]["AverageSalary"] or 0,
                "highestSalary": results[0]["HighestSalary"] or 0,
                "totalBonuses": results[0]["TotalBonuses"] or 0
            }
        }
    
    except Exception as e:
        logger.error(f"Error getting salary statistics: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"Status": False, "Error": str(e), "Message": "Failed to load salary statistics. Please try again later."}
        )

@reports_router.get("/mysql/salary-stats")
async def get_salary_stats_mysql(year: int, request: Request):
    """
    Get salary statistics from MySQL for a specific year
    """
    try:
        logger.info(f"Getting salary statistics from MySQL for year {year}")
        
        # MySQL query for salary stats
        query = """
            SELECT 
                SUM(Salary) as TotalPayroll,
                AVG(Salary) as AverageSalary,
                MAX(Salary) as HighestSalary,
                SUM(Salary) * 0.1 as TotalBonuses  -- Just a placeholder calculation
            FROM employee
            WHERE Status = 'Active'
        """
        
        results = await execute_mysql_query(query)
        
        if not results:
            return {
                "Status": True,
                "Data": {
                    "totalPayroll": 0,
                    "averageSalary": 0,
                    "highestSalary": 0,
                    "totalBonuses": 0
                }
            }
        
        return {
            "Status": True,
            "Data": {
                "totalPayroll": float(results[0]["TotalPayroll"] or 0),
                "averageSalary": float(results[0]["AverageSalary"] or 0),
                "highestSalary": float(results[0]["HighestSalary"] or 0),
                "totalBonuses": float(results[0]["TotalBonuses"] or 0)
            }
        }
    
    except Exception as e:
        logger.error(f"Error getting MySQL salary statistics: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"Status": False, "Error": str(e), "Message": "Failed to load MySQL salary statistics. Please try again later."}
        )

@reports_router.get("/organization-stats")
async def get_organization_stats(request: Request):
    """
    Get organization structure statistics
    """
    try:
        await check_db_connection()
        logger.info("Getting organization structure statistics")
        
        # Sample SQL Server queries for organization structure
        departments_query = "SELECT COUNT(*) as TotalDepartments FROM [HUMAN].[dbo].[Departments]"
        positions_query = "SELECT COUNT(*) as TotalPositions FROM [HUMAN].[dbo].[Positions]"
        managers_query = """
            SELECT COUNT(*) as TotalManagers 
            FROM [HUMAN].[dbo].[Employees] e
            INNER JOIN [HUMAN].[dbo].[Positions] p ON e.PositionID = p.PositionID
            WHERE p.PositionName LIKE '%Manager%'
        """
        
        # Execute queries
        dept_results = await execute_sqlserver_query(departments_query)
        pos_results = await execute_sqlserver_query(positions_query)
        mgr_results = await execute_sqlserver_query(managers_query)
        
        # Extract results
        total_departments = dept_results[0]["TotalDepartments"] if dept_results else 0
        total_positions = pos_results[0]["TotalPositions"] if pos_results else 0
        total_managers = mgr_results[0]["TotalManagers"] if mgr_results else 0
        
        # Calculate average team size (simple estimation)
        avg_team_size = round(6.5, 1)  # Placeholder value
        
        return {
            "Status": True,
            "Data": {
                "totalDepartments": total_departments,
                "totalPositions": total_positions,
                "totalManagers": total_managers,
                "avgTeamSize": avg_team_size,
                "departments": total_departments,
                "positions": total_positions
            }
        }
    
    except Exception as e:
        logger.error(f"Error getting organization statistics: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"Status": False, "Error": str(e), "Message": "Failed to load organization statistics. Please try again later."}
        )

@reports_router.get("/mysql/organization-stats")
async def get_organization_stats_mysql(request: Request):
    """
    Get organization structure statistics from MySQL
    """
    try:
        logger.info("Getting organization structure statistics from MySQL")
        
        # MySQL queries for organization structure
        departments_query = "SELECT COUNT(*) as TotalDepartments FROM department"
        positions_query = "SELECT COUNT(*) as TotalPositions FROM position"
        managers_query = """
            SELECT COUNT(*) as TotalManagers 
            FROM employee e
            INNER JOIN position p ON e.PositionID = p.PositionID
            WHERE p.PositionName LIKE '%Manager%'
        """
        
        # Execute queries
        dept_results = await execute_mysql_query(departments_query)
        pos_results = await execute_mysql_query(positions_query)
        mgr_results = await execute_mysql_query(managers_query)
        
        # Extract results
        total_departments = dept_results[0]["TotalDepartments"] if dept_results else 0
        total_positions = pos_results[0]["TotalPositions"] if pos_results else 0
        total_managers = mgr_results[0]["TotalManagers"] if mgr_results else 0
        
        # Calculate average team size (employees per department)
        team_size_query = """
            SELECT AVG(emp_count) as AvgTeamSize FROM (
                SELECT COUNT(e.EmployeeID) as emp_count
                FROM department d
                LEFT JOIN employee e ON d.DepartmentID = e.DepartmentID
                GROUP BY d.DepartmentID
            ) as dept_counts
        """
        team_size_result = await execute_mysql_query(team_size_query)
        avg_team_size = round(float(team_size_result[0]["AvgTeamSize"] or 0), 1) if team_size_result else 0
        
        return {
            "Status": True,
            "Data": {
                "totalDepartments": total_departments,
                "totalPositions": total_positions,
                "totalManagers": total_managers,
                "avgTeamSize": avg_team_size,
                "departments": total_departments,
                "positions": total_positions
            }
        }
    
    except Exception as e:
        logger.error(f"Error getting MySQL organization statistics: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"Status": False, "Error": str(e), "Message": "Failed to load MySQL organization statistics. Please try again later."}
        )

# Add test endpoint for reports
@reports_router.get("/test")
async def test_reports_connection():
    """Simple test endpoint for checking Reports API connection"""
    try:
        # Return dummy data without database access
        return {
            "Status": True,
            "Message": "Reports API test successful",
            "Data": {
                "byDepartment": [
                    {"name": "IT", "count": 25},
                    {"name": "HR", "count": 15},
                    {"name": "Finance", "count": 20},
                    {"name": "Marketing", "count": 12},
                    {"name": "Operations", "count": 30}
                ],
                "overall": {
                    "totalEmployees": 102,
                    "totalNewHires": 12,
                    "turnoverRate": 5.2,
                    "averageSalary": 15000000
                },
                "salaryStats": {
                    "totalPayroll": 1530000000,
                    "averageSalary": 15000000,
                    "highestSalary": 35000000,
                    "totalBonuses": 153000000
                }
            }
        }
    except Exception as e:
        logger.error(f"Error in test_reports_connection: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"Status": False, "Error": str(e), "Message": "Test connection failed"}
        ) 