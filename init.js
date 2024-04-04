const TelegramBot = require("node-telegram-bot-api");
const tzlookup = require("tz-lookup");
const timezoneOffset = require("timezone-offset");

// replace the value below with the Telegram token you receive from @BotFather
const token = "6885728029:AAG_WWpvbpyUpMKh7dwIS4gzUosgY2uC--8";

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

// Store user data temporarily
const userData = {};

// Listen for the /sendmessage command
bot.onText(/\/sendmessage/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    "Please send your location to determine your UTC timezone."
  );
});

// Listen for location message for sender
bot.on("location", (msg) => {
  const chatId = msg.chat.id;
  const { latitude, longitude } = msg.location;
  userData[chatId] = { latitude, longitude };
  bot.sendMessage(
    chatId,
    "Location received. Now please enter the recipient's location to determine their UTC timezone."
  );
});

// Listen for location message for recipient
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const message = msg.text;
  try {
    if (
      !userData[chatId] ||
      !userData[chatId].latitude ||
      !userData[chatId].longitude
    ) {
      bot.sendMessage(
        chatId,
        "Please send your location first to determine your UTC timezone."
      );
      return;
    }

    const { latitude: senderLatitude, longitude: senderLongitude } =
      userData[chatId];
    const { latitude: recipientLatitude, longitude: recipientLongitude } =
      msg.location;

    // Get sender's timezone based on coordinates
    const senderTimezone = tzlookup(senderLatitude, senderLongitude);

    // Get recipient's timezone based on coordinates
    const recipientTimezone = tzlookup(recipientLatitude, recipientLongitude);

    // Calculate the UTC offset for sender
    const senderUtcOffset = timezoneOffset(senderTimezone);

    // Calculate the UTC offset for recipient
    const recipientUtcOffset = timezoneOffset(recipientTimezone);

    // Calculate sender's UTC time
    const senderUtcTime = new Date().getUTCHours() + senderUtcOffset;
    const senderUtcTimeString = `${
      senderUtcTime < 10 ? "0" : ""
    }${senderUtcTime}:00 UTC`;

    // Calculate recipient's UTC time
    const recipientUtcTime = new Date().getUTCHours() + recipientUtcOffset;
    const recipientUtcTimeString = `${
      recipientUtcTime < 10 ? "0" : ""
    }${recipientUtcTime}:00 UTC`;

    // Send confirmation and ask for the message
    bot.sendMessage(
      chatId,
      `Your UTC time: ${senderUtcTimeString}\nRecipient's UTC time: ${recipientUtcTimeString}\n\nPlease enter the message you want to send:`
    );
  } catch (error) {
    console.error("Error sending message:", error);
    bot.sendMessage(
      chatId,
      "There was an error sending the message. Please try again."
    );
  }
});

// Listen for text message for sending the message
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const message = msg.text;

  // Send the message to the recipient
  // For demonstration purposes, let's assume the recipient's chat ID is known and replace `RECIPIENT_CHAT_ID`
  const recipientChatId = "RECIPIENT_CHAT_ID";
  bot.sendMessage(recipientChatId, message);
});
