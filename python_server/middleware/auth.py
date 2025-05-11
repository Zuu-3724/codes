import jwt
import os
import time
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any, Optional, List, Union
import logging

# Configure logging
logger = logging.getLogger("auth")

# Token cache to minimize repeated decoding
token_cache = {}

# Security scheme for JWT
security = HTTPBearer()

# JWT settings
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")
JWT_ALGORITHM = "HS256"

# Role definitions
class Roles:
    ADMIN = "Admin"
    HR_MANAGER = "HR Manager"
    PAYROLL_MANAGER = "Payroll Manager"
    EMPLOYEE = "Employee"

# Define API access permissions for each role
ROLE_PERMISSIONS = {
    Roles.ADMIN: {
        "can_access_all": True,  # Admin has access to all APIs
    },
    Roles.HR_MANAGER: {
        "can_manage_employees": True,  # Can add, update, delete employees
        "can_view_employees": True,     # Can view employee data
        "can_manage_departments": True, # Can manage departments
        "cannot_manage_payroll": True,  # Cannot modify payroll data
    },
    Roles.PAYROLL_MANAGER: {
        "can_manage_payroll": True,     # Can modify payroll data
        "can_view_employees": True,     # Can view employee data
        "cannot_manage_employees": True, # Cannot add/update/delete employees
    },
    Roles.EMPLOYEE: {
        "can_view_self": True,          # Can view own data only
    }
}

def verify_and_decode_token(token: str) -> Dict[str, Any]:
    """Verify and decode JWT token with caching"""
    # Check cache first
    if token in token_cache:
        cached_data = token_cache[token]
        # Check token expiry in cache
        if cached_data["expiry"] > time.time():
            return {"valid": True, "decoded": cached_data["decoded"]}
        else:
            # Remove expired token from cache
            del token_cache[token]
    
    try:
        # Decode token
        decoded = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        # Save to cache with expiry
        expiry = decoded.get("exp", time.time() + 3600)  # Default 1 hour
        token_cache[token] = {"decoded": decoded, "expiry": expiry}
        
        return {"valid": True, "decoded": decoded}
    except jwt.ExpiredSignatureError:
        return {"valid": False, "error": "Token has expired"}
    except jwt.InvalidTokenError as e:
        return {"valid": False, "error": f"Invalid token: {str(e)}"}

def extract_token(request: Request) -> Optional[str]:
    """Extract token from cookies or authorization header"""
    # Check cookies first
    token = request.cookies.get("token")
    
    # If not in cookies, check Authorization header
    if not token and "Authorization" in request.headers:
        auth_header = request.headers["Authorization"]
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
    
    return token

async def verify_token(request: Request, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify access token middleware"""
    try:
        # Use token from Authorization header (provided by the HTTPBearer dependency)
        token = credentials.credentials
        
        # Alternative: Extract token from cookies if needed
        if not token:
            token = extract_token(request)
        
        if not token:
            raise HTTPException(status_code=401, detail={"Status": False, "Message": "Token not found"})
        
        result = verify_and_decode_token(token)
        
        if not result["valid"]:
            logger.error(f"JWT Verification Error: {result.get('error')}")
            raise HTTPException(status_code=401, detail={"Status": False, "Message": "Invalid token"})
        
        # Add user info to request state
        request.state.user = result["decoded"]
        request.state.role = result["decoded"].get("role")
        request.state.id = result["decoded"].get("id")
        
        return result["decoded"]
    except Exception as e:
        logger.error(f"Token verification error: {str(e)}")
        raise HTTPException(status_code=401, detail={"Status": False, "Message": "Authentication error"})

def check_role(roles: Union[List[str], str]):
    """Check if user has required role(s)"""
    if isinstance(roles, str):
        roles = [roles]
        
    async def role_checker(request: Request):
        user_role = request.state.role
        if user_role not in roles:
            raise HTTPException(
                status_code=403,
                detail={"Status": False, "Message": f"Access denied. Required roles: {', '.join(roles)}"}
            )
        return True
    return role_checker

def is_admin(request: Request):
    """Check if user is an admin"""
    if request.state.role != Roles.ADMIN:
        raise HTTPException(
            status_code=403, 
            detail={"Status": False, "Message": "Access denied. Admin role required."}
        )
    return True

# Role-specific middleware
async def admin_only(request: Request):
    """Middleware that allows only Admin users"""
    return await check_role([Roles.ADMIN])(request)

async def hr_manager_only(request: Request):
    """Middleware that allows only HR Manager users"""
    return await check_role([Roles.ADMIN, Roles.HR_MANAGER])(request)

async def payroll_manager_only(request: Request):
    """Middleware that allows only Payroll Manager users"""
    return await check_role([Roles.ADMIN, Roles.PAYROLL_MANAGER])(request)

async def not_employee(request: Request):
    """Middleware that denies Employee users"""
    if request.state.role == Roles.EMPLOYEE:
        raise HTTPException(
            status_code=403,
            detail={"Status": False, "Message": "Access denied for Employee role"}
        )
    return True

# API-specific permission middleware
class APIPermission:
    @staticmethod
    def protect_employee_api():
        """Only allow employees to access their own data"""
        async def verify_employee_access(request: Request, employee_id: str):
            # Admin can access all employee data
            if request.state.role == Roles.ADMIN:
                return True
                
            # HR Manager can access all employee data
            if request.state.role == Roles.HR_MANAGER:
                return True
                
            # Payroll Manager can access all employee data
            if request.state.role == Roles.PAYROLL_MANAGER:
                return True
                
            # Employees can only access their own data
            if request.state.role == Roles.EMPLOYEE:
                # Check if the employee is accessing their own data
                if str(request.state.id) != employee_id:
                    raise HTTPException(
                        status_code=403,
                        detail={"Status": False, "Message": "You can only access your own data"}
                    )
            return True
        return verify_employee_access
    
    @staticmethod
    def protect_payroll_api():
        """Only allow Payroll Manager and Admin to modify payroll data"""
        async def verify_payroll_access(request: Request):
            # Only Admin and Payroll Manager can modify payroll data
            if request.state.role not in [Roles.ADMIN, Roles.PAYROLL_MANAGER]:
                raise HTTPException(
                    status_code=403,
                    detail={"Status": False, "Message": "Only Payroll Manager and Admin can modify payroll data"}
                )
            return True
        return verify_payroll_access
    
    @staticmethod
    def protect_hr_api():
        """Only allow HR Manager and Admin to modify employee data"""
        async def verify_hr_access(request: Request):
            # Only Admin and HR Manager can modify employee data
            if request.state.role not in [Roles.ADMIN, Roles.HR_MANAGER]:
                raise HTTPException(
                    status_code=403,
                    detail={"Status": False, "Message": "Only HR Manager and Admin can modify employee data"}
                )
            return True
        return verify_hr_access 