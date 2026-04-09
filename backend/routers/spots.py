from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import distinct, or_, func
from typing import List, Optional
from database import get_db
import models
import schemas

router = APIRouter(prefix="/api/spots", tags=["spots"])


@router.get("/continents", response_model=List[str])
def get_continents(db: Session = Depends(get_db)):
    """Récupérer la liste des continents avec le nombre de spots."""
    continents = db.query(distinct(models.Spot.continent))\
        .filter(models.Spot.continent.isnot(None))\
        .order_by(models.Spot.continent)\
        .all()
    return [c[0] for c in continents]


@router.get("/continents/stats", response_model=List[schemas.ContinentStats])
def get_continents_stats(db: Session = Depends(get_db)):
    """Récupérer les continents avec leur nombre de spots."""
    results = db.query(
        models.Spot.continent,
        func.count(models.Spot.id).label("spot_count")
    ).filter(models.Spot.continent.isnot(None))\
     .group_by(models.Spot.continent)\
     .order_by(models.Spot.continent)\
     .all()
    return [{"continent": r[0], "spot_count": r[1]} for r in results]


@router.get("/search", response_model=List[schemas.SpotSummary])
def search_spots(
    q: str = Query(..., min_length=2, description="Texte de recherche"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Recherche globale de spots par nom, région, pays ou continent."""
    search = f"%{q}%"
    spots = db.query(models.Spot)\
        .filter(
            or_(
                models.Spot.name.ilike(search),
                models.Spot.region.ilike(search),
                models.Spot.country.ilike(search),
                models.Spot.continent.ilike(search),
            )
        )\
        .order_by(models.Spot.wave_quality_score.desc().nullslast())\
        .limit(limit)\
        .all()
    return spots


@router.get("/countries/{continent}", response_model=List[str])
def get_countries(continent: str, db: Session = Depends(get_db)):
    """Récupérer la liste des pays d'un continent."""
    countries = db.query(distinct(models.Spot.country))\
        .filter(models.Spot.continent == continent)\
        .filter(models.Spot.country.isnot(None))\
        .order_by(models.Spot.country)\
        .all()
    return [c[0] for c in countries]


@router.get("/regions/{continent}/{country}", response_model=List[str])
def get_regions(continent: str, country: str, db: Session = Depends(get_db)):
    """Récupérer la liste des régions d'un pays."""
    regions = db.query(distinct(models.Spot.region))\
        .filter(models.Spot.continent == continent)\
        .filter(models.Spot.country == country)\
        .filter(models.Spot.region.isnot(None))\
        .order_by(models.Spot.region)\
        .all()
    return [r[0] for r in regions]


@router.get("/list/{continent}/{country}/{region}", response_model=List[schemas.SpotSummary])
def get_spots_by_region(
    continent: str,
    country: str,
    region: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    level: Optional[str] = Query(None, description="beginner | intermediate | expert"),
    quality: Optional[str] = Query(None, description="Filtrer par qualité de vague"),
    db: Session = Depends(get_db)
):
    """Récupérer la liste des spots d'une région avec filtres optionnels."""
    query = db.query(models.Spot)\
        .filter(models.Spot.continent == continent)\
        .filter(models.Spot.country == country)\
        .filter(models.Spot.region == region)

    if level == "beginner":
        query = query.filter(
            or_(models.Spot.experience_needed_score <= 0.4, models.Spot.experience_needed_score.is_(None))
        )
    elif level == "intermediate":
        query = query.filter(
            models.Spot.experience_needed_score > 0.4,
            models.Spot.experience_needed_score <= 0.7
        )
    elif level == "expert":
        query = query.filter(models.Spot.experience_needed_score > 0.7)

    if quality:
        query = query.filter(models.Spot.wave_quality == quality)

    spots = query.order_by(models.Spot.wave_quality_score.desc().nullslast())\
        .offset(skip)\
        .limit(limit)\
        .all()
    return spots


@router.get("/{spot_id}", response_model=schemas.SpotResponse)
def get_spot_detail(spot_id: int, db: Session = Depends(get_db)):
    """Récupérer les détails d'un spot."""
    spot = db.query(models.Spot).filter(models.Spot.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    return spot
