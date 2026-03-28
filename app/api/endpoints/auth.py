from fastapi import APIRouter, HTTPException
from sqlalchemy.future import select
from app.db.session import AsyncSessionLocal
from app.db.models.user import User
from app.core.security import hash_password, verify_password, create_access_token

router = APIRouter()

@router.post("/register")
async def register(email: str, password: str):
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).filter(User.email == email))
        user = result.scalar_one_or_none()
        if user:
            raise HTTPException(400, "User already exists")

        new_user = User(email=email, password=hash_password(password))
        db.add(new_user)
        await db.commit()

        return {"message": "User created"}

@router.post("/login")
async def login(email: str, password: str):
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).filter(User.email == email))
        user = result.scalar_one_or_none()
        if not user or not verify_password(password, user.password):
            raise HTTPException(401, "Invalid credentials")

        token = create_access_token({"sub": user.id})

        return {"access_token": token}