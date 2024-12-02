/**
 * Custom response handler to override default bot behavior
 */

"use strict";

const Response = require("./response"),
  GraphApi = require("./graph-api");

class CustomResponse {
  constructor(user, webhookEvent) {
    this.user = user;
    this.webhookEvent = webhookEvent;
  }

  // Override the default message handler
  handleMessage() {
    const response = {
      text: "Howdy customer"
    };

    // Construct the message body
    const requestBody = {
      recipient: {
        id: this.user.psid
      },
      message: response
    };

    // Send message immediately without delay
    GraphApi.callSendApi(requestBody);
  }
}

module.exports = CustomResponse;
