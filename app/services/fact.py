from app.services.yandex import generate_fact
from app.crud.fact import create_fact
from app.models.topic import Topic
from app.services._types import LLMResult

async def generate_and_store_fact(db, topic: Topic | None):
    topic_name = topic.name if topic else "Интересный факт"
    result: LLMResult = await generate_fact(topic_name)
    fact = await create_fact(
        db,
        content=result.text,
        topic_id=topic.id if topic else None,
        source=result.model,
    )
    fact.topic = topic
    return fact
