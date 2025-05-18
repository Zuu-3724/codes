from pydantic import BaseModel, validator, Field, EmailStr
from typing import List, Dict, Any, Optional
from datetime import date, datetime
from enum import Enum

# Enum cho các giá trị cố định


class EmployeeStatus(str, Enum):
    ACTIVE = "Active"
    INACTIVE = "Inactive"
    ON_LEAVE = "On Leave"
    TERMINATED = "Terminated"


class Gender(str, Enum):
    MALE = "Male"
    FEMALE = "Female"
    OTHER = "Other"

# Base Schemas


class DepartmentBase(BaseModel):
    DepartmentID: Optional[int] = None
    DepartmentName: str
    Description: Optional[str] = None


class PositionBase(BaseModel):
    PositionID: Optional[int] = None
    PositionName: str
    Description: Optional[str] = None


class EmployeeBase(BaseModel):
    EmployeeID: str
    FullName: str
    Email: Optional[str] = None
    PhoneNumber: Optional[str] = None

    @validator('Email')
    def validate_email(cls, v):
        if v is None:
            return v
        if '@' not in v:
            raise ValueError('Invalid email format')
        return v

# Create Schemas (with additional fields for creation)


class DepartmentCreate(DepartmentBase):
    ManagerID: Optional[str] = None


class PositionCreate(PositionBase):
    DepartmentID: int
    Salary: Optional[float] = None


class EmployeeCreate(EmployeeBase):
    DepartmentID: int
    PositionID: int
    ApplicantID: Optional[str] = None
    Gender: Optional[Gender] = None
    DateOfBirth: Optional[date] = None
    HireDate: date
    Salary: float
    Status: EmployeeStatus = EmployeeStatus.ACTIVE

    @validator('Salary')
    def salary_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Salary must be positive')
        return v

# Update Schemas (all fields optional for partial updates)


class DepartmentUpdate(BaseModel):
    DepartmentName: Optional[str] = None
    ManagerID: Optional[str] = None
    Description: Optional[str] = None


class PositionUpdate(BaseModel):
    PositionName: Optional[str] = None
    DepartmentID: Optional[int] = None
    Description: Optional[str] = None
    Salary: Optional[float] = None

    @validator('Salary')
    def salary_must_be_positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError('Salary must be positive')
        return v


class EmployeeUpdate(BaseModel):
    FullName: Optional[str] = None
    Email: Optional[str] = None
    PhoneNumber: Optional[str] = None
    DepartmentID: Optional[int] = None
    PositionID: Optional[int] = None
    Gender: Optional[Gender] = None
    DateOfBirth: Optional[date] = None
    Salary: Optional[float] = None
    Status: Optional[EmployeeStatus] = None

    @validator('Email')
    def validate_email(cls, v):
        if v is None:
            return v
        if '@' not in v:
            raise ValueError('Invalid email format')
        return v

    @validator('Salary')
    def salary_must_be_positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError('Salary must be positive')
        return v

# Response Schemas (includes IDs and other system fields)


class DepartmentResponse(DepartmentBase):
    DepartmentID: int
    ManagerID: Optional[str] = None
    ManagerName: Optional[str] = None
    TotalEmployees: Optional[int] = None

    class Config:
        orm_mode = True


class PositionResponse(PositionBase):
    PositionID: int
    DepartmentID: int
    DepartmentName: Optional[str] = None
    AverageSalary: Optional[float] = None

    class Config:
        orm_mode = True


class EmployeeResponse(EmployeeBase):
    EmployeeID: str
    DepartmentID: int
    DepartmentName: str
    PositionID: int
    PositionName: str
    Gender: Optional[Gender] = None
    DateOfBirth: Optional[date] = None
    HireDate: date
    Salary: float
    Status: EmployeeStatus

    class Config:
        orm_mode = True

# Lương và thưởng


class SalaryCreate(BaseModel):
    EmployeeID: str
    Salary: float
    EffectiveDate: date = Field(default_factory=date.today)
    Reason: Optional[str] = None

    @validator('Salary')
    def salary_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Salary must be positive')
        return v


class SalaryResponse(SalaryCreate):
    DividendID: int
    FullName: Optional[str] = None
    DepartmentName: Optional[str] = None

    class Config:
        orm_mode = True

# Phân trang


class PaginationParams(BaseModel):
    page: int = 1
    page_size: int = 20

    @validator('page')
    def page_must_be_positive(cls, v):
        if v < 1:
            return 1
        return v

    @validator('page_size')
    def page_size_must_be_positive(cls, v):
        if v < 1:
            return 20
        if v > 100:  # Limit max page size
            return 100
        return v


class PaginatedResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    items: List[Any]

# Authentication


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
    role: Optional[str] = "User"


class UserLogin(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    status: str

    class Config:
        orm_mode = True
