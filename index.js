import TelegramBot from "node-telegram-bot-api";
import express from "express";
import dotenv from "dotenv";
import fs from "fs";
import sqlite3 from "sqlite3";
import OpenAI from "openai";

dotenv.config();

/* ================= ENV ================= */
const BOT_TOKEN = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 3000;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

if (!BOT_TOKEN) {
  console.error("❌ BOT_TOKEN missing");
  process.exit(1);
}

/* ================= EXPRESS ================= */
const app = express();
app.use(express.static("."));

app.get("/", (_, res) => {
  res.sendFile(process.cwd() + "/site.html");
});

app.listen(PORT, () => {
  console.log(`🌐 Website running on port ${PORT}`);
});

/* ================= BOT ================= */
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

/* ================= DATABASE ================= */
const db = new sqlite3.Database("database.db");

db.run(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    username TEXT,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

/* ================= ADMINS ================= */
const admins = JSON.parse(fs.readFileSync("admin.json")).admins;

/* ================= AI ================= */
let openai = null;
if (OPENAI_KEY) {
  openai = new OpenAI({ apiKey: OPENAI_KEY });
  console.log("🧠 AI enabled");
} else {
  console.log("⚠️ AI disabled (no key)");
}

/* ================= STATE ================= */
const awaitingOrder = new Set();

/* ================= MENU ================= */
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

/* ================= START ================= */
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "👋 Welcome to Brian Tech\n\nChoose an option below 👇",
    menu
  );
});

/* ================= CALLBACKS ================= */
bot.on("callback_query", (q) => {
  const chatId = q.message.chat.id;

  if (q.data === "order") {
    awaitingOrder.add(chatId);
    bot.sendMessage(chatId, "🛒 Please type your order:");
  }

  if (q.data === "ai") {
    if (!openai) {
      bot.sendMessage(chatId, "⚠️ AI is not enabled.");
    } else {
      bot.sendMessage(chatId, "🤖 Ask your question:");
    }
    awaitingOrder.delete(chatId);
  }

  bot.answerCallbackQuery(q.id);
});

/* ================= MESSAGE HANDLER ================= */
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;

  if (!msg.text) return;
  if (msg.text.startsWith("/")) return;

  /* ===== ORDER FLOW ===== */
  if (awaitingOrder.has(chatId)) {
    awaitingOrder.delete(chatId);

    db.run(
      "INSERT INTO orders (user_id, username, message) VALUES (?, ?, ?)",
      [msg.from.id, msg.from.username || "unknown", msg.text],
      function () {
        const orderId = this.lastID;

        // User confirmation
        bot.sendMessage(
          chatId,
          "✅ Order received! We’ll contact you shortly."
        );

        // Admin notifications (NO parse_mode – SAFE)
        admins.forEach((adminId) => {
          bot.sendMessage(
            adminId,
            "📦 NEW ORDER RECEIVED\n\n" +
            `Order ID: ${orderId}\n` +
            `User: @${msg.from.username || "unknown"}\n\n` +
            "Message:\n" +
            msg.text
          ).catch(err => {
            console.error("❌ Failed to DM admin:", adminId, err.message);
          });
        });
      }
    );
    return;
  }

  /* ===== AI FLOW ===== */
  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are Brian Tech support assistant." },
          { role: "user", content: msg.text }
        ]
      });

      bot.sendMessage(chatId, response.choices[0].message.content);
    } catch {
      bot.sendMessage(chatId, "❌ AI error. Try again later.");
    }
  }
});

/* ================= ADMIN VIEW ================= */
bot.onText(/\/orders/, (msg) => {
  if (!admins.includes(msg.from.id)) {
    return bot.sendMessage(msg.chat.id, "❌ Access denied");
  }

  db.all("SELECT * FROM orders ORDER BY id DESC LIMIT 5", (_, rows) => {
    if (!rows.length) {
      return bot.sendMessage(msg.chat.id, "📭 No orders yet.");
    }

    let text = "📦 LATEST ORDERS\n\n";
    rows.forEach(o => {
      text += `#${o.id} @${o.username}\n${o.message}\n\n`;
    });

    bot.sendMessage(msg.chat.id, text);
  });
});

console.log("✅ Brian Tech system running");
