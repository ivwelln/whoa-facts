import anthropic

from app.core.config import settings

client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

async def get_fact_from_claude(topic: str) -> str:
    try:
        response = await client.completions.create(
            model="claude-sonnet-4-5",
            max_tokens_to_sample=100,
            temperature=0.7,
            top_p=1,
            stream=False,
            stop_sequences=["\n\n"],
            prompt=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant that provides interesting facts. Answer on russian language."
                },
                {
                    "role": "user",
                    "content": f"Tell me an interesting fact about {topic}."
                }
            ]
        )
        return response.completion
    except Exception as e:
        print(f"Error fetching fact from Claude: {e}")
        return "Sorry, I couldn't fetch a fact at this time."   