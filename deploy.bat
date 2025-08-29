@echo off
REM Deployment script for Render.com (Windows version)

echo Preparing for deployment...

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js not found. Please install it first.
    exit /b 1
)

REM Create deployment package (requires 7-Zip or similar)
echo Creating deployment package...
if exist "deployment.zip" del "deployment.zip"

REM Using PowerShell to create ZIP (available on all modern Windows)
powershell -Command "Compress-Archive -Path .\* -DestinationPath .\deployment.zip -Force -Exclude @('deployment.zip', '.git', 'node_modules')"

echo Deployment package created: deployment.zip

echo.
echo Deployment Instructions:
echo ------------------------
echo 1. Go to https://render.com and create a new Web Service
echo 2. Choose 'Upload Files' instead of connecting to GitHub
echo 3. Upload the deployment.zip file
echo 4. Configure the service with the following settings:
echo    - Environment: Node.js
echo    - Build Command: npm install
echo    - Start Command: node server.js
echo 5. Add Environment Variable:
echo    - BOT_TOKEN: Your Telegram bot token
echo.
echo After deployment, make sure to send a message to your bot to initialize the chat ID
echo Visit your deployed application URL to verify it's working

REM Create the monitor deployment package
echo.
echo Creating monitor deployment package...

REM Create a temporary file with the correct SERVICE_URL
@echo const fetch = require('node-fetch'); > monitor.js.tmp
@echo. >> monitor.js.tmp
@echo // Configure this with your actual deployed URL >> monitor.js.tmp
@echo const SERVICE_URL = process.env.SERVICE_URL || 'https://your-deployed-url.onrender.com'; >> monitor.js.tmp

REM Append the rest of monitor.js, excluding the lines we just added
powershell -Command "Get-Content monitor.js | Where-Object { -not ($_ -match 'const fetch = require' -or $_ -match 'const SERVICE_URL') } | Add-Content monitor.js.tmp"
move /Y monitor.js.tmp monitor.js

REM Create a simple package.json for the monitor
@echo {
@echo   "name": "service-monitor",
@echo   "version": "1.0.0",
@echo   "description": "Keeps the main service alive by regular pinging",
@echo   "main": "monitor.js",
@echo   "scripts": {
@echo     "start": "node monitor.js"
@echo   },
@echo   "dependencies": {
@echo     "node-fetch": "^2.6.7"
@echo   },
@echo   "engines": {
@echo     "node": ">=14.0.0"
@echo   }
@echo } > monitor-package.json

REM Create the monitor zip
if exist "monitor-deployment.zip" del "monitor-deployment.zip"
powershell -Command "Compress-Archive -Path monitor.js, monitor-package.json -DestinationPath .\monitor-deployment.zip -Force"
del monitor-package.json

echo.
echo Monitor deployment package created: monitor-deployment.zip
echo.
echo Monitor Deployment Instructions:
echo -------------------------------
echo 1. Go to https://render.com and create another Web Service
echo 2. Upload the monitor-deployment.zip file
echo 3. Configure the service with the following settings:
echo    - Environment: Node.js
echo    - Build Command: move monitor-package.json package.json && npm install
echo    - Start Command: node monitor.js
echo 4. Add Environment Variable:
echo    - SERVICE_URL: The URL of your main application
echo.
echo This will help keep your main service alive by pinging it regularly
