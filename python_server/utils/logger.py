import logging
import sys
import os
from datetime import datetime

# Log configuration
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
LOG_DIR = os.getenv("LOG_DIR", "logs")

# Ensure log directory exists
os.makedirs(LOG_DIR, exist_ok=True)

# Get current date for log filename
current_date = datetime.now().strftime('%Y-%m-%d')
LOG_FILE = f"{LOG_DIR}/app-{current_date}.log"

# Configure root logger
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format=LOG_FORMAT,
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler(sys.stdout)
    ]
)

# Get logger instance


def get_logger(name):
    """Get a logger with the specified name"""
    return logging.getLogger(name)

# Request logging middleware for FastAPI


async def log_request(request, call_next):
    """Middleware to log HTTP requests"""
    logger = get_logger("request")

    # Start timer
    start_time = datetime.now()

    # Get client IP
    client_host = request.client.host if request.client else "unknown"

    # Log request
    logger.info(
        f"Request: {request.method} {request.url.path} from {client_host}"
    )

    # Process request
    response = await call_next(request)

    # Calculate processing time
    process_time = (datetime.now() - start_time).total_seconds() * 1000

    # Log response
    logger.info(
        f"Response: {request.method} {request.url.path} - {response.status_code} ({process_time:.2f}ms)"
    )

    return response
