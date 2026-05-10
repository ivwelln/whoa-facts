from fastapi import Request, Response
from fastapi.routing import APIRouter
from fastapi.templating import Jinja2Templates
from app.state import fact_cache

router = APIRouter()

templates = Jinja2Templates(directory="app/templates")

@router.get("/")
async def index(request: Request):
    fact = await fact_cache.get()
    return templates.TemplateResponse(request, "index.html", context={"fact": fact})

@router.get("/history")
async def history(request: Request):
    return templates.TemplateResponse(request, "history.html")

@router.get("/admin")
async def admin(request: Request):
    return templates.TemplateResponse(request, "admin.html")
