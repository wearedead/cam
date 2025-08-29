#!/bin/bash
# Deployment script for Render.com

echo "Preparing for deployment..."

# Check if zip command is available
if ! command -v zip &> /dev/null; then
    echo "Error: zip command not found. Please install it first."
    exit 1
fi

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js not found. Please install it first."
    exit 1
fi

# Create deployment package
echo "Creating deployment package..."
zip -r deployment.zip . -x "*.git*" "node_modules/*" "deployment.zip"

echo "Deployment package created: deployment.zip"
echo ""
echo "Deployment Instructions:"
echo "------------------------"
echo "1. Go to https://render.com and create a new Web Service"
echo "2. Choose 'Upload Files' instead of connecting to GitHub"
echo "3. Upload the deployment.zip file"
echo "4. Configure the service with the following settings:"
echo "   - Environment: Node.js"
echo "   - Build Command: npm install"
echo "   - Start Command: node server.js"
echo "5. Add Environment Variable:"
echo "   - BOT_TOKEN: Your Telegram bot token"
echo ""
echo "After deployment, make sure to send a message to your bot to initialize the chat ID"
echo "Visit your deployed application URL to verify it's working"

# Create the monitor deployment package
echo ""
echo "Creating monitor deployment package..."
echo "const fetch = require('node-fetch');" > monitor.js.tmp
echo "" >> monitor.js.tmp
echo "// Configure this with your actual deployed URL" >> monitor.js.tmp
echo "const SERVICE_URL = process.env.SERVICE_URL || 'https://your-deployed-url.onrender.com';" >> monitor.js.tmp
cat monitor.js | grep -v "const fetch = require" | grep -v "const SERVICE_URL" >> monitor.js.tmp
mv monitor.js.tmp monitor.js

# Create a simple package.json for the monitor
echo '{
  "name": "service-monitor",
  "version": "1.0.0",
  "description": "Keeps the main service alive by regular pinging",
  "main": "monitor.js",
  "scripts": {
    "start": "node monitor.js"
  },
  "dependencies": {
    "node-fetch": "^2.6.7"
  },
  "engines": {
    "node": ">=14.0.0"
  }
}' > monitor-package.json

zip -r monitor-deployment.zip monitor.js monitor-package.json
rm monitor-package.json

echo ""
echo "Monitor deployment package created: monitor-deployment.zip"
echo ""
echo "Monitor Deployment Instructions:"
echo "-------------------------------"
echo "1. Go to https://render.com and create another Web Service"
echo "2. Upload the monitor-deployment.zip file"
echo "3. Configure the service with the following settings:"
echo "   - Environment: Node.js"
echo "   - Build Command: mv monitor-package.json package.json && npm install"
echo "   - Start Command: node monitor.js"
echo "4. Add Environment Variable:"
echo "   - SERVICE_URL: The URL of your main application"
echo ""
echo "This will help keep your main service alive by pinging it regularly"
