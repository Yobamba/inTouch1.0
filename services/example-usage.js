/**
 * Example of how to send custom messages while letting the bot operate normally
 */

const CustomResponse = require('./custom-response');

// Example: How to send a custom message to a user
// Replace USER_PSID with the actual Page-scoped ID of the user
async function sendExample() {
    try {
        await CustomResponse.sendCustomMessage("USER_PSID", "Howdy customer");
        console.log("Custom message sent successfully");
    } catch (error) {
        console.error("Error sending custom message:", error);
    }
}

// You can call this function whenever you want to send a custom message
// The bot will continue to operate normally for all other interactions

module.exports = {
    sendExample
};
