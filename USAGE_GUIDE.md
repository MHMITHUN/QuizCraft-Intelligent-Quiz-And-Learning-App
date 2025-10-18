# 🚀 QuizCraft - Complete Usage Guide

Welcome to QuizCraft! This guide will help you deploy and use the QuizCraft AI-powered quiz platform anywhere using Docker.

## 📋 What You Need

- **Docker** and **Docker Compose** installed
- **Google Gemini API Key** ([Get one free here](https://makersuite.google.com/app/apikey))
- **5 minutes** of your time!

## 🎯 Quick Deploy (Anywhere in the World)

### Method 1: Pull from Docker Hub (Recommended)

```bash
# 1. Create a new directory
mkdir quizcraft-app
cd quizcraft-app

# 2. Download the required files
curl -O https://raw.githubusercontent.com/your-repo/QuizCraft/main/docker-compose.hub.yml
curl -O https://raw.githubusercontent.com/your-repo/QuizCraft/main/.env.template
curl -O https://raw.githubusercontent.com/your-repo/QuizCraft/main/scripts/init-mongo.js

# 3. Setup environment
cp .env.template .env
# Edit .env and add: GEMINI_API_KEY=your_actual_key_here

# 4. Create scripts directory
mkdir scripts
# Move init-mongo.js to scripts/

# 5. Deploy!
docker-compose -f docker-compose.hub.yml up -d
```

### Method 2: Using Docker Run (Single Command)

```bash
# Quick start with minimal setup
docker run -d \
  --name quizcraft-full \
  -p 19006:19006 \
  -p 5000:5000 \
  -p 27017:27017 \
  -e GEMINI_API_KEY=your_api_key_here \
  -e ADMIN_PASSWORD=YourSecurePassword123 \
  mahamudulhasan0/quizcraft-devlopment-environment:latest
```

## 🌐 Access Your Application

After deployment (takes ~2-3 minutes):

| Service | URL | Description |
|---------|-----|-------------|
| **Web App** | http://localhost:19006 | Main QuizCraft interface |
| **API** | http://localhost:5000 | Backend REST API |
| **Database** | mongodb://localhost:27017 | MongoDB database |

## 👥 Login Accounts

### Default Admin Account
- **Email**: `admin@quizcraft.com`
- **Password**: Your `ADMIN_PASSWORD` from .env (default: `ChangeThisPassword!`)

### User Registration
- Users can register directly through the web interface
- Guest access is also available for testing

## 🎮 How to Use QuizCraft

### 1. Creating Your First Quiz

**Option A: From Text**
1. Login to the web app
2. Click "Create Quiz" 
3. Select "From Text"
4. Paste or type your content
5. Choose quiz settings (number of questions, difficulty)
6. Click "Generate Quiz"

**Option B: From Files (PDF/Images)**
1. Click "Create Quiz"
2. Select "Upload File"
3. Upload PDF or image file
4. AI will extract text and generate quiz
5. Review and publish

### 2. Taking Quizzes
1. Browse available quizzes on the dashboard
2. Click on any quiz to start
3. Answer questions and get instant feedback
4. View detailed explanations for each answer
5. Track your progress in analytics

### 3. Managing Content (Admin)
1. Login with admin account
2. Access admin panel
3. Manage users, categories, and system settings
4. Monitor quiz generation usage and limits

## ⚙️ Configuration Options

### Environment Variables (.env)

```bash
# Required
GEMINI_API_KEY=your_gemini_api_key_here
ADMIN_PASSWORD=YourSecurePassword123

# Optional
JWT_SECRET=your_custom_jwt_secret
FREE_QUIZ_LIMIT=10
PREMIUM_QUIZ_LIMIT=1000
RATE_LIMIT_MAX_REQUESTS=100
```

### Port Configuration

Change ports in docker-compose.yml if needed:
```yaml
ports:
  - "19006:19006"  # Frontend
  - "5000:5000"    # Backend
  - "27017:27017"  # MongoDB
```

## 📊 Features Overview

### 🧠 AI Quiz Generation
- **Smart Content Analysis**: AI reads and understands your content
- **Multiple Question Types**: MCQ, True/False, Short Answer
- **Automatic Explanations**: Every answer includes AI-generated explanations
- **Difficulty Levels**: Easy, Medium, Hard questions

### 📄 File Processing
- **PDF Support**: Extract text from PDF documents
- **Image OCR**: Read text from images using Tesseract
- **Smart Parsing**: AI identifies relevant content for questions

### 🔍 Search & Discovery
- **Vector Search**: Find similar quizzes using AI embeddings
- **Category Filtering**: Browse by subject areas
- **Performance Analytics**: Track user progress and trends

### 👥 User Management
- **Role-Based Access**: Guest, Student, Teacher, Admin roles
- **Usage Quotas**: Configurable limits per user type
- **JWT Authentication**: Secure login system

## 🔧 Maintenance Commands

### View Logs
```bash
# All services
docker-compose -f docker-compose.hub.yml logs -f

# Specific service
docker-compose -f docker-compose.hub.yml logs -f backend
```

### Restart Services
```bash
# Restart everything
docker-compose -f docker-compose.hub.yml restart

# Restart specific service
docker-compose -f docker-compose.hub.yml restart backend
```

### Update to Latest Version
```bash
# Pull latest images
docker-compose -f docker-compose.hub.yml pull

# Restart with new images
docker-compose -f docker-compose.hub.yml up -d
```

### Backup Database
```bash
# Create backup
docker-compose -f docker-compose.hub.yml exec mongodb mongodump --db quizcraft --out /backup

# Restore backup
docker-compose -f docker-compose.hub.yml exec mongodb mongorestore --db quizcraft /backup/quizcraft
```

## 🚨 Troubleshooting

### Common Issues

**1. Can't connect to application**
```bash
# Check if containers are running
docker ps

# Check logs for errors
docker-compose -f docker-compose.hub.yml logs
```

**2. Database connection errors**
```bash
# Restart database
docker-compose -f docker-compose.hub.yml restart mongodb

# Check database status
docker-compose -f docker-compose.hub.yml exec mongodb mongosh --eval "db.adminCommand('ping')"
```

**3. Gemini API errors**
- Verify your API key is correct in .env
- Check API key quotas at [Google AI Studio](https://makersuite.google.com)
- Ensure API key has proper permissions

**4. Port conflicts**
```bash
# Check what's using the ports
netstat -tulpn | grep :5000
netstat -tulpn | grep :19006

# Change ports in docker-compose.yml if needed
```

### Performance Optimization

**For Production Use:**
1. Use environment-specific .env files
2. Enable HTTPS with reverse proxy
3. Set up proper backup schedules  
4. Monitor resource usage with `docker stats`
5. Scale services as needed

## 📱 Mobile Access

QuizCraft web interface is fully responsive and works great on:
- ✅ Desktop browsers (Chrome, Firefox, Safari, Edge)
- ✅ Mobile browsers (iOS Safari, Android Chrome)
- ✅ Tablet devices
- ✅ Progressive Web App (PWA) capable

## 🔐 Security Best Practices

### Production Deployment
1. **Change Default Passwords**: Update ADMIN_PASSWORD and JWT_SECRET
2. **Use HTTPS**: Set up SSL certificates with nginx/Apache reverse proxy
3. **Firewall Configuration**: Restrict access to MongoDB port (27017)
4. **Regular Updates**: Keep Docker images updated
5. **Backup Strategy**: Implement automated database backups

### Example Nginx Config
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:19006;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📞 Support & Help

### Getting Help
1. **Check Logs**: `docker-compose logs -f`
2. **Verify Configuration**: Ensure .env has correct values
3. **Test API**: Visit http://localhost:5000/api/health
4. **Database Check**: `docker-compose exec mongodb mongosh quizcraft`

### Common Commands Reference
```bash
# Status check
docker-compose -f docker-compose.hub.yml ps

# Full restart (keeps data)
docker-compose -f docker-compose.hub.yml restart

# Clean slate (⚠️ deletes data)
docker-compose -f docker-compose.hub.yml down -v
docker-compose -f docker-compose.hub.yml up -d

# Resource monitoring
docker stats
```

## 🎉 Success!

You now have QuizCraft running! Here's what you can do:

1. **Create your first quiz** at http://localhost:19006
2. **Test the API** at http://localhost:5000/api/health
3. **Explore admin features** with the admin account
4. **Scale and customize** as needed for your use case

**QuizCraft is now ready to revolutionize your quiz creation workflow!** 🚀

---

## 📝 Quick Reference Card

| Action | Command |
|--------|---------|
| Start | `docker-compose -f docker-compose.hub.yml up -d` |
| Stop | `docker-compose -f docker-compose.hub.yml down` |
| Logs | `docker-compose -f docker-compose.hub.yml logs -f` |
| Update | `docker-compose -f docker-compose.hub.yml pull && docker-compose -f docker-compose.hub.yml up -d` |
| Backup | `docker-compose -f docker-compose.hub.yml exec mongodb mongodump` |

**Happy Quiz Crafting! 🎯✨**