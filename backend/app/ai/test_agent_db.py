from app.ai.agent import run_agent
from app.database.connection import SessionLocal


db = SessionLocal()


response = run_agent(
    """
    Create a reservation.

    Name: Michael
    Phone: +353871111111
    Date: 2026-08-26
    Time: 19:00
    Guests: 4
    """,
    db
)


print(response)


db.close()