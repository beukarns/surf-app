from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from auth import get_current_user
import models
import schemas

router = APIRouter(prefix="/api/favorites", tags=["favorites"])


@router.get("", response_model=List[schemas.SpotSummary])
def get_my_favorites(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer les spots favoris de l'utilisateur."""
    favs = db.query(models.Favorite)\
        .filter(models.Favorite.user_id == current_user.id)\
        .order_by(models.Favorite.created_at.desc())\
        .all()
    return [f.spot for f in favs]


@router.get("/ids")
def get_my_favorite_ids(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer les IDs des spots favoris."""
    favs = db.query(models.Favorite.spot_id)\
        .filter(models.Favorite.user_id == current_user.id)\
        .all()
    return [f[0] for f in favs]


@router.post("/{spot_id}")
def toggle_favorite(
    spot_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ajouter ou retirer un spot des favoris."""
    spot = db.query(models.Spot).filter(models.Spot.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot non trouvé")

    existing = db.query(models.Favorite).filter(
        models.Favorite.user_id == current_user.id,
        models.Favorite.spot_id == spot_id
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        return {"favorited": False}
    else:
        fav = models.Favorite(user_id=current_user.id, spot_id=spot_id)
        db.add(fav)
        db.commit()
        return {"favorited": True}
