from app.models.conversation_log import ConversationLog


def save_message(
    db,
    restaurant_id,
    phone,
    user_message,
    ai_response
):

    log = ConversationLog(
        restaurant_id=restaurant_id,
        customer_phone=phone,
        user_message=user_message,
        ai_response=ai_response
    )

    db.add(log)
    db.commit()

def get_history(
    db,
    phone,
    restaurant_id
):

    logs = (
        db.query(ConversationLog)
        .filter(
            ConversationLog.customer_phone == phone,
            ConversationLog.restaurant_id == restaurant_id
        )
        .order_by(
            ConversationLog.created_at
        )
        .all()
    )


    history = []

    for log in logs:

        history.append(
            {
                "role": "user",
                "content": log.user_message
            }
        )

        history.append(
            {
                "role": "assistant",
                "content": log.ai_response
            }
        )

    return history
