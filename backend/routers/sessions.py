from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models
import schemas

router = APIRouter(prefix="/api/sessions", tags=["sessions"])

@router.post("", response_model=schemas.SessionResponse)
def create_session(
    session_data: schemas.SessionCreate,
    db: Session = Depends(get_db)
):
    """Créer une session de surf"""
    # Vérifier que le spot existe
    spot = db.query(models.Spot).filter(models.Spot.id == session_data.spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot non trouvé")

    # Créer la session (user_id fixé à 1 car pas d'auth)
    db_session = models.Session(
        user_id=1,  # ID par défaut car l'auth est désactivée
        **session_data.dict()
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

@router.get("/{spot_id}", response_model=List[schemas.SessionResponse])
def get_spot_sessions(
    spot_id: int,
    db: Session = Depends(get_db)
):
    """Récupérer toutes les sessions d'un spot"""
    # Vérifier que le spot existe
    spot = db.query(models.Spot).filter(models.Spot.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot non trouvé")

    sessions = db.query(models.Session)\
        .filter(models.Session.spot_id == spot_id)\
        .order_by(models.Session.date.desc())\
        .all()
    return sessions
