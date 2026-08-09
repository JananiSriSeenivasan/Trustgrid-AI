from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

from app.api.scan import router as scan_router
from app.api.assets import router as assets_router
from app.api.risk import router as risk_router
from app.api.vulnerability import router as vulnerability_router
from app.api.recommendation import router as recommendation_router
from app.api.history import router as history_router
from app.api.dashboard import router as dashboard_router
from app.api.reports import router as reports_router
from app.api.auth import router as auth_router
from app.api.chat import router as chat_router
from app.api.assistant import router as assistant_router
from app.database.seed import seed_database

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS for Dashboard UI compatibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup Event: Auto-seed database if empty
@app.on_event("startup")
def startup_event():
    try:
        seed_database()
    except Exception as e:
        print(f"[MainStartup] Seed notice: {e}")

# Register Modular Routers
app.include_router(scan_router)
app.include_router(assets_router)
app.include_router(risk_router)
app.include_router(vulnerability_router)
app.include_router(recommendation_router)
app.include_router(history_router)
app.include_router(dashboard_router)
app.include_router(reports_router)
app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(assistant_router)

@app.get("/")
def root():
    return {
        "platform": settings.PROJECT_NAME,
        "status": "Operational",
        "version": settings.VERSION,
        "description": settings.PROJECT_DESCRIPTION,
        "docs_url": "/docs",
        "endpoints": [
            "/scan",
            "/assets",
            "/vulnerability",
            "/risk",
            "/recommendation",
            "/history",
            "/dashboard/stats",
            "/reports/executive",
            "/reports/export/pdf",
            "/auth/login",
            "/chat",
            "/assistant/chat"
        ]
    }