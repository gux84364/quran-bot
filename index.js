const express = require("express");
const app = express();
const { Client, GatewayIntentBits, AttachmentBuilder, Routes } = require('discord.js');
const { REST } = require('@discordjs/rest');
const axios = require('axios');
const sharp = require('sharp');

// ======================
// سيرفر Express لتأكيد تشغيل البوت
// ======================
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
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const CHANNELS = [
  "1473787601520693331",
  "1475990635763990578"
];

let currentPage = 276; // يبدأ تلقائيًا من الصفحة 276
let pageInterval = null; // لحفظ setInterval

// ======================
// تعريف البوت
// ======================
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

// ======================
// دالة إرسال صفحة المصحف
// ======================
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
// أوامر البوت بالعربي
// ======================
const commands = [
  {
    name: 'ابدأ_الصفحات',
    description: 'يبدأ إرسال صفحات المصحف من الصفحة 1 تلقائيًا'
  },
  {
    name: 'أوقف_الصفحات',
    description: 'يوقف إرسال صفحات المصحف مؤقتًا'
  },
  {
    name: 'ابدأ_من',
    description: 'يبدأ إرسال الصفحات من رقم محدد',
    options: [
      {
        name: 'رقم_الصفحة',
        type: 4, // Integer
        description: 'أدخل رقم الصفحة التي تريد البدء منها',
        required: true
      }
    ]
  }
];

// ======================
// تسجيل الأوامر عند التشغيل وأي سيرفر جديد
// ======================
const rest = new REST({ version: '10' }).setToken(TOKEN);

async function registerCommands(guildId) {
  try {
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, guildId),
      { body: commands }
    );
    console.log(`✅ تم تسجيل الأوامر في السيرفر: ${guildId}`);
  } catch (err) {
    console.error(`❌ خطأ تسجيل أوامر في السيرفر: ${guildId}`, err);
  }
}

// ======================
// عند جاهزية البوت
// ======================
client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // إرسال رسالة جاهزية لكل قناة
  for (const id of CHANNELS) {
    const channel = await client.channels.fetch(id);
    await channel.send("✅ البوت جاهز للتحكم في صفحات المصحف!");
  }

  // يبدأ تلقائيًا من الصفحة 276
  pageInterval = setInterval(sendPage, 2 * 60 * 1000);

  // تسجيل الأوامر لكل سيرفر موجود في الكاش
  const guilds = client.guilds.cache.map(g => g.id);
  for (const guildId of guilds) {
    await registerCommands(guildId);
  }
});

// ======================
// تسجيل أوامر للسيرفر الجديد عند الانضمام
// ======================
client.on('guildCreate', async guild => {
  await registerCommands(guild.id);
});

// ======================
// التعامل مع أوامر البوت
// ======================
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  // كل سيرفر مستقل
  if (interaction.commandName === 'ابدأ_الصفحات') {
    currentPage = 1;
    if (pageInterval) clearInterval(pageInterval);
    pageInterval = setInterval(sendPage, 2 * 60 * 1000);
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

  if (interaction.commandName === 'ابدأ_من') {
    const pageNum = interaction.options.getInteger('رقم_الصفحة');
    if (pageNum < 1 || pageNum > 604) {
      return interaction.reply("⚠️ رقم الصفحة غير صالح. الصفحات من 1 إلى 604.");
    }
    currentPage = pageNum;
    if (pageInterval) clearInterval(pageInterval);
    pageInterval = setInterval(sendPage, 2 * 60 * 1000);
    await interaction.reply(`✅ بدأ إرسال صفحات المصحف من الصفحة ${pageNum}!`);
  }
});

// ======================
// تسجيل دخول البوت
// ======================
client.login(TOKEN);
