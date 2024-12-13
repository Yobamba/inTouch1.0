/**
 * Copyright 2021-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

// Import dependencies and set up http server
const express = require("express"),
  { urlencoded, json } = require("body-parser"),
  crypto = require("crypto"),
  path = require("path"),
  Receive = require("./services/receive"),
  GraphApi = require("./services/graph-api"),
  InstagramApi = require("./services/instagram-api"),
  InstagramUsers = require("./services/instagram-users"),
  InstagramConversation = require("./services/instagram-conversation"),
  User = require("./services/user"),
  config = require("./services/config"),
  i18n = require("./i18n.config"),
  CustomResponse = require("./services/custom-response"),
  Conversation = require("./services/conversation"),
  Auth = require("./services/auth"),
  { connect: connectDb } = require("./db/connection"),
  app = express();

var users = {};

// Initialize InstagramConversation service
const instagramConversation = new InstagramConversation();

// Parse application/x-www-form-urlencoded
app.use(
  urlencoded({
    extended: true
  })
);

// Parse application/json. Verify that callback came from Facebook
app.use(json({ verify: verifyRequestSignature }));

// Serving static files in Express
app.use(express.static(path.join(path.resolve(), "public")));

// Set template engine in Express
app.set("view engine", "ejs");

// Authentication routes
app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await Auth.loginUser(username, password);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(401).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/logout", (req, res) => {
  res.json({ success: true, message: "Logged out successfully" });
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const result = await Auth.registerUser(username, email, password);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Chat interfaces
app.get("/chat", function (req, res) {
  res.render("chat");
});

app.get("/instagram-chat", function (req, res) {
  res.render("instagram-chat");
});

// Instagram API endpoints
app.get("/instagram/users", async (req, res) => {
  try {
    const users = await InstagramUsers.getUsers();
    res.json(users);
  } catch (error) {
    console.error("Error getting Instagram users:", error);
    res.status(500).json({ 
      error: "Error fetching users",
      details: error.message 
    });
  }
});

app.get("/instagram/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const userProfile = await InstagramUsers.getUserById(userId);
    res.json(userProfile);
  } catch (error) {
    console.error("Error getting Instagram user:", error);
    res.status(500).json({ 
      error: "Error fetching user profile",
      details: error.message 
    });
  }
});

app.get("/instagram/conversation/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const conversation = await InstagramConversation.getConversationHistory(userId);
    res.json(conversation);
  } catch (error) {
    console.error("Error getting Instagram conversation:", error);
    res.status(500).json({ 
      error: "Error fetching conversation",
      details: error.message 
    });
  }
});

app.post("/instagram/send-message", async (req, res) => {
  try {
    const { message, userId } = req.body;
    
    if (!userId || !message) {
      return res.status(400).json({
        message: "Both userId and message are required"
      });
    }
    
    await InstagramApi.sendMessage(userId, message);
    // Add sent message to conversation history
    InstagramConversation.addMessage(message, config.instagramAccountId, userId, Date.now(), false);
    res.json({ message: "Message sent successfully!" });
  } catch (error) {
    console.error("Error sending Instagram message:", error);
    res.status(500).json({ message: "Error sending message: " + error.message });
  }
});

// Instagram webhook endpoint
app.post("/instagram/webhook", async (req, res) => {
  try {
    const body = req.body;

    console.log(`\u{1F4F8} Received Instagram webhook:`);
    console.dir(body, { depth: null });

    if (body.object === "instagram") {
      // Handle webhook data
      const msg = body.entry[0].messaging[0];
      if (msg.message) {
        // Add message to conversation history
        InstagramConversation.addMessage(
          msg.message.text,
          msg.sender.id,
          msg.recipient.id,
          msg.timestamp,
          msg.message.is_echo || false
        );
      }
      
      await InstagramApi.handleWebhook(body);
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
app.get("/instagram/webhook", (req, res) => {
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

// Messenger conversation endpoints
app.get("/conversation/:psid", async (req, res) => {
  try {
    const psid = req.params.psid;
    const conversation = await Conversation.getConversationHistory(psid);
    res.json(conversation);
  } catch (error) {
    console.error("Error getting conversation:", error);
    res.status(500).json({ 
      error: "Error fetching conversation",
      details: error.message 
    });
  }
});

app.post("/send-custom-message", async (req, res) => {
  try {
    const { message, psid } = req.body;
    
    if (!psid || !message) {
      return res.status(400).json({
        message: "Both PSID and message are required"
      });
    }
    
    await CustomResponse.sendCustomMessage(psid, message);
    res.json({ message: "Message sent successfully!" });
  } catch (error) {
    console.error("Error sending custom message:", error);
    res.status(500).json({ message: "Error sending message: " + error.message });
  }
});

// Respond with index page
app.get("/", function (_req, res) {
  res.redirect("/instagram-chat");
});

// Messenger webhook verification
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === config.verifyToken) {
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// Messenger webhook
app.post("/webhook", (req, res) => {
  let body = req.body;

  console.log(`\u{1F7EA} Received webhook:`);
  console.dir(body, { depth: null });

  if (body.object === "page") {
    res.status(200).send("EVENT_RECEIVED");

    body.entry.forEach(async function (entry) {
      if ("changes" in entry) {
        let receiveMessage = new Receive();
        if (entry.changes[0].field === "feed") {
          let change = entry.changes[0].value;
          switch (change.item) {
            case "post":
              return receiveMessage.handlePrivateReply(
                "post_id",
                change.post_id
              );
            case "comment":
              return receiveMessage.handlePrivateReply(
                "comment_id",
                change.comment_id
              );
            default:
              console.warn("Unsupported feed change type.");
              return;
          }
        }
      }

      entry.messaging.forEach(async function (webhookEvent) {
        if (webhookEvent.sender && webhookEvent.sender.id) {
          console.log("\n=== IMPORTANT: YOUR PSID IS ===");
          console.log(webhookEvent.sender.id);
          console.log("=== COPY THIS VALUE ===\n");
        }

        if ("read" in webhookEvent) {
          console.log("Got a read event");
          return;
        } else if ("delivery" in webhookEvent) {
          console.log("Got a delivery event");
          return;
        } else if (webhookEvent.message && webhookEvent.message.is_echo) {
          console.log(
            "Got an echo of our send, mid = " + webhookEvent.message.mid
          );
          return;
        }

        let senderPsid = webhookEvent.sender.id;
        let user_ref = webhookEvent.sender.user_ref;
        let guestUser = isGuestUser(webhookEvent);

        if (senderPsid != null && senderPsid != undefined) {
          if (!(senderPsid in users)) {
            if (!guestUser) {
              let user = new User(senderPsid);
              GraphApi.getUserProfile(senderPsid)
                .then((userProfile) => {
                  user.setProfile(userProfile);
                })
                .catch((error) => {
                  console.log(JSON.stringify(body));
                  console.log("Profile is unavailable:", error);
                })
                .finally(() => {
                  console.log("locale: " + user.locale);
                  users[senderPsid] = user;
                  i18n.setLocale("en_US");
                  console.log(
                    "New Profile PSID:",
                    senderPsid,
                    "with locale:",
                    i18n.getLocale()
                  );
                  return receiveAndReturn(
                    users[senderPsid],
                    webhookEvent,
                    false
                  );
                });
            } else {
              setDefaultUser(senderPsid);
              return receiveAndReturn(users[senderPsid], webhookEvent, false);
            }
          } else {
            i18n.setLocale(users[senderPsid].locale);
            console.log(
              "Profile already exists PSID:",
              senderPsid,
              "with locale:",
              i18n.getLocale()
            );
            return receiveAndReturn(users[senderPsid], webhookEvent, false);
          }
        } else if (user_ref != null && user_ref != undefined) {
          setDefaultUser(user_ref);
          return receiveAndReturn(users[user_ref], webhookEvent, true);
        }
      });
    });
  } else {
    res.sendStatus(404);
  }
});

function setDefaultUser(id) {
  let user = new User(id);
  users[id] = user;
  i18n.setLocale("en_US");
}

function isGuestUser(webhookEvent) {
  let guestUser = false;
  if ("postback" in webhookEvent) {
    if ("referral" in webhookEvent.postback) {
      if ("is_guest_user" in webhookEvent.postback.referral) {
        guestUser = true;
      }
    }
  }
  return guestUser;
}

function receiveAndReturn(user, webhookEvent, isUserRef) {
  let receiveMessage = new Receive(user, webhookEvent, isUserRef);
  return receiveMessage.handleMessage();
}

// Set up your App's Messenger Profile
app.get("/profile", (req, res) => {
  let token = req.query["verify_token"];
  let mode = req.query["mode"];

  if (!config.webhookUrl.startsWith("https://")) {
    res.status(200).send("ERROR - Need a proper API_URL in the .env file");
  }
  var Profile = require("./services/profile.js");
  Profile = new Profile();

  if (mode && token) {
    if (token === config.verifyToken) {
      if (mode == "webhook" || mode == "all") {
        Profile.setWebhook();
        res.write(
          `<p>&#9989; Set app ${config.appId} call to ${config.webhookUrl}</p>`
        );
      }
      if (mode == "profile" || mode == "all") {
        Profile.setThread();
        res.write(
          `<p>&#9989; Set Messenger Profile of Page ${config.pageId}</p>`
        );
      }
      if (mode == "personas" || mode == "all") {
        Profile.setPersonas();
        res.write(`<p>&#9989; Set Personas for ${config.appId}</p>`);
        res.write(
          "<p>Note: To persist the personas, add the following variables \
          to your environment variables:</p>"
        );
        res.write("<ul>");
        res.write(`<li>PERSONA_BILLING = ${config.personaBilling.id}</li>`);
        res.write(`<li>PERSONA_CARE = ${config.personaCare.id}</li>`);
        res.write(`<li>PERSONA_ORDER = ${config.personaOrder.id}</li>`);
        res.write(`<li>PERSONA_SALES = ${config.personaSales.id}</li>`);
        res.write("</ul>");
      }
      if (mode == "nlp" || mode == "all") {
        GraphApi.callNLPConfigsAPI();
        res.write(
          `<p>&#9989; Enabled Built-in NLP for Page ${config.pageId}</p>`
        );
      }
      if (mode == "domains" || mode == "all") {
        Profile.setWhitelistedDomains();
        res.write(
          `<p>&#9989; Whitelisted domains: ${config.whitelistedDomains}</p>`
        );
      }
      if (mode == "private-reply") {
        Profile.setPageFeedWebhook();
        res.write(`<p>&#9989; Set Page Feed Webhook for Private Replies.</p>`);
      }
      res.status(200).end();
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(404);
  }
});

// Verify that the callback came from Facebook.
function verifyRequestSignature(req, res, buf) {
  var signature = req.headers["x-hub-signature"];

  if (!signature) {
    console.warn(`Couldn't find "x-hub-signature" in headers.`);
  } else {
    var elements = signature.split("=");
    var signatureHash = elements[1];
    var expectedHash = crypto
      .createHmac("sha1", config.appSecret)
      .update(buf)
      .digest("hex");
    if (signatureHash != expectedHash) {
      throw new Error("Couldn't validate the request signature.");
    }
  }
}

// Check if all environment variables are set
config.checkEnvVariables();

// Connect to MongoDB
connectDb().then(() => {
  // Listen for requests
  var listener = app.listen(config.port, function () {
    console.log(`The app is listening on port ${listener.address().port}`);
    if (
      Object.keys(config.personas).length == 0 &&
      config.appUrl &&
      config.verifyToken
    ) {
      console.log(
        "Is this the first time running?\n" +
          "Make sure to set the both the Messenger profile, persona " +
          "and webhook by visiting:\n" +
          config.appUrl +
          "/profile?mode=all&verify_token=" +
          config.verifyToken
      );
    }

    if (config.pageId) {
      console.log("Test your app by messaging:");
      console.log(`https://m.me/${config.pageId}`);
    }
  });
});
