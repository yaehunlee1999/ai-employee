from pydantic import BaseModel, Field


class VapiAssistantSettingsUpdate(BaseModel):
    # Send null (or an empty value from the form) to disconnect the assistant.
    vapi_assistant_id: str | None = Field(default=None, max_length=255)
