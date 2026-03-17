from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class FAQCreate(BaseModel):
    question: str = Field(..., min_length=3)
    answer: str = Field(..., min_length=1)
    tags: List[str] = Field(default_factory=list)
    language: str = Field(default="en", min_length=2)
    published: bool = Field(default=True)
    order: Optional[int] = None


class FAQUpdate(BaseModel):
    question: Optional[str]
    answer: Optional[str]
    tags: Optional[List[str]]
    language: Optional[str]
    published: Optional[bool]
    order: Optional[int]


class FAQDB(FAQCreate):
    id: str = Field(..., alias="_id")

    model_config = ConfigDict(validate_by_name=True)
