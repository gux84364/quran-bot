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
const sharp = require('sharp');  // مكتبة sharp لتحرير الصور

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const TOKEN = process.env.TOKEN;  // سيقرأ التوكن من Environment Variables
const CHANNEL_ID = "1473787601520693331";  // ايدي القناة

let currentPage = 1;  // بداية من الصفحة 1

async function sendPage() {
  try {
    const channel = await client.channels.fetch(CHANNEL_ID);

    const url = `https://quran.ksu.edu.sa/png_big/${currentPage}.png`;
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'arraybuffer'
    });

    const modifiedImage = await sharp(response.data)
      .flatten({ background: { r: 255, g: 255, b: 255 } })  // الخلفية بيضاء
      .resize(600, 800)  // تغيير الحجم إذا أردت
      .toBuffer();

    const attachment = new AttachmentBuilder(modifiedImage, {
      name: `page-${currentPage}.png`
    });

    await channel.send({
      content: `📖 صفحة ${currentPage}`,
      files: [attachment]
    });

    currentPage++;
    if (currentPage > 604) currentPage = 1;  // العودة للصفحة 1 بعد الصفحة 604
  } catch (error) {
    console.error(error);
  }
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);

  // 🔹 الآن يرسل كل 5 دقائق
  setInterval(async () => {
    await sendPage();
  }, 5 * 60 * 1000);  // 5 دقائق = 300,000 ملي ثانية
});

client.login(TOKEN);
