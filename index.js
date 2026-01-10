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

startProject();
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
