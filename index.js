import TelegramBot from "node-telegram-bot-api";
import express from "express";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

// ================== ENV ==================
const BOT_TOKEN = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 3000;

if (!BOT_TOKEN) {
  console.error("❌ BOT_TOKEN missing");
  process.exit(1);
}

// ================== BOT ==================
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// ================== EXPRESS ==================
const app = express();
app.use(express.static("."));

app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/site.html");
});

app.listen(PORT, () => {
  console.log(`🌐 Website running on port ${PORT}`);
});

// ================== DATA ==================
const admins = JSON.parse(fs.readFileSync("admin.json")).admins;

// ================== BOT UI ==================
const mainMenu = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "🌐 Visit Website", url: "https://briantechspace.co.ke" }],
      [{ text: "🛒 Services", callback_data: "services" }],
      [{ text: "📞 WhatsApp", url: "https://wa.me/254768116434" }],
      [{ text: "ℹ️ About", callback_data: "about" }]
    ]
  }
};

// ================== COMMANDS ==================
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "👋 *Welcome to Brian Tech Bot*\n\n" +
    "💻 Web Development\n" +
    "🤖 Bot Hosting\n" +
    "🛠️ VPS & Pterodactyl\n\n" +
    "Use the menu below 👇",
    { parse_mode: "Markdown", ...mainMenu }
  );
});

// ================== CALLBACKS ==================
bot.on("callback_query", (query) => {
  const chatId = query.message.chat.id;

  if (query.data === "services") {
    bot.sendMessage(
      chatId,
      "🛒 *Our Services*\n\n" +
      "• Telegram & WhatsApp Bots\n" +
      "• Web Design & Hosting\n" +
      "• VPS & Pterodactyl Setup\n" +
      "• Automation Tools",
      { parse_mode: "Markdown" }
    );
  }

  if (query.data === "about") {
    bot.sendMessage(
      chatId,
      "ℹ️ *Brian Tech*\n\n" +
      "Kenya-based tech brand delivering\n" +
      "reliable digital solutions.\n\n" +
      "Founder: Brian",
      { parse_mode: "Markdown" }
    );
  }

  bot.answerCallbackQuery(query.id);
});

// ================== ADMIN COMMAND ==================
bot.onText(/\/admin/, (msg) => {
  if (!admins.includes(msg.from.id)) {
    return bot.sendMessage(msg.chat.id, "❌ Access denied");
  }

  bot.sendMessage(
    msg.chat.id,
    "🛡️ *Admin Panel*\n\n" +
    "• Bot is online\n" +
    "• Website is running\n" +
    "• All systems normal",
    { parse_mode: "Markdown" }
  );
});

console.log("✅ Brian Tech Bot is running");
