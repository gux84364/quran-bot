const express = require("express");
const app = express();
const { Client, GatewayIntentBits, AttachmentBuilder } = require("discord.js");
const axios = require("axios");
const sharp = require("sharp");

// ======================
// سيرفر Express
// ======================
app.get("/", (req, res) => res.send("Bot is running"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// ======================
// إعدادات البوت
// ======================
const TOKEN = process.env.TOKEN;

// القنوات التي سيرسل لها البوت
const CHANNELS = [
  "1473787601520693331",
  "1475990635763990578"
];

let currentPage = 1; // يبدأ من الصفحة 1
let pageInterval = null;

// ======================
// تعريف البوت
// ======================
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

// ======================
// دالة إرسال صفحة
// ======================
async function sendPage() {
  for (const channelId of CHANNELS) {
    try {
      const channel = await client.channels.fetch(channelId).catch(() => null);
      if (!channel) continue;

      const url = `https://quran.ksu.edu.sa/png_big/${currentPage}.png`;
      const response = await axios({ url, method: "GET", responseType: "arraybuffer" });

      const modifiedImage = await sharp(response.data)
        .ensureAlpha()
        .flatten({ background: "#ffffff" })
        .png()
        .toBuffer();

      const attachment = new AttachmentBuilder(modifiedImage, { name: `page-${currentPage}.png` });

      await channel.send({ content: `📖 صفحة ${currentPage}`, files: [attachment] });

    } catch (err) {
      console.error("خطأ إرسال الصفحة:", err);
    }
  }

  currentPage++;
  if (currentPage > 604) {
    clearInterval(pageInterval); // إذا وصل آخر صفحة يوقف البوت عن الإرسال
    console.log("✅ تم إرسال كل صفحات القرآن.");
  }
}

// ======================
// جاهزية البوت
// ======================
client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // يبدأ الإرسال مباشرة من الصفحة 1
  await sendPage();

  // ثم يستمر كل 10 دقائق
  pageInterval = setInterval(sendPage, 10 * 60 * 1000);
});

// ======================
process.on("unhandledRejection", error => {
  console.error("Unhandled promise rejection:", error);
});

client.login(TOKEN);
