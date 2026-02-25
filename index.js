const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Bot is running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');
const axios = require('axios');
const sharp = require('sharp');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

const TOKEN = process.env.TOKEN;

const CHANNELS = [
  "1473787601520693331",
  "1475990635763990578"
];

// ⭐ يبدأ من صفحة 258
let currentPage = 258;

async function sendPage() {
  try {
    for (const id of CHANNELS) {
      const channel = await client.channels.fetch(id);

      const url = `https://quran.ksu.edu.sa/png_big/${currentPage}.png`;

      const response = await axios({
        url,
        method: 'GET',
        responseType: 'arraybuffer'
      });

      // الصفحة نفسها تبقى بيضاء للنصوص بدون أي إطار
      const modifiedImage = await sharp(response.data)
        .ensureAlpha()
        .flatten({ background: "#ffffff" }) // خلفية بيضاء
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

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  for (const id of CHANNELS) {
    const channel = await client.channels.fetch(id);
    await channel.send("✅ البوت بدأ يعمل بنجاح في هذه القناة!");
  }

  // الإرسال كل 3 دقائق
  setInterval(async () => {
    await sendPage();
  }, 3 * 60 * 1000);
});

client.login(TOKEN);
