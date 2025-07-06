# 🚀 AquaSense Deployment Guide

## Quick Local Setup
```bash
npm install
npm start
```
Access at: `http://localhost:3000`

## ☁️ Cloud Deployment Options

### 1. Railway (Recommended - Free & Easy)
1. Push code to GitHub
2. Visit [railway.app](https://railway.app)
3. Connect GitHub account
4. Click "Deploy from GitHub repo"
5. Select your AquaSense repository
6. Railway auto-detects Node.js and deploys

**Pros:** 
- Free tier available
- Automatic HTTPS
- Easy environment variables
- Good for real-time apps

### 2. Render
1. Push code to GitHub
2. Visit [render.com](https://render.com)
3. Create new "Web Service"
4. Connect your GitHub repository
5. Use these settings:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node

**Pros:**
- Free tier with 750 hours/month
- Automatic SSL
- Easy database integration

### 3. Heroku
1. Install [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
2. Login: `heroku login`
3. Create app: `heroku create aquasense-dashboard`
4. Deploy:
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

### 4. Vercel (Frontend-focused)
Good for static deployment, but limited for WebSocket/Socket.IO

### 5. VPS/Server Deployment
For production environments:

```bash
# Install Node.js and PM2
sudo apt update
sudo apt install nodejs npm
npm install -g pm2

# Clone and setup
git clone <your-repo>
cd AquaSense_Project
npm install

# Start with PM2 (production)
pm2 start server.js --name "aquasense"
pm2 startup
pm2 save

# Setup reverse proxy with Nginx
sudo apt install nginx
# Configure nginx to proxy to localhost:3000
```

## 🔧 Environment Variables

For production, you may want to set:
- `PORT` - Server port (default: 3000)
- `NODE_ENV=production`
- Any MQTT credentials if using external broker

## 🔐 Authentication System

**Production-Ready Features:**
- ✅ **Server-side password storage** (data/users.json)
- ✅ **Password hashing** with PBKDF2
- ✅ **Secure password changes** via API endpoints
- ✅ **Default credentials**: admin/admin123, operator/operator123
- ✅ **Persistent across deployments** (not browser dependent)

**File Structure:**
```
data/
  └── users.json          # Encrypted user credentials
  └── cage1_data.csv       # Historical data
  └── cage2_data.csv
  └── cage3_data.csv
  └── cage4_data.csv
```

## 📱 Features After Deployment

✅ **Real-time Dashboard** - Live water quality monitoring  
✅ **Socket.IO Connection** - Real-time data updates  
✅ **Mobile Responsive** - Works on all devices  
✅ **CSV Data Import** - Historical data loading  
✅ **Multi-cage Monitoring** - 4 cage system  
✅ **Login System** - Secure access  

## 🌐 Custom Domain (Optional)

Most platforms allow custom domain setup:
1. Add CNAME record: `www.yoursite.com -> your-app.platform.com`
2. Configure domain in platform settings
3. SSL certificates are usually auto-generated

## 📊 Monitoring & Logs

- **Railway:** Built-in logs and metrics
- **Render:** Application logs in dashboard  
- **Heroku:** `heroku logs --tail`

## 🔒 Security Notes

- Login credentials are hardcoded for demo
- For production, use environment variables
- Consider adding rate limiting
- Use HTTPS (auto-enabled on most platforms)

---

**Need help?** The deployment should work out-of-the-box on any Node.js hosting platform!
