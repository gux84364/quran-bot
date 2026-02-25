const express = require("express");
const app = express();
const { Client, GatewayIntentBits, AttachmentBuilder, Routes } = require('discord.js');
const { REST } = require('@discordjs/rest');
const axios = require('axios');
const sharp = require('sharp');

app.get("/", (req, res) => {
  res.send("Bot is running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// ======================
// إعدادات البوت
// ======================
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

const TOKEN = process.env.TOKEN;      // توكن البوت
const CLIENT_ID = "1473785704105509104"; // ID البوت
const GUILD_ID = "1315040495453339718";  // ID السيرفر

const CHANNELS = [
  "1473787601520693331",
  "1475990635763990578"
];

let currentPage = 276; // يبدأ من الصفحة 276 تلقائيًا
let pageInterval = null; // لحفظ setInterval

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

// ======================
// تسجيل أوامر البوت بالعربي
// ======================
const commands = [
  {
    name: 'ابدأ_الصفحات',
    description: 'يبدأ إرسال صفحات المصحف من الصفحة 1 تلقائيًا'
  },
  {
    name: 'أوقف_الصفحات',
    description: 'يوقف إرسال صفحات المصحف مؤقتًا'
  }
];

const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
  try {
    console.log('🔹 تسجيل أوامر البوت...');
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log('✅ تم تسجيل الأوامر!');
  } catch (error) {
    console.error(error);
  }
})();

// ======================
// التعامل مع أوامر البوت
// ======================
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === 'ابدأ_الصفحات') {
    currentPage = 1;
    if (pageInterval) clearInterval(pageInterval);
    pageInterval = setInterval(sendPage, 2 * 60 * 1000); // كل 2 دقيقة
    await interaction.reply("✅ بدأ إرسال صفحات المصحف من الصفحة 1!");
  }

  if (interaction.commandName === 'أوقف_الصفحات') {
    if (pageInterval) {
      clearInterval(pageInterval);
      pageInterval = null;
      await interaction.reply("⏹️ تم إيقاف إرسال صفحات المصحف مؤقتًا!");
    } else {
      await interaction.reply("⚠️ لم يكن هناك إرسال صفحات شغال.");
    }
  }
});

// ======================
// بدء التشغيل التلقائي
// ======================
client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  for (const id of CHANNELS) {
    const channel = await client.channels.fetch(id);
    await channel.send("✅ البوت جاهز للتحكم في صفحات المصحف!");
  }

  // يبدأ تلقائيًا من الصفحة 276
  pageInterval = setInterval(sendPage, 2 * 60 * 1000); // كل 2 دقيقة
});

client.login(TOKEN);
