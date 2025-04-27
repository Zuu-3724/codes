import pytest
from fastapi.testclient import TestClient
import os
import sys
from datetime import datetime

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the FastAPI app
from main import app

# Create test client
client = TestClient(app)

# Test variables
test_user = {
    "username": f"testuser_{datetime.now().timestamp()}",
    "password": "test1234",
    "role": "User"
}
admin_user = {"username": "admin", "password": "admin123"}
test_token = ""

# Test the root endpoint
def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()

# Test the health check endpoint
def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert "status" in response.json()
    assert "databases" in response.json()

# Authentication tests
def test_register_user():
    response = client.post("/auth/register", json=test_user)
    assert response.status_code == 200
    assert response.json()["Status"] is True
    assert "Registration successful" in response.json()["Message"]

def test_login():
    global test_token
    
    # Login with test user
    response = client.post(
        "/auth/login",
        data={"username": test_user["username"], "password": test_user["password"]}
    )
    
    assert response.status_code == 200
    assert response.json()["Status"] is True
    assert "token" in response.json()
    
    # Save token for future tests
    test_token = response.json()["token"]

def test_check_auth():
    # Skip if no token
    if not test_token:
        pytest.skip("No authentication token available")
        
    response = client.get(
        "/auth/check-auth",
        cookies={"token": test_token}
    )
    
    assert response.status_code == 200
    assert response.json()["Status"] is True
    assert "Data" in response.json()

# Employee tests
def test_get_employees():
    # Skip if no token
    if not test_token:
        pytest.skip("No authentication token available")
    
    response = client.get(
        "/employees",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    
    # Check for either a successful response or a fallback to mock data
    assert response.status_code == 200
    assert response.json()["Status"] is True
    assert "Data" in response.json()

def test_get_employee_list():
    # Skip if no token
    if not test_token:
        pytest.skip("No authentication token available")
    
    response = client.get(
        "/employees/list",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    
    assert response.status_code == 200
    assert response.json()["Status"] is True
    assert "Data" in response.json()

# Payroll tests
def test_get_salary():
    # Skip if no token
    if not test_token:
        pytest.skip("No authentication token available")
    
    response = client.get(
        "/payroll/salary",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    
    assert response.status_code == 200
    assert response.json()["Status"] is True
    assert "Data" in response.json()

def test_get_attendance():
    # Skip if no token
    if not test_token:
        pytest.skip("No authentication token available")
    
    response = client.get(
        "/payroll/attendance",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    
    assert response.status_code == 200
    assert response.json()["Status"] is True
    assert "Data" in response.json()

# Test logout
def test_logout():
    response = client.post("/auth/logout")
    assert response.status_code == 200
    assert response.json()["Status"] is True 