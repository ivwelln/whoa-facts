from fastapi import APIRouter, Depends

from app.core.security import require_admin

router = APIRouter(prefix="/auth", tags=["auth"])

@router.get("/verify", dependencies=[Depends(require_admin)])
async def verify():
    return {"ok": True}
