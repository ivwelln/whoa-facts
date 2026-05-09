from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.fact import Fact
from datetime import datetime

async def create_fact(db: AsyncSession, content: str, topic_id: int | None = None, source: str | None = None):
    fact = Fact(content=content, topic_id=topic_id, source=source)
    db.add(fact)
    await db.flush()
    return fact

async def get_latest_fact(db: AsyncSession):
    result = await db.execute(
        select(Fact)
        .options(selectinload(Fact.topic))
        .order_by(Fact.created_at.desc())
        .limit(1)
    )
    return result.scalars().first()

async def list_facts(db: AsyncSession, limit: int = 20, cursor: datetime | None = None):
    query = (
        select(Fact)
        .options(selectinload(Fact.topic))
        .order_by(Fact.created_at.desc())
        .limit(limit)
    )
    if cursor:
        query = query.where(Fact.created_at < cursor)
    result = await db.execute(query)
    facts = result.scalars().all()
    next_cursor = facts[-1].created_at if len(facts) == limit else None
    return facts, next_cursor