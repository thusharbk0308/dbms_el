from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database.models.category import Category
from app.database.models.user import User
from app.schemas.category import CategoryCreate, CategoryResponse
from app.core.dependencies import require_roles

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get(
    "",
    response_model=List[CategoryResponse],
    summary="List all available asset categories"
)
def list_categories(db: Session = Depends(get_db)):
    """Returns all registered asset classification categories."""
    return db.query(Category).order_by(Category.category_id.asc()).all()

@router.post(
    "",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new asset category (Administrator only)"
)
def create_category(
    category_in: CategoryCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("ADMINISTRATOR"))
):
    """Allows administrators to define new digital asset classifications."""
    existing = db.query(Category).filter(
        Category.category_name == category_in.category_name.strip()
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Category '{category_in.category_name}' already exists."
        )

    new_cat = Category(
        category_name=category_in.category_name.strip(),
        description=category_in.description.strip() if category_in.description else None
    )
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    return new_cat
