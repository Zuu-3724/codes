import mysql.connector
import bcrypt
import logging
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("setup_admin")

def setup_admin_user():
    """Set up admin user and ensure tables exist with proper naming"""
    try:
        # Connect to MySQL server
        connection = mysql.connector.connect(
            host=os.getenv('MYSQL_HOST', 'localhost'),
            user=os.getenv('MYSQL_USER', 'root'),
            password=os.getenv('MYSQL_PASSWORD', 'YES'),
            database=os.getenv('MYSQL_DATABASE', 'payroll')
        )
        cursor = connection.cursor()
        
        # Check if user table exists (lowercase)
        cursor.execute("SHOW TABLES LIKE 'user'")
        user_table_exists = cursor.fetchone()
        
        # Check if users table exists (plural)
        cursor.execute("SHOW TABLES LIKE 'users'")
        users_table_exists = cursor.fetchone()
        
        # Create user table if needed
        if not user_table_exists:
            logger.info("Creating 'user' table...")
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS user (
                    UserID INT AUTO_INCREMENT PRIMARY KEY,
                    Username VARCHAR(50) NOT NULL UNIQUE,
                    Password VARCHAR(255) NOT NULL,
                    Email VARCHAR(100),
                    Role VARCHAR(20) NOT NULL DEFAULT 'Employee',
                    Status TINYINT(1) NOT NULL DEFAULT 1,
                    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    LastLoginAt TIMESTAMP NULL
                )
            """)
            logger.info("Created 'user' table")
        
        # Create admin user
        # Hash password
        hashed_password = bcrypt.hashpw(
            "admin123".encode('utf-8'), 
            bcrypt.gensalt()
        ).decode('utf-8')
        
        # Check if admin user exists
        cursor.execute("SELECT COUNT(*) FROM user WHERE Username = 'admin'")
        admin_exists = cursor.fetchone()[0]
        
        if not admin_exists:
            logger.info("Creating admin user...")
            cursor.execute("""
                INSERT INTO user (Username, Password, Role, Status) 
                VALUES ('admin', %s, 'Admin', 1)
            """, (hashed_password,))
            logger.info("Created admin user!")
        else:
            logger.info("Admin user already exists.")
        
        # Commit changes
        connection.commit()
        logger.info("Admin setup completed successfully")
        
    except Exception as e:
        logger.error(f"Error setting up admin user: {str(e)}")
        raise
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()

if __name__ == "__main__":
    setup_admin_user() 