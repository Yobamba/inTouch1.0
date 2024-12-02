/**
 * Service to handle conversation history retrieval
 */

"use strict";

const config = require("./config");
const fetch = require("node-fetch");

const PAGE_ID = "8750657048323051"; // The page/bot ID
const USER_ID = "475816382274514"; // The user ID

class Conversation {
  static async getConversationHistory(psid) {
    try {
      // First, get the conversation ID
      const conversationUrl = `https://graph.facebook.com/v18.0/${psid}?fields=id,first_name,last_name&access_token=${config.pageAccesToken}`;
      const userResponse = await fetch(conversationUrl);
      const userData = await userResponse.json();

      // Get messages using the conversation ID
      const messagesUrl = `https://graph.facebook.com/v18.0/me/conversations?user_id=${psid}&fields=messages{message,created_time,from}&access_token=${config.pageAccesToken}`;
      const messagesResponse = await fetch(messagesUrl);
      const messagesData = await messagesResponse.json();

      // Format and sort the conversation data
      const messages = messagesData.data[0] && messagesData.data[0].messages ? 
        messagesData.data[0].messages.data.map(msg => ({
          message: msg.message,
          timestamp: msg.created_time,
          sender: msg.from.id === PAGE_ID ? 'Page' : 'User',
          senderId: msg.from.id
        }))
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)) // Sort by timestamp ascending
        : [];

      const conversation = {
        user: {
          id: userData.id,
          name: `${userData.first_name} ${userData.last_name}`
        },
        messages: messages
      };

      return conversation;
    } catch (error) {
      console.error("Error fetching conversation:", error);
      throw error;
    }
  }
}

module.exports = Conversation;
