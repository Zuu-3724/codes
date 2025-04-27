from fastapi import Depends
from sqlalchemy.orm import Session
from utils.db import execute_sqlserver_query
from contextlib import asynccontextmanager
from typing import AsyncGenerator

@asynccontextmanager
async def get_db() -> AsyncGenerator[Session, None]:
    """Get a database session"""
    try:
        conn = await execute_sqlserver_query("SELECT 1")  # Test connection
        yield conn
    finally:
        pass  # Connection is automatically closed in execute_sqlserver_query 