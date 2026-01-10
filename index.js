/**
 * @author NTKhang
 * ! The source code is written by NTKhang, please don't change the author's name everywhere. Thank you for using
 * ! Official source code: https://github.com/ntkhang03/Goat-Bot-V2
 * ! If you do not download the source code from the above address, you are using an unknown version and at risk of having your account hacked
 *
 * English:
 * ! Please do not change the below code, it is very important for the project.
 * It is my motivation to maintain and develop the project for free.
 * ! If you change it, you will be banned forever
 * Thank you for using
 *
 * Vietnamese:
 * ! Vui lòng không thay đổi mã bên dưới, nó rất quan trọng đối với dự án.
 * Nó là động lực để tôi duy trì và phát triển dự án miễn phí.
 * ! Nếu thay đổi nó, bạn sẽ bị cấm vĩnh viễn
 * Cảm ơn bạn đã sử dụng
 */

const { spawn } = require("child_process");
const log = require("./logger/log.js");

function startProject() {
	const child = spawn("node", ["Goat.js"], {
		cwd: __dirname,
		stdio: "inherit",
		shell: true
	});

	child.on("close", (code) => {
		if (code == 2) {
			log.info("Restarting Project...");
			startProject();
		}
	});
}

const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const fs = require("fs");

const app = express();
app.use(bodyParser.json());

// 🔑 CONFIG
const PAGE_ACCESS_TOKEN = "YOUR_PAGE_ACCESS_TOKEN";
const ADMINS = ["61573657085244"]; // <-- ADD YOUR FB ID HERE
const DB_FILE = "./users.json";

// 🎰 SLOT SYMBOLS
const symbols = ["🍒", "🍋", "🔔", "⭐", "🍉", "💎"];

// 📦 LOAD / SAVE DATABASE
let users = fs.existsSync(DB_FILE)
  ? JSON.parse(fs.readFileSync(DB_FILE))
  : {};

function saveDB() {
  fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
}

// 👤 GET USER
function getUser(id) {
  if (!users[id]) users[id] = { coins: 500 };
  return users[id];
}

// 🎰 SLOT LOGIC
function spin() {
  return Array.from({ length: 3 }, () =>
    symbols[Math.floor(Math.random() * symbols.length)]
  );
}

function payout(slot, bet) {
  if (slot[0] === slot[1] && slot[1] === slot[2]) return bet * 5;
  if (slot[0] === slot[1] || slot[1] === slot[2]) return bet * 2;
  return 0;
}

// 📩 WEBHOOK
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

  // 🎰 SLOT GAME
  if (text.startsWith("/slot")) {
    const bet = parseInt(text.split(" ")[1]);

    if (!bet || bet <= 0)
      return send(senderId, "❌ Use: /slot 50");

    if (user.coins < bet)
      return send(senderId, "💸 Not enough coins!");

    user.coins -= bet;
    const s = spin();
    const win = payout(s, bet);
    user.coins += win;
    saveDB();

    return send(
      senderId,
      `🎰 SLOT MACHINE 🎰
${s.join(" | ")}

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

    if (!targetId || !amount || amount <= 0) {
      return send(senderId, "❌ Use: /addcoin USER_ID AMOUNT");
    }

    if (!users[targetId]) users[targetId] = { coins: 0 };
    users[targetId].coins += amount;
    saveDB();

    return send(
      senderId,
      `✅ Added ${amount} coins
👤 User: ${targetId}
💰 New Balance: ${users[targetId].coins}`
    );
  }

  res.sendStatus(200);
});

// 📤 SEND MESSAGE
function send(id, text) {
  axios.post(
    `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
    {
      recipient: { id },
      message: { text }
    }
  );
}

// 🚀 START SERVER
app.listen(3000, () => console.log("🤖 Messenger Slot Bot Running"));
