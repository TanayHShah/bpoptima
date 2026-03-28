from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str

    postgres_db: str
    postgres_user: str
    postgres_password: str
    postgres_host: str
    postgres_port: int

    redis_host: str
    redis_port: int
    redis_password: str

    celery_broker_url: str
    celery_result_backend: str

    class Config:
        env_file = ".env"

settings = Settings()