import openai
from app.core.config import settings
from app.services._types import LLMResult

client = openai.OpenAI(
    api_key=settings.YANDEX_API_KEY,
    base_url="https://ai.api.cloud.yandex.net/v1",
    project=settings.YANDEX_FOLDER_ID
)

async def generate_fact(topic: str) -> LLMResult:
    """Returns raw response from model."""
    response = client.responses.create(
        model=f"gpt://{settings.YANDEX_FOLDER_ID}/{settings.YANDEX_MODEL}",
        prompt={
            "id": "fvtnnu1o0gokuil4gke7",
            "variables": {
                "topic": topic,
            }
        },
        temperature=0.8,
        max_output_tokens=1000
    )
    return LLMResult(
        text=response.output_text,
        input_tokens=response.usage.input_tokens,
        output_tokens=response.usage.output_tokens,
        total_tokens=response.usage.total_tokens,
        model=response.model
    )
