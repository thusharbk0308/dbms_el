from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database.session import SessionLocal, engine
from app.database.models import Base, Category
from app.api.v1.router import api_router

DEFAULT_CATEGORIES = [
    {"category_id": 1, "category_name": "Source Code", "description": "Application software, smart contracts, backend scripts, algorithms"},
    {"category_id": 2, "category_name": "Digital Art & Photography", "description": "Illustrations, UI designs, photographs, 3D renderings"},
    {"category_id": 3, "category_name": "Documents & Research", "description": "Research papers, whitepapers, specifications, technical documentation"},
    {"category_id": 4, "category_name": "Music & Audio", "description": "Synthesized audio, podcasts, sound effects, audio tracks"},
    {"category_id": 5, "category_name": "Legal & Contracts", "description": "Standardized agreements, corporate bylaws, licensing templates"}
]

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables exist (Alembic manages migrations; this guarantees safety on fresh startup)
    Base.metadata.create_all(bind=engine)

    # Ensure uploads directory exists
    uploads_dir = Path(settings.UPLOAD_DIR)
    uploads_dir.mkdir(parents=True, exist_ok=True)

    # Seed default categories if database is newly initialized
    db = SessionLocal()
    try:
        for cat_data in DEFAULT_CATEGORIES:
            existing = db.query(Category).filter(
                (Category.category_id == cat_data["category_id"]) | 
                (Category.category_name == cat_data["category_name"])
            ).first()
            if not existing:
                cat = Category(
                    category_id=cat_data["category_id"],
                    category_name=cat_data["category_name"],
                    description=cat_data["description"]
                )
                db.add(cat)
        db.commit()
    except Exception as e:
        db.rollback()
    finally:
        db.close()

    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="ChainProof: Blockchain-Based Digital Intellectual Property Registration and Verification System",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/", tags=["System"])
def root():
    return {
        "system": settings.PROJECT_NAME,
        "status": "online",
        "version": "1.0.0",
        "docs_url": "/docs",
        "api_prefix": settings.API_V1_STR
    }

@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT
    }
