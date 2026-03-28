# BP Optima - Enterprise Document Processing API

BP Optima is a highly-concurrent, asynchronous document processing system built for heavy load. It features a completely decoupled architecture powered by FastAPI, PostgreSQL, Redis, Celery, and a robust React frontend dashboard.

This pipeline allows users to securely upload documents or submit document URLs, processing them in the background while instantly responding to API requests. Completed job payloads are automatically delivered downstream using asynchronous Webhook mechanisms.

---

## System Architecture & Design Patterns

The system strictly adheres to the **Asynchronous Worker Queue Pattern** combined with **Decoupled Stateless Microservices** utilizing secure JWT Token Authentication.

### Technology Stack & Rationale

1. **FastAPI (REST API Engine)**
   * **Reasoning**: Selected natively for its top-tier asynchronous processing speeds powered by `uvicorn`. By inherently supporting `async`/`await` primitives, FastAPI ensures that I/O-heavy operations (like handling user file uploads or broadcasting webhooks) will never block the master event loops handling concurrent HTTP socket threads.
   * **Design pattern**: Leverages Pydantic v2 schemas as validation boundaries between the user request payload and internal Python bytecode logic to entirely isolate SQL injection models and malformed requests.

2. **Celery & Redis (Background Message Broker)**
   * **Reasoning**: Document processing functions (e.g., text extraction, massive aggregations) are computationally intensive and can exceed HTTP timeout constraints if handled inside a standard web request view.
   * **Design pattern**: Celery inherently enforces the **Producer/Consumer (Queue) pattern**. Redis immediately caches short-term job pointers (message payload queueing), while highly isolated background Python worker threads execute processing logic autonomously on independent hardware/threads.

3. **PostgreSQL & SQLAlchemy asyncpg (Persistent Acid Store)**
   * **Reasoning**: To store long-term, strict relational metadata regarding user identity, credential hashing, and highly transactional job statuses.
   * **Design pattern**: Adopted an `asyncpg` fully asynchronous SQL driver implementation. This is essential for unlocking native Database event loops, preventing blocking when creating asynchronous background database connections.

4. **React & Vite with Tailwind CSS V4 (Frontend SPA)**
   * **Reasoning**: Standard template rendering (like Jinja2) drastically binds UI updates to server-side loads resulting in janked interfaces. A standalone Single-Page-Application gracefully isolates state management, allowing API polling and animated transition overlays natively.
   * **Design pattern**: Uses dynamic **Axios interceptors** to securely strap JWT tokens to backend HTTP proxies, creating an isolated UI context decoupled completely from backend operations. Tailwind provides responsive, design-system compliant token aesthetics out of the box with zero runtime CSS-in-JS overhead.

5. **Docker Compose (Container Orchestration)**
   * **Reasoning**: To reliably sandbox the completely differing lifecycles (React Dev Server, FastAPI Uvicorn, Celery Pre-fork Workers, Postgres, Redis Runtime).
   * **Design pattern**: **Shared Ephemeral Volumes**. Both the API (uploading files) and the Background worker (reading them) rely on temporary local disk caching. By allocating a single named docker-controlled Volume `uploads_data`, we ensure perfectly synchronised filesystem pointers bridging two entirely isolated Linux containers.

---

## Setup Instructions

### Prerequisites
- Docker & Docker Desktop
- Tested natively via `python-poetry` locally but orchestrated primarily for `docker-compose`.

### Configuration
1. Initialize a `.env` file in the root directory (refer to `.env.example`).
2. Ensure you specify the secure JWT `SECRET_KEY` and align the `POSTGRES_USER` passwords.

### Booting the Architecture

Launch the entire decoupled ecosystem (5 containers spanning network, cache, pipeline, api, and UI):

```bash
docker compose up --build -d
```
All system networking, package installations (`npm`/`poetry`), schema initiations, and PostCSS configuration are fully abstracted behind Docker layers.

---

## Endpoint Specifications

- **Web Dashboard Integration**: Access securely at `http://localhost:3000/`. Provides dynamic authentication rendering and auto-polling queues.
- **API Sandbox**: OpenAPI Swagger UI effortlessly auto-generated at `http://localhost:8000/docs`.

### Core API Flow
1. `POST /api/v1/register` : Constructs a new User schema leveraging `passlib.bcrypt` iteration hashing.
2. `POST /api/v1/login` : Issues stateless JWT OAuth2 Bearer token securely for dashboard authorization.
3. `POST /api/v1/jobs` : Creates a BackgroundTask utilizing Celery `delay()`. Accepts `multipart/form-data` uploads or absolute strings representing network hosted documents.
4. `GET /api/v1/jobs` : Validates active tokens utilizing Pydantic logic strings, fetching isolated Postgres instances resolving real-time job queues.
5. `POST /api/v1/webhooks` : (Mock receiver listener internally logging webhook payloads)
