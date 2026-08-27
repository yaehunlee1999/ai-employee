from app.ai.agent import run_agent


response = run_agent(
    "I want to book a table for 4 people tomorrow at 7pm"
)


print(response)