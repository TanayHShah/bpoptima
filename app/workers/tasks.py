import os
import asyncio
import urllib.request
import json
from datetime import datetime
from celery import Celery

from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.db.session import ASYNC_DATABASE_URL
from app.db.models.job import Job
from app.services.file_processor import (
    extract_text_from_pdf,
    extract_text_from_docx,
    count_lines,
)

celery = Celery(__name__)

async def _process_document_async(job_id: str, file_path: str, file_url: str):
    engine = create_async_engine(ASYNC_DATABASE_URL, pool_pre_ping=True)
    TaskSessionLocal = sessionmaker(bind=engine, class_=AsyncSession, autocommit=False, autoflush=False, expire_on_commit=False)
    
    async with TaskSessionLocal() as db:
        try:
            result = await db.execute(select(Job).filter(Job.id == job_id))
            job = result.scalar_one_or_none()
            if not job:
                return

            job.status = "processing"
            job.started_at = datetime.utcnow()
            await db.commit()

            await asyncio.sleep(10)

            if file_url and not file_path:
                ext = ".pdf" if ".pdf" in file_url.lower() else ".docx"
                file_path = f"uploads/{job_id}_downloaded{ext}"
                urllib.request.urlretrieve(file_url, file_path)

            text = ""
            if file_path.endswith(".pdf") or "pdf" in file_path.lower():
                text = extract_text_from_pdf(file_path)
            elif file_path.endswith(".docx") or "docx" in file_path.lower():
                text = extract_text_from_docx(file_path)
            else:
                raise ValueError("Unsupported file format")

            lines = count_lines(text)

            job.status = "completed"
            job.completed_at = datetime.utcnow()
            job.result = {
                "line_count": lines,
                "status": "success"
            }
            await db.commit()

            if job.webhook_url:
                target_url = job.webhook_url.replace("localhost:3000", "api:8000").replace("127.0.0.1:3000", "api:8000").replace("localhost:8000", "api:8000").replace("localhost", "api").replace("127.0.0.1", "api")
                payload = json.dumps({"job_id": job.id, "status": job.status, "result": job.result}).encode('utf-8')
                req = urllib.request.Request(target_url, data=payload, headers={'Content-Type': 'application/json'})
                try:
                    urllib.request.urlopen(req, timeout=5)
                except Exception as e:
                    print(f"Webhook delivery failed: {e}")

        except Exception as e:
            result = await db.execute(select(Job).filter(Job.id == job_id))
            job = result.scalar_one_or_none()
            if job:
                job.status = "failed"
                await db.commit()
            raise e
        finally:
            if file_path and os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except:
                    pass

    await engine.dispose()

@celery.task(bind=True, max_retries=3)
def process_document(self, job_id: str, file_path: str = None, file_url: str = None):
    try:
        asyncio.run(_process_document_async(job_id, file_path, file_url))
    except Exception as e:
        raise self.retry(exc=e, countdown=5)