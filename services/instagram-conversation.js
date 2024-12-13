/**
 * Service to handle Instagram conversation history retrieval
 */

"use strict";

const config = require("./config");

// Initialize static messages array
const messages = [];

class InstagramConversation {
  constructor() {
    // No initialization needed since messages is module-level
  }

  static async getConversationHistory(userId) {
    try {
      console.log("Getting conversation history for userId:", userId);
      console.log("Current messages:", messages);

      // Return stored messages
      const filteredMessages = messages
        .filter(msg => {
          // Include messages where:
          // 1. Message involves this user (as sender or recipient)
          // 2. Message involves the business account (17841460036924979) and the other user (606648068569151)
          return (msg.senderId === userId || msg.recipientId === userId) ||
                 (msg.senderId === "606648068569151" && msg.recipientId === "475816382274514") ||
                 (msg.senderId === "475816382274514" && msg.recipientId === "606648068569151");
        })
        .map(msg => ({
          ...msg,
          // Set sender to 'User' if the message is from the user we're viewing
          // Set sender to 'Page' if it's from anyone else
          sender: msg.senderId === userId ? 'User' : 'Page'
        }));

      console.log("Filtered messages:", filteredMessages);
      
      return {
        messages: filteredMessages.sort((a, b) => a.timestamp - b.timestamp)
      };
    } catch (error) {
      console.error("Error fetching Instagram conversation:", error);
      throw error;
    }
  }

  static addMessage(text, senderId, recipientId, timestamp, isEcho = false) {
    console.log("Adding message:", { text, senderId, recipientId, timestamp, isEcho });

    // If it's an echo, swap sender and recipient since the echo comes from the recipient
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

    // Add message if it doesn't exist
    const exists = messages.some(m => 
      m.timestamp === message.timestamp && 
      m.message === message.message &&
      m.senderId === message.senderId
    );

    if (!exists) {
      messages.push(message);
      console.log("Message added to conversation. Current messages:", messages);
    } else {
      console.log("Message already exists in conversation");
    }
  }

  // For debugging
  static clearMessages() {
    messages.length = 0;  // Clear array while keeping the reference
    console.log("Cleared all messages");
  }
}

module.exports = InstagramConversation;
