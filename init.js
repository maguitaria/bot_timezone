const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const tzlookup = require("tz-lookup");
const dotenv = require("dotenv")
const timezoneOffset = require("timezone-offset");

dotenv.config();
// Replace the value below with the Telegram token you receive from @BotFather
const token = process.env.BOT_TOKEN

// Initialize Express app
const app = express();

// Set up webhook route
app.post(`/webhook/${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Start Express server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

// Function to create a custom keyboard
function createKeyboard(buttons) {
  return {
    reply_markup: {
      keyboard: buttons.map((row) => row.map((text) => ({ text }))),
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  };
}

// Welcome message with emojis and commands
const welcomeMessage = `👋 Welcome to the Bot! Please choose an option from the menu below:
/sendmessage - Send Message
/sendlocation - Send Location`;

// Commands menu
const commandsMenu = [["/sendmessage", "/sendlocation"]];

// Object to store sender and recipient data temporarily
const userData = {};

// Listen for the /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  // Send welcome message with custom keyboard
  bot.sendMessage(chatId, welcomeMessage, createKeyboard(commandsMenu));
});

// Listen for the /sendmessage command
bot.onText(/\/sendmessage/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    "Please enter your town/city name to determine your UTC timezone."
  );
  // Set the user's state to 'waitingForSenderLocation'
  userData[chatId] = { state: "waitingForSenderLocation" };
});

// Listen for location messages
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;

  // Check the user's state
  if (userData[chatId]) {
    const { state } = userData[chatId];
    switch (state) {
      case "waitingForSenderLocation":
        // Save sender's town/city name
        userData[chatId].senderLocation = messageText;
        bot.sendMessage(
          chatId,
          "Sender's town/city received. Now please enter the recipient's town/city name."
        );
        // Update the user's state to 'waitingForRecipientLocation'
        userData[chatId].state = "waitingForRecipientLocation";
        break;
      case "waitingForRecipientLocation":
        // Save recipient's town/city name
        userData[chatId].recipientLocation = messageText;
        const { senderLocation, recipientLocation } = userData[chatId];

        // Get sender's timezone based on town/city name
        const senderTimezone = tzlookup(senderLocation);

        // Get recipient's timezone based on town/city name
        const recipientTimezone = tzlookup(recipientLocation);

        // Calculate the UTC offset for sender
        const senderUtcOffset = timezoneOffset(senderTimezone);

        // Calculate the UTC offset for recipient
        const recipientUtcOffset = timezoneOffset(recipientTimezone);

        // Calculate time difference in hours
        const timeDifference = recipientUtcOffset - senderUtcOffset;
 console.log(senderTimezone, recipientTimezone)
        // Ask for the time to send the message from sender's location
        bot.sendMessage(
          chatId,
          `Time difference between sender's and recipient's timezones: ${timeDifference} hours.\nPlease enter the time you want to send the message in your local time (HH:MM format):`
        );

        // Update the user's state to 'waitingForMessageTime'
        userData[chatId].state = "waitingForMessageTime";
        break;
      case "waitingForMessageTime":
        // Get the message time from the user
        const messageTime = messageText;
        // Here, you'll implement the logic to convert the time provided by the sender to the recipient's local time.
        // For simplicity, I'm just sending back the received message.
        bot.sendMessage(chatId, `Your message time: ${messageTime}`);
        // Clear the user's data since the conversation is complete
        delete userData[chatId];
        break;
      default:
        // If user's state is undefined or invalid, send a message informing the user
        bot.sendMessage(
          chatId,
          "Invalid state. Please restart the conversation."
        );
        break;
    }
  } else {
    // If user's data is undefined, send a message informing the user
    bot.sendMessage(chatId, "Please start the conversation by typing /start.");
  }
});
