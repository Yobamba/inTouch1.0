const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const config = require("./services/config");
const InstagramConversation = require("./services/instagram-conversation");

const app = express();

// Parse application/json. Verify that callback came from Facebook
app.use(bodyParser.json({
  verify: (req, res, buf) => {
    const signature = req.headers["x-hub-signature"];
    if (!signature) {
      console.warn("Couldn't find x-hub-signature in headers");
      return;
    }
    const elements = signature.split("=");
    const signatureHash = elements[1];
    const expectedHash = crypto
      .createHmac("sha1", config.appSecret)
      .update(buf)
      .digest("hex");
    if (signatureHash !== expectedHash) {
      throw new Error("Couldn't validate the request signature.");
    }
  }
}));

// Instagram webhook endpoint
app.post("/webhook", async (req, res) => {
  try {
    const body = req.body;

    console.log(`\u{1F4F8} Received Instagram webhook:`);
    console.dir(body, { depth: null });

    if (body.object === "instagram") {
      // Handle webhook data
      const msg = body.entry[0].messaging[0];
      console.log("Webhook message:", JSON.stringify(msg, null, 2));

      // Check message structure
      if (msg.message) {
        console.log("Message object:", JSON.stringify(msg.message, null, 2));
      }

      // Only process messages with text content
      if (msg.message && msg.message.text) {
        console.log("Processing message:", JSON.stringify(msg.message, null, 2));
        console.log("Sender ID:", msg.sender.id);
        
        // Handle messages from 606648068569151 first
        if (msg.sender.id === "606648068569151") {
          console.log("Message from Instagram user:", msg.message.text);
          // Message from real Instagram account
          InstagramConversation.addMessage(
            msg.message.text,
            msg.sender.id,  // Keep original sender ID
            "475816382274514",  // Map to Eddie's account
            msg.timestamp,
            false
          );
          console.log("Added message from Instagram user");
        } 
        // Then handle messages from business account (not echoes)
        else if (!msg.message.is_echo) {
          console.log("Message from business account:", msg.message.text);
          // Forward messages from business account to Eddie's account
          const recipientId = msg.recipient.id === "17841460036924979" ? "475816382274514" : msg.recipient.id;
          const senderId = msg.sender.id === "17841460036924979" ? "475816382274514" : msg.sender.id;
          
          // Regular message (not an echo)
          InstagramConversation.addMessage(
            msg.message.text,
            senderId,
            recipientId,
            msg.timestamp,
            false
          );
          console.log("Added message from business account");
        }
      } else {
        console.log("Message does not contain text or is not a message event");
        if (msg.message) {
          console.log("Message properties:", Object.keys(msg.message));
        } else {
          console.log("Message event properties:", Object.keys(msg));
        }
      }
      
      res.status(200).send("EVENT_RECEIVED");
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    console.error("Error handling Instagram webhook:", error);
    res.sendStatus(500);
  }
});

// Instagram webhook verification
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === config.verifyToken) {
      console.log("INSTAGRAM_WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// Use port 3001 to avoid conflict with main server
const port = 3001;
app.listen(port, () => {
  console.log(`Test webhook server listening on port ${port}`);
  console.log("Verify token:", config.verifyToken);
  console.log("App URL:", config.appUrl);
  console.log("Webhook URL should be:", `${config.appUrl}/webhook`);
});
