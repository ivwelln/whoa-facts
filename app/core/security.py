import secrets
from fastapi import Header, HTTPException, status

from app.core.config import settings

async def require_admin(x_admin_token: str = Header(..., alias="X-Admin-Token")):
    if not secrets.compare_digest(x_admin_token, settings.ADMIN_TOKEN):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin token",
        )

