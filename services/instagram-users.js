/**
 * Service to manage Instagram users
 */
"use strict";

const config = require("./config");
const request = require("request");

class InstagramUsers {
  static async getUsers() {
    try {
      const response = await new Promise((resolve, reject) => {
        request(
          {
            uri: `${config.apiUrl}/${config.instagramAccountId}/conversations`,
            qs: {
              access_token: config.instagramAccessToken,
              fields: "participants{name,username,id}"
            },
            method: "GET",
            json: true
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

      if (response.data && response.data.length > 0) {
        // Extract unique users from all conversations
        const usersMap = new Map();
        response.data.forEach(conversation => {
          conversation.participants.data.forEach(participant => {
            if (participant.id !== config.instagramAccountId) {
              usersMap.set(participant.id, {
                id: participant.id,
                name: participant.name,
                username: participant.username
              });
            }
          });
        });
        return Array.from(usersMap.values());
      }
      return [];
    } catch (error) {
      console.error("Error fetching Instagram users:", error);
      throw error;
    }
  }

  static async getUserById(userId) {
    try {
      const response = await new Promise((resolve, reject) => {
        request(
          {
            uri: `${config.apiUrl}/${userId}`,
            qs: {
              access_token: config.instagramAccessToken,
              fields: "name,username,profile_picture_url"
            },
            method: "GET",
            json: true
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

      return {
        id: userId,
        name: response.name,
        username: response.username,
        profilePicture: response.profile_picture_url
      };
    } catch (error) {
      console.error("Error fetching Instagram user:", error);
      throw error;
    }
  }
}

module.exports = InstagramUsers;
