from sqlalchemy import Column, Integer, String, Text, DECIMAL, TIMESTAMP, Boolean, Date, Time, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Relations
    sessions = relationship("Session", back_populates="user")
    alerts = relationship("Alert", back_populates="user")

class Spot(Base):
    __tablename__ = "spots"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), index=True)
    continent = Column(String(100), index=True)
    country = Column(String(100), index=True)
    region = Column(String(100), index=True)
    latitude = Column(DECIMAL(10, 8))
    longitude = Column(DECIMAL(11, 8))
    datum = Column(String(50))
    precision = Column(String(50))
    access_info = Column(Text)
    distance = Column(String(100))
    walk = Column(String(100))
    easy_to_find = Column(String(50))
    public_access = Column(String(50))
    special_access = Column(String(100))
    wave_quality = Column(String(50))
    experience = Column(String(100))
    frequency = Column(String(100))
    type = Column(String(50))
    direction = Column(String(50))
    bottom = Column(String(50))
    power = Column(String(100))
    normal_length = Column(String(50))
    good_day_length = Column(String(50))
    good_swell_direction = Column(String(100))
    good_wind_direction = Column(String(100))
    swell_size = Column(Text)
    best_tide_position = Column(String(100))
    best_tide_movement = Column(String(100))
    week_crowd = Column(String(50))
    weekend_crowd = Column(String(50))
    webcam_url = Column(String(500))
    description = Column(Text)
    description_2 = Column(Text)
    rating = Column(Integer)
    votes = Column(Integer)
    frequency_score = Column(DECIMAL(3, 2))
    wave_quality_score = Column(DECIMAL(3, 2))
    experience_needed_score = Column(DECIMAL(3, 2))
    swell_min = Column(DECIMAL(4, 2))
    swell_max = Column(DECIMAL(4, 2))
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Relations
    sessions = relationship("Session", back_populates="spot")

class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    spot_id = Column(Integer, ForeignKey("spots.id"), nullable=False)
    date = Column(Date, nullable=False)
    time = Column(Time)
    rating = Column(Integer)
    wave_height = Column(DECIMAL(4, 2))
    wind_direction = Column(String(50))
    tide = Column(String(50))
    notes = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Relations
    user = relationship("User", back_populates="sessions")
    spot = relationship("Spot", back_populates="sessions")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    region = Column(String(100))
    conditions = Column(JSON)  # Stockage des critères d'alerte
    notification_method = Column(String(50))
    active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Relations
    user = relationship("User", back_populates="alerts")

class ProposedSpot(Base):
    __tablename__ = "proposed_spots"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    continent = Column(String(100), nullable=False, index=True)
    country = Column(String(100), nullable=False, index=True)
    region = Column(String(100), nullable=False, index=True)
    latitude = Column(DECIMAL(10, 8))
    longitude = Column(DECIMAL(11, 8))
    description = Column(Text)
    submitter_name = Column(String(200))
    submitter_email = Column(String(255))
    status = Column(String(20), default='pending', index=True)  # pending, approved, rejected
    created_at = Column(TIMESTAMP, server_default=func.now())

class SpotRating(Base):
    __tablename__ = "spot_ratings"

    id = Column(Integer, primary_key=True, index=True)
    spot_id = Column(Integer, ForeignKey("spots.id"), nullable=False, index=True)
    rating = Column(Integer, nullable=False)  # 1 à 5 étoiles
    user_ip = Column(String(50))  # Pour éviter les votes multiples sans authentification
    created_at = Column(TIMESTAMP, server_default=func.now())
