from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from zoneinfo import ZoneInfo

from app.core.config import settings
from app.database.session import async_session
from app.services.fact import generate_and_store_fact
from app.state import fact_cache
from app.crud.topic import get_random_topic

scheduler = AsyncIOScheduler(timezone=ZoneInfo("Europe/Moscow"))

async def refresh_daily_fact() -> None:
    async with async_session() as db:
        try: 
            topic = await get_random_topic(db) if settings.TOPIC_MODE == "random" else None
            fact = await generate_and_store_fact(db, topic=topic)
            await db.commit()
        except Exception as e:
            await db.rollback()
            print(f"Error refreshing daily fact: {e}")
            return 
        await fact_cache.set(fact)
            
def start() -> None:
    scheduler.add_job(
        refresh_daily_fact,
        CronTrigger(hour=0, minute=0),
        id="refresh_daily_fact",
        replace_existing=True,
        misfire_grace_time=60
    )
    scheduler.start()
    
def stop() -> None:
    scheduler.shutdown(wait=False)