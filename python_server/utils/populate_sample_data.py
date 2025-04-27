"""
Script to populate sample data in the payroll MySQL database.
"""
import asyncio
import sys
import os
import bcrypt
import random
from datetime import datetime, timedelta

# Add parent directory to path to run this script directly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.db import execute_mysql_query

# Sample data for departments
DEPARTMENTS = [
    {"name": "Human Resources", "description": "HR department"},
    {"name": "Finance", "description": "Finance department"},
    {"name": "Information Technology", "description": "IT department"},
    {"name": "Sales", "description": "Sales department"},
    {"name": "Operations", "description": "Operations department"},
    {"name": "Marketing", "description": "Marketing department"},
]

# Sample data for positions
POSITIONS = [
    {"name": "HR Manager", "description": "HR Manager", "department_id": 1},
    {"name": "HR Specialist", "description": "HR Specialist", "department_id": 1},
    {"name": "Finance Manager", "description": "Finance Manager", "department_id": 2},
    {"name": "Accountant", "description": "Accountant", "department_id": 2},
    {"name": "IT Manager", "description": "IT Manager", "department_id": 3},
    {"name": "Software Developer", "description": "Software Developer", "department_id": 3},
    {"name": "Sales Manager", "description": "Sales Manager", "department_id": 4},
    {"name": "Sales Representative", "description": "Sales Representative", "department_id": 4},
    {"name": "Operations Manager", "description": "Operations Manager", "department_id": 5},
    {"name": "Operations Specialist", "description": "Operations Specialist", "department_id": 5},
    {"name": "Marketing Manager", "description": "Marketing Manager", "department_id": 6},
    {"name": "Marketing Specialist", "description": "Marketing Specialist", "department_id": 6},
]

# Sample data for employees
EMPLOYEES = [
    {"first_name": "Anh", "last_name": "Nguyen", "position_id": 1, "department_id": 1, "email": "anh.nguyen@company.com", "phone": "0901234567"},
    {"first_name": "Binh", "last_name": "Tran", "position_id": 3, "department_id": 2, "email": "binh.tran@company.com", "phone": "0912345678"},
    {"first_name": "Cuong", "last_name": "Le", "position_id": 1, "department_id": 2, "email": "cuong.le@company.com", "phone": "0923456789"},
    {"first_name": "Duyen", "last_name": "Pham", "position_id": 3, "department_id": 2, "email": "duyen.pham@company.com", "phone": "0934567890"},
    {"first_name": "Dat", "last_name": "Hoang", "position_id": 1, "department_id": 3, "email": "dat.hoang@company.com", "phone": "0945678901"},
    {"first_name": "Huong", "last_name": "Vu", "position_id": 3, "department_id": 3, "email": "huong.vu@company.com", "phone": "0956789012"},
    {"first_name": "Khanh", "last_name": "Tran", "position_id": 1, "department_id": 4, "email": "khanh.tran@company.com", "phone": "0967890123"},
    {"first_name": "Linh", "last_name": "Nguyen", "position_id": 3, "department_id": 4, "email": "linh.nguyen@company.com", "phone": "0978901234"},
    {"first_name": "Minh", "last_name": "Phan", "position_id": 1, "department_id": 5, "email": "minh.phan@company.com", "phone": "0989012345"},
]

async def create_tables():
    """Create necessary tables if they don't exist"""
    # Create user table
    await execute_mysql_query("""
        CREATE TABLE IF NOT EXISTS user (
            UserID INT AUTO_INCREMENT PRIMARY KEY,
            Username VARCHAR(50) NOT NULL UNIQUE,
            Password VARCHAR(255) NOT NULL,
            Role VARCHAR(50) NOT NULL,
            Status BOOLEAN DEFAULT 1,
            CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            LastLoginAt TIMESTAMP NULL,
            CONSTRAINT CHK_Role CHECK (Role IN ('Admin', 'HR Manager', 'Employee'))
        )
    """)
    
    # Create department table
    await execute_mysql_query("""
        CREATE TABLE IF NOT EXISTS department (
            DepartmentID INT AUTO_INCREMENT PRIMARY KEY,
            DepartmentName VARCHAR(100) NOT NULL,
            Description TEXT,
            CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    """)
    
    # Create position table
    await execute_mysql_query("""
        CREATE TABLE IF NOT EXISTS position (
            PositionID INT AUTO_INCREMENT PRIMARY KEY,
            PositionName VARCHAR(100) NOT NULL,
            Description TEXT,
            DepartmentID INT,
            CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (DepartmentID) REFERENCES department(DepartmentID)
        )
    """)
    
    # Create employee table
    await execute_mysql_query("""
        CREATE TABLE IF NOT EXISTS employee (
            EmployeeID INT AUTO_INCREMENT PRIMARY KEY,
            FirstName VARCHAR(50) NOT NULL,
            LastName VARCHAR(50) NOT NULL,
            Gender ENUM('Male', 'Female', 'Other') DEFAULT 'Male',
            DateOfBirth DATE,
            Email VARCHAR(100),
            Phone VARCHAR(20),
            Address TEXT,
            PositionID INT,
            DepartmentID INT,
            JoinDate DATE DEFAULT (CURRENT_DATE),
            EndDate DATE,
            Salary DECIMAL(15, 2) DEFAULT 0,
            Status ENUM('Active', 'Inactive', 'On Leave') DEFAULT 'Active',
            CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (PositionID) REFERENCES `position`(PositionID),
            FOREIGN KEY (DepartmentID) REFERENCES department(DepartmentID)
        )
    """)

async def populate_users():
    """Populate users table with sample data"""
    print("Populating users...")
    
    # Check if users already exist
    existing_users = await execute_mysql_query("SELECT COUNT(*) as count FROM user")
    if existing_users[0]['count'] > 0:
        print("Users already exist, skipping...")
        return
    
    # Create admin user
    hashed_password = bcrypt.hashpw("admin123".encode(), bcrypt.gensalt()).decode()
    await execute_mysql_query(
        "INSERT INTO user (Username, Password, Role) VALUES (%s, %s, %s)",
        ("admin", hashed_password, "Admin")
    )
    
    # Create HR manager user
    hashed_password = bcrypt.hashpw("hr123".encode(), bcrypt.gensalt()).decode()
    await execute_mysql_query(
        "INSERT INTO user (Username, Password, Role) VALUES (%s, %s, %s)",
        ("hr", hashed_password, "HR Manager")
    )
    
    # Create employee user
    hashed_password = bcrypt.hashpw("employee123".encode(), bcrypt.gensalt()).decode()
    await execute_mysql_query(
        "INSERT INTO user (Username, Password, Role) VALUES (%s, %s, %s)",
        ("employee", hashed_password, "Employee")
    )
    
    print("Added 3 users")

async def populate_departments():
    """Populate departments table with sample data"""
    print("Populating departments...")
    
    # Check if departments already exist
    existing_depts = await execute_mysql_query("SELECT COUNT(*) as count FROM department")
    if existing_depts[0]['count'] > 0:
        print("Departments already exist, skipping...")
        return
    
    for dept in DEPARTMENTS:
        await execute_mysql_query(
            "INSERT INTO department (DepartmentName, Description) VALUES (%s, %s)",
            (dept["name"], dept["description"])
        )
    
    print(f"Added {len(DEPARTMENTS)} departments")

async def populate_positions():
    """Populate positions table with sample data"""
    print("Populating positions...")
    
    # Check if positions already exist
    existing_positions = await execute_mysql_query("SELECT COUNT(*) as count FROM position")
    if existing_positions[0]['count'] > 0:
        print("Positions already exist, skipping...")
        return
    
    for position in POSITIONS:
        await execute_mysql_query(
            "INSERT INTO position (PositionName, Description, DepartmentID) VALUES (%s, %s, %s)",
            (position["name"], position["description"], position["department_id"])
        )
    
    print(f"Added {len(POSITIONS)} positions")

async def populate_employees():
    """Populate employees table with sample data"""
    print("Populating employees...")
    
    # Check if employees already exist
    existing_employees = await execute_mysql_query("SELECT COUNT(*) as count FROM employee")
    if existing_employees[0]['count'] > 0:
        print("Employees already exist, skipping...")
        return
    
    # Get current year for join date calculation
    current_year = datetime.now().year
    
    for emp in EMPLOYEES:
        # Generate random join date within the last 3 years
        years_ago = random.randint(0, 3)
        months_ago = random.randint(0, 11)
        days_ago = random.randint(0, 28)
        join_date = datetime(current_year - years_ago, 1, 1) + timedelta(days=months_ago*30 + days_ago)
        
        # Generate random salary based on position (higher for managers)
        base_salary = 15000000 if "Manager" in POSITIONS[emp["position_id"]-1]["name"] else 10000000
        variation = random.uniform(0.8, 1.2)
        salary = base_salary * variation
        
        # Generate random birth date (25-45 years old)
        age = random.randint(25, 45)
        birth_year = current_year - age
        birth_date = datetime(birth_year, random.randint(1, 12), random.randint(1, 28))
        
        await execute_mysql_query(
            """
            INSERT INTO employee 
            (FirstName, LastName, Gender, DateOfBirth, Email, Phone, PositionID, DepartmentID, JoinDate, Salary) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                emp["first_name"], 
                emp["last_name"], 
                "Male" if random.random() > 0.5 else "Female",
                birth_date.strftime("%Y-%m-%d"),
                emp["email"], 
                emp["phone"], 
                emp["position_id"], 
                emp["department_id"], 
                join_date.strftime("%Y-%m-%d"),
                salary
            )
        )
    
    print(f"Added {len(EMPLOYEES)} employees")

async def main():
    """Main function to populate all data"""
    print("Starting database population...")
    
    try:
        # Create tables first
        await create_tables()
        
        # Populate tables with data
        await populate_users()
        await populate_departments()
        await populate_positions()
        await populate_employees()
        
        print("Database population completed successfully!")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    # Run the async main function
    asyncio.run(main()) 