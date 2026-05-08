from fastapi import Request, HTTPException, Depends
from fastapi.routing import APIRouter
from app.database.session import get_db
from fastapi import status, Header

from app.core.security import require_admin
from app.crud.topic import create_topic, list_topics, delete_topic, delete_all_topics

router = APIRouter(prefix="/topics", tags=["topics"])

@router.get("/")
async def list(request: Request, db=Depends(get_db)):
    return await list_topics(db)

@router.post("/create", dependencies=[Depends(require_admin)], status_code=status.HTTP_201_CREATED)
async def create(request: Request, name: str, db=Depends(get_db)):
    return await create_topic(db, name)

@router.delete("/delete/{topic_id}", dependencies=[Depends(require_admin)], status_code=status.HTTP_204_NO_CONTENT)
async def delete(request: Request, topic_id: int, db=Depends(get_db)):
    if not await delete_topic(db, topic_id):
        raise HTTPException(status_code=404, detail="Topic not found")

@router.delete("/delete_all", dependencies=[Depends(require_admin)], status_code=status.HTTP_204_NO_CONTENT)
async def delete_all(request: Request, db=Depends(get_db)):
    return await delete_all_topics(db)