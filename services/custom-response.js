/**
 * Custom response handler for sending manual messages
 */

"use strict";

const GraphApi = require("./graph-api");

class CustomResponse {
  /**
   * Send a custom message to a specific user
   * @param {string} psid - The Page-scoped ID of the user to send the message to
   * @param {string} message - The message text to send
   */
  static async sendCustomMessage(psid, message) {
    const response = {
      text: message
    };

    const requestBody = {
      recipient: {
        id: psid
      },
      message: response
    };

    // Send message immediately without delay
    return GraphApi.callSendApi(requestBody);
  }
}

module.exports = CustomResponse;
