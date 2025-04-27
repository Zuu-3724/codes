import jwt
import os
import time
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any, Optional
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

def check_role(roles: list):
    """Check if user has required role"""
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
    if request.state.role != "Admin":
        raise HTTPException(
            status_code=403, 
            detail={"Status": False, "Message": "Access denied. Admin role required."}
        )
    return True 