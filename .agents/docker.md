---
description: "Docker and Docker Compose conventions for development and deployment"
globs: "**/Dockerfile, **/docker-compose*.yml"
---

# Docker & Docker Compose Conventions

## Project Services

The DATN monorepo runs 4 services via Docker Compose:

| Service | Image/Build | Port | Purpose |
|---|---|---|---|
| `frontend` | Build from `./frontend` | 3000 | Next.js 14 App |
| `backend` | Build from `./backend` | 3001 | NestJS API |
| `ml-service` | Build from `./ml` | 8000 | FastAPI inference |
| `mysql` | `mysql:8.0` | 3306 | Database |
| `redis` | `redis:7-alpine` | 6379 | Cache |

## docker-compose.yml Structure

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_started
    env_file: ./backend/.env

  ml-service:
    build: ./ml
    ports:
      - "8000:8000"
    volumes:
      - ./ml/models:/app/models    # Mount trained models
    env_file: ./ml/.env

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
    env_file: ./frontend/.env

volumes:
  mysql_data:
```

## Dockerfile Best Practices

- Use multi-stage builds to reduce image size.
- Use specific base image tags (e.g., `node:20-alpine`, `python:3.11-slim`), not `latest`.
- Copy dependency files first, install, then copy source code (leverage Docker layer caching).
- Use `.dockerignore` to exclude `node_modules/`, `.git/`, `data/`, `__pycache__/`.
- Run as non-root user in production.
- Set `WORKDIR` explicitly.

### Node.js Dockerfile (Frontend/Backend)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3001
CMD ["node", "dist/main.js"]
```

### Python Dockerfile (ML Service)

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY service/ ./service/
EXPOSE 8000
CMD ["uvicorn", "service.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Environment Variables

- Use `.env` files per service (gitignored).
- Provide `.env.example` files with placeholder values for documentation.
- Never hardcode secrets in Dockerfiles or docker-compose.yml.
- Use `env_file` directive in docker-compose.yml.

## Development vs Production

- **Dev:** Use `docker-compose.yml` with volume mounts for hot-reload.
- **Prod:** Use `docker-compose.prod.yml` with built images, no volume mounts, resource limits.
- Use `depends_on` with `condition: service_healthy` for proper startup order.
