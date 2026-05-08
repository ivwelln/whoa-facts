from fastapi import Depends
from fastapi.routing import APIRouter

from app.state import fact_cache
from app.database.session import get_db, AsyncSession
from app.services.yandex import generate_fact
from app.crud.topic import get_random_topic
from app.core.security import require_admin

router = APIRouter(prefix="/fact", tags=["fact"])


@router.get("/")
async def get_fact():
    fact = await fact_cache.get()
    if fact is None:
        return {"content": None, "topic": None, "source": None}
    return {
        "content": fact.content,
        "topic": fact.topic.name if fact.topic else None,
        "source": fact.source,
    }

@router.get("/new")
async def new_random_fact(db: AsyncSession = Depends(get_db, require_admin)):
    topic = await get_random_topic(db)
    topic_name = topic.name if topic else "Интересный факт"
    fact: str = await generate_fact(topic_name)
    return {"fact": fact}