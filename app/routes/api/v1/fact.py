from fastapi import Depends, HTTPException, status
from fastapi.routing import APIRouter

from app.state import fact_cache
from app.database.session import get_db, AsyncSession
from app.services.yandex import generate_fact
from app.crud.topic import get_random_topic
from app.core.security import require_admin
from app.crud.fact import create_fact, get_latest_fact, delete_by_id
from app.services._types import LLMResult
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

@router.post("/new", dependencies=[Depends(require_admin)])
# @router.post("/new")
async def new_random_fact(db: AsyncSession = Depends(get_db)):
    topic = await get_random_topic(db)
    topic_name = topic.name if topic else "Интересный факт"
    raw_fact: LLMResult = await generate_fact(topic_name)
    fact = raw_fact.text
    source = raw_fact.model
    await create_fact(db, fact, topic.id, source)
    return {"fact": fact}

@router.post("/update-fact", dependencies=[Depends(require_admin)])
# @router.post("/update-fact")
async def update_homepage_fact(db:AsyncSession = Depends(get_db)):
    fact = await get_latest_fact(db)
    await fact_cache.set(fact)
    
@router.delete("/{fact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_selected(fact_id: int, db: AsyncSession = Depends(get_db)):
    if not await delete_by_id(db, fact_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fact not found.")
    
    # Check if fact is cached and active. 
    cached = await fact_cache.get()
    if cached and cached.id == fact_id:
        latest = await get_latest_fact(db)
        if latest:
            await fact_cache.set(latest) 
        else:
            fact_cache.clear()