import openai
from app.core.config import settings

client = openai.OpenAI(
    api_key=settings.YANDEX_API_KEY,
    base_url="https://ai.api.cloud.yandex.net/v1",
    project="b1gd0nmlrjfmujl5i22g"
)

async def generate_fact(topic: str) -> str:
    response = client.responses.create(
        prompt={
            "id": "fvtnnu1o0gokuil4gke7",
            "variables": {
                "topic": topic,
            }
        },
        input=f"Расскажи интересный факт.",
    )
    return response.output_text
