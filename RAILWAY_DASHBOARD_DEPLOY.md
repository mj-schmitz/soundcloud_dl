# 🚂 Railway Dashboard Deployment (Recommended)

The Railway CLI has issues with build logs and timeouts. **Use the Railway Dashboard instead** - it's more reliable and shows real-time build progress.

## ✅ Quick Setup (5 minutes)

### 1. Push to GitHub
```bash
cd /Users/michaelschmitz/Programming/soundcloud_transfer
git add .
git commit -m "Add Railway deployment configuration"
git push origin main
```

### 2. Deploy via Railway Dashboard

1. **Go to Railway Dashboard**
   - Visit: https://railway.app/dashboard
   - Click "New Project"

2. **Deploy from GitHub**
   - Select "Deploy from GitHub repo"
   - Choose `soundcloud_transfer` repository
   - Railway will auto-detect the configuration

3. **Configure Service Settings** (Important!)
   - Click on your service
   - Go to "Settings" tab
   - Under "Root Directory": Leave blank (uses repo root)
   - Under "Build": Should auto-detect Dockerfile
   - Click "Deploy"

4. **Set Environment Variables**
   - Go to "Variables" tab
   - Add these variables:
     ```
     PORT=5001
     FLASK_ENV=production
     MAX_WORKERS=10
     CORS_ORIGINS=https://your-frontend.vercel.app
     ```

5. **Get Your Backend URL**
   - Go to "Settings" → "Domains"
   - Copy the Railway domain (e.g., `soundclouddl-production.up.railway.app`)
   - This is your backend API URL

### 3. Monitor Deployment

- **Build Logs**: Click "Deployments" tab to see real-time build progress
- **Runtime Logs**: Click "Logs" tab to see application logs
- **Status**: Green = running, Red = failed

## 📝 Current Configuration

Your project is configured with:

✅ **`railway.json`** at root:
- Points to `backend/Dockerfile`
- Uses gunicorn with 4 workers
- Auto-restarts on failure

✅ **`backend/Dockerfile`**:
- Python 3.11 with ffmpeg
- Installs all dependencies
- Uses dynamic PORT variable

✅ **`backend/app.py`**:
- Reads PORT from environment
- CORS configured for production

## 🔍 Troubleshooting

### Build Fails
- Check "Deployments" tab for error messages
- Verify Dockerfile syntax
- Ensure all dependencies in requirements.txt

### App Won't Start
- Check "Logs" tab for Python errors
- Verify PORT environment variable is set
- Check gunicorn command in railway.json

### CORS Errors
- Update CORS_ORIGINS variable with your frontend URL
- Format: `https://your-app.vercel.app` (no trailing slash)

## 🎯 Your Deployment Status

**Service**: soundcloud_dl  
**Project**: illustrious-clarity  
**URL**: https://soundclouddl-production.up.railway.app

**Check deployment status**:
- Dashboard: https://railway.app/project/1684f34f-6280-47b3-bfa2-c08a21e3341d
- Health endpoint: https://soundclouddl-production.up.railway.app/api/health

## 🚀 Next Steps

1. **Wait for build to complete** (2-3 minutes)
   - Watch the "Deployments" tab in Railway dashboard
   - Build includes installing ffmpeg which takes time

2. **Test the API**
   ```bash
   curl https://soundclouddl-production.up.railway.app/api/health
   ```
   Should return: `{"status":"ok","message":"SoundCloud Downloader API is running"}`

3. **Deploy Frontend to Vercel**
   - Use the Railway URL as your `VITE_API_URL`
   - Follow the Vercel section in DEPLOYMENT.md

## 💡 Why Dashboard > CLI?

- ✅ Real-time build logs
- ✅ Visual deployment status
- ✅ Easy environment variable management
- ✅ No timeout issues
- ✅ Better error messages
- ✅ Automatic GitHub integration

## 🔄 Future Deployments

Once set up with GitHub integration:
1. Push to main branch
2. Railway auto-deploys
3. Check dashboard for status
4. Done! 🎉

No CLI needed after initial setup!
