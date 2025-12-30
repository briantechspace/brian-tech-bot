import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";

dotenv.config();

const token = process.env.BOT_TOKEN;

if (!token) {
  console.error("❌ BOT_TOKEN is missing");
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

bot.on("message", (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(
    chatId,
    "👋 Welcome to *Brian Tech Bot*\n\n" +
    "🌐 Website: briantechspace.co.ke\n" +
    "💻 Services: Bots • Hosting • Web\n\n" +
    "Type /start anytime.",
    { parse_mode: "Markdown" }
  );
});

console.log("✅ Brian Tech Bot is running");
