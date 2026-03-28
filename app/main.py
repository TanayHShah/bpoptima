from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import jobs, auth

from app.db.base import Base
from app.db.session import engine
from app.db.models.job import Job
from app.db.models.user import User

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()

app = FastAPI(title="Async Document Processing API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(jobs.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")

mock_webhooks = []

@app.post("/api/v1/webhooks")
async def receive_webhook(request: Request):
    payload = await request.json()
    mock_webhooks.insert(0, {"payload": payload})
    if len(mock_webhooks) > 20:
        mock_webhooks.pop()
    return {"status": "ok"}

@app.get("/api/v1/webhooks")
async def list_webhooks():
    return mock_webhooks