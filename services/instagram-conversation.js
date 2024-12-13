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
      // Initialize if needed
      if (!InstagramConversation._messages) {
        InstagramConversation._messages = [];
      }

      console.log("Getting conversation history for userId:", userId);
      console.log("Instagram Account ID:", config.instagramAccountId);
      console.log("Current messages:", InstagramConversation._messages);

      // Return stored messages
      const messages = InstagramConversation._messages
        .filter(msg => {
          // Include messages where:
          // 1. User sent to page (page is recipient, user is sender)
          // 2. Page sent to user (user is recipient, page is sender)
          const isUserToPage = msg.senderId === userId && msg.recipientId === config.instagramAccountId;
          const isPageToUser = msg.senderId === config.instagramAccountId && msg.recipientId === userId;
          console.log("Message:", msg);
          console.log("isUserToPage:", isUserToPage);
          console.log("isPageToUser:", isPageToUser);
          return isUserToPage || isPageToUser;
        });

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
    // Initialize if needed
    if (!InstagramConversation._messages) {
      InstagramConversation._messages = [];
    }

    console.log("Adding message:", { text, senderId, recipientId, timestamp, isEcho });

    const message = {
      message: text,
      timestamp: timestamp || Date.now(),
      // If it's an echo, it means the page sent it
      sender: isEcho ? 'Page' : (senderId === config.instagramAccountId ? 'Page' : 'User'),
      senderId: senderId,
      recipientId: recipientId,
      isEcho: isEcho
    };

    // Add message if it doesn't exist
    const exists = InstagramConversation._messages.some(m => 
      m.timestamp === message.timestamp && 
      m.message === message.message &&
      m.senderId === message.senderId
    );

    if (!exists) {
      InstagramConversation._messages.push(message);
      console.log("Message added to conversation. Current messages:", InstagramConversation._messages);
    } else {
      console.log("Message already exists in conversation");
    }
  }

  // For debugging
  static clearMessages() {
    InstagramConversation._messages = [];
    console.log("Cleared all messages");
  }
}

module.exports = InstagramConversation;
