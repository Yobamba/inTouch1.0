require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const axios = require('axios');
const crypto = require('crypto'); // Import crypto for signature verification

const app = express();

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));

// Verify that the callback came from Facebook.
function verifyRequestSignature(req, res, buf) {
  const signature = req.headers["x-hub-signature-256"];

  if (!signature) {
    console.warn(`Couldn't find "x-hub-signature-256" in headers.`);
  } else {
    const elements = signature.split("=");
    const signatureHash = elements[1];
    const expectedHash = crypto
      .createHmac("sha256", process.env.APP_SECRET) // Use your app's App Secret
      .update(buf)
      .digest("hex");
    if (signatureHash !== expectedHash) {
      throw new Error("Couldn't validate the request signature.");
    }
  }
}

// Middleware to verify request signature
app.use((req, res, buf, encoding) => {
  try {
    verifyRequestSignature(req, res, buf);
  } catch (err) {
    res.status(403).send("Invalid request signature");
  }
});

// Create the endpoint for your webhook
app.post("/webhook", (req, res) => {
  let body = req.body;

  console.log(`\u{1F7EA} Received webhook:`);
  console.dir(body, { depth: null });

  // Send a 200 OK response if this is a page webhook
  if (body.object === "page") {
    res.status(200).send("EVENT_RECEIVED");
    // Determine which webhooks were triggered and get sender PSIDs and locale, message content and more.
  } else {
    res.sendStatus(404);
  }
});

// Add support for GET requests to our webhook
app.get("/messaging-webhook", (req, res) => {
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === process.env.verifyToken) {
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// Instagram App credentials
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

const qs = require('qs');

app.post('/api/exchange-token', async (req, res) => {
  console.log("At least the /api/exchange-token path endpoint was hit");
  const { code } = req.body;

  try {
    const response = await axios.post(
      'https://api.instagram.com/oauth/access_token',
      qs.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
        code: code,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      }
    );

    const { access_token, user_id } = response.data;
    res.status(200).json({ access_token, user_id });
  } catch (error) {
    console.error('Error exchanging token:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to exchange token' });
  }
});

app.post('/api/send-instagram-message', async (req, res) => {
  const { igId, recipientId, messageText, accessToken } = req.body;

  const url = `https://graph.instagram.com/v21.0/${igId}/messages`;

  const messageData = {
    recipient: {
      id: recipientId,
    },
    message: {
      text: messageText,
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
