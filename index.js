const { Client, GatewayIntentBits, AttachmentBuilder } = require("discord.js");
const express = require("express");
const axios = require("axios");
const sharp = require("sharp");

// ======================
// سيرفر Express (مهم لـ Render)
// ======================
const app = express();
app.get("/", (req, res) => res.send("Bot is running"));
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// ======================
// إعدادات البوت
// ======================
const TOKEN = process.env.TOKEN;

// ✅ فحص التوكن بشكل واضح
if (!TOKEN || TOKEN.length < 50) {
  console.error("❌ التوكن غير موجود أو قصير جدًا! تحقق من Environment Variables");
  process.exit(1);
} else {
  console.log("✅ التوكن موجود وطوله:", TOKEN.length);
}

let currentPage = 1;
let pageInterval = null;

// ======================
// تعريف البوت
// ======================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
});

// ======================
// القنوات
// ======================
const CHANNELS = [
  "1475990635763990578"
];

// ======================
// دالة إرسال صفحة
// ======================
async function sendPage() {
  try {
    console.log(`📤 محاولة إرسال الصفحة ${currentPage}`);

    const url = `https://quran.ksu.edu.sa/png_big/${currentPage}.png`;

    const response = await axios({
      url,
      method: "GET",
      responseType: "arraybuffer",
      timeout: 20000
    });

    const imageBuffer = await sharp(response.data)
      .flatten({ background: "#ffffff" })
      .png({ quality: 100 })
      .toBuffer();

    const attachment = new AttachmentBuilder(imageBuffer, {
      name: `page-${currentPage}.png`
    });

    for (const channelId of CHANNELS) {
      const channel = await client.channels.fetch(channelId).catch(() => null);

      if (!channel || !channel.isTextBased()) {
        console.log(`⚠️ ما قدر يوصل للقناة ${channelId}`);
        continue;
      }

      await channel.send({
        content: `📖 صفحة ${currentPage}`,
        files: [attachment]
      });

      console.log(`✅ تم الإرسال للقناة ${channelId}`);
    }

    currentPage++;
    if (currentPage > 604) {
      currentPage = 1;
      console.log("🔁 إعادة من الصفحة 1");
    }

  } catch (err) {
    console.error("❌ خطأ أثناء الإرسال:", err.message);
  }
}

// ======================
// تشغيل الإرسال بأمان
// ======================
function startInterval() {
  if (pageInterval) {
    clearInterval(pageInterval);
  }

  pageInterval = setInterval(() => {
    if (client.isReady()) {
      sendPage();
    }
  }, 10 * 60 * 1000);

  console.log("⏱️ Interval Started");
}

// ======================
// أحداث البوت
// ======================
client.once("ready", async () => {
  console.log(`🔥 Logged in as ${client.user.tag}`);
  await sendPage();
  startInterval();
});

client.on("error", console.error);
client.on("warn", console.warn);

process.on("unhandledRejection", error =>
  console.error("Unhandled promise rejection:", error)
);

// ======================
// تسجيل الدخول
// ======================
client.login(TOKEN)
  .then(() => console.log("✅ تم تسجيل الدخول بنجاح"))
  .catch(err => {
    console.error("❌ فشل تسجيل الدخول:", err.message);
    process.exit(1);
  });
