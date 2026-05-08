from fastapi import Request
from fastapi.routing import APIRouter

router = APIRouter(prefix="/fact", tags=["fact"])

@router.get("/")
async def get_fact(request: Request):
    # Placeholder for actual logic to get a fact from Claude
    return {"fact": "This is a placeholder fact from Claude."}