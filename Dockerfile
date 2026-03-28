FROM python:3.11-slim

WORKDIR /app

# Install system deps
RUN apt-get update && apt-get install -y gcc

# Install Poetry
RUN pip install poetry

# Copy dependency files first (cache layer)
COPY pyproject.toml poetry.lock* /app/

# Copy all source code
COPY . /app

# Install dependencies, skip installing the package itself
RUN poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi

# Expose port
EXPOSE 8000

# Command to run FastAPI
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]