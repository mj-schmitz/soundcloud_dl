# 🚂 Railway CLI Guide

## Installation

### macOS/Linux
```bash
# Using Homebrew (recommended for macOS)
brew install railway

# Or using npm
npm install -g @railway/cli

# Or using curl
curl -fsSL https://railway.app/install.sh | sh
```

### Verify Installation
```bash
railway --version
```

## Authentication

```bash
# Login to Railway
railway login

# This will open your browser to authenticate
# Once authenticated, you're ready to use the CLI
```

## Common Commands

### Project Management

```bash
# Link your local project to Railway
railway link

# Initialize a new Railway project
railway init

# View project info
railway status

# Open project in browser
railway open
```

### Deployment

```bash
# Deploy current directory
railway up

# Deploy with specific service
railway up --service backend

# Deploy from specific directory
cd backend && railway up
```

### Environment Variables

```bash
# List all environment variables
railway variables

# Set an environment variable
railway variables set PORT=5001

# Delete an environment variable
railway variables delete PORT
```

### Logs

```bash
# View logs (live tail)
railway logs

# View logs for specific service
railway logs --service backend

# View last 100 lines
railway logs --lines 100
```

### Running Commands

```bash
# Run a command in Railway environment
railway run python app.py

# Run with environment variables loaded
railway run npm start

# Open a shell with Railway environment
railway shell
```

### Database Management

```bash
# Connect to database
railway connect postgres

# Run database migrations
railway run python manage.py migrate
```

## Workflow for Your SoundCloud App

### Initial Setup
```bash
# 1. Navigate to your backend directory
cd /Users/michaelschmitz/Programming/soundcloud_transfer/backend

# 2. Login to Railway
railway login

# 3. Link to your existing project
railway link
# (Select your project from the list)

# 4. Set environment variables
railway variables set PORT=5001
railway variables set FLASK_ENV=production
railway variables set MAX_WORKERS=10
```

### Deploy from CLI
```bash
# Deploy backend
cd backend
railway up

# View deployment logs
railway logs --follow
```

### Quick Deploy Script
Create a file `deploy.sh` in your project root:

```bash
#!/bin/bash

echo "🚀 Deploying SoundCloud Downloader to Railway..."

# Deploy backend
cd backend
railway up --service backend

echo "✅ Backend deployed!"
echo "🌐 Check your Railway dashboard for the live URL"
```

Make it executable:
```bash
chmod +x deploy.sh
```

Then deploy with:
```bash
./deploy.sh
```

## Advanced Usage

### Multiple Environments

```bash
# Deploy to staging
railway up --environment staging

# Deploy to production
railway up --environment production
```

### Service-Specific Commands

```bash
# List all services
railway service

# Switch between services
railway service backend
railway service frontend
```

### Volume Management

```bash
# List volumes
railway volume list

# Create a volume
railway volume create
```

## Troubleshooting

### Check Deployment Status
```bash
railway status
railway logs --lines 50
```

### Restart Service
```bash
railway restart
```

### View Build Logs
```bash
railway logs --deployment <deployment-id>
```

### Environment Issues
```bash
# Check current variables
railway variables

# Test locally with Railway env
railway run python app.py
```

## Integration with Your Workflow

### Option 1: CLI-Only Deployment
```bash
# Skip GitHub Actions, deploy directly
cd backend
railway up
```

### Option 2: Hybrid Approach
- Use GitHub Actions for main branch
- Use CLI for quick testing/hotfixes
- Use CLI for environment variable management

### Option 3: Local Development with Railway Env
```bash
# Run locally with production environment variables
railway run python app.py

# This loads all Railway env vars locally
```

## Railway API (Advanced)

If you want programmatic access, Railway also has a GraphQL API:

```bash
# Get your API token
railway whoami --token

# Use in scripts or tools
export RAILWAY_TOKEN="your-token-here"
```

## Useful Aliases

Add to your `~/.zshrc` or `~/.bashrc`:

```bash
# Quick Railway commands
alias rw='railway'
alias rwl='railway logs --follow'
alias rwu='railway up'
alias rws='railway status'
alias rwo='railway open'
```

## Resources

- **Railway CLI Docs**: https://docs.railway.app/develop/cli
- **Railway API**: https://docs.railway.app/reference/public-api
- **Railway Discord**: https://discord.gg/railway (great for support)

## Quick Reference Card

```
railway login          # Authenticate
railway link           # Connect to project
railway up             # Deploy
railway logs           # View logs
railway variables      # Manage env vars
railway status         # Check deployment
railway open           # Open in browser
railway shell          # Interactive shell
railway run <cmd>      # Run command with env
```

---

**Pro Tip**: Use `railway run` to test your app locally with production environment variables before deploying!
