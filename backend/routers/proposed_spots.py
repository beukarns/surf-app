from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models
import schemas

router = APIRouter(prefix="/api/proposed-spots", tags=["proposed-spots"])

@router.post("", response_model=schemas.ProposedSpotResponse)
def create_proposed_spot(
    proposed_spot: schemas.ProposedSpotCreate,
    db: Session = Depends(get_db)
):
    """Créer une proposition de nouveau spot"""
    db_proposed_spot = models.ProposedSpot(**proposed_spot.dict())
    db.add(db_proposed_spot)
    db.commit()
    db.refresh(db_proposed_spot)
    return db_proposed_spot

@router.get("", response_model=List[schemas.ProposedSpotResponse])
def get_proposed_spots(
    status: str = None,
    db: Session = Depends(get_db)
):
    """Récupérer la liste des spots proposés (optionnellement filtré par statut)"""
    query = db.query(models.ProposedSpot)
    if status:
        query = query.filter(models.ProposedSpot.status == status)
    return query.order_by(models.ProposedSpot.created_at.desc()).all()
