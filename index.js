import TelegramBot from "node-telegram-bot-api";
import express from "express";
import dotenv from "dotenv";
import fs from "fs";
import sqlite3 from "sqlite3";
import OpenAI from "openai";

dotenv.config();

// ================= ENV =================
const BOT_TOKEN = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 3000;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

if (!BOT_TOKEN) {
  console.error("❌ BOT_TOKEN missing");
  process.exit(1);
}

// ================= EXPRESS =================
const app = express();
app.use(express.static("."));

app.get("/", (_, res) => {
  res.sendFile(process.cwd() + "/site.html");
});

app.listen(PORT, () => {
  console.log(`🌐 Website running on port ${PORT}`);
});

// ================= BOT =================
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// ================= DATABASE =================
const db = new sqlite3.Database("database.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      username TEXT,
      message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// ================= ADMINS =================
const admins = JSON.parse(fs.readFileSync("admin.json")).admins;

// ================= AI =================
let openai = null;
if (OPENAI_KEY) {
  openai = new OpenAI({ apiKey: OPENAI_KEY });
  console.log("🧠 AI enabled");
} else {
  console.log("⚠️ AI disabled (no key)");
}

// ================= MENU =================
const menu = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "🌐 Website", url: "https://briantechspace.co.ke" }],
      [{ text: "🛒 Order Service", callback_data: "order" }],
      [{ text: "🤖 Ask AI", callback_data: "ai" }],
      [{ text: "📞 WhatsApp", url: "https://wa.me/254768116434" }]
    ]
  }
};

// ================= START =================
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "👋 *Welcome to Brian Tech*\n\n" +
    "• Bots & Automation\n" +
    "• Web & Hosting\n" +
    "• VPS & Panels\n\n" +
    "Choose an option 👇",
    { parse_mode: "Markdown", ...menu }
  );
});

// ================= CALLBACKS =================
bot.on("callback_query", async (q) => {
  const chatId = q.message.chat.id;

  if (q.data === "order") {
    bot.sendMessage(chatId, "🛒 Please type what you want to order:");
    bot.once("message", (msg) => saveOrder(msg));
  }

  if (q.data === "ai") {
    if (!openai) {
      return bot.sendMessage(chatId, "⚠️ AI is not enabled.");
    }
    bot.sendMessage(chatId, "🤖 Ask me anything:");
    bot.once("message", (msg) => aiReply(msg));
  }

  bot.answerCallbackQuery(q.id);
});

// ================= ORDER SAVE =================
function saveOrder(msg) {
  db.run(
    "INSERT INTO orders (user_id, username, message) VALUES (?, ?, ?)",
    [msg.from.id, msg.from.username || "unknown", msg.text]
  );

  bot.sendMessage(
    msg.chat.id,
    "✅ Order received!\n\nWe’ll contact you shortly."
  );
}

// ================= AI REPLY =================
async function aiReply(msg) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are Brian Tech support assistant." },
        { role: "user", content: msg.text }
      ]
    });

    bot.sendMessage(msg.chat.id, response.choices[0].message.content);
  } catch (err) {
    bot.sendMessage(msg.chat.id, "❌ AI error, try again later.");
  }
}

// ================= ADMIN =================
bot.onText(/\/orders/, (msg) => {
  if (!admins.includes(msg.from.id)) {
    return bot.sendMessage(msg.chat.id, "❌ Access denied");
  }

  db.all("SELECT * FROM orders ORDER BY id DESC LIMIT 5", (_, rows) => {
    if (!rows.length) {
      return bot.sendMessage(msg.chat.id, "📭 No orders yet.");
    }

    let text = "📦 *Latest Orders*\n\n";
    rows.forEach(o => {
      text += `#${o.id} @${o.username}\n${o.message}\n\n`;
    });

    bot.sendMessage(msg.chat.id, text, { parse_mode: "Markdown" });
  });
});

console.log("✅ Brian Tech system running");
