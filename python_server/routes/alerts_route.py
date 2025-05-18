from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import datetime, timedelta
from utils.db import execute_sqlserver_query
from middleware.auth import verify_token
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("alerts")

alerts_router = APIRouter()


@alerts_router.get("/work-anniversaries", dependencies=[Depends(verify_token)])
async def get_work_anniversaries():
    try:
        logger.info("Getting work anniversaries")

        # Get employees with upcoming work anniversaries in the next 30 days
        query = """
        SELECT 
            e.EmployeeID,
            e.FullName,
            e.HireDate,
            d.DepartmentName,
            DATEDIFF(YEAR, e.HireDate, GETDATE()) as YearsOfService
        FROM [HUMAN].[dbo].[Employees] e
        JOIN [HUMAN].[dbo].[Departments] d ON e.DepartmentID = d.DepartmentID
        WHERE 
            MONTH(e.HireDate) = MONTH(GETDATE())
            AND DAY(e.HireDate) >= DAY(GETDATE())
            AND DAY(e.HireDate) <= DAY(DATEADD(DAY, 30, GETDATE()))
        ORDER BY DAY(e.HireDate)
        """

        results = await execute_sqlserver_query(query)

        # Format dates
        for result in results:
            result['Date'] = result['HireDate'].strftime('%Y-%m-%d')

        return {"Status": True, "Data": results}

    except Exception as e:
        logger.error(f"Error getting work anniversaries: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"Status": False, "Error": str(
                e), "Message": "Failed to load work anniversaries"}
        )


@alerts_router.get("/leave-violations", dependencies=[Depends(verify_token)])
async def get_leave_violations():
    try:
        logger.info("Getting leave violations")

        # Get employees who have exceeded their leave limit in the current month
        query = """
        SELECT 
            e.EmployeeID,
            e.FullName,
            d.DepartmentName,
            COUNT(CASE WHEN a.Status = 'Leave' THEN 1 END) as LeaveDays,
            MONTH(GETDATE()) as Month,
            YEAR(GETDATE()) as Year
        FROM [HUMAN].[dbo].[Employees] e
        JOIN [HUMAN].[dbo].[Departments] d ON e.DepartmentID = d.DepartmentID
        LEFT JOIN [HUMAN].[dbo].[Attendance] a ON e.EmployeeID = a.EmployeeID 
            AND YEAR(a.Date) = YEAR(GETDATE()) 
            AND MONTH(a.Date) = MONTH(GETDATE())
        GROUP BY e.EmployeeID, e.FullName, d.DepartmentName
        HAVING COUNT(CASE WHEN a.Status = 'Leave' THEN 1 END) > 3  -- Assuming 3 days is the limit
        ORDER BY LeaveDays DESC
        """

        results = await execute_sqlserver_query(query)

        # Format results
        for result in results:
            result['Month'] = datetime(
                result['Year'], result['Month'], 1).strftime('%B %Y')
            result['ExcessDays'] = result['LeaveDays'] - \
                3  # Assuming 3 days is the limit

        return {"Status": True, "Data": results}

    except Exception as e:
        logger.error(f"Error getting leave violations: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"Status": False, "Error": str(
                e), "Message": "Failed to load leave violations"}
        )


@alerts_router.put("/acknowledge/{alert_type}/{alert_id}", dependencies=[Depends(verify_token)])
async def acknowledge_alert(alert_type: str, alert_id: str):
    try:
        logger.info(f"Acknowledging alert: {alert_type} - {alert_id}")

        # In a real application, you would update a flag in the database
        # For now, we'll just return success
        return {"Status": True, "Message": "Alert acknowledged successfully"}

    except Exception as e:
        logger.error(f"Error acknowledging alert: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"Status": False, "Error": str(
                e), "Message": "Failed to acknowledge alert"}
        )

# Add test endpoint for alerts


@alerts_router.get("/test")
async def test_alerts_connection():
    """Simple test endpoint for checking Alerts API connection"""
    try:
        # Return dummy data without database access
        today = datetime.now()
        return {
            "Status": True,
            "Message": "Alerts API test successful",
            "Data": {
                "workAnniversaries": [
                    {
                        "EmployeeID": "E001",
                        "FullName": "Nguyễn Văn A",
                        "DepartmentName": "IT",
                        "YearsOfService": 5,
                        "Date": (today + timedelta(days=3)).strftime('%Y-%m-%d')
                    },
                    {
                        "EmployeeID": "E005",
                        "FullName": "Pham Thi H",
                        "DepartmentName": "HR",
                        "YearsOfService": 3,
                        "Date": (today + timedelta(days=7)).strftime('%Y-%m-%d')
                    }
                ],
                "leaveViolations": [
                    {
                        "EmployeeID": "E002",
                        "FullName": "Trần Thị B",
                        "DepartmentName": "HR",
                        "LeaveDays": 5,
                        "ExcessDays": 2,
                        "Month": today.strftime('%B %Y')
                    }
                ]
            }
        }
    except Exception as e:
        logger.error(f"Error in test_alerts_connection: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"Status": False, "Error": str(
                e), "Message": "Test connection failed"}
        )
