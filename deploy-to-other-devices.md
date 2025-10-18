# 🚀 Deploy QuizCraft to Any Device - Easy Guide

## Method 1: Using Docker Hub (Recommended - Easiest)

### Step 1: Push Your Changes to Docker Hub

On your development machine:

```bash
# 1. Make your changes and commit them
git add .
git commit -m "my latest changes"
git push

# 2. Build and push Docker images to Docker Hub
.\build-and-push.ps1
```

This will push your images to: `mahamudulhasan0/quizcraft-devlopment-environment`

### Step 2: Run on Any Other Device

On the other device (any Windows/Mac/Linux computer):

```bash
# 1. Install Docker Desktop
# Download from: https://www.docker.com/products/docker-desktop

# 2. Create a new folder
mkdir QuizCraft
cd QuizCraft

# 3. Create docker-compose.yml file
```

Create this `docker-compose.yml` file:

```yaml
version: "3.8"

services:
  # MongoDB Database
  mongodb:
    image: mongo:7
    container_name: quizcraft-mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: quizcraft2024
      MONGO_INITDB_DATABASE: quizcraft
    volumes:
      - mongodb_data:/data/db
    networks:
      - quizcraft-network

  # Backend API (using your Docker Hub image)
  backend:
    image: mahamudulhasan0/quizcraft-devlopment-environment:backend
    container_name: quizcraft-backend
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: production
      PORT: 5000
      MONGODB_URI: mongodb://quizcraft_user:quizcraft_pass@mongodb:27017/quizcraft
      JWT_SECRET: your_super_secret_jwt_key_change_this_in_production
      JWT_EXPIRE: 7d
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      GEMINI_MODEL: gemini-1.5-pro
      EMBEDDING_MODEL: gemini-embedding-001
      VECTOR_INDEX_NAME: quizembeddings_vector_index
      UPLOAD_PATH: ./uploads
      MAX_FILE_SIZE: 10485760
      RATE_LIMIT_WINDOW_MS: 900000
      RATE_LIMIT_MAX_REQUESTS: 100
      FREE_QUIZ_LIMIT: 10
      PREMIUM_QUIZ_LIMIT: 1000
      ADMIN_EMAIL: admin@quizcraft.com
      ADMIN_PASSWORD: ${ADMIN_PASSWORD:-ChangeThisPassword!}
    depends_on:
      - mongodb
    volumes:
      - backend_uploads:/app/uploads
    networks:
      - quizcraft-network

  # Frontend Web App (using your Docker Hub image)
  frontend:
    image: mahamudulhasan0/quizcraft-devlopment-environment:frontend
    container_name: quizcraft-frontend
    restart: unless-stopped
    ports:
      - "19006:19006"
    environment:
      EXPO_DEVTOOLS_LISTEN_ADDRESS: 0.0.0.0
      REACT_NATIVE_PACKAGER_HOSTNAME: 0.0.0.0
    depends_on:
      - backend
    networks:
      - quizcraft-network
    volumes:
      - /app/node_modules
    stdin_open: true
    tty: true

networks:
  quizcraft-network:
    driver: bridge

volumes:
  mongodb_data:
    driver: local
  backend_uploads:
    driver: local
```

```bash
# 4. Create .env file
```

Create `.env` file:

```env
# Your Google Gemini API Key (REQUIRED)
GEMINI_API_KEY=your_gemini_api_key_here

# Admin password
ADMIN_PASSWORD=YourSecurePassword123!
```

```bash
# 5. Start the application
docker-compose up -d

# 6. Check if everything is running
docker-compose ps

# 7. Open in browser
# Frontend: http://localhost:19006
# Backend: http://localhost:5000
```

## Method 2: Using Git Clone (Alternative)

### On the other device:

```bash
# 1. Install Docker Desktop
# 2. Clone your repository
git clone https://github.com/your-username/QuizCraft.git
cd QuizCraft

# 3. Copy environment template
cp .env.template .env
# Edit .env and add your GEMINI_API_KEY

# 4. Start everything
docker-compose up -d
```

## Method 3: One-Click Setup Script

Create this `setup-quizcraft.ps1` script:

```powershell
# QuizCraft One-Click Setup Script
Write-Host "🚀 QuizCraft One-Click Setup" -ForegroundColor Green

# Check if Docker is installed
try {
    docker --version | Out-Null
    Write-Host "✅ Docker is installed!" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    Write-Host "Download from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Create project directory
$projectDir = "QuizCraft"
if (Test-Path $projectDir) {
    Write-Host "📁 Project directory already exists" -ForegroundColor Yellow
} else {
    New-Item -ItemType Directory -Name $projectDir
    Set-Location $projectDir
    Write-Host "📁 Created project directory" -ForegroundColor Green
}

# Create docker-compose.yml
$dockerComposeContent = @"
version: '3.8'

services:
  mongodb:
    image: mongo:7
    container_name: quizcraft-mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: quizcraft2024
      MONGO_INITDB_DATABASE: quizcraft
    volumes:
      - mongodb_data:/data/db
    networks:
      - quizcraft-network

  backend:
    image: mahamudulhasan0/quizcraft-devlopment-environment:backend
    container_name: quizcraft-backend
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: production
      PORT: 5000
      MONGODB_URI: mongodb://quizcraft_user:quizcraft_pass@mongodb:27017/quizcraft
      JWT_SECRET: your_super_secret_jwt_key_change_this_in_production
      JWT_EXPIRE: 7d
      GEMINI_API_KEY: `${GEMINI_API_KEY}
      GEMINI_MODEL: gemini-1.5-pro
      EMBEDDING_MODEL: gemini-embedding-001
      VECTOR_INDEX_NAME: quizembeddings_vector_index
      UPLOAD_PATH: ./uploads
      MAX_FILE_SIZE: 10485760
      RATE_LIMIT_WINDOW_MS: 900000
      RATE_LIMIT_MAX_REQUESTS: 100
      FREE_QUIZ_LIMIT: 10
      PREMIUM_QUIZ_LIMIT: 1000
      ADMIN_EMAIL: admin@quizcraft.com
      ADMIN_PASSWORD: `${ADMIN_PASSWORD:-ChangeThisPassword!}
    depends_on:
      - mongodb
    volumes:
      - backend_uploads:/app/uploads
    networks:
      - quizcraft-network

  frontend:
    image: mahamudulhasan0/quizcraft-devlopment-environment:frontend
    container_name: quizcraft-frontend
    restart: unless-stopped
    ports:
      - "19006:19006"
    environment:
      EXPO_DEVTOOLS_LISTEN_ADDRESS: 0.0.0.0
      REACT_NATIVE_PACKAGER_HOSTNAME: 0.0.0.0
    depends_on:
      - backend
    networks:
      - quizcraft-network
    volumes:
      - /app/node_modules
    stdin_open: true
    tty: true

networks:
  quizcraft-network:
    driver: bridge

volumes:
  mongodb_data:
    driver: local
  backend_uploads:
    driver: local
"@

Set-Content -Path "docker-compose.yml" -Value $dockerComposeContent
Write-Host "📝 Created docker-compose.yml" -ForegroundColor Green

# Create .env file
$envContent = @"
# Your Google Gemini API Key (REQUIRED)
GEMINI_API_KEY=your_gemini_api_key_here

# Admin password
ADMIN_PASSWORD=YourSecurePassword123!
"@

Set-Content -Path ".env" -Value $envContent
Write-Host "📝 Created .env file" -ForegroundColor Green

Write-Host ""
Write-Host "⚠️  IMPORTANT: Edit the .env file and add your GEMINI_API_KEY!" -ForegroundColor Yellow
Write-Host "   Get your API key from: https://makersuite.google.com/app/apikey" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key after editing .env file..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Start the application
Write-Host "🚀 Starting QuizCraft..." -ForegroundColor Green
docker-compose up -d

# Wait a moment
Start-Sleep -Seconds 5

# Check status
Write-Host "🔍 Checking services..." -ForegroundColor Yellow
docker-compose ps

Write-Host ""
Write-Host "🎉 QuizCraft is now running!" -ForegroundColor Green
Write-Host "📱 Frontend: http://localhost:19006" -ForegroundColor Cyan
Write-Host "🔧 Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 To stop: docker-compose down" -ForegroundColor Yellow
Write-Host "📋 To view logs: docker-compose logs -f" -ForegroundColor Yellow
```

## Quick Commands for Other Devices

### Start QuizCraft

```bash
docker-compose up -d
```

### Stop QuizCraft

```bash
docker-compose down
```

### Update to Latest Version

```bash
docker-compose pull
docker-compose up -d
```

### Check Status

```bash
docker-compose ps
```

### View Logs

```bash
docker-compose logs -f
```

## Troubleshooting

### Port Already in Use

```bash
# Check what's using the ports
netstat -ano | findstr :19006
netstat -ano | findstr :5000

# Kill the process or change ports in docker-compose.yml
```

### Docker Not Running

```bash
# Start Docker Desktop
# Or restart Docker service
```

### Permission Issues (Linux/Mac)

```bash
sudo chown -R $USER:$USER .
```

## System Requirements

### Minimum Requirements

- **RAM**: 4GB
- **Storage**: 10GB free space
- **OS**: Windows 10+, macOS 10.14+, Ubuntu 18.04+
- **Docker**: Version 20.10+

### Recommended Requirements

- **RAM**: 8GB+
- **Storage**: 20GB+ free space
- **CPU**: 4+ cores
- **Internet**: Stable connection for Docker Hub pulls
