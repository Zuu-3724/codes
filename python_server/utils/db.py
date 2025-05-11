import os
import mysql.connector
from mysql.connector import Error as MySQLError, pooling
import pyodbc
import logging
from typing import Dict, Any, Optional
# from dotenv import load_dotenv # Comment out this line
from fastapi import HTTPException
import time
from functools import wraps

# Load environment variables
# load_dotenv() # Comment out this line

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("database")

# MySQL Configuration
MYSQL_CONFIG = {
    'host': os.getenv('MYSQL_HOST', 'localhost'),
    'user': os.getenv('MYSQL_USER', 'root'),
    'password': os.getenv('MYSQL_PASSWORD', 'YES'),
    'database': os.getenv('MYSQL_DATABASE', 'payroll'),
    'pool_name': 'mypool',
    'pool_size': 10
}

# Set this to True to force using demo data
FORCE_DEMO_DATA = os.getenv('FORCE_DEMO_DATA', 'false').lower() == 'true'

# Initialize MySQL connection pool
try:
    if FORCE_DEMO_DATA:
        logger.warning("FORCE_DEMO_DATA is set to True. Using demo data for MySQL.")
        mysql_pool = None
    else:
        mysql_pool = pooling.MySQLConnectionPool(**MYSQL_CONFIG)
        logger.info("MySQL Connection Pool created successfully")
except Exception as e:
    logger.error(f"Error creating MySQL connection pool: {str(e)}")
    mysql_pool = None  # Allow application to continue even if MySQL fails

# SQL Server Configuration
SQL_SERVER_CONFIG = {
    'driver': '{ODBC Driver 13 for SQL Server}',  # Using the available driver on this system
    'server': os.getenv('SQLSERVER_HOST', 'localhost'),
    'database': os.getenv('SQLSERVER_DATABASE', 'HUMAN'),
    'uid': os.getenv('SQLSERVER_USER', 'sa'),
    'pwd': os.getenv('SQLSERVER_PASSWORD', 'trunghieu013'),
}

# Initialize SQL Server connection pool
sqlserver_pool = None
try:
    if FORCE_DEMO_DATA:
        logger.warning("FORCE_DEMO_DATA is set to True. Using demo data for SQL Server.")
    else:
        # Check available SQL Server drivers
        drivers = [x for x in pyodbc.drivers() if x.endswith(' for SQL Server')]
        if drivers:
            logger.info(f"Found SQL Server driver: {drivers[0]}")
            SQL_SERVER_CONFIG['driver'] = drivers[0]
            
            # Use direct connection instead of pooling since there's an issue with ConnectionPool
            logger.info("Skipping SQL Server connection pool due to compatibility issues.")
            logger.info("Will create connections directly when needed.")
        else:
            logger.warning("No SQL Server driver found")
except Exception as e:
    logger.error(f"Error initializing SQL Server: {str(e)}")

def retry_on_error(max_retries=3, delay=1):
    """Decorator to retry database operations on failure"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_retries - 1:
                        raise
                    logger.warning(f"Attempt {attempt + 1} failed: {str(e)}")
                    time.sleep(delay)
            return None
        return wrapper
    return decorator

@retry_on_error()
async def execute_mysql_query(query: str, params=None):
    """Execute a MySQL query with retry logic"""
    if mysql_pool is None:
        logger.warning("MySQL connection not available. Returning mock data.")
        return []  # Return empty list for mock data
        
    try:
        connection = mysql_pool.get_connection()
        cursor = connection.cursor(dictionary=True)
        
        try:
            cursor.execute(query, params or ())
            if query.strip().upper().startswith('SELECT'):
                result = cursor.fetchall()
            else:
                result = cursor.rowcount
            connection.commit()
            return result
        finally:
            cursor.close()
            connection.close()
    except Exception as e:
        logger.error(f"MySQL query error: {str(e)}")
        raise

@retry_on_error()
async def execute_sqlserver_query(query: str, params=None):
    """Execute a SQL Server query with retry logic"""
    if FORCE_DEMO_DATA:
        logger.warning("SQL Server connection not available. Returning mock data.")
        return []  # Return empty list for mock data
        
    try:
        # Create a direct connection instead of using pool
        connection_string = f"DRIVER={SQL_SERVER_CONFIG['driver']};SERVER={SQL_SERVER_CONFIG['server']};DATABASE={SQL_SERVER_CONFIG['database']};UID={SQL_SERVER_CONFIG['uid']};PWD={SQL_SERVER_CONFIG['pwd']};TrustServerCertificate=yes"
        connection = pyodbc.connect(connection_string)
        cursor = connection.cursor()
        
        try:
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            
            if query.strip().upper().startswith('SELECT'):
                columns = [column[0] for column in cursor.description]
                result = [dict(zip(columns, row)) for row in cursor.fetchall()]
            else:
                result = cursor.rowcount
            connection.commit()
            return result
        finally:
            cursor.close()
            connection.close()
    except Exception as e:
        logger.error(f"SQL Server query error: {str(e)}")
        raise

# Health check functions - non-async version for direct calls
def check_mysql_health():
    """Check MySQL connection health"""
    if FORCE_DEMO_DATA:
        return {
            "status": "demo",
            "version": "Demo Mode"
        }
        
    try:
        if mysql_pool is None:
            return {
                "status": "unhealthy",
                "error": "MySQL connection pool not initialized"
            }
            
        connection = mysql_pool.get_connection()
        cursor = connection.cursor()
        cursor.execute("SELECT VERSION()")
        version = cursor.fetchone()[0]
        cursor.close()
        connection.close()
        return {
            "status": "healthy",
            "version": version
        }
    except Exception as e:
        logger.error(f"MySQL health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }

def check_sqlserver_health():
    """Check SQL Server connection health"""
    if FORCE_DEMO_DATA:
        return {
            "status": "demo",
            "version": "Demo Mode"
        }
        
    try:
        # Create a direct connection instead of using pool
        connection_string = f"DRIVER={SQL_SERVER_CONFIG['driver']};SERVER={SQL_SERVER_CONFIG['server']};DATABASE={SQL_SERVER_CONFIG['database']};UID={SQL_SERVER_CONFIG['uid']};PWD={SQL_SERVER_CONFIG['pwd']};TrustServerCertificate=yes"
        connection = pyodbc.connect(connection_string)
        cursor = connection.cursor()
        cursor.execute("SELECT @@VERSION")
        version = cursor.fetchone()[0]
        cursor.close()
        connection.close()
        return {
            "status": "healthy",
            "version": version
        }
    except Exception as e:
        logger.error(f"SQL Server health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }

# SQL Server Connection settings
sql_server_config = {
    'server': os.getenv('SQLSERVER_HOST', '.'),
    'database': os.getenv('SQLSERVER_DATABASE', 'HUMAN'),
    'username': os.getenv('SQLSERVER_USER', 'sa'),
    'password': os.getenv('SQLSERVER_PASSWORD', 'trunghieu013'),
    'pool_size': int(os.getenv('SQLSERVER_POOL_SIZE', '10')),
    'connection_timeout': int(os.getenv('SQLSERVER_TIMEOUT', '30')),
    'max_retries': int(os.getenv('SQLSERVER_MAX_RETRIES', '3')),
    'retry_delay': int(os.getenv('SQLSERVER_RETRY_DELAY', '1')),
}

# SQL Server connection pool
sql_server_pool = []
sql_server_pool_lock = False

def retry_on_error(max_retries=3, delay=1):
    """Decorator for retrying database operations"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            last_error = None
            for attempt in range(max_retries):
                try:
                    return await func(*args, **kwargs)
                except (pyodbc.Error, MySQLError) as e:
                    last_error = e
                    if attempt < max_retries - 1:
                        wait_time = delay * (attempt + 1)
                        logger.warning(f"Attempt {attempt + 1} failed, retrying in {wait_time}s: {str(e)}")
                        time.sleep(wait_time)
                    else:
                        logger.error(f"All {max_retries} attempts failed: {str(e)}")
                        raise
            raise last_error
        return wrapper
    return decorator

# Find available SQL Server driver
def get_sql_server_driver():
    """Find and test available SQL Server drivers"""
    drivers = [
        '{ODBC Driver 18 for SQL Server}',
        '{ODBC Driver 17 for SQL Server}',
        '{SQL Server Native Client 11.0}',
        '{SQL Server}'
    ]
    for driver in drivers:
        try:
            test_conn_string = (
                f"DRIVER={driver};"
                f"SERVER={sql_server_config['server']};"
                "DATABASE=master;"
                f"UID={sql_server_config['username']};"
                f"PWD={sql_server_config['password']};"
                "TrustServerCertificate=yes;"
                "Encrypt=no;"
                f"Connection Timeout={sql_server_config['connection_timeout']};"
            )
            pyodbc.connect(test_conn_string, timeout=1)
            logger.info(f"Found SQL Server driver: {driver}")
            return driver
        except pyodbc.Error:
            continue
    return '{SQL Server}'  # Default fallback

# Add driver to SQL Server config after detection
sql_server_config['driver'] = get_sql_server_driver()

async def initialize_sql_server_pool():
    """Initialize the SQL Server connection pool"""
    global sql_server_pool, sql_server_pool_lock
    
    if sql_server_pool_lock:
        return
    
    sql_server_pool_lock = True
    try:
        # Build connection string
        connection_string = (
            f"DRIVER={sql_server_config['driver']};"
            f"SERVER={sql_server_config['server']};"
            f"DATABASE={sql_server_config['database']};"
            f"UID={sql_server_config['username']};"
            f"PWD={sql_server_config['password']};"
            "TrustServerCertificate=yes;"
            "Encrypt=no;"
            f"Connection Timeout={sql_server_config['connection_timeout']};"
            "ApplicationIntent=ReadWrite;"
            "CharacterSet=UTF-8;"
        )
        
        # Create pool connections
        for _ in range(sql_server_config['pool_size']):
            conn = pyodbc.connect(connection_string)
            conn.setencoding(encoding='cp1252')
            conn.setdecoding(pyodbc.SQL_CHAR, encoding='cp1252')
            conn.setdecoding(pyodbc.SQL_WCHAR, encoding='cp1252')
            sql_server_pool.append({"connection": conn, "in_use": False})
        
        logger.info(f"SQL Server connection pool initialized with {sql_server_config['pool_size']} connections")
    except Exception as e:
        logger.error(f"Error initializing SQL Server pool: {str(e)}")
        sql_server_pool = []
    finally:
        sql_server_pool_lock = False

async def get_sql_server_connection_from_pool():
    """Get a connection from the SQL Server pool"""
    if not sql_server_pool:
        await initialize_sql_server_pool()
    
    # Find available connection
    for conn_info in sql_server_pool:
        if not conn_info["in_use"]:
            try:
                # Test connection before using
                conn_info["connection"].execute("SELECT 1")
                conn_info["in_use"] = True
                return conn_info
            except pyodbc.Error:
                # Connection is dead, create new one
                try:
                    conn_info["connection"] = await get_sqlserver_connection()
                    conn_info["in_use"] = True
                    return conn_info
                except:
                    continue
    
    # No available connections, create new one
    raise HTTPException(
        status_code=503,
        detail={"Status": False, "Message": "No database connections available"}
    )

@retry_on_error(max_retries=3, delay=1)
async def execute_sqlserver_query(query: str, params: dict = None):
    """Execute a SQL Server query and return results"""
    conn_info = None
    try:
        conn_info = await get_sql_server_connection_from_pool()
        connection = conn_info["connection"]
        cursor = connection.cursor()
        
        if params:
            # Handle named parameters in SQL Server query
            for key, value in params.items():
                # Replace named parameters with ? placeholders
                query = query.replace(f"@{key}", "?")
            
            # Execute with parameters as a tuple in the same order they appear in the query
            cursor.execute(query, tuple(params.values()))
        else:
            cursor.execute(query)
        
        if query.strip().upper().startswith(('SELECT')):
            columns = [column[0] for column in cursor.description]
            rows = cursor.fetchall()
            
            # Convert rows to dictionaries
            result = []
            for row in rows:
                result.append(dict(zip(columns, row)))
            
            return result
        else:
            connection.commit()
            return {"affected_rows": cursor.rowcount}
    except pyodbc.Error as err:
        logger.error(f"Error executing SQL Server query: {err}")
        raise HTTPException(
            status_code=500,
            detail={"Status": False, "Error": str(err), "Message": "Database query failed"}
        )
    finally:
        if conn_info:
            conn_info["in_use"] = False

# Get MySQL connection from pool
async def get_mysql_connection():
    """Get a connection from the MySQL pool"""
    if not mysql_pool:
        raise Exception("MySQL connection pool not available")
    
    try:
        connection = mysql_pool.get_connection()
        return connection
    except MySQLError as err:
        logger.error(f"Error getting MySQL connection: {err}")
        raise

# Execute MySQL query
async def execute_mysql_query(query: str, params: tuple = None):
    """Execute a MySQL query and return results"""
    connection = None
    try:
        connection = await get_mysql_connection()
        cursor = connection.cursor(dictionary=True)
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        
        if query.strip().upper().startswith(('SELECT', 'SHOW')):
            result = cursor.fetchall()
            return result
        else:
            connection.commit()
            return {"affected_rows": cursor.rowcount}
    except MySQLError as err:
        logger.error(f"Error executing MySQL query: {err}")
        raise
    finally:
        if connection:
            connection.close()

# Get SQL Server connection
async def get_sqlserver_connection():
    """Get a connection to SQL Server"""
    try:
        # Build connection string with additional parameters for stability
        connection_string = (
            f"DRIVER={SQL_SERVER_CONFIG['driver']};"
            f"SERVER={SQL_SERVER_CONFIG['server']};"
            f"DATABASE={SQL_SERVER_CONFIG['database']};"
            f"UID={SQL_SERVER_CONFIG['uid']};"
            f"PWD={SQL_SERVER_CONFIG['pwd']};"
            "TrustServerCertificate=yes;"
            "Encrypt=no;"
            "Connection Timeout=30;"
            "ApplicationIntent=ReadWrite;"
        )
        logger.info("Attempting SQL Server connection")
        connection = pyodbc.connect(connection_string)
        connection.setencoding(encoding='utf-8')
        connection.setdecoding(pyodbc.SQL_CHAR, encoding='utf-8')
        connection.setdecoding(pyodbc.SQL_WCHAR, encoding='utf-8')
        logger.info("SQL Server connection successful")
        return connection
    except pyodbc.Error as err:
        error_msg = str(err)
        logger.error(f"Error connecting to SQL Server: {error_msg}")
        if "Login failed" in error_msg:
            raise HTTPException(
                status_code=500,
                detail={"Status": False, "Error": "Database authentication failed", "Message": "Invalid username or password"}
            )
        elif "Cannot open database" in error_msg:
            raise HTTPException(
                status_code=500,
                detail={"Status": False, "Error": "Database not found", "Message": f"Database '{SQL_SERVER_CONFIG['database']}' does not exist"}
            )
        else:
            raise HTTPException(
                status_code=500,
                detail={"Status": False, "Error": "Connection failed", "Message": "Could not connect to database server"}
            )

# Async health check functions
async def check_mysql_health_async() -> Dict[str, Any]:
    """Check MySQL connection health asynchronously"""
    return check_mysql_health()

async def check_sqlserver_health_async() -> Dict[str, Any]:
    """Check SQL Server connection health asynchronously"""
    return check_sqlserver_health() 