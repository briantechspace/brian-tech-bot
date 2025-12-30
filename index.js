import TelegramBot from "node-telegram-bot-api";
import express from "express";
import session from "express-session";
import dotenv from "dotenv";
import fs from "fs";
import sqlite3 from "sqlite3";
import crypto from "crypto";

dotenv.config();

/* ========== ENV ========== */
const BOT_TOKEN = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 3000;

if (!BOT_TOKEN) {
  console.error("BOT_TOKEN missing");
  process.exit(1);
}

/* ========== LOAD ADMINS ========== */
const admins = JSON.parse(fs.readFileSync("admin.json")).admins;

/* ========== EXPRESS ========== */
const app = express();
app.use(express.static("."));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: crypto.randomBytes(32).toString("hex"),
    resave: false,
    saveUninitialized: false
  })
);

/* ========== DATABASE ========== */
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

/* ========== BOT ========== */
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

const awaitingOrder = new Set();

/* ========== BOT UI ========== */
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "👋 Welcome to Brian Tech\n\nClick below to order.",
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🛒 Order Service", callback_data: "order" }]
        ]
      }
    }
  );
});

bot.on("callback_query", (q) => {
  if (q.data === "order") {
    awaitingOrder.add(q.message.chat.id);
    bot.sendMessage(q.message.chat.id, "Type your order:");
  }
});

bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  if (!msg.text || msg.text.startsWith("/")) return;

  if (awaitingOrder.has(chatId)) {
    awaitingOrder.delete(chatId);

    db.run(
      "INSERT INTO orders (user_id, username, message) VALUES (?, ?, ?)",
      [msg.from.id, msg.from.username || "unknown", msg.text],
      function () {
        const orderId = this.lastID;

        bot.sendMessage(chatId, "✅ Order received!");

        admins.forEach((adminId) => {
          bot.sendMessage(
            adminId,
            `📦 NEW ORDER\n\nID: ${orderId}\nUser: @${msg.from.username || "unknown"}\n\n${msg.text}`
          );
        });
      }
    );
  }
});

/* ========== TELEGRAM LOGIN VERIFY ========== */
function verifyTelegramLogin(data) {
  const secret = crypto
    .createHash("sha256")
    .update(BOT_TOKEN)
    .digest();

  const checkString = Object.keys(data)
    .filter(k => k !== "hash")
    .sort()
    .map(k => `${k}=${data[k]}`)
    .join("\n");

  const hmac = crypto
    .createHmac("sha256", secret)
    .update(checkString)
    .digest("hex");

  return hmac === data.hash;
}

/* ========== ADMIN ROUTES ========== */
app.get("/admin", (req, res) => {
  if (req.session.admin) {
    return res.sendFile(process.cwd() + "/admin/dashboard.html");
  }
  res.sendFile(process.cwd() + "/admin/login.html");
});

app.get("/admin/auth", (req, res) => {
  if (!verifyTelegramLogin(req.query)) {
    return res.status(403).send("Invalid login");
  }

  const telegramId = Number(req.query.id);
  if (!admins.includes(telegramId)) {
    return res.status(403).send("Not an admin");
  }

  req.session.admin = telegramId;
  res.redirect("/admin");
});

app.get("/admin/orders", (req, res) => {
  if (!req.session.admin) {
    return res.status(401).json([]);
  }

  db.all("SELECT * FROM orders ORDER BY id DESC", (_, rows) => {
    res.json(rows);
  });
});

app.get("/admin/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin");
  });
});

/* ========== START SERVER ========== */
app.listen(PORT, () => {
  console.log(`🌐 Server running on port ${PORT}`);
  console.log("✅ Admin dashboard enabled at /admin");
});
