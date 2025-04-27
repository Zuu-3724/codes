import requests

def test_login():
    # Login to get token
    login_url = "http://localhost:9000/auth/login"
    login_data = {"username": "admin", "password": "admin123"}
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    
    response = requests.post(login_url, data=login_data, headers=headers)
    print("\nLogin Response:", response.json())
    
    if response.status_code == 200:
        token = response.json()["token"]
        print("\nToken:", token)
        
        # Test departments endpoint
        departments_url = "http://localhost:9000/departments"
        auth_headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(departments_url, headers=auth_headers)
        print("\nDepartments Response:", response.json())
    else:
        print("Login failed:", response.text)

if __name__ == "__main__":
    test_login() 