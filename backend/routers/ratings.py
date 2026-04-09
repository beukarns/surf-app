from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
import models
import schemas

router = APIRouter(prefix="/api/ratings", tags=["ratings"])

@router.post("", response_model=schemas.SpotRatingResponse)
def create_rating(
    rating_data: schemas.SpotRatingCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Créer ou mettre à jour la note d'un spot"""
    # Vérifier que le rating est entre 1 et 5
    if rating_data.rating < 1 or rating_data.rating > 5:
        raise HTTPException(status_code=400, detail="La note doit être entre 1 et 5")

    # Vérifier que le spot existe
    spot = db.query(models.Spot).filter(models.Spot.id == rating_data.spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot non trouvé")

    # Récupérer l'IP de l'utilisateur
    user_ip = request.client.host

    # Vérifier si l'utilisateur a déjà voté pour ce spot
    existing_rating = db.query(models.SpotRating).filter(
        models.SpotRating.spot_id == rating_data.spot_id,
        models.SpotRating.user_ip == user_ip
    ).first()

    if existing_rating:
        # Mettre à jour le vote existant
        existing_rating.rating = rating_data.rating
        db.commit()
        db.refresh(existing_rating)
        return existing_rating
    else:
        # Créer un nouveau vote
        db_rating = models.SpotRating(
            spot_id=rating_data.spot_id,
            rating=rating_data.rating,
            user_ip=user_ip
        )
        db.add(db_rating)
        db.commit()
        db.refresh(db_rating)
        return db_rating

@router.get("/{spot_id}", response_model=schemas.SpotRatingStats)
def get_spot_ratings(
    spot_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """Récupérer les statistiques de notation pour un spot"""
    # Vérifier que le spot existe
    spot = db.query(models.Spot).filter(models.Spot.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot non trouvé")

    # Calculer la moyenne et le nombre total de votes
    stats = db.query(
        func.avg(models.SpotRating.rating).label('average_rating'),
        func.count(models.SpotRating.id).label('total_votes')
    ).filter(models.SpotRating.spot_id == spot_id).first()

    # Récupérer le vote de l'utilisateur actuel (basé sur IP)
    user_ip = request.client.host
    user_rating = db.query(models.SpotRating).filter(
        models.SpotRating.spot_id == spot_id,
        models.SpotRating.user_ip == user_ip
    ).first()

    return {
        "average_rating": float(stats.average_rating) if stats.average_rating else 0.0,
        "total_votes": stats.total_votes or 0,
        "user_rating": user_rating.rating if user_rating else None
    }
