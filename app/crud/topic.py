from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.topic import Topic

async def create_topic(db: AsyncSession, name: str):
    topic = Topic(name=name)
    db.add(topic)
    await db.flush()
    return topic

async def list_topics(db: AsyncSession):
    result = await db.execute(select(Topic).order_by(Topic.name))
    return result.scalars().all()

async def delete_topic(db: AsyncSession, topic_id: int):
    topic = await db.get(Topic, topic_id)
    if topic:
        await db.delete(topic)
        await db.flush()
        return True
    return False

async def delete_all_topics(db: AsyncSession):
    result = await db.execute(select(Topic))
    topics = result.scalars().all()
    for topic in topics:
        await db.delete(topic)
    await db.flush()
    return len(topics)

async def get_random_topic(db: AsyncSession):
    result = await db.execute(select(Topic).order_by(func.random()).limit(1))
    return result.scalars().first()