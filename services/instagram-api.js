/**
 * Instagram Graph API Integration Service
 */
"use strict";

const config = require("./config"),
  request = require("request");

class InstagramApi {
  static async callAPI(path, data, accessToken = null) {
    if (!accessToken) {
      accessToken = config.instagramAccessToken;
    }
    try {
      const response = await new Promise((resolve, reject) => {
        request(
          {
            uri: `${config.apiUrl}/${path}`,
            qs: { access_token: accessToken, ...data },
            method: "GET",
            json: true,
          },
          (error, response, body) => {
            if (error) {
              reject(error);
            } else {
              resolve(body);
            }
          }
        );
      });
      return response;
    } catch (error) {
      console.error("Instagram API Error:", error);
      throw error;
    }
  }

  static async getUserProfile(userId) {
    const fields = "username,name,profile_picture_url";
    const response = await this.callAPI(`${userId}`, { fields });
    return {
      name: response.name,
      profilePic: response.profile_picture_url,
      username: response.username
    };
  }

  static async sendMessage(userId, message) {
    const path = "me/messages";
    const messageData = {
      recipient: {
        id: userId
      },
      message: {
        text: message
      }
    };
    try {
      const response = await new Promise((resolve, reject) => {
        request(
          {
            uri: `${config.apiUrl}/${path}`,
            qs: { access_token: config.instagramAccessToken },
            method: "POST",
            json: messageData,
          },
          (error, response, body) => {
            if (error) {
              reject(error);
            } else {
              resolve(body);
            }
          }
        );
      });
      return response;
    } catch (error) {
      console.error("Error sending Instagram message:", error);
      throw error;
    }
  }

  static async getConversations(userId) {
    const fields = "participants,messages{message,from,to,created_time}";
    const response = await this.callAPI(`${userId}/conversations`, { fields });
    return response.data.map((conversation) => ({
      id: conversation.id,
      participants: conversation.participants.data,
      messages: conversation.messages.data.map((msg) => ({
        message: msg.message,
        from: msg.from.id,
        to: msg.to.id,
        createdTime: msg.created_time
      }))
    }));
  }

  static async handleWebhook(body) {
    if (body.object === "instagram") {
      const entry = body.entry[0];
      if (entry.messaging) {
        const messagingEvent = entry.messaging[0];
        if (messagingEvent.message) {
          return this.handleMessage(messagingEvent);
        }
        if (messagingEvent.postback) {
          return this.handlePostback(messagingEvent);
        }
      }
    }
    return null;
  }

  static async handleMessage(messagingEvent) {
    const senderId = messagingEvent.sender.id;
    const message = messagingEvent.message;
    try {
      const userProfile = await this.getUserProfile(senderId);
      if (message.text) {
        return {
          type: "text",
          sender: {
            id: senderId,
            ...userProfile
          },
          message: message.text
        };
      }
      return null;
    } catch (error) {
      console.error("Error handling Instagram message:", error);
      throw error;
    }
  }

  static async handlePostback(messagingEvent) {
    const senderId = messagingEvent.sender.id;
    const postback = messagingEvent.postback;
    try {
      const userProfile = await this.getUserProfile(senderId);
      return {
        type: "postback",
        sender: {
          id: senderId,
          ...userProfile
        },
        payload: postback.payload
      };
    } catch (error) {
      console.error("Error handling Instagram postback:", error);
      throw error;
    }
  }
}

module.exports = InstagramApi;
