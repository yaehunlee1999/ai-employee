from typing import Optional

from pydantic import BaseModel, Field


class RestaurantOnboardingCreate(BaseModel):
    restaurant_name: str = Field(min_length=1, max_length=120)
    owner_name: str = Field(min_length=1, max_length=120)
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=8, max_length=128)
    phone: Optional[str] = Field(default=None, max_length=50)
    address: Optional[str] = Field(default=None, max_length=255)
