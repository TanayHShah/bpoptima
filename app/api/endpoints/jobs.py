import shutil
import os
from typing import Optional
from fastapi import HTTPException, APIRouter, UploadFile, File, Depends, Form
from sqlalchemy.future import select
from app.db.models.job import Job
from app.db.session import AsyncSessionLocal
from app.workers.tasks import process_document
from app.core.security import get_current_user
from app.schemas.job import JobResponse
import shutil
import os

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/jobs", response_model=JobResponse)
async def create_job(
    file: Optional[UploadFile] = File(None),
    file_url: Optional[str] = Form(None),
    webhook_url: Optional[str] = Form(None),
    user = Depends(get_current_user)
):
    if not file and not file_url:
        raise HTTPException(status_code=400, detail="Must provide either file or file_url")
    if file and file_url:
        raise HTTPException(status_code=400, detail="Must provide exactly one of file or file_url, not both")
    
    if file and not file.filename.endswith((".pdf", ".docx")):
        raise HTTPException(status_code=400, detail="Only PDF or DOCX allowed")

    async with AsyncSessionLocal() as db:
        job = Job(status="queued", file_url=file_url, webhook_url=webhook_url)
        db.add(job)
        await db.commit()
        await db.refresh(job)

        file_path = None
        if file:
            file_path = os.path.join(UPLOAD_DIR, f"{job.id}_{file.filename}")
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

        process_document.delay(job.id, file_path, file_url)

        return job

@router.get("/jobs", response_model=list[JobResponse])
async def list_jobs(user = Depends(get_current_user)):
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Job))
        return result.scalars().all()

@router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: str, user = Depends(get_current_user)):
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Job).filter(Job.id == job_id))
        job = result.scalar_one_or_none()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        return job