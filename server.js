require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser'); // Import body-parser
const axios = require('axios');


const app = express();

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));

// Verification token
const VERIFY_TOKEN = "i_verify_im_him";

// Instagram Webhook Route (GET for verification)
app.get('/webhook', (req, res) => {
    const verifyToken = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (verifyToken === VERIFY_TOKEN) {
        return res.status(200).send(challenge);
    } else {
        return res.status(403).send('Error, invalid token');
    }
});

// Instagram Webhook Route (POST for incoming messages)
app.post('/webhook', (req, res) => {
    const data = req.body;
    // Log the incoming webhook event
    console.log(`Received webhook event:`, data);
    // Process the event (e.g., store in database, perform an action)
    return res.status(200).json({ status: 'received' });
});

// Instagram App credentials
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;


const qs = require('qs'); // Import querystring library

app.post('/api/exchange-token', async (req, res) => {
    console.log("At least the /api/exchange-token path endpoint was hit");
    const { code } = req.body;
    
    try {
        const response = await axios.post('https://api.instagram.com/oauth/access_token', qs.stringify({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: 'authorization_code',
            redirect_uri: REDIRECT_URI,
            code: code
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        // The response should include the access_token and other details
        const { access_token, user_id } = response.data;

        // You might want to store the token securely here (e.g., in a database)
        res.status(200).json({ access_token, user_id });
    } catch (error) {
        console.error('Error exchanging token:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to exchange token' });
    }
});


// Send message endpoint
app.post('/api/send-instagram-message', async (req, res) => {
    const { igId, recipientId, messageText, accessToken } = req.body;
  
    const url = `https://graph.instagram.com/v21.0/${igId}/messages`;
  
    const messageData = {
      recipient: {
        id: recipientId, // Instagram-scoped ID of the recipient
      },
      message: {
        text: messageText, // Text message or link
      },
    };
  
    try {
      const response = await axios.post(url, messageData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      res.status(200).json(response.data);
    } catch (error) {
      console.error('Error sending message:', error.response.data);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });



// Handle all other requests (React app)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Port configuration
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

