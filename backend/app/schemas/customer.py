from pydantic import BaseModel, Field, field_validator


class CustomerCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    phone: str = Field(min_length=3, max_length=50)

    @field_validator("name", "phone")
    @classmethod
    def strip_and_require_text(cls, value: str) -> str:
        cleaned_value = value.strip()
        if not cleaned_value:
            raise ValueError("Value must not be blank")
        return cleaned_value
