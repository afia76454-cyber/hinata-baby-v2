const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

const PAGE_ACCESS_TOKEN = "YOUR_PAGE_ACCESS_TOKEN";

// Slot symbols
const slots = ["🍒", "🍋", "🔔", "⭐", "🍉", "💎"];

function spinSlot() {
  return [
    slots[Math.floor(Math.random() * slots.length)],
    slots[Math.floor(Math.random() * slots.length)],
    slots[Math.floor(Math.random() * slots.length)]
  ];
}

function getResult(slot) {
  if (slot[0] === slot[1] && slot[1] === slot[2]) {
    return "🎉 JACKPOT! You Win!";
  }
  return "😢 Try Again!";
}

// Webhook
app.post("/webhook", (req, res) => {
  const event = req.body.entry[0].messaging[0];
  const senderId = event.sender.id;
  const message = event.message?.text;

  if (message === "/slot") {
    const spin = spinSlot();
    const result = getResult(spin);

    sendMessage(
      senderId,
      `🎰 SLOT MACHINE 🎰\n\n${spin.join(" | ")}\n\n${result}`
    );
  }

  res.sendStatus(200);
});

function sendMessage(senderId, text) {
  axios.post(
    `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
    {
      recipient: { id: senderId },
      message: { text }
    }
  );
}

app.listen(3000, () => console.log("Bot running on port 3000"));
