from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List
from datetime import datetime
from utils.db import execute_sqlserver_query
from middleware.auth import verify_token
import logging

# Logger
logger = logging.getLogger("attendance")

# Create router
attendance_router = APIRouter()

@attendance_router.get("/daily/{year}/{month}", dependencies=[Depends(verify_token)])
async def get_daily_attendance(year: int, month: int):
    """
    Get daily attendance records for a specific month
    """
    try:
        logger.info(f"Getting daily attendance for {year}-{month}")
        
        query = """
        SELECT 
            a.AttendanceID,
            a.EmployeeID,
            e.FullName as EmployeeName,
            d.DepartmentName as Department,
            a.Date,
            a.CheckIn,
            a.CheckOut,
            a.Status,
            a.WorkHours,
            a.LateMinutes,
            a.Overtime
        FROM [HUMAN].[dbo].[Attendance] a
        JOIN [HUMAN].[dbo].[Employees] e ON a.EmployeeID = e.EmployeeID
        JOIN [HUMAN].[dbo].[Departments] d ON e.DepartmentID = d.DepartmentID
        WHERE YEAR(a.Date) = @Year AND MONTH(a.Date) = @Month
        ORDER BY a.Date DESC, a.EmployeeID
        """
        
        results = await execute_sqlserver_query(query, {"Year": year, "Month": month})
        return {"Status": True, "Data": results}
        
    except Exception as e:
        logger.error(f"Error getting daily attendance: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"Status": False, "Error": str(e), "Message": "Failed to load attendance data. Please try again later."}
        )

@attendance_router.get("/monthly/{year}/{month}", dependencies=[Depends(verify_token)])
async def get_monthly_attendance(year: int, month: int):
    """
    Get monthly attendance summary for each employee
    """
    try:
        logger.info(f"Getting monthly attendance for {year}-{month}")
        
        query = """
        SELECT 
            e.EmployeeID,
            e.FullName as EmployeeName,
            d.DepartmentName as Department,
            COUNT(CASE WHEN a.Status = 'Present' THEN 1 END) as PresentDays,
            COUNT(CASE WHEN a.Status = 'Absent' THEN 1 END) as AbsentDays,
            COUNT(CASE WHEN a.Status = 'Leave' THEN 1 END) as LeaveDays,
            COUNT(CASE WHEN a.LateMinutes > 0 THEN 1 END) as LateDays,
            SUM(a.WorkHours) as TotalWorkHours
        FROM [HUMAN].[dbo].[Employees] e
        JOIN [HUMAN].[dbo].[Departments] d ON e.DepartmentID = d.DepartmentID
        LEFT JOIN [HUMAN].[dbo].[Attendance] a ON e.EmployeeID = a.EmployeeID 
            AND YEAR(a.Date) = @Year AND MONTH(a.Date) = @Month
        GROUP BY e.EmployeeID, e.FullName, d.DepartmentName
        ORDER BY d.DepartmentName, e.FullName
        """
        
        results = await execute_sqlserver_query(query, {"Year": year, "Month": month})
        return {"Status": True, "Data": results}
        
    except Exception as e:
        logger.error(f"Error getting monthly attendance: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"Status": False, "Error": str(e), "Message": "Failed to load attendance data. Please try again later."}
        )

@attendance_router.get("/summary/{year}/{month}", dependencies=[Depends(verify_token)])
async def get_attendance_summary(year: int, month: int):
    """
    Get attendance summary statistics
    """
    try:
        logger.info(f"Getting attendance summary for {year}-{month}")
        
        # Get department-wise statistics
        dept_query = """
        SELECT 
            d.DepartmentName as Department,
            COUNT(DISTINCT e.EmployeeID) as TotalEmployees,
            COUNT(CASE WHEN a.Status = 'Present' THEN 1 END) as TotalPresent,
            COUNT(CASE WHEN a.Status = 'Absent' THEN 1 END) as TotalAbsent,
            COUNT(CASE WHEN a.LateMinutes > 0 THEN 1 END) as TotalLate
        FROM [HUMAN].[dbo].[Departments] d
        JOIN [HUMAN].[dbo].[Employees] e ON d.DepartmentID = e.DepartmentID
        LEFT JOIN [HUMAN].[dbo].[Attendance] a ON e.EmployeeID = a.EmployeeID 
            AND YEAR(a.Date) = @Year AND MONTH(a.Date) = @Month
        GROUP BY d.DepartmentName
        """
        
        department_stats = await execute_sqlserver_query(dept_query, {"Year": year, "Month": month})
        
        # Calculate rates for each department
        for stats in department_stats:
            if stats['TotalEmployees'] > 0:
                stats['PresentRate'] = round((stats['TotalPresent'] / stats['TotalEmployees']) * 100, 1)
                stats['AbsentRate'] = round((stats['TotalAbsent'] / stats['TotalEmployees']) * 100, 1)
                stats['LateRate'] = round((stats['TotalLate'] / stats['TotalEmployees']) * 100, 1)
            else:
                stats['PresentRate'] = 0
                stats['AbsentRate'] = 0
                stats['LateRate'] = 0
        
        # Get overall statistics
        overall_query = """
        SELECT 
            COUNT(DISTINCT e.EmployeeID) as TotalEmployees,
            COUNT(CASE WHEN a.Status = 'Present' THEN 1 END) as TotalPresent,
            COUNT(CASE WHEN a.Status = 'Absent' THEN 1 END) as TotalAbsent,
            COUNT(CASE WHEN a.LateMinutes > 0 THEN 1 END) as TotalLate
        FROM [HUMAN].[dbo].[Employees] e
        LEFT JOIN [HUMAN].[dbo].[Attendance] a ON e.EmployeeID = a.EmployeeID 
            AND YEAR(a.Date) = @Year AND MONTH(a.Date) = @Month
        """
        
        overall_stats = await execute_sqlserver_query(overall_query, {"Year": year, "Month": month})
        overall_stats = overall_stats[0]
        
        # Calculate overall rates
        if overall_stats['TotalEmployees'] > 0:
            overall_stats['AveragePresentRate'] = round((overall_stats['TotalPresent'] / overall_stats['TotalEmployees']) * 100, 1)
            overall_stats['AverageAbsentRate'] = round((overall_stats['TotalAbsent'] / overall_stats['TotalEmployees']) * 100, 1)
            overall_stats['AverageLateRate'] = round((overall_stats['TotalLate'] / overall_stats['TotalEmployees']) * 100, 1)
        else:
            overall_stats['AveragePresentRate'] = 0
            overall_stats['AverageAbsentRate'] = 0
            overall_stats['AverageLateRate'] = 0
            
        return {
            "Status": True,
            "Data": {
                "departmentStats": department_stats,
                "overallStats": overall_stats
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting attendance summary: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"Status": False, "Error": str(e), "Message": "Failed to load attendance data. Please try again later."}
        ) 