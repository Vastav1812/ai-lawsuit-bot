# AI Court Bot - Docker Setup

This document provides instructions for running the AI Court Bot using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 2GB of available RAM
- At least 5GB of available disk space

## Quick Start

1. **Clone the repository and navigate to the project directory:**
   ```bash
   cd ai-lawsuit-bot
   ```

2. **Set up environment variables:**
   - Copy `.env.example` to `.env` in both `backend/` and `frontend/` directories
   - Configure your environment variables (API keys, database URLs, etc.)

3. **Build and start the services:**
   ```bash
   docker-compose up --build
   ```

4. **Access the application:**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000

## Docker Compose Services

### Backend Service
- **Port:** 3000
- **Container:** ai-court-backend
- **Health Check:** http://localhost:3000/health
- **Volumes:**
  - `./cases:/app/cases` - Case data persistence
  - `./backend/data:/app/data` - Backend data
  - `./backend/cache:/app/cache` - Cache storage

### Frontend Service
- **Port:** 3001
- **Container:** ai-court-frontend
- **Health Check:** http://localhost:3001
- **Dependencies:** Backend service (waits for backend to be healthy)

## Useful Commands

### Start services in background:
```bash
docker-compose up -d
```

### View logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Stop services:
```bash
docker-compose down
```

### Rebuild and restart:
```bash
docker-compose down
docker-compose up --build
```

### View service status:
```bash
docker-compose ps
```

### Execute commands in containers:
```bash
# Backend shell
docker-compose exec backend sh

# Frontend shell
docker-compose exec frontend sh
```

## Environment Variables

### Backend (.env)
```env
NODE_ENV=production
PORT=3000
# Add your specific backend environment variables
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
# Add your specific frontend environment variables
```

## Production Deployment

For production deployment, consider:

1. **Using a reverse proxy (nginx):**
   ```yaml
   # Add to docker-compose.yml
   nginx:
     image: nginx:alpine
     ports:
       - "80:80"
       - "443:443"
     volumes:
       - ./nginx.conf:/etc/nginx/nginx.conf
     depends_on:
       - frontend
       - backend
   ```

2. **Adding a database service:**
   ```yaml
   # Add to docker-compose.yml
   postgres:
     image: postgres:15-alpine
     environment:
       POSTGRES_DB: ai_court
       POSTGRES_USER: aicourt
       POSTGRES_PASSWORD: your_password
     volumes:
       - postgres_data:/var/lib/postgresql/data
   ```

3. **Using Docker secrets for sensitive data:**
   ```yaml
   # In docker-compose.yml
   secrets:
     - db_password
     - api_key
   ```

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   ```bash
   # Check what's using the ports
   lsof -i :3000
   lsof -i :3001
   ```

2. **Permission issues:**
   ```bash
   # Fix volume permissions
   sudo chown -R $USER:$USER ./cases ./backend/data ./backend/cache
   ```

3. **Build failures:**
   ```bash
   # Clean build
   docker-compose down
   docker system prune -f
   docker-compose up --build
   ```

4. **Health check failures:**
   ```bash
   # Check service logs
   docker-compose logs backend
   docker-compose logs frontend
   ```

### Performance Optimization

1. **Resource limits:**
   ```yaml
   # Add to services in docker-compose.yml
   deploy:
     resources:
       limits:
         memory: 1G
         cpus: '0.5'
   ```

2. **Volume optimization:**
   ```yaml
   # Use named volumes for better performance
   volumes:
     - cases_data:/app/cases
     - backend_data:/app/data
     - backend_cache:/app/cache
   ```

## Security Considerations

- Services run as non-root users
- Multi-stage builds reduce attack surface
- Health checks ensure service availability
- Environment variables for sensitive configuration
- Network isolation between services

## Monitoring

### Health Checks
- Backend: `curl http://localhost:3000/health`
- Frontend: `curl http://localhost:3001`

### Logs
```bash
# Real-time logs
docker-compose logs -f

# Log analysis
docker-compose logs backend | grep ERROR
```

## Development vs Production

### Development
```bash
# Use development environment
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### Production
```bash
# Use production environment
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Backup and Recovery

### Backup
```bash
# Backup case data
tar -czf cases-backup-$(date +%Y%m%d).tar.gz ./cases

# Backup volumes
docker run --rm -v ai-court_cases-data:/data -v $(pwd):/backup alpine tar czf /backup/cases-data-backup.tar.gz -C /data .
```

### Recovery
```bash
# Restore case data
tar -xzf cases-backup-20231201.tar.gz

# Restore volumes
docker run --rm -v ai-court_cases-data:/data -v $(pwd):/backup alpine tar xzf /backup/cases-data-backup.tar.gz -C /data
``` 