import tkinter as tk
from login_app import LoginApp

def main():
    """Main entry point for the HR-Payroll application"""
    # Create the root window
    root = tk.Tk()
    
    # Initialize the login app
    app = LoginApp(root)
    
    # Start the main loop
    root.mainloop()

if __name__ == "__main__":
    main() 