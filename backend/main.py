import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import engine, Base
from config import settings
from routers import auth, spots, proposed_spots, ratings, sessions, favorites, media

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Surf Spots API",
    description="API pour gérer les spots de surf",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(spots.router)
app.include_router(proposed_spots.router)
app.include_router(ratings.router)
app.include_router(sessions.router)
app.include_router(favorites.router)
app.include_router(media.router)

# Servir les fichiers uploadés
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.get("/")
def read_root():
    return {"message": "Welcome to Surf Spots API", "version": "1.0.0"}


@app.get("/health")
def health_check():
    return {"status": "ok"}
