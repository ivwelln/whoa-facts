from app.services.gemini import generate_fact
from app.crud.fact import create_fact
from app.models.topic import Topic

async def generate_and_store_fact(db, topic: Topic | None, source: str):
    if source.lower() != "claude":
        raise ValueError("Unsupported source")

    topic_name = topic.name if topic else "Интересный факт"
    text = await generate_fact(topic_name)
    fact = await create_fact(
        db,
        content=text,
        topic_id=topic.id if topic else None,
        source=source,
    )
    fact.topic = topic
    return fact
