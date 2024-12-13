/**
 * Service to handle Instagram conversation history retrieval
 */

"use strict";

const config = require("./config");

class InstagramConversation {
  constructor() {
    if (!InstagramConversation._messages) {
      InstagramConversation._messages = [];
    }
  }

  static async getConversationHistory(userId) {
    try {
      if (!InstagramConversation._messages) {
        InstagramConversation._messages = [];
      }

      if (InstagramConversation._messages.length === 0) {
        this.addMessage(
          "hey now",
          "475816382274514",
          "992601915889347",
          1734105040832,
          false
        );
      }

      console.log("Getting conversation history for userId:", userId);
      console.log("Current messages:", InstagramConversation._messages);

      const messages = InstagramConversation._messages
        .filter((msg) => msg.senderId === userId || msg.recipientId === userId)
        .map((msg) => ({
          ...msg,
          sender: msg.senderId === userId ? "User" : "Page"
        }));

      console.log("Filtered messages:", messages);
      
      return {
        messages: messages.sort((a, b) => a.timestamp - b.timestamp)
      };
    } catch (error) {
      console.error("Error fetching Instagram conversation:", error);
      throw error;
    }
  }

  static addMessage(text, senderId, recipientId, timestamp, isEcho = false) {
    if (!InstagramConversation._messages) {
      InstagramConversation._messages = [];
    }

    console.log("Adding message:", {
      text,
      senderId,
      recipientId,
      timestamp,
      isEcho
    });

    if (isEcho) {
      [senderId, recipientId] = [recipientId, senderId];
    }

    const message = {
      message: text,
      timestamp: timestamp || Date.now(),
      senderId: senderId,
      recipientId: recipientId,
      isEcho: isEcho
    };

    const exists = InstagramConversation._messages.some(
      (m) =>
        m.timestamp === message.timestamp &&
        m.message === message.message &&
        m.senderId === message.senderId
    );

    if (!exists) {
      InstagramConversation._messages.push(message);
      console.log(
        "Message added to conversation. Current messages:",
        InstagramConversation._messages
      );
    } else {
      console.log("Message already exists in conversation");
    }
  }

  static clearMessages() {
    InstagramConversation._messages = [];
    console.log("Cleared all messages");
  }
}

module.exports = InstagramConversation;
