from typing import Optional
from pydantic import BaseModel, Field

class CategoryBase(BaseModel):
    category_name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    category_id: int

    class Config:
        from_attributes = True
