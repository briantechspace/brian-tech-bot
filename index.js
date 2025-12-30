const TelegramBot = require("node-telegram-bot-api");
const data = require("./data");

// 🔐 TOKEN FROM ENV (Pterodactyl / GitHub-safe)
const TOKEN = process.env.BOT_TOKEN || "";

if (!TOKEN) {
  console.error("❌ BOT_TOKEN is missing");
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });

console.log("✅ Brian Tech Bot is running");

// ===== MENUS =====
const mainMenu = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "🛒 Products & Services", callback_data: "products" }],
      [{ text: "📂 Categories", callback_data: "categories" }],
      [{ text: "💳 Payment Methods", callback_data: "payment" }],
      [{ text: "🆘 Support", callback_data: "support" }],
      [{ text: "🌐 Open Website", url: data.website }]
    ]
  }
};

// ===== COMMANDS =====
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `👋 *Welcome to Brian Tech Bot*

Your digital gateway to:
• Tech Services
• Automation
• Hosting
• Cyber Services
• Training`,
    { parse_mode: "Markdown", ...mainMenu }
  );
});

bot.onText(/\/products/, (msg) => showProducts(msg.chat.id));
bot.onText(/\/categories/, (msg) => showCategories(msg.chat.id));
bot.onText(/\/payment/, (msg) =>
  bot.sendMessage(msg.chat.id, data.paymentMethods, { parse_mode: "Markdown" })
);
bot.onText(/\/support/, (msg) => support(msg.chat.id));
bot.onText(/\/website/, (msg) =>
  bot.sendMessage(msg.chat.id, `🌐 ${data.website}`)
);

// ===== CALLBACK HANDLER =====
bot.on("callback_query", (q) => {
  const chatId = q.message.chat.id;

  if (q.data === "products") showProducts(chatId);
  if (q.data === "categories") showCategories(chatId);
  if (q.data === "payment")
    bot.sendMessage(chatId, data.paymentMethods, { parse_mode: "Markdown" });
  if (q.data === "support") support(chatId);

  bot.answerCallbackQuery(q.id);
});

// ===== FUNCTIONS =====
function showProducts(chatId) {
  let text = "🛒 *Products & Services*\n\n";
  data.products.forEach((p, i) => {
    text += `${i + 1}. *${p.name}*\n   ${p.category} — ${p.price}\n\n`;
  });

  bot.sendMessage(chatId, text, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "📲 Order via WhatsApp",
            url: `https://wa.me/${data.whatsapp}`
          }
        ],
        [{ text: "🔙 Back", callback_data: "back" }]
      ]
    }
  });
}

function showCategories(chatId) {
  let text = "📂 *Categories*\n\n";
  data.categories.forEach((c) => (text += `• ${c}\n`));

  bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
}

function support(chatId) {
  bot.sendMessage(
    chatId,
    `🆘 *Brian Tech Support*

For orders or inquiries, contact us on WhatsApp:
📲 https://wa.me/${data.whatsapp}

We’re online and ready to help.`,
    { parse_mode: "Markdown" }
  );
}
