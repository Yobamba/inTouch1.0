# Instagram Messaging API Guide

This guide explains how to set up and use the Instagram Messaging API for your application.

## Prerequisites

Before you begin, you'll need:
1. An Instagram Business Account or Instagram Creator Account
2. A Facebook Developer Account
3. A Facebook App with Instagram Basic Display API enabled
4. A Meta Business Account connected to your Instagram account

## Setup Process

### 1. Create a Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com)
2. Click "Create App"
3. Select "Business" as your app type
4. Fill in your app details and create the app

### 2. Configure Instagram Basic Display

1. In your Facebook App dashboard, add "Instagram Basic Display" product
2. Configure OAuth settings:
   - Add OAuth redirect URLs
   - Set your app's privacy policy URL
   - Set your app's terms of service URL

### 3. Configure Required Permissions

Your app needs the following permissions:
- `instagram_basic` - For basic profile information
- `instagram_manage_messages` - For sending and receiving messages
- `pages_messaging` - For messaging capabilities

### 4. Environment Configuration

Create a `.env` file with the following variables:

```env
INSTAGRAM_ACCOUNT_ID=your_instagram_account_id
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token
INSTAGRAM_APP_SECRET=your_app_secret
```

## API Implementation

### 1. Core API Functions

```javascript
// Initialize API with access token
const instagramApi = new InstagramApi(accessToken);

// Send a message
await instagramApi.sendMessage(userId, "Hello from your app!");

// Get user profile
const profile = await instagramApi.getUserProfile(userId);

// Get conversations
const conversations = await instagramApi.getConversations(userId);
```

### 2. Webhook Setup

1. Configure webhook URL in your Facebook App dashboard
2. Set up webhook endpoint in your application:

```javascript
app.post("/webhook", async (req, res) => {
  const body = req.body;
  await InstagramApi.handleWebhook(body);
});
```

### 3. Message Handling

The API supports handling different types of messages:

```javascript
// Handle incoming text messages
const handleMessage = async (messagingEvent) => {
  const senderId = messagingEvent.sender.id;
  const message = messagingEvent.message;
  
  // Process message
  if (message.text) {
    // Handle text message
  }
};

// Handle postback actions
const handlePostback = async (messagingEvent) => {
  const senderId = messagingEvent.sender.id;
  const postback = messagingEvent.postback;
  
  // Process postback
};
```

## API Features

1. **Message Operations**
   - Send text messages
   - Receive messages through webhooks
   - Access conversation history

2. **User Profile Access**
   - Get user information
   - Access profile pictures
   - Get username and full name

3. **Conversation Management**
   - List all conversations
   - Access message history
   - Get conversation participants

## Best Practices

1. **Error Handling**
   - Always implement proper error handling
   - Log API errors for debugging
   - Implement retry mechanisms for failed requests

2. **Rate Limiting**
   - Monitor your API usage
   - Implement rate limiting in your application
   - Cache responses when possible

3. **Security**
   - Store sensitive credentials in environment variables
   - Validate webhook signatures
   - Use HTTPS for all API endpoints

## Common Issues and Solutions

1. **Authentication Errors**
   - Verify access token is valid and not expired
   - Ensure proper permissions are granted
   - Check Instagram account connection status

2. **Webhook Issues**
   - Verify webhook URL is accessible
   - Check webhook subscription status
   - Validate webhook signatures

3. **Message Delivery Problems**
   - Verify recipient ID is correct
   - Check message format
   - Monitor API response codes

## Additional Resources

- [Meta for Developers Documentation](https://developers.facebook.com/docs/messenger-platform/instagram)
- [Instagram Graph API Documentation](https://developers.facebook.com/docs/instagram-api)
- [Webhook Reference](https://developers.facebook.com/docs/messenger-platform/webhook)
