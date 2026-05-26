#!/bin/bash

# DevSchool Pro - Automated Deployment Script
echo "🚀 Initiating Deployment Sequence..."

# 1. Pull latest changes
echo "📥 Pulling latest code..."
git pull origin main

# 2. Build and restart backend
echo "⚙️  Building Backend..."
cd backend
npm install
# npx prisma migrate deploy # Uncomment if using Prisma migrations
pm2 restart devschool-backend || pm2 start src/server.js --name devschool-backend

# 3. Build and deploy frontend
echo "🎨 Building Frontend..."
cd ../frontend
npm install
npm run build
# Assumes serving via Nginx or similar
# sudo cp -r dist/* /var/www/devschool/

echo "✅ Deployment Successful!"
