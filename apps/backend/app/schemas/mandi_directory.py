from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel


class MandiContact(BaseModel):
    person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None


class MandiDirectoryItem(BaseModel):
    mandi_id: str
    name: str
    state: str
    district: Optional[str] = None
    timings: Optional[str] = None
    facilities: List[str] = []
    contact: Optional[MandiContact] = None
    major_commodities: List[str] = []
    transport_info: Optional[str] = None
