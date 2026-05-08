import asyncio
from app.models.fact import Fact

class FactCache:
    def __init__(self):
        self._fact: Fact | None = None
        self._lock = asyncio.Lock()
        
    async def set(self, fact: Fact) -> None:
        async with self._lock:
            self._fact = fact
                
    async def get(self) -> Fact | None:
        async with self._lock:
            return self._fact
        
fact_cache = FactCache()