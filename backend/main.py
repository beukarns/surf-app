from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from config import settings
from routers import auth, spots, proposed_spots, ratings, sessions, favorites

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


@app.get("/")
def read_root():
    return {"message": "Welcome to Surf Spots API", "version": "1.0.0"}


@app.get("/health")
def health_check():
    return {"status": "ok"}
