const express = require("express");
const app = express();
const fs = require("fs");
const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');
const axios = require('axios');
const sharp = require('sharp');

// صفحة البداية للبوت
app.get("/", (req, res) => {
  res.send("Bot is running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// إعدادات البوت
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

const TOKEN = process.env.TOKEN;

// القنوات اللي يرسل فيها البوت
const CHANNELS = [
  "1473787601520693331",
  "1475990635763990578"
];

// يبدأ من الصفحة 266
let currentPage = 266;

// دالة إرسال صفحة المصحف
async function sendPage() {
  try {
    for (const id of CHANNELS) {
      const channel = await client.channels.fetch(id);

      const url = `https://quran.ksu.edu.sa/png_big/${currentPage}.png`;
      const response = await axios({ url, method: 'GET', responseType: 'arraybuffer' });

      const modifiedImage = await sharp(response.data)
        .ensureAlpha()
        .flatten({ background: "#ffffff" })
        .toColourspace('srgb')
        .png({ quality: 100, compressionLevel: 0 })
        .toBuffer();

      const attachment = new AttachmentBuilder(modifiedImage, {
        name: `page-${currentPage}.png`
      });

      await channel.send({
        content: `📖 صفحة ${currentPage}`,
        files: [attachment]
      });
    }

    currentPage++;
    if (currentPage > 604) currentPage = 1;

  } catch (error) {
    console.error(error);
  }
}

// قراءة الأحاديث من الملف hadiths.json
function getRandomHadith() {
  const hadiths = JSON.parse(fs.readFileSync('hadiths.json', 'utf8'));
  return hadiths[Math.floor(Math.random() * hadiths.length)];
}

// دالة إرسال حديث عشوائي
async function sendHadith() {
  try {
    for (const id of CHANNELS) {
      const channel = await client.channels.fetch(id);
      await channel.send(`📜 حديث نبوي:\n${getRandomHadith()}`);
    }
  } catch (error) {
    console.error(error);
  }
}

// عند تشغيل البوت
client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // رسالة البداية في كل قناة
  for (const id of CHANNELS) {
    const channel = await client.channels.fetch(id);
    await channel.send("✅ البوت بدأ يعمل بنجاح في هذه القناة!");
  }

  // إرسال حديث فور التشغيل
  await sendHadith();

  // الإرسال كل 2 دقيقة لصفحات المصحف
  setInterval(async () => {
    await sendPage();
  }, 2 * 60 * 1000);

  // الإرسال كل 5 دقائق للاحاديث
  setInterval(async () => {
    await sendHadith();
  }, 5 * 60 * 1000);
});

// تسجيل الدخول
client.login(TOKEN);
