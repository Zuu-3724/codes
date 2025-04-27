import mysql.connector
import pyodbc
from dotenv import load_dotenv
import os

load_dotenv()

def test_mysql_connection():
    try:
        connection = mysql.connector.connect(
            host=os.getenv('DB_HOST'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD'),
            database=os.getenv('DB_NAME'),
            port=int(os.getenv('DB_PORT', 3306))
        )
        print("Successfully connected to MySQL!")
        
        # Test query
        cursor = connection.cursor()
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        print("\nAvailable tables:")
        for table in tables:
            print(f"- {table[0]}")
            
        cursor.close()
        connection.close()
        
    except mysql.connector.Error as err:
        print(f"Error: {err}")
        print("\nPlease check:")
        print("1. MySQL server is running")
        print("2. Credentials in .env are correct")
        print("3. Database 'payroll' exists")
        print(f"4. Port {os.getenv('DB_PORT', 3306)} is correct")

def test_sqlserver_connection():
    try:
        conn_str = (
            f"DRIVER={{ODBC Driver 17 for SQL Server}};"
            f"SERVER={os.getenv('SQLSERVER_HOST', '.')};"
            f"DATABASE={os.getenv('SQLSERVER_DATABASE', 'HUMAN')};"
            f"UID={os.getenv('SQLSERVER_USER', 'sa')};"
            f"PWD={os.getenv('SQLSERVER_PASSWORD', 'trunghieu013')};"
            "TrustServerCertificate=yes;"
        )
        connection = pyodbc.connect(conn_str)
        print("\nSuccessfully connected to SQL Server!")
        
        # Test query
        cursor = connection.cursor()
        cursor.execute("SELECT * FROM [HUMAN].[dbo].[Users]")
        users = cursor.fetchall()
        print("\nAvailable users:")
        for user in users:
            print(f"- {user.Username}")
            
        cursor.close()
        connection.close()
        
    except pyodbc.Error as err:
        print(f"\nSQL Server Error: {err}")
        print("\nPlease check:")
        print("1. SQL Server is running")
        print("2. Credentials in .env are correct")
        print("3. Database 'HUMAN' exists")
        print("4. ODBC Driver 17 for SQL Server is installed")

if __name__ == "__main__":
    test_mysql_connection()
    test_sqlserver_connection() 