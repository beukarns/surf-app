import os
import uuid
import re
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from auth import get_current_user
import models
import schemas

router = APIRouter(prefix="/api/media", tags=["media"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
ALLOWED_PHOTO = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_VIDEO = {"video/mp4", "video/webm", "video/quicktime"}
MAX_PHOTO_SIZE = 10 * 1024 * 1024   # 10 MB
MAX_VIDEO_SIZE = 100 * 1024 * 1024  # 100 MB

os.makedirs(UPLOAD_DIR, exist_ok=True)


def extract_youtube_id(url: str) -> Optional[str]:
    patterns = [
        r"(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([a-zA-Z0-9_-]{11})",
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


@router.get("/{spot_id}", response_model=List[schemas.SpotMediaResponse])
def get_spot_media(spot_id: int, db: Session = Depends(get_db)):
    media = db.query(models.SpotMedia)\
        .filter(models.SpotMedia.spot_id == spot_id)\
        .order_by(models.SpotMedia.created_at.desc())\
        .all()
    result = []
    for m in media:
        item = schemas.SpotMediaResponse(
            id=m.id, spot_id=m.spot_id, user_id=m.user_id,
            media_type=m.media_type, url=m.url, title=m.title,
            created_at=m.created_at,
            user_email=m.user.email if m.user else None
        )
        result.append(item)
    return result


@router.post("/{spot_id}/upload", response_model=schemas.SpotMediaResponse)
async def upload_media(
    spot_id: int,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    spot = db.query(models.Spot).filter(models.Spot.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot non trouvé")

    content_type = file.content_type or ""
    if content_type in ALLOWED_PHOTO:
        media_type = "photo"
        max_size = MAX_PHOTO_SIZE
        ext = content_type.split("/")[-1].replace("jpeg", "jpg")
    elif content_type in ALLOWED_VIDEO:
        media_type = "video"
        max_size = MAX_VIDEO_SIZE
        ext = content_type.split("/")[-1].replace("quicktime", "mov")
    else:
        raise HTTPException(status_code=400, detail="Type de fichier non supporté (jpg, png, webp, mp4, webm, mov)")

    contents = await file.read()
    if len(contents) > max_size:
        raise HTTPException(status_code=400, detail=f"Fichier trop volumineux (max {max_size // 1024 // 1024} MB)")

    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(contents)

    url = f"/uploads/{filename}"
    db_media = models.SpotMedia(
        spot_id=spot_id, user_id=current_user.id,
        media_type=media_type, url=url, title=title
    )
    db.add(db_media)
    db.commit()
    db.refresh(db_media)

    return schemas.SpotMediaResponse(
        id=db_media.id, spot_id=db_media.spot_id, user_id=db_media.user_id,
        media_type=db_media.media_type, url=db_media.url, title=db_media.title,
        created_at=db_media.created_at, user_email=current_user.email
    )


@router.post("/{spot_id}/youtube", response_model=schemas.SpotMediaResponse)
def add_youtube(
    spot_id: int,
    youtube_url: str = Form(...),
    title: Optional[str] = Form(None),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    spot = db.query(models.Spot).filter(models.Spot.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot non trouvé")

    video_id = extract_youtube_id(youtube_url)
    if not video_id:
        raise HTTPException(status_code=400, detail="URL YouTube invalide")

    embed_url = f"https://www.youtube.com/embed/{video_id}"
    db_media = models.SpotMedia(
        spot_id=spot_id, user_id=current_user.id,
        media_type="youtube", url=embed_url, title=title
    )
    db.add(db_media)
    db.commit()
    db.refresh(db_media)

    return schemas.SpotMediaResponse(
        id=db_media.id, spot_id=db_media.spot_id, user_id=db_media.user_id,
        media_type=db_media.media_type, url=db_media.url, title=db_media.title,
        created_at=db_media.created_at, user_email=current_user.email
    )


@router.delete("/{media_id}")
def delete_media(
    media_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    media = db.query(models.SpotMedia).filter(models.SpotMedia.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Média non trouvé")
    if media.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Non autorisé")

    # Supprimer le fichier physique si ce n'est pas YouTube
    if media.media_type in ("photo", "video"):
        filepath = os.path.join(UPLOAD_DIR, media.url.lstrip("/uploads/"))
        if os.path.exists(filepath):
            os.remove(filepath)

    db.delete(media)
    db.commit()
    return {"deleted": True}
