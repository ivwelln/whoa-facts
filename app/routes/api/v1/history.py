from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query

from app.database.session import get_db
from app.crud.fact import list_facts, get_latest_fact

router = APIRouter(prefix="/facts", tags=["facts"])


def _serialize(fact):
    return {
        "id": fact.id,
        "content": fact.content,
        "topic": fact.topic.name if fact.topic else None,
        "source": fact.source,
        "created_at": fact.created_at.isoformat(),
    }


@router.get("/")
async def index(
    limit: int = Query(20, ge=1, le=100),
    cursor: str | None = None,
    db=Depends(get_db),
):
    cursor_dt: datetime | None = None
    if cursor:
        try:
            cursor_dt = datetime.fromisoformat(cursor)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid cursor format")

    facts, next_cursor = await list_facts(db, limit=limit, cursor=cursor_dt)
    return {
        "facts": [_serialize(f) for f in facts],
        "next_cursor": next_cursor.isoformat() if next_cursor else None,
    }


@router.get("/latest")
async def get_latest(db=Depends(get_db)):
    fact = await get_latest_fact(db)
    return _serialize(fact) if fact else None
