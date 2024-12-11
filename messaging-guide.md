# Meta Sample In Touch Messaging Guide

This guide explains how to use the GUI-based messaging system in the Meta Sample In Touch project.

## Project Overview

The project is set up as a Node.js application using Express.js framework with EJS templating. It integrates with Meta's Graph API for handling messaging functionality.

## Key Components

1. **Views (Frontend)**
   - `views/chat.ejs`: Main chat interface
   - `views/conversation.ejs`: Individual conversation view
   - `views/send-message.ejs`: Message composition interface

2. **Services (Backend)**
   - `services/conversation.js`: Handles conversation logic
   - `services/receive.js`: Manages incoming messages
   - `services/response.js`: Handles message responses
   - `services/graph-api.js`: Integrates with Meta's Graph API

## Step-by-Step Setup Process

### 1. Environment Configuration
1. Create a `.env` file in the root directory
2. Add required environment variables:
   ```
   PAGE_ID=your_page_id
   APP_ID=your_app_id
   PAGE_ACCESS_TOKEN=your_page_access_token
   APP_SECRET=your_app_secret
   VERIFY_TOKEN=your_verify_token
   ```

### 2. Installation
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the server:
   ```bash
   npm start
   ```

### 3. Accessing the GUI
1. Open your browser and navigate to `http://localhost:3000`
2. Log in using your credentials
3. Access the messaging interface through the dashboard

### 4. Using the Messaging Interface

#### To View Conversations:
1. Navigate to the conversations view
2. Click on any conversation to view the message history
3. Messages are displayed in chronological order with sender information

#### To Send a Message:
1. Open the send message interface
2. Select the recipient
3. Compose your message
4. Click "Send" to deliver the message

#### To Handle Incoming Messages:
1. Messages appear in real-time in the chat interface
2. Click on a conversation to view and respond
3. Use the response interface to send replies

## Technical Flow

1. **Message Reception**
   - Incoming messages are received through webhooks
   - `services/receive.js` processes incoming messages
   - Messages are stored and routed to appropriate handlers

2. **Message Processing**
   - `services/conversation.js` manages conversation state
   - Messages are processed through `services/response.js`
   - Custom responses can be configured in `services/custom-response.js`

3. **Message Sending**
   - Messages are sent through Meta's Graph API
   - `services/graph-api.js` handles API communication
   - Responses are formatted and delivered to recipients

## Security Considerations

1. All requests are authenticated using Meta's security protocols
2. Page access tokens are required for API interactions
3. Webhook verification ensures secure message reception
4. User authentication is required for GUI access

## Troubleshooting

1. **Connection Issues**
   - Verify environment variables are correctly set
   - Ensure valid Page Access Token
   - Check webhook configuration

2. **Message Delivery Problems**
   - Confirm recipient is valid
   - Check API response for errors
   - Verify message format compliance

3. **GUI Access Issues**
   - Ensure server is running
   - Verify login credentials
   - Check browser console for errors

## Additional Resources

- [Meta Messaging API Documentation](https://developers.facebook.com/docs/messenger-platform)
- [Graph API Reference](https://developers.facebook.com/docs/graph-api)
- [Webhook Setup Guide](https://developers.facebook.com/docs/messenger-platform/webhook)
