from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List, Dict, Any, Optional
import logging
from middleware.auth import verify_token
from utils.db import execute_sqlserver_query, check_sqlserver_health, execute_mysql_query
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("reports")

# Create router
reports_router = APIRouter()

# Demo data for reports when database connections fail
DEMO_EMPLOYEE_STATS = {
    "byDepartment": [
        {"name": "Human Resources", "count": 8},
        {"name": "Finance", "count": 12},
        {"name": "Information Technology", "count": 15},
        {"name": "Sales", "count": 10},
        {"name": "Marketing", "count": 7},
        {"name": "Operations", "count": 6}
    ],
    "overall": {
        "totalEmployees": 58,
        "totalNewHires": 12,
        "turnoverRate": 7.5,
        "averageSalary": 22500000
    }
}

DEMO_SALARY_STATS = {
    "totalPayroll": 1305000000,
    "averageSalary": 22500000,
    "highestSalary": 35000000,
    "totalBonuses": 130500000
}

DEMO_ORGANIZATION_STATS = {
    "departments": {
        "totalDepartments": 6,
        "avgEmployeesPerDepartment": 9.6,
        "largestDepartment": "Information Technology",
        "smallestDepartment": "Operations"
    },
    "structure": {
        "totalManagers": 12,
        "managerToEmployeeRatio": 0.22,
        "avgTeamSize": 4.5
    },
    "gender": {
        "male": 52,
        "female": 48
    }
}

# Check if we're in demo mode
FORCE_DEMO_DATA = os.getenv('FORCE_DEMO_DATA', 'false').lower() == 'true'


async def check_db_connection():
    """Check database connection before executing queries"""
    if FORCE_DEMO_DATA:
        logger.info("Using demo data, skipping connection check")
        return

    health = await check_sqlserver_health()
    if health["status"] != "healthy":
        logger.error(f"Database connection error: {health}")
        raise HTTPException(
            status_code=503,
            detail={"Status": False,
                    "Message": "Database connection error. Please try again later."}
        )


@reports_router.get("/employee-stats")
async def get_employee_stats(year: int, request: Request):
    """
    Get employee statistics grouped by department for a specific year
    """
    try:
        if FORCE_DEMO_DATA:
            logger.info(
                f"Using demo data for employee statistics (year: {year})")
            return {
                "Status": True,
                "Data": DEMO_EMPLOYEE_STATS
            }

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
        turnover_rate = round(
            stats_results[0]["TurnoverRate"] or 0, 1) if stats_results else 0
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
        # Return demo data on error
        return {
            "Status": True,
            "Data": DEMO_EMPLOYEE_STATS
        }


@reports_router.get("/mysql/employee-stats")
async def get_employee_stats_mysql(year: int, request: Request):
    """
    Get employee statistics from MySQL database grouped by department for a specific year
    """
    try:
        if FORCE_DEMO_DATA:
            logger.info(
                f"Using demo data for MySQL employee statistics (year: {year})")
            return {
                "Status": True,
                "Data": DEMO_EMPLOYEE_STATS
            }

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
        turnover_rate = round(
            stats_results[0]["TurnoverRate"] or 0, 1) if stats_results else 0
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
        # Return demo data on error
        return {
            "Status": True,
            "Data": DEMO_EMPLOYEE_STATS
        }


@reports_router.get("/salary-stats")
async def get_salary_stats(year: int, request: Request):
    """
    Get salary statistics for a specific year
    """
    try:
        if FORCE_DEMO_DATA:
            logger.info(
                f"Using demo data for salary statistics (year: {year})")
            return {
                "Status": True,
                "Data": DEMO_SALARY_STATS
            }

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
        # Return demo data on error
        return {
            "Status": True,
            "Data": DEMO_SALARY_STATS
        }


@reports_router.get("/mysql/salary-stats")
async def get_salary_stats_mysql(year: int, request: Request):
    """
    Get salary statistics from MySQL for a specific year
    """
    try:
        if FORCE_DEMO_DATA:
            logger.info(
                f"Using demo data for MySQL salary statistics (year: {year})")
            return {
                "Status": True,
                "Data": DEMO_SALARY_STATS
            }

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
        # Return demo data on error
        return {
            "Status": True,
            "Data": DEMO_SALARY_STATS
        }


@reports_router.get("/organization-stats")
async def get_organization_stats(request: Request):
    """
    Get organization structure statistics
    """
    try:
        if FORCE_DEMO_DATA:
            logger.info("Using demo data for organization statistics")
            return {
                "Status": True,
                "Data": DEMO_ORGANIZATION_STATS
            }

        await check_db_connection()
        logger.info("Getting organization structure statistics")

        # Get department stats
        dept_query = """
            SELECT 
                COUNT(DepartmentID) as TotalDepartments,
                AVG(EmployeeCount) as AvgEmployeesPerDepartment,
                (SELECT TOP 1 DepartmentName FROM [HUMAN].[dbo].[Departments] ORDER BY EmployeeCount DESC) as LargestDepartment,
                (SELECT TOP 1 DepartmentName FROM [HUMAN].[dbo].[Departments] WHERE EmployeeCount > 0 ORDER BY EmployeeCount ASC) as SmallestDepartment
            FROM [HUMAN].[dbo].[Departments]
        """

        dept_results = await execute_sqlserver_query(dept_query)

        # Get structure stats
        structure_query = """
            SELECT 
                SUM(CASE WHEN JobTitle LIKE '%Manager%' THEN 1 ELSE 0 END) as TotalManagers,
                CAST(SUM(CASE WHEN JobTitle LIKE '%Manager%' THEN 1 ELSE 0 END) AS FLOAT) / 
                NULLIF(COUNT(*), 0) as ManagerToEmployeeRatio,
                COUNT(*) / NULLIF(SUM(CASE WHEN JobTitle LIKE '%Manager%' THEN 1 ELSE 0 END), 0) as AvgTeamSize
            FROM [HUMAN].[dbo].[Employees]
            WHERE Status = 'Active'
        """

        structure_results = await execute_sqlserver_query(structure_query)

        # Get gender stats
        gender_query = """
            SELECT 
                SUM(CASE WHEN Gender = 'Male' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as Male,
                SUM(CASE WHEN Gender = 'Female' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as Female
            FROM [HUMAN].[dbo].[Employees]
            WHERE Status = 'Active'
        """

        gender_results = await execute_sqlserver_query(gender_query)

        # Format results
        total_departments = dept_results[0]["TotalDepartments"] if dept_results else 0
        avg_employees_per_dept = round(
            dept_results[0]["AvgEmployeesPerDepartment"] or 0, 1) if dept_results else 0
        largest_department = dept_results[0]["LargestDepartment"] if dept_results else ""
        smallest_department = dept_results[0]["SmallestDepartment"] if dept_results else ""

        total_managers = structure_results[0]["TotalManagers"] if structure_results else 0
        manager_ratio = round(
            structure_results[0]["ManagerToEmployeeRatio"] or 0, 2) if structure_results else 0
        avg_team_size = round(
            structure_results[0]["AvgTeamSize"] or 0, 1) if structure_results else 0

        male_percentage = round(
            gender_results[0]["Male"] or 0, 0) if gender_results else 0
        female_percentage = round(
            gender_results[0]["Female"] or 0, 0) if gender_results else 0

        return {
            "Status": True,
            "Data": {
                "departments": {
                    "totalDepartments": total_departments,
                    "avgEmployeesPerDepartment": avg_employees_per_dept,
                    "largestDepartment": largest_department,
                    "smallestDepartment": smallest_department
                },
                "structure": {
                    "totalManagers": total_managers,
                    "managerToEmployeeRatio": manager_ratio,
                    "avgTeamSize": avg_team_size
                },
                "gender": {
                    "male": male_percentage,
                    "female": female_percentage
                }
            }
        }

    except Exception as e:
        logger.error(f"Error getting organization statistics: {str(e)}")
        # Return demo data on error
        return {
            "Status": True,
            "Data": DEMO_ORGANIZATION_STATS
        }


@reports_router.get("/mysql/organization-stats")
async def get_organization_stats_mysql(request: Request):
    """
    Get organization structure statistics from MySQL
    """
    try:
        if FORCE_DEMO_DATA:
            logger.info("Using demo data for MySQL organization statistics")
            return {
                "Status": True,
                "Data": DEMO_ORGANIZATION_STATS
            }

        logger.info("Getting organization structure statistics from MySQL")

        # Get department stats from MySQL
        dept_query = """
            SELECT 
                COUNT(DepartmentID) as TotalDepartments,
                AVG(EmployeeCount) as AvgEmployeesPerDepartment,
                (SELECT DepartmentName FROM department ORDER BY EmployeeCount DESC LIMIT 1) as LargestDepartment,
                (SELECT DepartmentName FROM department WHERE EmployeeCount > 0 ORDER BY EmployeeCount ASC LIMIT 1) as SmallestDepartment
            FROM department
        """

        dept_results = await execute_mysql_query(dept_query)

        # Get structure stats from MySQL
        structure_query = """
            SELECT 
                SUM(CASE WHEN JobTitle LIKE '%Manager%' THEN 1 ELSE 0 END) as TotalManagers,
                SUM(CASE WHEN JobTitle LIKE '%Manager%' THEN 1 ELSE 0 END) / COUNT(*) as ManagerToEmployeeRatio,
                COUNT(*) / NULLIF(SUM(CASE WHEN JobTitle LIKE '%Manager%' THEN 1 ELSE 0 END), 0) as AvgTeamSize
            FROM employee
            WHERE Status = 'Active'
        """

        structure_results = await execute_mysql_query(structure_query)

        # Get gender stats from MySQL
        gender_query = """
            SELECT 
                SUM(CASE WHEN Gender = 'Male' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as Male,
                SUM(CASE WHEN Gender = 'Female' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as Female
            FROM employee
            WHERE Status = 'Active'
        """

        gender_results = await execute_mysql_query(gender_query)

        # Format results
        total_departments = dept_results[0]["TotalDepartments"] if dept_results else 0
        avg_employees_per_dept = round(float(
            dept_results[0]["AvgEmployeesPerDepartment"] or 0), 1) if dept_results else 0
        largest_department = dept_results[0]["LargestDepartment"] if dept_results else ""
        smallest_department = dept_results[0]["SmallestDepartment"] if dept_results else ""

        total_managers = structure_results[0]["TotalManagers"] if structure_results else 0
        manager_ratio = round(float(
            structure_results[0]["ManagerToEmployeeRatio"] or 0), 2) if structure_results else 0
        avg_team_size = round(
            float(structure_results[0]["AvgTeamSize"] or 0), 1) if structure_results else 0

        male_percentage = round(
            float(gender_results[0]["Male"] or 0), 0) if gender_results else 0
        female_percentage = round(
            float(gender_results[0]["Female"] or 0), 0) if gender_results else 0

        return {
            "Status": True,
            "Data": {
                "departments": {
                    "totalDepartments": total_departments,
                    "avgEmployeesPerDepartment": avg_employees_per_dept,
                    "largestDepartment": largest_department,
                    "smallestDepartment": smallest_department
                },
                "structure": {
                    "totalManagers": total_managers,
                    "managerToEmployeeRatio": manager_ratio,
                    "avgTeamSize": avg_team_size
                },
                "gender": {
                    "male": male_percentage,
                    "female": female_percentage
                }
            }
        }

    except Exception as e:
        logger.error(f"Error getting MySQL organization statistics: {str(e)}")
        # Return demo data on error
        return {
            "Status": True,
            "Data": DEMO_ORGANIZATION_STATS
        }


@reports_router.get("/test")
async def test_reports_connection():
    """
    Test endpoint to verify the reports API is working
    """
    return {
        "Status": True,
        "Message": "Reports API is operational",
        "DemoMode": FORCE_DEMO_DATA
    }
