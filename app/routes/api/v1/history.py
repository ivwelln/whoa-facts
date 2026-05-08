from fastapi import Request, APIRouter, Depends
from app.database.session import get_db
from app.crud.fact import list_facts, get_latest_fact

router = APIRouter(prefix="/facts", tags=["facts"])

@router.get("/")
async def index(request: Request, limit: int = 20, cursor: str | None = None, db = Depends(get_db)):
    return await list_facts(db, limit=limit, cursor=cursor)
    
@router.get("/latest")
async def get_latest(request: Request, db = Depends(get_db)):
    return await get_latest_fact(db)