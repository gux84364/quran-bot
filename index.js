const express = require("express");
const app = express();
const { Client, GatewayIntentBits, AttachmentBuilder, Routes } = require('discord.js');
const { REST } = require('@discordjs/rest');
const axios = require('axios');
const sharp = require('sharp');

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
const CLIENT_ID = process.env.CLIENT_ID;

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
  intents: [GatewayIntentBits.Guilds]
});

// ======================
// دالة إرسال صفحة
// ======================
async function sendPage() {
  try {
    for (const id of CHANNELS) {
      const channel = await client.channels.fetch(id);
      if (!channel) continue;

      const url = `https://quran.ksu.edu.sa/png_big/${currentPage}.png`;
      const response = await axios({
        url,
        method: 'GET',
        responseType: 'arraybuffer'
      });

      const modifiedImage = await sharp(response.data)
        .ensureAlpha()
        .flatten({ background: "#ffffff" })
        .png()
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
    console.error("خطأ أثناء الإرسال:", error);
  }
}

// ======================
// أوامر البوت
// ======================
const commands = [
  { name: 'ابدأ_الصفحات', description: 'يبدأ إرسال الصفحات من الصفحة 1' },
  { name: 'أوقف_الصفحات', description: 'يوقف إرسال الصفحات' },
  {
    name: 'ابدأ_من',
    description: 'يبدأ من صفحة محددة',
    options: [
      {
        name: 'رقم_الصفحة',
        type: 4,
        description: 'رقم الصفحة من 1 إلى 604',
        required: true
      }
    ]
  }
];

// ======================
// تسجيل الأوامر
// ======================
const rest = new REST({ version: '10' }).setToken(TOKEN);
const guildIds = ["1315040495453339718", "1316505661701492816"];

async function registerCommands() {
  for (const guildId of guildIds) {
    try {
      await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, guildId),
        { body: commands }
      );
      console.log(`✅ تم تسجيل الأوامر في السيرفر: ${guildId}`);
    } catch (err) {
      console.error(err);
    }
  }
}

// ======================
// عند جاهزية البوت
// ======================
client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  for (const id of CHANNELS) {
    const channel = await client.channels.fetch(id);
    if (channel) {
      await channel.send("✅ البوت جاهز للتحكم في صفحات المصحف!");
    }
  }

  await registerCommands();
});

// ======================
// التعامل مع الأوامر
// ======================
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // ===== بدء من 1 =====
  if (interaction.commandName === 'ابدأ_الصفحات') {

    if (pageInterval)
      return interaction.reply("⚠️ الإرسال شغال بالفعل.");

    currentPage = 1;

    await sendPage(); // يرسل فورًا
    pageInterval = setInterval(sendPage, 2 * 60 * 1000);

    await interaction.reply("✅ بدأ الإرسال من الصفحة 1.");
  }

  // ===== إيقاف =====
  if (interaction.commandName === 'أوقف_الصفحات') {

    if (!pageInterval)
      return interaction.reply("⚠️ لا يوجد إرسال شغال.");

    clearInterval(pageInterval);
    pageInterval = null;

    await interaction.reply("⏹️ تم إيقاف الإرسال.");
  }

  // ===== بدء من رقم معين =====
  if (interaction.commandName === 'ابدأ_من') {

    if (pageInterval)
      return interaction.reply("⚠️ أوقف الإرسال الحالي أولاً.");

    const pageNum = interaction.options.getInteger('رقم_الصفحة');

    if (pageNum < 1 || pageNum > 604)
      return interaction.reply("⚠️ الصفحات من 1 إلى 604 فقط.");

    currentPage = pageNum;

    await sendPage(); // يرسل فورًا
    pageInterval = setInterval(sendPage, 2 * 60 * 1000);

    await interaction.reply(`✅ بدأ الإرسال من الصفحة ${pageNum}.`);
  }
});

// ======================
client.login(TOKEN);
