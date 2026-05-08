from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles

from app.routes.api.v1 import api_router

app = FastAPI()

app.mount("/static", StaticFiles(directory="app/static"), name="static")

