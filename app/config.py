from dotenv import load_dotenv
import os
from datetime import timedelta

# Load environment variables from .env file
load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
    JWT_TOKEN_LOCATION = ['cookies']
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=30)
    JWT_COOKIE_CSRF_PROTECT = True
    JWT_COOKIE_SECURE = False

    DATABASE_CONFIG = {
        'user': os.getenv('DB_user'),
        'password': os.getenv('DB_password'),
        'host': os.getenv('DB_host'),
        'database': os.getenv('DB_name')
    }

