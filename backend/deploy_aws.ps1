# AWS EC2 Deployment Script (PowerShell)

Write-Host "[START] Starting AWS Deployment..." -ForegroundColor Green

$pemPath = "C:\Users\vroy1\Downloads\DEVSCHOOL.pem"
$serverIp = "13.201.52.158"
$user = "ubuntu"

# 1. Clean up old tar file if it exists locally
if (Test-Path "backend.tar.gz") { Remove-Item "backend.tar.gz" }

# 2. Package the backend (excluding heavy node_modules)
Write-Host "[ZIP] Zipping backend files (excluding node_modules)..." -ForegroundColor Cyan
tar --exclude=node_modules --exclude=dist --exclude=.git -czf backend.tar.gz .

# 3. Stop old backend on AWS
Write-Host "[STOP] Stopping existing backend on AWS..." -ForegroundColor Cyan
ssh -i $pemPath -o StrictHostKeyChecking=no ${user}@${serverIp} "mkdir -p ~/devschool-backend && cd ~/devschool-backend && docker compose down || true"

# 4. Upload to AWS
Write-Host "[UPLOAD] Uploading new backend to AWS (this may take a minute)..." -ForegroundColor Cyan
scp -i $pemPath -o StrictHostKeyChecking=no backend.tar.gz ${user}@${serverIp}:~/backend.tar.gz

# 5. Extract and Deploy on AWS
Write-Host "[DEPLOY] Extracting and building on AWS (Free Tier Optimized)..." -ForegroundColor Cyan
$deployCommand = "cd ~/devschool-backend && docker compose down || true && cd ~ && tar -xzf backend.tar.gz -C ~/devschool-backend && rm backend.tar.gz && cd ~/devschool-backend && docker compose up -d --build"

ssh -i $pemPath -o StrictHostKeyChecking=no ${user}@${serverIp} $deployCommand

Write-Host "[DONE] Deployment Complete! The new backend with Redis and BullMQ is now running on AWS." -ForegroundColor Green
