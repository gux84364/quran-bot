const express = require("express");
const app = express();
const { Client, GatewayIntentBits, AttachmentBuilder } = require("discord.js");
const axios = require("axios");
const sharp = require("sharp");

// ======================
// سيرفر Express (مهم لـ Render)
// ======================
app.get("/", (req, res) => res.send("Bot is running"));
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// ======================
// إعدادات البوت
// ======================
const TOKEN = process.env.TOKEN;

console.log("TOKEN LENGTH:", TOKEN ? TOKEN.length : "undefined"); // الآن بعد التعريف

if (!TOKEN) {
  console.error("❌ TOKEN غير موجود في Environment Variables");
  process.exit(1);
}

// القنوات التي سيرسل لها البوت
const CHANNELS = [
  "1473787601520693331",
  "1475990635763990578"
];

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
  ]
});

// ======================
// دالة إرسال صفحة
// ======================
async function sendPage() {
  try {
    for (const channelId of CHANNELS) {

      const channel = await client.channels.fetch(channelId);
      if (!channel) continue;

      const url = `https://quran.ksu.edu.sa/png_big/${currentPage}.png`;

      const response = await axios({
        url,
        method: "GET",
        responseType: "arraybuffer",
        timeout: 15000
      });

      const modifiedImage = await sharp(response.data)
        .png()
        .toBuffer();

      const attachment = new AttachmentBuilder(modifiedImage, {
        name: `page-${currentPage}.png`
      });

      await channel.send({
        content: `📖 صفحة ${currentPage}`,
        files: [attachment]
      });

      console.log(`✅ تم إرسال الصفحة ${currentPage} إلى ${channelId}`);
    }

    currentPage++;
    if (currentPage > 604) {
      currentPage = 1; // يرجع للبداية بدل ما يوقف
      console.log("🔁 إعادة من الصفحة 1");
    }

  } catch (err) {
    console.error("❌ خطأ أثناء الإرسال:", err);
  }
}

// ======================
// جاهزية البوت
// ======================
client.once("ready", async () => {
  console.log(`🔥 Logged in as ${client.user.tag}`);

  await sendPage();
  pageInterval = setInterval(sendPage, 10 * 60 * 1000);
});

// ======================
process.on("unhandledRejection", error => {
  console.error("Unhandled promise rejection:", error);
});

// ======================
// تسجيل الدخول
// ======================
client.login(TOKEN)
  .then(() => console.log("✅ تم تسجيل الدخول بنجاح"))
  .catch(err => {
    console.error("❌ فشل تسجيل الدخول:", err);
    process.exit(1);
  });
