const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const fs = require("fs");

const app = express();
app.use(bodyParser.json());

// ================= CONFIG =================
const PAGE_ACCESS_TOKEN = "YOUR_PAGE_ACCESS_TOKEN"; // <-- REQUIRED
const ADMINS = ["61573657085244"];                // <-- ADMIN FB ID
const BOT_VERSION = "v1.5.35";
const DB_FILE = "./users.json";

// ============== SLOT SYMBOLS ==============
const SYMBOLS = ["🍒", "🍋", "🔔", "⭐", "🍉", "💎"];

// ============== DATABASE ==================
let users = fs.existsSync(DB_FILE)
  ? JSON.parse(fs.readFileSync(DB_FILE))
  : {};

function saveDB() {
  fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
}

function getUser(id) {
  if (!users[id]) users[id] = { coins: 500 };
  return users[id];
}

// ============== SLOT LOGIC ================
function spin() {
  return Array.from({ length: 3 }, () =>
    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
  );
}

function payout(result, bet) {
  if (result[0] === result[1] && result[1] === result[2]) return bet * 5;
  if (result[0] === result[1] || result[1] === result[2]) return bet * 2;
  return 0;
}

// ============== WEBHOOK ===================
app.post("/webhook", (req, res) => {
  const event = req.body.entry?.[0]?.messaging?.[0];
  if (!event || !event.message?.text) return res.sendStatus(200);

  const senderId = event.sender.id;
  const text = event.message.text.toLowerCase();
  const user = getUser(senderId);

  // 🆔 USER ID
  if (text === "/id") {
    return send(senderId, `🆔 Your User ID:\n${senderId}`);
  }

  // 💰 BALANCE
  if (text === "/balance") {
    return send(senderId, `💰 Balance: ${user.coins} coins`);
  }

  // ℹ️ VERSION
  if (text === "/version") {
    return send(
      senderId,
      `🤖 Messenger Slot Bot
Version: ${BOT_VERSION}
Status: Stable ✅`
    );
  }

  // 🎰 SLOT GAME
  if (text.startsWith("/slot")) {
    const bet = parseInt(text.split(" ")[1]);

    if (!bet || bet <= 0)
      return send(senderId, "❌ Use: /slot <amount>");

    if (user.coins < bet)
      return send(senderId, "💸 Not enough coins!");

    user.coins -= bet;
    const result = spin();
    const win = payout(result, bet);
    user.coins += win;
    saveDB();

    return send(
      senderId,
      `🎰 SLOT MACHINE 🎰
${result.join(" | ")}

${win > 0 ? "🎉 You Won " + win : "😢 You Lost"}
💰 Balance: ${user.coins}`
    );
  }

  // 🏆 LEADERBOARD
  if (text === "/top") {
    const top = Object.entries(users)
      .sort((a, b) => b[1].coins - a[1].coins)
      .slice(0, 5)
      .map((u, i) => `${i + 1}. ${u[1].coins} coins`)
      .join("\n");

    return send(senderId, `🏆 TOP PLAYERS 🏆\n${top || "No players yet"}`);
  }

  // 👑 ADMIN ADD COINS
  if (text.startsWith("/addcoin")) {
    if (!ADMINS.includes(senderId)) {
      return send(senderId, "⛔ Admin only command.");
    }

    const args = text.split(" ");
    const targetId = args[1];
    const amount = parseInt(args[2]);

    if (!targetId || !amount || amount <= 0)
      return send(senderId, "❌ Use: /addcoin USER_ID AMOUNT");

    if (!users[targetId]) users[targetId] = { coins: 0 };

    users[targetId].coins += amount;
    saveDB();

    return send(
      senderId,
      `✅ Coins Added
👤 User: ${targetId}
💰 Amount: ${amount}
💳 Balance: ${users[targetId].coins}`
    );
  }

  res.sendStatus(200);
});

// ============== SEND MESSAGE ==============
function send(id, text) {
  axios.post(
    `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
    {
      recipient: { id },
      message: { text }
    }
  );
}

// ============== START SERVER ===============
app.listen(3000, () =>
  console.log(`🤖 Slot Bot ${BOT_VERSION} Running`)
);
