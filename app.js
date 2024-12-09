/**
 * Copyright 2021-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Messenger For Original Coast Clothing
 * https://developers.facebook.com/docs/messenger-platform/getting-started/sample-apps/original-coast-clothing
 */

"use strict";

// Import dependencies and set up http server
const express = require("express"),
  { urlencoded, json } = require("body-parser"),
  crypto = require("crypto"),
  path = require("path"),
  Receive = require("./services/receive"),
  GraphApi = require("./services/graph-api"),
  User = require("./services/user"),
  config = require("./services/config"),
  i18n = require("./i18n.config"),
  CustomResponse = require("./services/custom-response"),
  Conversation = require("./services/conversation"),
  Auth = require("./services/auth"),
  { connect: connectDb } = require("./db/connection"),
  app = express();

var users = {};

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
  // In a real app, you'd clear the session/token here
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

app.get("/recover-password", (req, res) => {
  res.render("password-recovery");
});

app.post("/recover-password", async (req, res) => {
  try {
    const { email } = req.body;
    const result = await Auth.initiatePasswordReset(email);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/verify-code", async (req, res) => {
  try {
    const { email, code } = req.body;
    const result = await Auth.verifyCode(email, code);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/reset-password", (req, res) => {
  res.render("reset-password");
});

app.post("/reset-password", async (req, res) => {
  try {
    const { email, code, new_password } = req.body;
    const result = await Auth.resetPassword(email, code, new_password);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// New unified chat interface
app.get("/chat", function (req, res) {
  res.render("chat");
});

// Get conversation history API endpoint
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

// Handle custom message submission
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

// Respond with chat interface when a GET request is made to the homepage
app.get("/", function (_req, res) {
  res.render("chat");
});

// Original index page now accessible at /about
app.get("/about", function (_req, res) {
  res.render("index");
});

// Adding support for GET requests to our webhook
app.get("/webhook", (req, res) => {
  // Parse the query params
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  // Checking if a token and mode is in the query string of the request
  if (mode && token) {
    // Check the mode and token sent is correct
    if (mode === "subscribe" && token === config.verifyToken) {
      // Respond with the challenge token from the request
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      // Respond with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

// Creating the endpoint for the webhook
app.post("/webhook", (req, res) => {
  let body = req.body;

  console.log(`\u{1F7EA} Received webhook:`);
  console.dir(body, { depth: null });

  // Check if this is an event from a page subscription
  if (body.object === "page") {
    // Returns a '200 OK' response to all requests
    res.status(200).send("EVENT_RECEIVED");

    // Iterate over each entry - there may be multiple if batched
    body.entry.forEach(async function (entry) {
      if ("changes" in entry) {
        // Handle Page Changes event
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

      // Iterate over webhook events - there may be multiple
      entry.messaging.forEach(async function (webhookEvent) {
        // Log the PSID when a user messages the page
        if (webhookEvent.sender && webhookEvent.sender.id) {
          console.log("\n=== IMPORTANT: YOUR PSID IS ===");
          console.log(webhookEvent.sender.id);
          console.log("=== COPY THIS VALUE ===\n");
        }

        // Discard uninteresting events
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

        // Get the sender PSID
        let senderPsid = webhookEvent.sender.id;
        // Get the user_ref if from Chat plugin logged in user
        let user_ref = webhookEvent.sender.user_ref;
        // Check if user is guest from Chat plugin guest user
        let guestUser = isGuestUser(webhookEvent);

        if (senderPsid != null && senderPsid != undefined) {
          if (!(senderPsid in users)) {
            if (!guestUser) {
              // Make call to UserProfile API only if user is not guest
              let user = new User(senderPsid);
              GraphApi.getUserProfile(senderPsid)
                .then((userProfile) => {
                  user.setProfile(userProfile);
                })
                .catch((error) => {
                  // The profile is unavailable
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
          // Handle user_ref
          setDefaultUser(user_ref);
          return receiveAndReturn(users[user_ref], webhookEvent, true);
        }
      });
    });
  } else {
    // Return a '404 Not Found' if event is not from a page subscription
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

  // Check if a token and mode is in the query string of the request
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
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  } else {
    // Returns a '404 Not Found' if mode or token are missing
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
