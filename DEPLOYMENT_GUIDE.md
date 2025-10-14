# QuizCraft Production Deployment Guide

This guide provides step-by-step instructions for deploying QuizCraft to production.

## 📋 Pre-Deployment Checklist

### Environment Setup
- [ ] Production server provisioned
- [ ] Domain name configured
- [ ] SSL certificates obtained
- [ ] Database server setup
- [ ] File storage configured
- [ ] CDN configured (optional)

### Code Preparation
- [ ] All features tested and validated
- [ ] Code review completed
- [ ] Version tagged in git
- [ ] Build pipeline verified
- [ ] Environment-specific configurations ready

## 🔧 Backend Deployment

### 1. Server Requirements

**Minimum Specifications:**
- CPU: 2 cores
- RAM: 4GB
- Storage: 50GB SSD
- OS: Ubuntu 20.04+ or CentOS 8+

**Recommended for Production:**
- CPU: 4+ cores
- RAM: 8GB+
- Storage: 100GB+ SSD
- Load balancer for high availability

### 2. Dependencies Installation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

### 3. MongoDB Configuration

```bash
# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Create database and user
mongosh
```

```javascript
use quizcraft_prod
db.createUser({
  user: "quizcraftuser",
  pwd: "SECURE_PASSWORD_HERE",
  roles: [ { role: "readWrite", db: "quizcraft_prod" } ]
})
```

### 4. Application Deployment

```bash
# Clone repository
git clone https://github.com/your-org/quizcraft.git
cd quizcraft/backend

# Install dependencies
npm install --production

# Create uploads directory
mkdir -p uploads/files uploads/avatars

# Set proper permissions
sudo chown -R $USER:$USER uploads/
chmod -R 755 uploads/
```

### 5. Environment Configuration

Create `.env` file:

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://quizcraftuser:SECURE_PASSWORD_HERE@localhost:27017/quizcraft_prod
JWT_SECRET=your_jwt_secret_here_minimum_32_chars
GEMINI_API_KEY=your_gemini_api_key_here

# Email Configuration (for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Security
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# Bangladesh Payment Configuration
BKASH_MERCHANT_ID=your_bkash_merchant_id
NAGAD_MERCHANT_ID=your_nagad_merchant_id
```

### 6. PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'quizcraft-backend',
    script: 'server.js',
    cwd: '/path/to/quizcraft/backend',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/quizcraft-error.log',
    out_file: '/var/log/pm2/quizcraft-out.log',
    log_file: '/var/log/pm2/quizcraft.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 5000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

Start the application:

```bash
# Create log directory
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 7. Nginx Configuration

Create `/etc/nginx/sites-available/quizcraft`:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # File Upload Size
    client_max_body_size 10M;
    
    # API Routes
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }
    
    # File Uploads
    location /uploads/ {
        alias /path/to/quizcraft/backend/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/quizcraft /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 8. SSL Certificate

```bash
# Obtain SSL certificate
sudo certbot --nginx -d api.yourdomain.com

# Setup auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📱 Frontend Deployment

### Option 1: Expo/EAS Build (Recommended for Mobile)

```bash
cd frontend

# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Create production build
eas build --platform all --profile production

# Submit to app stores
eas submit --platform ios
eas submit --platform android
```

### Option 2: Web Deployment

```bash
cd frontend

# Build for web
npm run build:web

# Deploy to your hosting provider
# (Netlify, Vercel, AWS S3, etc.)
```

### Environment Configuration

Update `frontend/app.config.js`:

```javascript
export default {
  expo: {
    name: "QuizCraft",
    slug: "quizcraft",
    version: "1.0.0",
    orientation: "portrait",
    platforms: ["ios", "android", "web"],
    
    extra: {
      apiUrl: "https://api.yourdomain.com/api",
      environment: "production"
    },
    
    ios: {
      bundleIdentifier: "com.yourcompany.quizcraft",
      buildNumber: "1"
    },
    
    android: {
      package: "com.yourcompany.quizcraft",
      versionCode: 1,
      permissions: [
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE"
      ]
    }
  }
};
```

## 🔍 Monitoring & Maintenance

### 1. Log Monitoring

```bash
# PM2 logs
pm2 logs quizcraft-backend

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

### 2. Health Checks

Create health check endpoint in backend:

```javascript
// Add to your Express app
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version
  });
});
```

Setup monitoring script:

```bash
#!/bin/bash
# health-check.sh

response=$(curl -s -o /dev/null -w "%{http_code}" https://api.yourdomain.com/health)

if [ $response != "200" ]; then
    echo "API health check failed with status: $response"
    # Send alert (email, Slack, etc.)
fi
```

### 3. Backup Strategy

MongoDB backup script:

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mongodb"
DB_NAME="quizcraft_prod"

mkdir -p $BACKUP_DIR

mongodump --db $DB_NAME --out $BACKUP_DIR/backup_$DATE

# Compress backup
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz -C $BACKUP_DIR backup_$DATE
rm -rf $BACKUP_DIR/backup_$DATE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete

echo "Backup completed: backup_$DATE.tar.gz"
```

Add to crontab:

```bash
sudo crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

## 🚨 Security Considerations

### 1. Firewall Configuration

```bash
# Configure UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 2. MongoDB Security

```bash
# Enable authentication
sudo nano /etc/mongod.conf
```

```yaml
security:
  authorization: enabled
```

```bash
sudo systemctl restart mongod
```

### 3. Regular Updates

```bash
#!/bin/bash
# update.sh

# System updates
sudo apt update && sudo apt upgrade -y

# Node.js security updates
cd /path/to/quizcraft/backend
npm audit fix

# Restart services
pm2 restart all
sudo systemctl reload nginx

echo "Updates completed"
```

## 📊 Performance Optimization

### 1. Database Indexing

```javascript
// Create indexes for better performance
db.quizzes.createIndex({ "title": "text", "description": "text" })
db.quizzes.createIndex({ "category": 1 })
db.quizzes.createIndex({ "creator": 1 })
db.quizzes.createIndex({ "createdAt": -1 })
db.users.createIndex({ "email": 1 }, { "unique": true })
db.quizhistories.createIndex({ "user": 1, "createdAt": -1 })
```

### 2. Redis Caching (Optional)

```bash
# Install Redis
sudo apt install redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf
```

Add caching to your Express app:

```javascript
const redis = require('redis');
const client = redis.createClient();

// Cache frequently accessed data
app.get('/api/quiz/:id', async (req, res) => {
  const cacheKey = `quiz:${req.params.id}`;
  
  try {
    const cached = await client.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    
    const quiz = await Quiz.findById(req.params.id);
    await client.setex(cacheKey, 300, JSON.stringify(quiz)); // 5 min cache
    
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 🔄 CI/CD Pipeline (Optional)

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: |
        cd backend
        npm ci --production
    
    - name: Run tests
      run: |
        cd backend
        npm test
    
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.KEY }}
        script: |
          cd /path/to/quizcraft
          git pull origin main
          cd backend
          npm install --production
          pm2 restart quizcraft-backend
```

## 📱 App Store Deployment

### iOS App Store
1. Create Apple Developer Account
2. Configure certificates and provisioning profiles
3. Use EAS Build to create IPA file
4. Upload to App Store Connect
5. Submit for review

### Google Play Store
1. Create Google Play Console Account
2. Use EAS Build to create APK/AAB file
3. Upload to Google Play Console
4. Submit for review

## 🎯 Post-Deployment Verification

### Functionality Tests
- [ ] User registration and login
- [ ] Quiz creation and taking
- [ ] Payment flow
- [ ] Admin dashboard
- [ ] Mobile app functionality

### Performance Tests
- [ ] Page load times < 3 seconds
- [ ] API response times < 500ms
- [ ] Database query performance
- [ ] File upload speed

### Security Tests
- [ ] SSL certificate valid
- [ ] Security headers present
- [ ] Authentication working
- [ ] Rate limiting functional

## 📞 Support & Maintenance

### Error Tracking
- Set up error monitoring (e.g., Sentry)
- Configure alerts for critical errors
- Monitor performance metrics

### User Support
- Set up support email/ticket system
- Create user documentation
- Monitor user feedback

### Regular Maintenance
- Weekly security updates
- Monthly database cleanup
- Quarterly performance reviews
- Annual security audits

---

**Deployment Checklist Complete:** ✅

**Production URL:** https://yourdomain.com

**API URL:** https://api.yourdomain.com

**Deployed By:** DevOps Team

**Deployment Date:** [DATE]