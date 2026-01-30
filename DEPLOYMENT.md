# 🚀 Deployment Guide

This guide will help you deploy the SoundCloud Downloader app to production with automatic CI/CD via GitHub Actions.

## 📋 Prerequisites

- GitHub account
- Railway account (for backend) - https://railway.app
- Vercel account (for frontend) - https://vercel.com

## 🔧 Setup Instructions

### 1. Backend Deployment (Railway)

1. **Create Railway Account**
   - Go to https://railway.app and sign up
   - Connect your GitHub account

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `soundcloud_transfer` repository
   - Select the `backend` folder as the root directory

3. **Configure Environment Variables**
   - In Railway dashboard, go to your project
   - Click "Variables" tab
   - Add these variables:
     ```
     PORT=5001
     FLASK_ENV=production
     MAX_WORKERS=10
     ```

4. **Get Railway Token**
   - Go to Account Settings → Tokens
   - Create a new token
   - Copy it for GitHub Actions setup

5. **Note Your Backend URL**
   - After deployment, Railway will give you a URL like:
   - `https://your-app.railway.app`
   - You'll need this for frontend configuration

### 2. Frontend Deployment (Vercel)

1. **Create Vercel Account**
   - Go to https://vercel.com and sign up
   - Connect your GitHub account

2. **Import Project**
   - Click "Add New" → "Project"
   - Import your `soundcloud_transfer` repository
   - Set Root Directory to `frontend`
   - Framework Preset: Vite

3. **Configure Environment Variables**
   - In Vercel project settings → Environment Variables
   - Add:
     ```
     VITE_API_URL=https://your-backend.railway.app/api
     ```
   - Replace with your actual Railway backend URL

4. **Get Vercel Credentials**
   - Install Vercel CLI: `npm i -g vercel`
   - Run `vercel login`
   - Run `vercel link` in your frontend directory
   - Get your tokens from Vercel dashboard:
     - Settings → Tokens (create new token)
     - Project Settings → General (copy Project ID and Org ID)

### 3. GitHub Actions Setup

1. **Add GitHub Secrets**
   - Go to your GitHub repo → Settings → Secrets and variables → Actions
   - Add these secrets:
     ```
     RAILWAY_TOKEN=<your-railway-token>
     VERCEL_TOKEN=<your-vercel-token>
     VERCEL_ORG_ID=<your-vercel-org-id>
     VERCEL_PROJECT_ID=<your-vercel-project-id>
     ```

2. **Enable GitHub Actions**
   - The workflow file is already created at `.github/workflows/deploy.yml`
   - Push to `main` branch to trigger deployment

### 4. Update CORS Settings

After deployment, update your backend CORS settings:

In `backend/app.py`, update the CORS configuration:
```python
CORS(app, origins=[
    "https://your-frontend.vercel.app",
    "http://localhost:5173",  # Keep for local development
    "http://localhost:5179"
])
```

## 🎯 Deployment Workflow

Once set up, the deployment is automatic:

1. **Make changes** to your code
2. **Commit and push** to `main` branch
3. **GitHub Actions** automatically:
   - Builds and deploys backend to Railway
   - Builds and deploys frontend to Vercel
4. **Live in ~2-3 minutes!**

## 📊 Architecture

```
┌─────────────────┐
│   GitHub Repo   │
└────────┬────────┘
         │ (push to main)
         ▼
┌─────────────────┐
│ GitHub Actions  │
└────┬───────┬────┘
     │       │
     ▼       ▼
┌─────────┐ ┌──────────┐
│ Railway │ │  Vercel  │
│ Backend │ │ Frontend │
└─────────┘ └──────────┘
```

## 🔍 Monitoring

- **Railway**: Check logs in Railway dashboard
- **Vercel**: Check deployment logs in Vercel dashboard
- **GitHub Actions**: Check workflow runs in GitHub Actions tab

## 🐛 Troubleshooting

### Backend Issues
- Check Railway logs for errors
- Verify environment variables are set
- Ensure ffmpeg is installed (included in Dockerfile)

### Frontend Issues
- Check Vercel build logs
- Verify `VITE_API_URL` environment variable
- Test API connection from browser console

### CORS Errors
- Verify frontend URL is in backend CORS origins
- Check that API URL in frontend matches backend URL

## 💰 Cost Estimate

- **Railway**: Free tier includes $5/month credit (sufficient for moderate use)
- **Vercel**: Free tier (unlimited for personal projects)
- **GitHub Actions**: Free for public repos, 2000 minutes/month for private

**Total**: $0-5/month depending on usage

## 🔒 Security Notes

- Never commit `.env` files
- Use environment variables for all sensitive data
- Railway and Vercel automatically use HTTPS
- Consider rate limiting for production use

## 📝 Local Development

To run locally after cloning:

```bash
# Backend
cd backend
pip install -r requirements.txt
python app.py

# Frontend
cd frontend
npm install
npm run dev
```

## 🎉 You're Done!

Your app is now live and will auto-deploy on every push to main!

- **Frontend**: https://your-app.vercel.app
- **Backend**: https://your-app.railway.app
- **GitHub Actions**: Automatic deployment on push
