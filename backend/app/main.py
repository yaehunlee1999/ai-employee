import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import reservations
from app.api import restaurants
from app.api import customers
from app.api import auth
from app.api import ai
from app.api import vapi
from app.api import settings
from app.api import conversations
from app.api import analytics


LOCAL_DEVELOPMENT_ORIGINS = {
    "http://localhost:3000",
    "http://127.0.0.1:3000"
}

PRODUCTION_WEB_ORIGINS = {
    "https://dinebell.app",
    "https://www.dinebell.app"
}


def get_allowed_origins() -> list[str]:
    """Return explicit browser origins and fail closed in production."""

    configured_origins = {
        origin.strip().rstrip("/")
        for origin in os.getenv("CORS_ALLOWED_ORIGINS", "").split(",")
        if origin.strip()
    }

    if "*" in configured_origins:
        raise RuntimeError("CORS_ALLOWED_ORIGINS must not include '*'")

    if os.getenv("APP_ENV", "development").lower() == "production":
        if not configured_origins:
            raise RuntimeError(
                "CORS_ALLOWED_ORIGINS is required when APP_ENV is production"
            )

        # The web application is served from these first-party domains. Keep
        # them explicit so an outdated deployment variable cannot block every
        # authenticated browser request after a frontend release.
        return sorted(PRODUCTION_WEB_ORIGINS | configured_origins)

    return sorted(LOCAL_DEVELOPMENT_ORIGINS | configured_origins)


app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


app.include_router(reservations.router)
app.include_router(reservations.restaurant_router)
app.include_router(restaurants.router)
app.include_router(customers.router)
app.include_router(auth.router)
app.include_router(ai.router)
app.include_router(vapi.router)
app.include_router(settings.router)
app.include_router(conversations.router)
app.include_router(analytics.router)


@app.get("/health")
def health():
    """Lightweight application health check for the hosting platform."""

    return {"status": "ok"}


@app.get("/")
def root():
    return {
        "message": "DineBell Backend Running"
    }
