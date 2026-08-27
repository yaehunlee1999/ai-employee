from openai import OpenAI
from dotenv import load_dotenv
import os
import json

from app.ai.prompts import SYSTEM_PROMPT
from app.ai.tools import (
    create_reservation_tool,
    execute_create_reservation
)

from app.services.conversation_service import (
    get_history,
    save_message
)


load_dotenv()


client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)


def run_agent(message: str, db, phone: str, restaurant_id):
    conversation_history = get_history(
        db,
        phone,
        restaurant_id
    )


    response = client.chat.completions.create(

        model="gpt-4.1-mini",

        messages=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT
            },
            *conversation_history,
            {
                "role": "user",
                "content": message
            }
        ],

        tools=[
            create_reservation_tool
        ]

    )


    message_response = response.choices[0].message


    ai_text = message_response.content or ""


    if message_response.tool_calls:

        tool_call = message_response.tool_calls[0]


        arguments = json.loads(
            tool_call.function.arguments
        )


        result = execute_create_reservation(
            arguments,
            db,
            restaurant_id=restaurant_id
        )


        ai_text = (
            f"Your reservation has been created. "
            f"Reservation ID: {result.id}"
        )


        save_message(
            db=db,
            restaurant_id=restaurant_id,
            phone=phone,
            user_message=message,
            ai_response=ai_text
        )


        return {
            "success": True,
            "message": "Reservation successfully created.",
            "reservation_id": str(result.id)
        }


    save_message(
        db=db,
        restaurant_id=restaurant_id,
        phone=phone,
        user_message=message,
        ai_response=ai_text
    )


    return {
        "message": ai_text
    }
