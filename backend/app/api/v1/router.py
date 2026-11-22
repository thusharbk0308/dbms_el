from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.categories import router as categories_router
from app.api.v1.assets import router as assets_router
from app.api.v1.blockchain import router as blockchain_router
from app.api.v1.verification import router as verification_router
from app.api.v1.licenses import router as licenses_router
from app.api.v1.disputes import router as disputes_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.admin import router as admin_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(categories_router)
api_router.include_router(assets_router)
api_router.include_router(blockchain_router)
api_router.include_router(verification_router)
api_router.include_router(licenses_router)
api_router.include_router(disputes_router)
api_router.include_router(analytics_router)
api_router.include_router(admin_router)
