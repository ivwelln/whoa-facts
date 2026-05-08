import anthropic
from app.core.config import settings

client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

async def generate_fact(topic: str) -> str:
    response = await client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=500,
        temperature=0.7,
        system="Отвечай на русском языке. Давай один интересный, проверяемый факт без вступлений.",
        messages=[{"role": "user", "content": f"Расскажи интересный факт про: {topic}"}],
    )
    return response.content[0].text
