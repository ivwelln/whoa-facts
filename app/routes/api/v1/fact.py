from fastapi.routing import APIRouter

from app.state import fact_cache

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
