import os
import logging
import requests
import json
import mysql.connector
import time
# Comment out dotenv import
# from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("debug_auth")

# Comment out this line
# load_dotenv()

def check_mysql_connection():
    """Check MySQL connection"""
    try:
        connection = mysql.connector.connect(
            host='localhost',
            user='root',
            password='YES',
            database='payroll'
        )
        cursor = connection.cursor()
        cursor.execute("SELECT VERSION()")
        version = cursor.fetchone()
        logger.info(f"MySQL connection successful. Version: {version[0]}")
        
        # Check user table
        cursor.execute("SHOW TABLES LIKE 'user'")
        if cursor.fetchone():
            logger.info("User table exists")
            cursor.execute("SELECT COUNT(*) FROM user")
            count = cursor.fetchone()[0]
            logger.info(f"User table has {count} rows")
            if count > 0:
                cursor.execute("SELECT UserID, Username, Role FROM user LIMIT 5")
                users = cursor.fetchall()
                for user in users:
                    logger.info(f"User: {user}")
        else:
            logger.warning("User table does not exist")
            
        # Close connection
        cursor.close()
        connection.close()
        return True
    except Exception as e:
        logger.error(f"MySQL connection error: {str(e)}")
        return False

def test_login():
    """Test login API"""
    try:
        api_url = "http://localhost:9000/auth/login-json"
        credentials = {
            "username": "admin",
            "password": "admin123"
        }
        
        logger.info(f"Testing login API at {api_url} with credentials: {credentials['username']}")
        response = requests.post(api_url, json=credentials)
        
        logger.info(f"Login response status code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            logger.info(f"Login response: {data}")
            return data.get("token")
        else:
            logger.error(f"Login failed with status {response.status_code}")
            logger.error(f"Response: {response.text}")
            return None
    except Exception as e:
        logger.error(f"Login request error: {str(e)}")
        return None

def test_payroll_api(token):
    """Test payroll API with token"""
    try:
        api_url = "http://localhost:9000/payroll/salary"
        headers = {"Authorization": f"Bearer {token}"}
        
        logger.info(f"Testing payroll API at {api_url} with token")
        response = requests.get(api_url, headers=headers)
        
        logger.info(f"Payroll API response status code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            logger.info(f"Payroll API response: {data}")
            return True
        else:
            logger.error(f"Payroll API request failed with status {response.status_code}")
            logger.error(f"Response: {response.text}")
            return False
    except Exception as e:
        logger.error(f"Payroll API request error: {str(e)}")
        return False

def test_health_api():
    """Test health API"""
    try:
        api_url = "http://localhost:9000/health"
        
        logger.info(f"Testing health API at {api_url}")
        response = requests.get(api_url)
        
        logger.info(f"Health API response status code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            logger.info(f"Health API response: {data}")
            return True
        else:
            logger.error(f"Health API request failed with status {response.status_code}")
            logger.error(f"Response: {response.text}")
            return False
    except Exception as e:
        logger.error(f"Health API request error: {str(e)}")
        return False

def test_payroll_test_api(token):
    """Test payroll test API with token"""
    try:
        api_url = "http://localhost:9000/payroll/test"
        headers = {"Authorization": f"Bearer {token}"}
        
        logger.info(f"Testing payroll test API at {api_url} with token")
        response = requests.get(api_url, headers=headers)
        
        logger.info(f"Payroll test API response status code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            logger.info(f"Payroll test API response: {data}")
            return True
        else:
            logger.error(f"Payroll test API request failed with status {response.status_code}")
            logger.error(f"Response: {response.text}")
            return False
    except Exception as e:
        logger.error(f"Payroll test API request error: {str(e)}")
        return False

if __name__ == "__main__":
    logger.info("Starting authentication and connection debug")
    
    # Check MySQL connection
    logger.info("\n=== MySQL Connection Check ===")
    mysql_ok = check_mysql_connection()
    
    # Test health API
    logger.info("\n=== Health API Check ===")
    health_ok = test_health_api()
    
    # Test login
    logger.info("\n=== Login API Check ===")
    token = test_login()
    
    # Test payroll API if login was successful
    if token:
        logger.info("\n=== Payroll API Check ===")
        payroll_ok = test_payroll_api(token)
    else:
        payroll_ok = False
    
    # Test payroll test API if login was successful
    if token:
        logger.info("\n=== Payroll Test API Check ===")
        payroll_test_ok = test_payroll_test_api(token)
    else:
        payroll_test_ok = False
    
    # Summary
    logger.info("\n=== Summary ===")
    logger.info(f"MySQL Connection: {'OK' if mysql_ok else 'FAILED'}")
    logger.info(f"Health API: {'OK' if health_ok else 'FAILED'}")
    logger.info(f"Login API: {'OK' if token else 'FAILED'}")
    logger.info(f"Payroll API: {'OK' if payroll_ok else 'FAILED'}")
    logger.info(f"Payroll Test API: {'OK' if payroll_test_ok else 'FAILED'}") 