// Emergency ping script - Run this from another machine or service
// This script will aggressively ping your service every 60 seconds

const https = require('https');

// Configure with your actual URL
const SERVICE_URL = 'https://camer-scda.onrender.com';
const PING_INTERVAL = 60 * 1000; // 60 seconds

console.log(`Starting emergency pinger for ${SERVICE_URL}`);

function pingService() {
  console.log(`[${new Date().toISOString()}] Pinging service...`);
  
  // Ping the service
  https.get(`${SERVICE_URL}/ping`, (res) => {
    console.log(`Ping response: ${res.statusCode}`);
  }).on('error', (err) => {
    console.error(`Ping failed: ${err.message}`);
  });
  
  // Also ping the health endpoint occasionally
  if (Math.random() < 0.3) { // 30% of the time
    https.get(`${SERVICE_URL}/health`, (res) => {
      console.log(`Health check response: ${res.statusCode}`);
    }).on('error', (err) => {
      console.error(`Health check failed: ${err.message}`);
    });
  }
}

// Start pinging immediately
pingService();

// Schedule regular pings
setInterval(pingService, PING_INTERVAL);

console.log('Emergency pinger is running');
