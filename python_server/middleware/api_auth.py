from fastapi import Request, HTTPException, Depends
from typing import Callable, List, Dict, Any
import logging
from .auth import verify_token, Roles

# Configure logging
logger = logging.getLogger("api_auth")

class RoleBasedAccessControl:
    """
    Middleware for implementing role-based API access control
    
    This middleware implements the following permissions:
    - Admin → Full access to all system APIs
    - HR Manager → Can manage employee data from HUMAN_2025 but cannot modify payroll
    - Payroll Manager → Can manage payroll data from PAYROLL but cannot modify employee data
    - Employee → Can only view their own personal information & salary
    """
    
    @staticmethod
    async def verify_employee_data_access(request: Request, employee_id: str = None):
        """Verify access to employee data based on role"""
        await verify_token(request)
        user_role = request.state.role
        user_id = request.state.id
        
        # Admin has full access
        if user_role == Roles.ADMIN:
            return True
            
        # HR Manager can access all employee data
        if user_role == Roles.HR_MANAGER:
            return True
            
        # Payroll Manager can view employee data but not modify
        if user_role == Roles.PAYROLL_MANAGER:
            # Check if this is a GET request (view only)
            if request.method != "GET":
                raise HTTPException(
                    status_code=403,
                    detail={"Status": False, "Message": "Payroll Manager cannot modify employee data"}
                )
            return True
            
        # Employees can only access their own data
        if user_role == Roles.EMPLOYEE:
            # If employee_id is provided, check if it matches the user's ID
            if employee_id and str(user_id) != employee_id:
                raise HTTPException(
                    status_code=403,
                    detail={"Status": False, "Message": "You can only access your own data"}
                )
            
            # For employee list endpoints, restrict to only return their own data
            request.state.self_only = True
        
        return True
    
    @staticmethod
    async def verify_payroll_data_access(request: Request, employee_id: str = None):
        """Verify access to payroll data based on role"""
        await verify_token(request)
        user_role = request.state.role
        user_id = request.state.id
        
        # Admin has full access
        if user_role == Roles.ADMIN:
            return True
            
        # Payroll Manager can access all payroll data
        if user_role == Roles.PAYROLL_MANAGER:
            return True
            
        # HR Manager can view payroll data but not modify
        if user_role == Roles.HR_MANAGER:
            # Check if this is a GET request (view only)
            if request.method != "GET":
                raise HTTPException(
                    status_code=403,
                    detail={"Status": False, "Message": "HR Manager cannot modify payroll data"}
                )
            return True
            
        # Employees can only access their own payroll data
        if user_role == Roles.EMPLOYEE:
            # If employee_id is provided, check if it matches the user's ID
            if employee_id and str(user_id) != employee_id:
                raise HTTPException(
                    status_code=403,
                    detail={"Status": False, "Message": "You can only access your own payroll data"}
                )
            
            # For payroll list endpoints, restrict to only return their own data
            request.state.self_only = True
        
        return True
    
    @staticmethod
    async def admin_only(request: Request):
        """Allow only Admins to access"""
        await verify_token(request)
        user_role = request.state.role
        
        if user_role != Roles.ADMIN:
            raise HTTPException(
                status_code=403,
                detail={"Status": False, "Message": "Only Admin can access this endpoint"}
            )
        
        return True

# Factory functions for dependency injection

def protect_employee_endpoint(employee_id_param: str = None):
    """Protect employee endpoints with role-based access control"""
    async def _protect(request: Request):
        # If employee_id is in path parameters, extract it
        employee_id = None
        if employee_id_param and employee_id_param in request.path_params:
            employee_id = request.path_params[employee_id_param]
        
        return await RoleBasedAccessControl.verify_employee_data_access(request, employee_id)
    
    return _protect

def protect_payroll_endpoint(employee_id_param: str = None):
    """Protect payroll endpoints with role-based access control"""
    async def _protect(request: Request):
        # If employee_id is in path parameters, extract it
        employee_id = None
        if employee_id_param and employee_id_param in request.path_params:
            employee_id = request.path_params[employee_id_param]
        
        return await RoleBasedAccessControl.verify_payroll_data_access(request, employee_id)
    
    return _protect

def admin_only():
    """Protect admin-only endpoints"""
    async def _protect(request: Request):
        return await RoleBasedAccessControl.admin_only(request)
    
    return _protect 