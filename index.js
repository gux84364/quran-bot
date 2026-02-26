const express = require("express");
const app = express();
const { Client, GatewayIntentBits, AttachmentBuilder, Routes } = require("discord.js");
const { REST } = require("@discordjs/rest");
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
const CLIENT_ID = process.env.CLIENT_ID;

// لكل سيرفر نخزن بياناته هنا
const guildSessions = new Map();

// ======================
// تعريف البوت
// ======================
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ======================
// دالة إرسال صفحة
// ======================
async function sendPage(guildId) {
  const session = guildSessions.get(guildId);
  if (!session) return;

  try {
    const channel = await client.channels.fetch(session.channelId);
    if (!channel) return;

    const url = `https://quran.ksu.edu.sa/png_big/${session.currentPage}.png`;

    const response = await axios({
      url,
      method: "GET",
      responseType: "arraybuffer"
    });

    const modifiedImage = await sharp(response.data)
      .ensureAlpha()
      .flatten({ background: "#ffffff" })
      .png()
      .toBuffer();

    const attachment = new AttachmentBuilder(modifiedImage, {
      name: `page-${session.currentPage}.png`
    });

    await channel.send({
      content: `📖 صفحة ${session.currentPage}`,
      files: [attachment]
    });

    session.currentPage++;
    if (session.currentPage > 604) session.currentPage = 1;

  } catch (err) {
    console.error("خطأ إرسال الصفحة:", err);
  }
}

// ======================
// أوامر البوت
// ======================
const commands = [
  { name: "ابدأ_الصفحات", description: "يبدأ إرسال الصفحات من الصفحة 1" },
  { name: "أوقف_الصفحات", description: "يوقف إرسال الصفحات" },
  {
    name: "ابدأ_من",
    description: "يبدأ من صفحة محددة",
    options: [
      {
        name: "رقم_الصفحة",
        type: 4,
        description: "رقم الصفحة من 1 إلى 604",
        required: true
      }
    ]
  }
];

const rest = new REST({ version: "10" }).setToken(TOKEN);

async function registerCommands() {
  await rest.put(
    Routes.applicationCommands(CLIENT_ID),
    { body: commands }
  );
  console.log("✅ تم تسجيل الأوامر عالميًا");
}

// ======================
// عند جاهزية البوت
// ======================
client.once("clientReady", async () => {
  console.log(`Logged in as ${client.user.tag}`);
  await registerCommands();
});

// ======================
// التعامل مع الأوامر
// ======================
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const guildId = interaction.guildId;

  // ===== بدء من 1 =====
  if (interaction.commandName === "ابدأ_الصفحات") {

    if (guildSessions.has(guildId))
      return interaction.reply("⚠️ الإرسال شغال بالفعل في هذا السيرفر.");

    guildSessions.set(guildId, {
      currentPage: 1,
      channelId: interaction.channelId,
      interval: null
    });

    await sendPage(guildId);

    const interval = setInterval(() => {
      sendPage(guildId);
    }, 2 * 60 * 1000);

    guildSessions.get(guildId).interval = interval;

    return interaction.reply("✅ بدأ الإرسال من الصفحة 1.");
  }

  // ===== إيقاف =====
  if (interaction.commandName === "أوقف_الصفحات") {

    const session = guildSessions.get(guildId);
    if (!session)
      return interaction.reply("⚠️ لا يوجد إرسال شغال في هذا السيرفر.");

    clearInterval(session.interval);
    guildSessions.delete(guildId);

    return interaction.reply("⏹️ تم إيقاف الإرسال.");
  }

  // ===== بدء من رقم معين =====
  if (interaction.commandName === "ابدأ_من") {

    if (guildSessions.has(guildId))
      return interaction.reply("⚠️ أوقف الإرسال الحالي أولاً.");

    const pageNum = interaction.options.getInteger("رقم_الصفحة");

    if (pageNum < 1 || pageNum > 604)
      return interaction.reply("⚠️ الصفحات من 1 إلى 604 فقط.");

    guildSessions.set(guildId, {
      currentPage: pageNum,
      channelId: interaction.channelId,
      interval: null
    });

    await sendPage(guildId);

    const interval = setInterval(() => {
      sendPage(guildId);
    }, 2 * 60 * 1000);

    guildSessions.get(guildId).interval = interval;

    return interaction.reply(`✅ بدأ الإرسال من الصفحة ${pageNum}.`);
  }
});

// ======================
process.on("unhandledRejection", error => {
  console.error("Unhandled promise rejection:", error);
});

client.login(TOKEN);
