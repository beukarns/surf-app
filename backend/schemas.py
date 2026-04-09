from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, time, datetime
from decimal import Decimal

# Schémas pour User
class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

# Schémas pour Spot
class SpotBase(BaseModel):
    name: Optional[str] = None
    continent: Optional[str] = None
    country: Optional[str] = None
    region: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    datum: Optional[str] = None
    precision: Optional[str] = None
    access_info: Optional[str] = None
    distance: Optional[str] = None
    walk: Optional[str] = None
    easy_to_find: Optional[str] = None
    public_access: Optional[str] = None
    special_access: Optional[str] = None
    wave_quality: Optional[str] = None
    experience: Optional[str] = None
    frequency: Optional[str] = None
    type: Optional[str] = None
    direction: Optional[str] = None
    bottom: Optional[str] = None
    power: Optional[str] = None
    normal_length: Optional[str] = None
    good_day_length: Optional[str] = None
    good_swell_direction: Optional[str] = None
    good_wind_direction: Optional[str] = None
    swell_size: Optional[str] = None
    best_tide_position: Optional[str] = None
    best_tide_movement: Optional[str] = None
    week_crowd: Optional[str] = None
    weekend_crowd: Optional[str] = None
    webcam_url: Optional[str] = None
    description: Optional[str] = None
    description_2: Optional[str] = None
    rating: Optional[int] = None
    votes: Optional[int] = None
    frequency_score: Optional[Decimal] = None
    wave_quality_score: Optional[Decimal] = None
    experience_needed_score: Optional[Decimal] = None
    swell_min: Optional[Decimal] = None
    swell_max: Optional[Decimal] = None

class SpotResponse(SpotBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Schémas pour les listes de navigation
class ContinentResponse(BaseModel):
    continent: str

class ContinentStats(BaseModel):
    continent: str
    spot_count: int

class CountryResponse(BaseModel):
    country: str

class RegionResponse(BaseModel):
    region: str

class SpotSummary(BaseModel):
    id: int
    name: Optional[str] = None
    region: str
    rating: Optional[int] = None
    wave_quality: Optional[str] = None
    type: Optional[str] = None
    wave_quality_score: Optional[Decimal] = None
    frequency_score: Optional[Decimal] = None
    experience_needed_score: Optional[Decimal] = None
    swell_min: Optional[Decimal] = None
    swell_max: Optional[Decimal] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None

    class Config:
        from_attributes = True

# Schémas pour Session (future feature)
class SessionCreate(BaseModel):
    spot_id: int
    date: date
    time: Optional[time] = None
    rating: Optional[int] = None
    wave_height: Optional[Decimal] = None
    wind_direction: Optional[str] = None
    tide: Optional[str] = None
    notes: Optional[str] = None

class SessionResponse(SessionCreate):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Schémas pour ProposedSpot
class ProposedSpotCreate(BaseModel):
    name: str
    continent: str
    country: str
    region: str
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    description: Optional[str] = None
    submitter_name: Optional[str] = None
    submitter_email: Optional[str] = None

class ProposedSpotResponse(ProposedSpotCreate):
    id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Schémas pour SpotRating
class SpotRatingCreate(BaseModel):
    spot_id: int
    rating: int  # 1 à 5

class SpotRatingResponse(BaseModel):
    id: int
    spot_id: int
    rating: int
    created_at: datetime

    class Config:
        from_attributes = True

class SpotRatingStats(BaseModel):
    average_rating: float
    total_votes: int
    user_rating: Optional[int] = None
