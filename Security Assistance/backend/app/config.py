import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "Security Assistance"
    PROJECT_DESCRIPTION: str = "AI-Powered Security Assistance Platform for Vulnerability Assessment and Asset Intelligence"
    VERSION: str = "1.0.0"
    
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
    MONGO_DB_NAME: str = os.getenv("MONGO_DB_NAME", "trustgrid_ai")
    
    # Nmap executable path default or auto-detection
    NMAP_PATH: str = os.getenv("NMAP_PATH", r"C:\Program Files (x86)\Nmap\nmap.exe")
    
    # Security & Auth Settings
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "security-assistance-enterprise-secret-key-2026-super-secure")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    # Scanner Fallback Settings
    ALLOW_SYNTHETIC_FALLBACK: bool = True

settings = Settings()

