import logging
import os
from uuid import UUID

import requests
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.database.connection import SessionLocal
from app.models.restaurant import Restaurant
from app.models.restaurant_settings import RestaurantSettings
from app.models.restaurant_user import RestaurantUser
from app.schemas.onboarding import RestaurantOnboardingCreate


logger = logging.getLogger(__name__)


router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

UNPROCESSABLE_CONTENT = getattr(status, "HTTP_422_UNPROCESSABLE_CONTENT", 422)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_auth_user_from_response(auth_result: dict) -> dict | None:
    """Normalize the REST and SDK-shaped Supabase Auth signup responses."""

    nested_user = auth_result.get("user")
    if isinstance(nested_user, dict):
        return nested_user

    # GoTrue's REST /signup endpoint returns the user fields at the top level,
    # unlike the supabase-js SDK response which wraps them in `user`.
    if isinstance(auth_result.get("id"), str):
        return auth_result

    return None


def create_supabase_auth_user(email: str, password: str) -> tuple[UUID, bool]:
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")

    if not supabase_url or not supabase_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase Auth is not configured"
        )

    try:
        response = requests.post(
            f"{supabase_url.rstrip('/')}/auth/v1/signup",
            headers={
                "apikey": supabase_key,
                "Content-Type": "application/json"
            },
            json={
                "email": email,
                "password": password
            },
            timeout=10
        )
    except requests.RequestException as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase Auth is unavailable"
        ) from error

    if response.status_code not in (
        status.HTTP_200_OK,
        status.HTTP_201_CREATED
    ):
        # Supabase returns useful validation details (for example, an
        # already-registered email or a password policy failure). Preserve the
        # message so the signup form can tell the user what to fix, without
        # exposing the raw response or any credentials.
        try:
            error_result = response.json()
        except ValueError:
            error_result = {}

        supabase_message = (
            error_result.get("msg")
            if isinstance(error_result, dict)
            else None
        )
        if not isinstance(supabase_message, str) or not supabase_message.strip():
            supabase_message = "Unable to create the Supabase Auth account"

        logger.warning(
            "Supabase Auth signup rejected: status=%s error_code=%s",
            response.status_code,
            error_result.get("error_code")
            if isinstance(error_result, dict)
            else None
        )

        # Keep client-validation failures distinguishable while avoiding
        # forwarding arbitrary upstream 5xx status codes to the browser.
        error_status = (
            UNPROCESSABLE_CONTENT
            if response.status_code == UNPROCESSABLE_CONTENT
            else status.HTTP_429_TOO_MANY_REQUESTS
            if response.status_code == status.HTTP_429_TOO_MANY_REQUESTS
            else status.HTTP_400_BAD_REQUEST
            if 400 <= response.status_code < 500
            else status.HTTP_502_BAD_GATEWAY
        )
        raise HTTPException(
            status_code=error_status,
            detail=supabase_message
        )

    try:
        auth_result = response.json()
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Invalid response from Supabase Auth"
        ) from error
    if not isinstance(auth_result, dict):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Invalid response from Supabase Auth"
        )

    auth_user = get_auth_user_from_response(auth_result)

    if not isinstance(auth_user, dict):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Invalid response from Supabase Auth"
        )

    # With email confirmation enabled, Supabase can return an obfuscated user
    # for an already-registered email. Do not attach that user to a restaurant.
    if auth_user.get("identities") == []:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Unable to create an account with this email"
        )

    try:
        auth_user_id = UUID(auth_user["id"])
    except (KeyError, TypeError, ValueError) as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Invalid response from Supabase Auth"
        ) from error

    return auth_user_id, auth_result.get("session") is None


def get_existing_auth_user(
    db: Session,
    email: str
) -> tuple[UUID, bool] | None:
    """Find a prior signup that has no restaurant profile yet.

    This runs only in the backend's database connection. No Auth table is
    exposed to frontend clients.
    """

    row = db.execute(
        text(
            "select id, email_confirmed_at is not null as email_confirmed "
            "from auth.users where lower(email) = lower(:email)"
        ),
        {"email": email}
    ).mappings().one_or_none()

    if not row:
        return None

    return UUID(str(row["id"])), bool(row["email_confirmed"])


def verify_existing_supabase_credentials(
    email: str,
    password: str
) -> UUID:
    """Verify password ownership before attaching a recovered signup profile."""

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")

    if not supabase_url or not supabase_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase Auth is not configured"
        )

    try:
        response = requests.post(
            f"{supabase_url.rstrip('/')}/auth/v1/token?grant_type=password",
            headers={
                "apikey": supabase_key,
                "Content-Type": "application/json"
            },
            json={"email": email, "password": password},
            timeout=10
        )
    except requests.RequestException as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase Auth is unavailable"
        ) from error

    if response.status_code != status.HTTP_200_OK:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "This email already has an account. Confirm the email and use "
                "the same password to finish restaurant setup."
            )
        )

    try:
        auth_result = response.json()
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Invalid response from Supabase Auth"
        ) from error

    if not isinstance(auth_result, dict):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Invalid response from Supabase Auth"
        )

    auth_user = get_auth_user_from_response(auth_result)
    if not auth_user:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Invalid response from Supabase Auth"
        )

    try:
        return UUID(auth_user["id"])
    except (KeyError, TypeError, ValueError) as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Invalid response from Supabase Auth"
        ) from error


@router.post("/onboarding", status_code=status.HTTP_201_CREATED)
def onboard_restaurant(
    onboarding: RestaurantOnboardingCreate,
    db: Session = Depends(get_db)
):
    restaurant_name = onboarding.restaurant_name.strip()
    owner_name = onboarding.owner_name.strip()
    email = onboarding.email.strip().lower()
    phone = (onboarding.phone or "").strip() or None
    address = (onboarding.address or "").strip() or None

    if not restaurant_name or not owner_name or not email:
        raise HTTPException(
            status_code=UNPROCESSABLE_CONTENT,
            detail="Restaurant name, owner name, and email are required"
        )

    existing_owner = (
        db.query(RestaurantUser)
        .filter(RestaurantUser.email == email)
        .first()
    )
    if existing_owner:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An onboarding account already exists for this email"
        )

    existing_auth_user = get_existing_auth_user(db, email)
    if existing_auth_user:
        existing_auth_user_id, email_confirmed = existing_auth_user
        if not email_confirmed:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Confirm this email before finishing restaurant setup"
            )

        verified_auth_user_id = verify_existing_supabase_credentials(
            email,
            onboarding.password
        )
        if verified_auth_user_id != existing_auth_user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unable to verify the existing Supabase account"
            )

        auth_user_id = existing_auth_user_id
        requires_email_confirmation = False
    else:
        auth_user_id, requires_email_confirmation = create_supabase_auth_user(
            email,
            onboarding.password
        )

    try:
        restaurant = Restaurant(
            name=restaurant_name,
            phone_number=phone,
            address=address
        )
        db.add(restaurant)
        db.flush()

        restaurant_owner = RestaurantUser(
            restaurant_id=restaurant.id,
            auth_user_id=auth_user_id,
            email=email,
            name=owner_name,
            role="owner"
        )
        restaurant_settings = RestaurantSettings(
            restaurant_id=restaurant.id,
            phone_number=phone
        )
        db.add_all([restaurant_owner, restaurant_settings])
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Unable to finish restaurant onboarding"
        ) from error
    except SQLAlchemyError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to finish restaurant onboarding"
        ) from error

    return {
        "restaurant_id": str(restaurant.id),
        "auth_user_id": str(auth_user_id),
        "email": email,
        "requires_email_confirmation": requires_email_confirmation
    }


def get_current_restaurant_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db)
) -> RestaurantUser:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Supabase access token"
        )

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")

    if not supabase_url or not supabase_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase Auth is not configured"
        )

    try:
        response = requests.get(
            f"{supabase_url.rstrip('/')}/auth/v1/user",
            headers={
                "apikey": supabase_key,
                "Authorization": authorization
            },
            timeout=10
        )
    except requests.RequestException as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase Auth is unavailable"
        ) from error

    if response.status_code != status.HTTP_200_OK:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Supabase access token"
        )

    auth_user = response.json()

    try:
        auth_user_id = UUID(auth_user["id"])
    except (KeyError, TypeError, ValueError) as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Supabase user response"
        ) from error

    restaurant_user = (
        db.query(RestaurantUser)
        .filter(RestaurantUser.auth_user_id == auth_user_id)
        .first()
    )

    if not restaurant_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This Supabase user is not linked to a restaurant administrator"
        )

    return restaurant_user


@router.get("/me")
def get_current_user(
    restaurant_user: RestaurantUser = Depends(get_current_restaurant_user)
):
    return {
        "auth_user_id": str(restaurant_user.auth_user_id),
        "restaurant_id": str(restaurant_user.restaurant_id),
        "email": restaurant_user.email,
        "name": restaurant_user.name,
        "role": restaurant_user.role
    }
