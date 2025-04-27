import pyodbc
from dotenv import load_dotenv
import os

load_dotenv()

def test_sqlserver_connection():
    try:
        # Find available SQL Server driver
        drivers = [
            '{ODBC Driver 18 for SQL Server}',
            '{ODBC Driver 17 for SQL Server}',
            '{SQL Server Native Client 11.0}',
            '{SQL Server}'
        ]
        
        driver = None
        for d in drivers:
            try:
                print(f"Testing driver: {d}")
                connection_string = (
                    f"DRIVER={d};"
                    f"SERVER={os.getenv('SQLSERVER_HOST', '.')};"
                    f"DATABASE={os.getenv('SQLSERVER_DATABASE', 'HUMAN')};"
                    f"UID={os.getenv('SQLSERVER_USER', 'sa')};"
                    f"PWD={os.getenv('SQLSERVER_PASSWORD', 'trunghieu013')};"
                    "TrustServerCertificate=yes;"
                    "Encrypt=no;"
                )
                conn = pyodbc.connect(connection_string, timeout=3)
                driver = d
                print(f"Successfully connected using {d}")
                break
            except pyodbc.Error as e:
                print(f"Failed with {d}: {str(e)}")
                continue
        
        if not driver:
            print("No working SQL Server driver found!")
            return
        
        # Test connection and check tables
        connection_string = (
            f"DRIVER={driver};"
            f"SERVER={os.getenv('SQLSERVER_HOST', '.')};"
            f"DATABASE={os.getenv('SQLSERVER_DATABASE', 'HUMAN')};"
            f"UID={os.getenv('SQLSERVER_USER', 'sa')};"
            f"PWD={os.getenv('SQLSERVER_PASSWORD', 'trunghieu013')};"
            "TrustServerCertificate=yes;"
            "Encrypt=no;"
        )
        
        connection = pyodbc.connect(connection_string)
        print("\nSuccessfully connected to SQL Server!")
        
        # Get server version
        cursor = connection.cursor()
        cursor.execute("SELECT @@VERSION")
        version = cursor.fetchone()[0]
        print(f"\nSQL Server Version:\n{version}")
        
        # Check required tables
        required_tables = [
            '[HUMAN].[dbo].[Departments]',
            '[HUMAN].[dbo].[Employees]',
            '[HUMAN].[dbo].[Positions]',
            '[HUMAN].[dbo].[Attendance]',
            '[HUMAN].[dbo].[Payroll]'
        ]
        
        print("\nChecking required tables:")
        for table in required_tables:
            try:
                cursor.execute(f"SELECT TOP 1 * FROM {table}")
                print(f"✓ {table} exists and is accessible")
                # Print column names
                print("  Columns:", ", ".join([column[0] for column in cursor.description]))
            except pyodbc.Error as e:
                print(f"✗ Error with {table}: {str(e)}")
        
        # Test specific queries
        print("\nTesting specific queries:")
        
        # Test employee stats query
        print("\nTesting employee stats query:")
        query = """
            SELECT TOP 1
                d.DepartmentName,
                COUNT(e.EmployeeID) as TotalEmployees,
                AVG(CAST(e.Salary as FLOAT)) as AverageSalary,
                SUM(CASE WHEN YEAR(e.HireDate) = 2025 THEN 1 ELSE 0 END) as NewHires,
                COUNT(CASE WHEN a.Status = 'Leave' AND YEAR(a.Date) = 2025 THEN 1 END) as TotalLeaves
            FROM [HUMAN].[dbo].[Departments] d
            LEFT JOIN [HUMAN].[dbo].[Employees] e ON d.DepartmentID = e.DepartmentID
            LEFT JOIN [HUMAN].[dbo].[Attendance] a ON e.EmployeeID = a.EmployeeID
            GROUP BY d.DepartmentName
        """
        try:
            cursor.execute(query)
            print("✓ Employee stats query executed successfully")
            result = cursor.fetchone()
            if result:
                print("  Sample result:", dict(zip([column[0] for column in cursor.description], result)))
        except pyodbc.Error as e:
            print(f"✗ Error executing employee stats query: {str(e)}")
        
        cursor.close()
        connection.close()
        
    except pyodbc.Error as err:
        print(f"\nError: {err}")
        print("\nPlease check:")
        print("1. SQL Server is running")
        print("2. Credentials in .env are correct")
        print("3. Database 'HUMAN' exists")
        print("4. SQL Server is accepting TCP/IP connections")
        print("5. SQL Server port is accessible")
        print("6. Required ODBC drivers are installed")

if __name__ == "__main__":
    test_sqlserver_connection() 