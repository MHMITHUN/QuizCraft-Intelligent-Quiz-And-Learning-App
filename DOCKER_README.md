# 🐳 QuizCraft Docker Setup Guide

Run QuizCraft anywhere with Docker! This guide will help you deploy the complete QuizCraft platform using Docker containers.

## 📋 Prerequisites

Before you begin, make sure you have:

- **Docker** (version 20.10+)
- **Docker Compose** (version 2.0+)  
- **Google Gemini API Key** ([Get one here](https://makersuite.google.com/app/apikey))

## 🚀 Quick Start (5 minutes)

### 1. Clone or Download the Project
```bash
git clone <your-repository-url>
cd QuizCraft
```

### 2. Configure Environment
```bash
# Copy the environment template
cp .env.template .env

# Edit .env and add your Gemini API key
# GEMINI_API_KEY=your_actual_api_key_here
```

### 3. Start the Application
```bash
# Build and start all services
docker-compose up -d

# Wait for initialization (first run takes ~2-3 minutes)
docker-compose logs -f db-setup
```

### 4. Access Your Application
- **Frontend (Web)**: http://localhost:19006
- **Backend API**: http://localhost:5000
- **MongoDB**: localhost:27017

## 📁 Project Structure

```
QuizCraft/
├── backend/                 # Node.js API server
│   ├── Dockerfile
│   └── .dockerignore
├── frontend/                # React Native (Expo) web app
│   ├── Dockerfile
│   └── .dockerignore
├── scripts/
│   └── init-mongo.js       # Database initialization
├── docker-compose.yml      # Full stack orchestration
├── .env.template          # Environment configuration template
└── DOCKER_README.md       # This file
```

## ⚙️ Detailed Configuration

### Environment Variables (.env)

#### Required Settings
```bash
# Your Google Gemini API key (REQUIRED)
GEMINI_API_KEY=your_gemini_api_key_here

# Admin password for the admin@quizcraft.com account
ADMIN_PASSWORD=YourSecurePassword123!
```

#### Optional Advanced Settings
```bash
# Database configuration (uses Docker MongoDB by default)
MONGODB_URI=mongodb://quizcraft_user:quizcraft_pass@mongodb:27017/quizcraft

# JWT configuration
JWT_SECRET=your_super_secret_jwt_key

# Rate limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# Quiz limits per user type
FREE_QUIZ_LIMIT=10
PREMIUM_QUIZ_LIMIT=1000
```

## 🔧 Docker Commands

### Basic Operations
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose down
docker-compose up --build -d
```

### Development Commands
```bash
# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb

# Execute commands in containers
docker-compose exec backend npm run setup
docker-compose exec mongodb mongosh quizcraft
```

### Data Management
```bash
# Backup database
docker-compose exec mongodb mongodump --db quizcraft --out /backup

# Clean up everything (⚠️ DESTRUCTIVE - removes all data)
docker-compose down -v
docker system prune -a
```

## 🌐 Service Details

### Backend API (Port 5000)
- **Health Check**: http://localhost:5000/api/health
- **API Documentation**: Available via the application
- **Technologies**: Node.js, Express, MongoDB, Gemini AI

### Frontend Web App (Port 19006)
- **Main URL**: http://localhost:19006
- **Technologies**: React Native (Expo), React Navigation
- **Responsive**: Works on desktop and mobile browsers

### MongoDB Database (Port 27017)
- **Connection**: `mongodb://quizcraft_user:quizcraft_pass@localhost:27017/quizcraft`
- **Admin Connection**: `mongodb://admin:quizcraft2024@localhost:27017`
- **Auto-initialized**: Database, collections, and indexes created automatically

## 👥 Default Accounts

After first setup, you can log in with:

- **Admin Account**:
  - Email: `admin@quizcraft.com`
  - Password: Value from `ADMIN_PASSWORD` in your `.env` file (default: `ChangeThisPassword!`)

## 🔍 Troubleshooting

### Common Issues

#### 1. "Permission Denied" Errors
```bash
# On Linux/Mac, fix Docker permissions
sudo chown -R $USER:$USER .
```

#### 2. Port Already in Use
```bash
# Check what's using the ports
netstat -tulpn | grep :5000
netstat -tulpn | grep :19006

# Kill processes or change ports in docker-compose.yml
```

#### 3. Database Connection Errors
```bash
# Check if MongoDB is running
docker-compose ps mongodb

# View MongoDB logs
docker-compose logs mongodb

# Reset database (⚠️ deletes all data)
docker-compose down -v
docker-compose up -d
```

#### 4. Frontend Build Errors
```bash
# Rebuild frontend container
docker-compose build frontend
docker-compose up -d frontend
```

### Service Health Checks

Check if services are healthy:
```bash
# Quick status check
docker-compose ps

# Detailed health information
docker inspect --format='{{.State.Health.Status}}' quizcraft-backend
docker inspect --format='{{.State.Health.Status}}' quizcraft-frontend
```

## 🚢 Pushing to Docker Hub

To push your customized version:

```bash
# Build and tag images
docker build -t mahamudulhasan0/quizcraft-devlopment-environment:backend ./backend
docker build -t mahamudulhasan0/quizcraft-devlopment-environment:frontend ./frontend

# Push to Docker Hub
docker push mahamudulhasan0/quizcraft-devlopment-environment:backend
docker push mahamudulhasan0/quizcraft-devlopment-environment:frontend

# For full stack image, build from root
docker build -t mahamudulhasan0/quizcraft-devlopment-environment:latest .
docker push mahamudulhasan0/quizcraft-devlopment-environment:latest
```

## 📊 Monitoring & Logs

### Real-time Monitoring
```bash
# Follow all logs
docker-compose logs -f

# Monitor resource usage
docker stats

# View container processes
docker-compose top
```

### Log Files
Logs are available through Docker commands. For persistent logging, mount volumes:

```yaml
# Add to docker-compose.yml services
volumes:
  - ./logs:/app/logs
```

## 🔐 Security Considerations

### Production Deployment
- Change default passwords
- Use environment-specific `.env` files
- Enable HTTPS with reverse proxy (nginx/Apache)
- Implement proper backup strategy
- Monitor container resource usage
- Regularly update base images

### Network Security
```bash
# Create custom network for better isolation
docker network create --driver bridge quizcraft-secure
```

## 🆘 Support & Help

### Getting Help
1. Check the logs: `docker-compose logs -f`
2. Verify configuration: Ensure `.env` file has correct values
3. Test API: Visit http://localhost:5000/api/health
4. Database check: `docker-compose exec mongodb mongosh quizcraft`

### Useful Commands
```bash
# Complete restart (keeps data)
docker-compose restart

# Force rebuild everything
docker-compose build --no-cache
docker-compose up -d

# Clean slate (⚠️ deletes all data)
docker-compose down -v
docker system prune -a
docker-compose up -d
```

---

## 📝 Quick Reference

| Service | Port | URL | Description |
|---------|------|-----|-------------|
| Frontend | 19006 | http://localhost:19006 | Web application |
| Backend | 5000 | http://localhost:5000 | REST API |
| MongoDB | 27017 | mongodb://localhost:27017 | Database |

### Essential Files
- `.env` - Your configuration
- `docker-compose.yml` - Service orchestration
- `backend/Dockerfile` - Backend container definition
- `frontend/Dockerfile` - Frontend container definition

**🎉 You're all set! QuizCraft should now be running and accessible at http://localhost:19006**