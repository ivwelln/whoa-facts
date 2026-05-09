from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from datetime import date, datetime
from zoneinfo import ZoneInfo
TZ = ZoneInfo("Europe/Moscow")

from app.state import fact_cache
from app.core.config import settings
from app import scheduler as app_scheduler
from app.database.session import async_session
from app.crud.fact import get_latest_fact

from app.routes.api.v1 import fact, history, topic
from app.routes import pages


@asynccontextmanager
async def lifespan(app: FastAPI):
    today = datetime.now(TZ).date()
    async with async_session() as db:
        try:
            latest = await get_latest_fact(db)
        except Exception as e:
            latest = None
            print(f"Error fetching latest fact: {e}")
        
    if latest and latest.created_at.astimezone(TZ).date() == today:
        await fact_cache.set(latest)
    else:
        await app_scheduler.refresh_daily_fact()
        
    app_scheduler.start()
    yield
    app_scheduler.stop()

app = FastAPI(lifespan=lifespan)

app.mount("/static", StaticFiles(directory="app/static"), name="static")

app.include_router(pages.router)
app.include_router(fact.router, prefix="/api/v1")
app.include_router(topic.router, prefix="/api/v1")
app.include_router(history.router, prefix="/api/v1")

