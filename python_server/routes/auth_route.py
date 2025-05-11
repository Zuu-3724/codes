from fastapi import APIRouter, Depends, HTTPException, Response, Cookie, Request
from fastapi.security import OAuth2PasswordRequestForm
from typing import Dict, Any, Optional
import jwt
import bcrypt
from datetime import datetime, timedelta
import logging
from utils.db import execute_mysql_query
import os
from middleware.auth import verify_token, Roles
from middleware.api_auth import RoleBasedAccessControl, protect_employee_endpoint, protect_payroll_endpoint, admin_only

# Initialize logger
logger = logging.getLogger("auth")

# Create router
auth_router = APIRouter()

# JWT Settings
JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key')
JWT_ALGORITHM = os.getenv('JWT_ALGORITHM', 'HS256')
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', '1440'))

def generate_token(user_data: Dict[str, Any]) -> str:
    """Generate JWT token"""
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "exp": expire,
        "id": user_data["UserID"],
        "username": user_data["Username"],
        "role": user_data["Role"]
    }
    
    token = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    logger.info(f"Generated token for user: {user_data['Username']}")
    
    return token

@auth_router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login and get JWT token"""
    try:
        logger.info("Using OAuth2 form login method")
        return await process_login(form_data.username, form_data.password)
    except Exception as e:
        logger.error(f"OAuth2 login error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"Status": False, "Message": f"Login failed: {str(e)}"}
        )

@auth_router.post("/login-json")
async def login_json(credentials: Dict[str, Any]):
    """Alternative login endpoint accepting JSON credentials"""
    try:
        logger.info("Using JSON login method")
        username = credentials.get("username")
        password = credentials.get("password")
        
        logger.info(f"Received credentials: username={username}, password=****")
        
        if not username or not password:
            raise HTTPException(
                status_code=400,
                detail={"Status": False, "Message": "Username and password are required"}
            )
            
        # For debugging, if username is admin and password is admin123, bypass normal authentication
        if username == "admin" and password == "admin123":
            logger.info("Using test admin account")
            # Create mock user data
            user_data = {
                "UserID": 1,
                "Username": "admin",
                "Role": "Admin"
            }
            
            # Generate token
            token = generate_token(user_data)
            
            # Create response
            response = {
                "Status": True,
                "token": token,
                "Data": {
                    "id": user_data["UserID"],
                    "username": user_data["Username"],
                    "role": user_data["Role"]
                }
            }
            
            logger.info(f"Login successful for test admin user: {username}")
            return response
        
        # Otherwise use regular authentication flow
        return await process_login(username, password)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"JSON login error: {str(e)}")
        # Return a cleaner error response
        return {
            "Status": False, 
            "Message": f"Login failed: {str(e)}"
        }

async def process_login(username: str, password: str):
    """Common login processing logic"""
    try:
        # Debug info
        logger.info("==== LOGIN ATTEMPT DETAILS ====")
        logger.info(f"Username: {username}")
        logger.info(f"Password: {'*' * len(password)}")  # Don't log actual password
        logger.info("===============================")

        logger.info(f"Login attempt for user: {username}")
        
        # Find user in database
        query = "SELECT * FROM user WHERE Username = %s"
        users = await execute_mysql_query(query, (username,))
        
        if not users:
            logger.warning(f"Login failed: User not found: {username}")
            # Create test user if it doesn't exist
            if username == "admin":
                logger.info("Creating admin test user")
                hashed_password = bcrypt.hashpw(
                    "admin123".encode('utf-8'), 
                    bcrypt.gensalt()
                ).decode('utf-8')
                
                # Save new admin user
                insert_query = """
                    INSERT INTO user (Username, Password, Role, Status) 
                    VALUES (%s, %s, %s, 1)
                """
                await execute_mysql_query(
                    insert_query, 
                    (username, hashed_password, "Admin")
                )
                logger.info(f"Created test admin user")
                # Query again to get the new user
                users = await execute_mysql_query(query, (username,))
            else:
                raise HTTPException(
                    status_code=401,
                    detail={"Status": False, "Message": "Account does not exist"}
                )
        
        user = users[0]
        logger.info(f"User found: {user['Username']}, ID: {user['UserID']}")
        
        # Check password
        try:
            stored_password = user['Password'].strip()  # Remove any whitespace
            logger.info(f"Stored password hash: {stored_password}")
            
            # Ensure the stored password is a valid bcrypt hash
            if not stored_password.startswith('$2b$'):
                logger.error(f"Invalid password hash format for user: {username}")
                raise HTTPException(
                    status_code=401, 
                    detail={"Status": False, "Message": "Invalid password format"}
                )
            
            is_valid = bcrypt.checkpw(
                password.encode('utf-8'),
                stored_password.encode('utf-8')
            )
        except Exception as e:
            logger.error(f"Password check error: {str(e)}")
            logger.error(f"Stored password: {stored_password}")
            raise HTTPException(
                status_code=401, 
                detail={"Status": False, "Message": "Incorrect password"}
            )
        
        if not is_valid:
            logger.warning(f"Login failed: Invalid password for user: {username}")
            raise HTTPException(
                status_code=401, 
                detail={"Status": False, "Message": "Incorrect password"}
            )
        
        # Generate token
        token = generate_token(user)
        
        # Create response
        response = {
            "Status": True,
            "token": token,
            "Data": {
                "id": user["UserID"],
                "username": user["Username"],
                "role": user["Role"]
            }
        }
        
        # Update last login time
        update_query = """
            UPDATE user
            SET LastLoginAt = CURRENT_TIMESTAMP
            WHERE UserID = %s
        """
        await execute_mysql_query(update_query, (user["UserID"],))
        
        logger.info(f"Login successful for user: {username}")
        return response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login processing error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"Status": False, "Message": f"Login failed: {str(e)}"}
        )

@auth_router.post("/register")
async def register(user_data: Dict[str, Any]):
    """Register a new user"""
    try:
        username = user_data.get("username")
        password = user_data.get("password")
        role = user_data.get("role", "Employee")  # Default role
        
        if not username or not password:
            raise HTTPException(
                status_code=400,
                detail={"Status": False, "Message": "Username and password are required"}
            )
        
        # Check if user exists
        check_query = "SELECT COUNT(*) as count FROM user WHERE Username = %s"
        result = await execute_mysql_query(check_query, (username,))
        
        if result[0]["count"] > 0:
            raise HTTPException(
                status_code=409,
                detail={"Status": False, "Message": "Username already exists"}
            )
        
        # Hash password
        hashed_password = bcrypt.hashpw(
            password.encode('utf-8'), 
            bcrypt.gensalt()
        ).decode('utf-8')
        
        # Save new user
        insert_query = """
            INSERT INTO user (Username, Password, Role, Status) 
            VALUES (%s, %s, %s, 1)
        """
        await execute_mysql_query(
            insert_query, 
            (username, hashed_password, role)
        )
        
        logger.info(f"User registered successfully: {username}")
        return {"Status": True, "Message": "Registration successful"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"Status": False, "Message": f"Registration failed: {str(e)}"}
        )

@auth_router.get("/check-auth")
async def check_auth(token: str = Cookie(None)):
    """Check if user is authenticated"""
    try:
        if not token:
            raise HTTPException(
                status_code=401,
                detail={"Status": False, "Message": "Not authenticated"}
            )
        
        try:
            # Verify token
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            user_id = payload.get("id")
            
            # Get user info from database
            query = "SELECT UserID, Username, Role, Status FROM user WHERE UserID = %s"
            users = await execute_mysql_query(query, (user_id,))
            
            if not users:
                raise HTTPException(
                    status_code=401,
                    detail={"Status": False, "Message": "Invalid login session"}
                )
            
            return {"Status": True, "Data": users[0]}
        
        except jwt.PyJWTError:
            raise HTTPException(
                status_code=401,
                detail={"Status": False, "Message": "Invalid or expired token"}
            )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Authentication check error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"Status": False, "Message": f"Authentication check failed: {str(e)}"}
        )

@auth_router.post("/logout")
async def logout(response: Response):
    """Logout user by clearing the token cookie"""
    response.delete_cookie(key="token")
    return {"Status": True, "Message": "Logout successful"}

@auth_router.get("/users")
async def get_users():
    """Get list of all users"""
    try:
        query = """
            SELECT UserID, Username, Role, Status, CreatedAt, UpdatedAt 
            FROM user 
            ORDER BY Username
        """
        users = await execute_mysql_query(query)
        return {"Status": True, "Data": users}
    except Exception as e:
        logger.error(f"Error getting users: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"Status": False, "Error": str(e)}
        )

@auth_router.get("/roles")
async def get_roles():
    """Get list of available roles"""
    try:
        roles = ["Admin", "HR Manager", "Employee"]  # Match with CHK_Role constraint
        return {"Status": True, "Data": roles}
    except Exception as e:
        logger.error(f"Error getting roles: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"Status": False, "Error": str(e)}
        )

@auth_router.get("/test-auth", dependencies=[Depends(verify_token)])
async def test_auth(request: Request):
    """Test the authentication and get current user role"""
    return {
        "Status": True,
        "Message": "Authentication successful",
        "Data": {
            "id": request.state.id,
            "username": request.state.user.get("username"),
            "role": request.state.role
        }
    }

@auth_router.get("/test-admin", dependencies=[Depends(admin_only())])
async def test_admin_access(request: Request):
    """Test the Admin role access"""
    return {
        "Status": True,
        "Message": "Admin access granted",
        "Data": {
            "id": request.state.id,
            "username": request.state.user.get("username"),
            "role": request.state.role
        }
    }

@auth_router.get("/test-employee", dependencies=[Depends(protect_employee_endpoint())])
async def test_employee_access(request: Request):
    """Test the Employee data access permissions"""
    # This will vary depending on user role - will filter employee data for employees 
    # but allow full access for admins, HR managers, and view-only for payroll managers
    return {
        "Status": True,
        "Message": "Employee data access granted",
        "Data": {
            "role": request.state.role,
            "self_only": hasattr(request.state, 'self_only') and request.state.self_only,
            "id": request.state.id
        }
    }

@auth_router.get("/test-payroll", dependencies=[Depends(protect_payroll_endpoint())])
async def test_payroll_access(request: Request):
    """Test the Payroll data access permissions"""
    # This will vary depending on user role - will filter payroll data for employees
    # but allow full access for admins, payroll managers, and view-only for HR managers
    return {
        "Status": True,
        "Message": "Payroll data access granted",
        "Data": {
            "role": request.state.role,
            "self_only": hasattr(request.state, 'self_only') and request.state.self_only,
            "id": request.state.id
        }
    } 