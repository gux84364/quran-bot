const express = require("express");
const app = express();
const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');
const axios = require('axios');
const sharp = require('sharp');

app.get("/", (req, res) => {
  res.send("Bot is running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

const TOKEN = process.env.TOKEN;

const CHANNELS = [
  "1473787601520693331",
  "1475990635763990578"
];

// يبدأ من الصفحة 276
let currentPage = 276;

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

// ============================
// الأحاديث معلقة مؤقتًا
// ============================
// const fs = require("fs");
// function getRandomHadith() { ... }
// async function sendHadith() { ... }
// ============================

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  for (const id of CHANNELS) {
    const channel = await client.channels.fetch(id);
    await channel.send("✅ البوت بدأ يعمل بنجاح في هذه القناة!");
  }

  // الإرسال كل 2 دقيقة لصفحات المصحف
  setInterval(async () => {
    await sendPage();
  }, 2 * 60 * 1000);

  // الإرسال كل 5 دقائق للاحاديث → معلقة مؤقتًا
  // setInterval(async () => {
  //   await sendHadith();
  // }, 5 * 60 * 1000);
});

client.login(TOKEN);
