// Load .env (required for Pterodactyl eggs without env UI)
require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");

// =====================
// CONFIG
// =====================
const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error("❌ BOT_TOKEN is missing. Check your .env file.");
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log("✅ Brian Tech Bot is running");

// =====================
// DATA (static – no backend)
// =====================
const WEBSITE_URL = "https://www.briantechspace.co.ke";
const WHATSAPP = "254768116434";

const CATEGORIES = [
  "WhatsApp",
  "Pterodactyl",
  "Safaricom",
  "Telegram",
  "Developers",
  "Web Design & Development",
  "Installation & Tutorial",
  "Web Hosting Tutorials",
  "Hosting Tools",
  "Cyber Services",
  "Classes"
];

const PRODUCTS = [
  { name: "WhatsApp Bot Hosting", category: "WhatsApp", price: "KES 50" },
  { name: "WhatsApp Unban Tool", category: "WhatsApp", price: "KES 100" },
  { name: "Pterodactyl Panel Installation", category: "Pterodactyl", price: "KES 800" },
  { name: "Admin Panel Access", category: "Pterodactyl", price: "KES 400" },
  { name: "Telegram Premium APK", category: "Telegram", price: "KES 200" },
  { name: "Bug Bot Scripts", category: "Developers", price: "KES 300" },
  { name: "Web Development", category: "Web Design & Development", price: "KES 10,000 – 30,000" },
  { name: "Ubuntu Installation", category: "Installation & Tutorial", price: "KES 1,000" },
  { name: "KRA PIN Registration", category: "Cyber Services", price: "KES 100" },
  { name: "HELB Loan Application", category: "Cyber Services", price: "KES 300" },
  { name: "Computer Essentials Class", category: "Classes", price: "KES 200" }
];

// =====================
// MENUS
// =====================
const mainMenu = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "🛒 Products & Services", callback_data: "products" }],
      [{ text: "📂 Categories", callback_data: "categories" }],
      [{ text: "💳 Payment Methods", callback_data: "payment" }],
      [{ text: "🆘 Support", callback_data: "support" }],
      [{ text: "🌐 Open Website", url: WEBSITE_URL }]
    ]
  }
};

// =====================
// COMMANDS
// =====================
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `👋 *Welcome to Brian Tech Bot*

Your digital gateway to:
• Tech Services
• Automation
• Hosting
• Cyber Services
• Training

Choose an option below 👇`,
    { parse_mode: "Markdown", ...mainMenu }
  );
});

bot.onText(/\/products/, (msg) => showProducts(msg.chat.id));
bot.onText(/\/categories/, (msg) => showCategories(msg.chat.id));
bot.onText(/\/payment/, (msg) => showPayments(msg.chat.id));
bot.onText(/\/support/, (msg) => showSupport(msg.chat.id));
bot.onText(/\/website/, (msg) =>
  bot.sendMessage(msg.chat.id, `🌐 ${WEBSITE_URL}`)
);

// =====================
// CALLBACK HANDLER
// =====================
bot.on("callback_query", (q) => {
  const chatId = q.message.chat.id;

  switch (q.data) {
    case "products":
      showProducts(chatId);
      break;
    case "categories":
      showCategories(chatId);
      break;
    case "payment":
      showPayments(chatId);
      break;
    case "support":
      showSupport(chatId);
      break;
  }

  bot.answerCallbackQuery(q.id);
});

// =====================
// FUNCTIONS
// =====================
function showProducts(chatId) {
  let text = "🛒 *Products & Services*\n\n";

  PRODUCTS.forEach((p, i) => {
    text += `${i + 1}. *${p.name}*\n   📂 ${p.category}\n   💰 ${p.price}\n\n`;
  });

  bot.sendMessage(chatId, text, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "📲 Order via WhatsApp",
            url: `https://wa.me/${WHATSAPP}`
          }
        ],
        [{ text: "🔙 Back to Menu", callback_data: "back" }]
      ]
    }
  });
}

function showCategories(chatId) {
  let text = "📂 *Categories*\n\n";
  CATEGORIES.forEach((c) => (text += `• ${c}\n`));

  bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
}

function showPayments(chatId) {
  bot.sendMessage(
    chatId,
    `💳 *Payment Methods*

• M-Pesa Till: *6955715*
• Paybill: *625625*
  Account: *20177486*
• MiniPay
• PayPal
• Eversend
• Mukuru
• Credit / Debit Cards`,
    { parse_mode: "Markdown" }
  );
}

function showSupport(chatId) {
  bot.sendMessage(
    chatId,
    `🆘 *Brian Tech Support*

For orders or inquiries:
📲 https://wa.me/${WHATSAPP}

We are available and ready to help.`,
    { parse_mode: "Markdown" }
  );
}
