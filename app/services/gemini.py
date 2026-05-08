from google import genai
from google.genai import types

from app.core.config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)

async def generate_fact(topic: str) -> str:
    response = await client.aio.models.generate_content(
        model="gemini-2.5-flash",
        contents=f"Расскажи интересный факт про: {topic}",
        config=types.GenerateContentConfig(
            system_instruction=settings.GEMINI_INSTRUCTION,
            temperature=0.7,
            max_output_tokens=500,
        ),
    )
    return response.text