from fastapi import Request, Response
from fastapi.routing import APIRouter
from fastapi.templating import Jinja2Templates

router = APIRouter()

templates = Jinja2Templates(directory="app/templates")

@router.get("/")
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@router.get("/history")
async def read_history(request: Request):
    return templates.TemplateResponse("history.html", {"request": request})