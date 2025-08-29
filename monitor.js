// External monitoring script to keep the application alive
const fetch = require('node-fetch');

// Configure this with your actual deployed URL
const SERVICE_URL = process.env.SERVICE_URL || 'https://camer-scda.onrender.com';
const PING_INTERVAL = 90 * 1000; // 90 seconds (more frequent pings to prevent shutdown)

console.log(`Starting external monitor for: ${SERVICE_URL}`);

async function pingService() {
  try {
    const startTime = Date.now();
    const response = await fetch(`${SERVICE_URL}/ping`);
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      console.log(`[${new Date().toISOString()}] Ping successful - ${response.status} (${responseTime}ms)`);
    } else {
      console.error(`[${new Date().toISOString()}] Ping failed with status: ${response.status}`);
    }
    
    // Also check health endpoint occasionally
    if (Math.random() < 0.2) { // 20% of the time
      const healthResponse = await fetch(`${SERVICE_URL}/health`);
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log(`Health check: ${JSON.stringify(healthData)}`);
      }
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error pinging service: ${error.message}`);
  }
}

// Initial ping
pingService();

// Schedule regular pings
setInterval(pingService, PING_INTERVAL);

console.log(`Monitor running - pinging every ${PING_INTERVAL/1000/60} minutes`);

// Keep the process running
process.stdin.resume();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Monitor stopping...');
  process.exit(0);
});
