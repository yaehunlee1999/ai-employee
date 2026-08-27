"""Seed a safe, repeatable Demo Restaurant after its owner completes onboarding.

This script never creates Supabase Auth users. Use the existing /signup flow
with a real, verified email first; then run this script with that owner email.
It refuses to modify a non-demo restaurant, so Test Restaurant and production
restaurants cannot be selected accidentally.
"""

import argparse
from datetime import date, datetime, time, timedelta
from uuid import UUID

from sqlalchemy import func, text

from app.database.connection import SessionLocal
from app.models.conversation_log import ConversationLog
from app.models.customer import Customer
from app.models.reservation import Reservation
from app.models.restaurant import Restaurant
from app.models.restaurant_settings import RestaurantSettings
from app.models.restaurant_user import RestaurantUser


DEMO_RESTAURANT_NAME = "Harbour & Hearth"
DEMO_PHONE = "+353 1 555 0148"
DEMO_ADDRESS = "42 Grand Canal Street, Dublin 2"
DEMO_CUSTOMERS = (
    ("30111111-1111-4111-8111-111111111111", "Aoife Murphy", "+353 86 123 4567"),
    ("30222222-2222-4222-8222-222222222222", "James O'Connor", "+353 87 234 5678"),
    ("30333333-3333-4333-8333-333333333333", "Sofia Rossi", "+353 85 345 6789"),
    ("30444444-4444-4444-8444-444444444444", "Liam Byrne", "+353 89 456 7890"),
    ("30555555-5555-4555-8555-555555555555", "Maya Patel", "+353 86 567 8901"),
    ("30666666-6666-4666-8666-666666666666", "Noah Kelly", "+353 87 678 9012"),
)


def demo_reservations(today: date):
    return (
        ("40111111-1111-4111-8111-111111111111", 0, 0, "19:00", 4, "confirmed", "Anniversary dinner", 0),
        ("40222222-2222-4222-8222-222222222222", 1, 1, "20:00", 2, "confirmed", "Window table requested", 1),
        ("40333333-3333-4333-8333-333333333333", 2, 2, "18:30", 6, "confirmed", "Birthday celebration", 2),
        ("40444444-4444-4444-8444-444444444444", 3, 0, "20:30", 3, "confirmed", None, 3),
        ("40555555-5555-4555-8555-555555555555", 4, 3, "19:15", 2, "cancelled", "Guest cancelled by phone", 4),
        ("40666666-6666-4666-8666-666666666666", 5, 4, "18:00", 5, "confirmed", "High chair requested", 5),
        ("40777777-7777-4777-8777-777777777777", 0, 5, "21:00", 2, "confirmed", None, 6),
        ("40888888-8888-4888-8888-888888888888", 1, 6, "19:30", 4, "confirmed", "Dietary note recorded", 6),
        ("40999999-9999-4999-8999-999999999999", 2, 2, "20:45", 2, "cancelled", "Late cancellation", 5),
    )


def demo_conversations(now: datetime):
    return (
        {
            "id": "50111111-1111-4111-8111-111111111111",
            "phone": "+353 86 123 4567",
            "vapi_call_id": "demo-harbour-hearth-call-001",
            "reservation_id": "40111111-1111-4111-8111-111111111111",
            "summary": "Aoife booked an anniversary dinner for four at 7:00 PM.",
            "transcript": "Assistant: Welcome to Harbour & Hearth. How can I help?\nCustomer: A table for four tonight at seven, please.\nAssistant: Your table for four is confirmed for 7:00 PM.",
            "duration": 94.0,
            "analysis": {"successEvaluation": "true", "structuredData": {"party_size": 4, "occasion": "anniversary"}},
            "ended_reason": "customer-ended-call",
            "created_at": now - timedelta(hours=2),
        },
        {
            "id": "50222222-2222-4222-8222-222222222222",
            "phone": "+353 87 234 5678",
            "vapi_call_id": "demo-harbour-hearth-call-002",
            "reservation_id": "40222222-2222-4222-8222-222222222222",
            "summary": "James booked a window table for two tomorrow at 8:00 PM.",
            "transcript": "Assistant: What date and time would you prefer?\nCustomer: Tomorrow at eight for two.\nAssistant: Confirmed. I have added your window table request.",
            "duration": 78.0,
            "analysis": {"successEvaluation": "true", "structuredData": {"party_size": 2, "table_preference": "window"}},
            "ended_reason": "assistant-ended-call",
            "created_at": now - timedelta(hours=5),
        },
        {
            "id": "50333333-3333-4333-8333-333333333333",
            "phone": "+353 85 345 6789",
            "vapi_call_id": "demo-harbour-hearth-call-003",
            "reservation_id": "40333333-3333-4333-8333-333333333333",
            "summary": "Sofia booked a birthday dinner for six this weekend.",
            "transcript": "Assistant: How many guests will be joining you?\nCustomer: Six for a birthday dinner.\nAssistant: Wonderful. Your table for six is confirmed.",
            "duration": 111.0,
            "analysis": {"successEvaluation": "true", "structuredData": {"party_size": 6, "occasion": "birthday"}},
            "ended_reason": "customer-ended-call",
            "created_at": now - timedelta(days=1, hours=3),
        },
        {
            "id": "50444444-4444-4444-8444-444444444444",
            "phone": "+353 89 456 7890",
            "vapi_call_id": "demo-harbour-hearth-call-004",
            "reservation_id": "40444444-4444-4444-8444-444444444444",
            "summary": "Liam confirmed a table for three this Friday.",
            "transcript": "Assistant: I can help with that reservation.\nCustomer: Friday at half past eight for three.\nAssistant: Your reservation is confirmed.",
            "duration": 86.0,
            "analysis": {"successEvaluation": "true", "structuredData": {"party_size": 3}},
            "ended_reason": "customer-ended-call",
            "created_at": now - timedelta(days=2),
        },
        {
            "id": "50555555-5555-4555-8555-555555555555",
            "phone": "+353 86 567 8901",
            "vapi_call_id": "demo-harbour-hearth-call-005",
            "reservation_id": None,
            "summary": "Maya asked about availability but did not complete a booking.",
            "transcript": "Assistant: What time were you looking for?\nCustomer: I am still deciding.\nAssistant: No problem. Please call back whenever you are ready.",
            "duration": 46.0,
            "analysis": {"successEvaluation": "false", "structuredData": {"booking_completed": False}},
            "ended_reason": "customer-ended-call",
            "created_at": now - timedelta(days=3),
        },
        {
            "id": "50666666-6666-4666-8666-666666666666",
            "phone": "+353 87 678 9012",
            "vapi_call_id": "demo-harbour-hearth-call-006",
            "reservation_id": "40666666-6666-4666-8666-666666666666",
            "summary": "Noah booked a table for five and requested a high chair.",
            "transcript": "Assistant: I have noted a high chair for your party.\nCustomer: Thank you, five people at six.\nAssistant: Your reservation is confirmed.",
            "duration": 103.0,
            "analysis": {"successEvaluation": "true", "structuredData": {"party_size": 5, "high_chair": True}},
            "ended_reason": "assistant-ended-call",
            "created_at": now - timedelta(days=4),
        },
        {
            "id": "50777777-7777-4777-8777-777777777777",
            "phone": "+353 86 123 4567",
            "vapi_call_id": None,
            "reservation_id": None,
            "summary": None,
            "transcript": None,
            "duration": None,
            "analysis": None,
            "ended_reason": None,
            "user_message": "Do you have a table for two this evening?",
            "ai_response": "I can help with that. What time would you prefer?",
            "created_at": now - timedelta(days=5),
        },
        {
            "id": "50888888-8888-4888-8888-888888888888",
            "phone": "+353 87 234 5678",
            "vapi_call_id": None,
            "reservation_id": None,
            "summary": None,
            "transcript": None,
            "duration": None,
            "analysis": None,
            "ended_reason": None,
            "user_message": "Can I bring a stroller?",
            "ai_response": "Yes. We can accommodate a stroller—please let us know your preferred time.",
            "created_at": now - timedelta(days=5, hours=3),
        },
        {
            "id": "50999999-9999-4999-8999-999999999999",
            "phone": "+353 85 345 6789",
            "vapi_call_id": None,
            "reservation_id": None,
            "summary": None,
            "transcript": None,
            "duration": None,
            "analysis": None,
            "ended_reason": None,
            "user_message": "What time do you close on Sunday?",
            "ai_response": "Our Sunday hours are 12:00 PM to 10:00 PM.",
            "created_at": now - timedelta(days=6),
        },
        {
            "id": "51000000-0000-4000-8000-000000000000",
            "phone": "+353 89 456 7890",
            "vapi_call_id": None,
            "reservation_id": None,
            "summary": None,
            "transcript": None,
            "duration": None,
            "analysis": None,
            "ended_reason": None,
            "user_message": "Do you have vegetarian options?",
            "ai_response": "Yes. Our menu includes several vegetarian dishes.",
            "created_at": now - timedelta(days=6, hours=4),
        },
    )


def get_arguments():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--owner-email", required=True, help="Verified demo owner email")
    parser.add_argument("--dry-run", action="store_true", help="Validate without committing")
    return parser.parse_args()


def main():
    arguments = get_arguments()
    owner_email = arguments.owner_email.strip().lower()
    db = SessionLocal()

    try:
        owner = (
            db.query(RestaurantUser)
            .filter(func.lower(RestaurantUser.email) == owner_email)
            .one_or_none()
        )
        if not owner or not owner.auth_user_id:
            raise SystemExit(
                "No confirmed onboarding owner found. Create and verify a new "
                "Harbour & Hearth owner account through /signup first."
            )

        email_confirmed = db.execute(
            text(
                "select email_confirmed_at is not null "
                "from auth.users where id = :auth_user_id"
            ),
            {"auth_user_id": owner.auth_user_id}
        ).scalar_one_or_none()
        if email_confirmed is not True:
            raise SystemExit(
                "The demo owner email is not confirmed yet. Complete the "
                "Supabase verification email before seeding demo data."
            )

        restaurant = db.get(Restaurant, owner.restaurant_id)
        if not restaurant:
            raise SystemExit("The demo owner is not linked to a restaurant.")
        if not restaurant.is_demo and restaurant.name != DEMO_RESTAURANT_NAME:
            raise SystemExit(
                "Refusing to modify a non-demo restaurant. During onboarding, use "
                f"the exact restaurant name: {DEMO_RESTAURANT_NAME}"
            )

        restaurant.name = DEMO_RESTAURANT_NAME
        restaurant.phone_number = DEMO_PHONE
        restaurant.address = DEMO_ADDRESS
        restaurant.max_capacity = 80
        restaurant.is_demo = True

        settings = (
            db.query(RestaurantSettings)
            .filter(RestaurantSettings.restaurant_id == restaurant.id)
            .one_or_none()
        )
        if not settings:
            settings = RestaurantSettings(restaurant_id=restaurant.id)
            db.add(settings)
        settings.phone_number = DEMO_PHONE
        settings.timezone = "Europe/Dublin"
        settings.business_hours = {
            "monday": "12:00-22:30",
            "tuesday": "12:00-22:30",
            "wednesday": "12:00-22:30",
            "thursday": "12:00-22:30",
            "friday": "12:00-23:00",
            "saturday": "12:00-23:00",
            "sunday": "12:00-22:00"
        }

        customer_ids = []
        for customer_id, name, phone in DEMO_CUSTOMERS:
            parsed_id = UUID(customer_id)
            customer_ids.append(parsed_id)
            customer = db.get(Customer, parsed_id)
            if customer:
                if customer.name != name or customer.phone != phone:
                    raise SystemExit("Demo customer ID conflicts with existing data.")
                continue
            db.add(Customer(id=parsed_id, name=name, phone=phone))

        # The seed uses explicit UUID foreign keys rather than ORM
        # relationships. Flush each parent group so PostgreSQL can enforce the
        # real customer -> reservation -> conversation dependency order.
        db.flush()

        now = datetime.now().replace(microsecond=0)
        for reservation_id, customer_index, day_offset, clock, guests, status, notes, created_days_ago in demo_reservations(date.today()):
            parsed_id = UUID(reservation_id)
            reservation = db.get(Reservation, parsed_id)
            if reservation and reservation.restaurant_id != restaurant.id:
                raise SystemExit("Demo reservation ID conflicts with another restaurant.")
            reservation_date = date.today() + timedelta(days=day_offset)
            reservation_time = time.fromisoformat(clock)
            if not reservation:
                reservation = Reservation(id=parsed_id)
                db.add(reservation)
            reservation.restaurant_id = restaurant.id
            reservation.customer_id = customer_ids[customer_index]
            reservation.reservation_date = reservation_date
            reservation.reservation_time = reservation_time
            reservation.guests = guests
            reservation.status = status
            reservation.notes = notes
            reservation.created_at = now - timedelta(days=created_days_ago)

        db.flush()

        for record in demo_conversations(now):
            parsed_id = UUID(record["id"])
            conversation = db.get(ConversationLog, parsed_id)
            if conversation and conversation.restaurant_id != restaurant.id:
                raise SystemExit("Demo conversation ID conflicts with another restaurant.")
            if not conversation:
                conversation = ConversationLog(id=parsed_id)
                db.add(conversation)
            conversation.restaurant_id = restaurant.id
            conversation.customer_phone = record["phone"]
            conversation.vapi_call_id = record["vapi_call_id"]
            conversation.reservation_id = (
                UUID(record["reservation_id"])
                if record["reservation_id"]
                else None
            )
            conversation.summary = record["summary"]
            conversation.transcript = record["transcript"]
            conversation.duration = record["duration"]
            conversation.analysis = record["analysis"]
            conversation.call_ended_reason = record["ended_reason"]
            conversation.user_message = record.get("user_message")
            conversation.ai_response = record.get("ai_response")
            conversation.created_at = record["created_at"]

        if arguments.dry_run:
            db.rollback()
            print("Demo seed validation passed; no changes were committed.")
            return

        db.commit()
        print(f"Demo restaurant seeded: {DEMO_RESTAURANT_NAME}")
        print("Reservations: 9 (7 confirmed, 2 cancelled)")
        print("Conversation logs: 10 (6 Vapi calls, 4 AI chats)")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
