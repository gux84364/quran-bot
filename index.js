const express = require("express");
const { Client, GatewayIntentBits, AttachmentBuilder } = require("discord.js");
const axios = require("axios");
const sharp = require("sharp");

// ======================
// سيرفر Express (مهم لـ Render)
// ======================
const app = express();
app.get("/", (req, res) => res.send("Bot is running"));
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// ======================
// إعدادات البوت
// ======================
const TOKEN = process.env.TOKEN;
if (!TOKEN) {
  console.error("❌ TOKEN غير موجود في Environment Variables");
  process.exit(1);
}
console.log("TOKEN LENGTH:", TOKEN.length);

let currentPage = 1;
let pageInterval = null;

// ======================
// تعريف البوت
// ======================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

// ======================
// دالة إرسال صفحة للقناة المحددة
// ======================
const CHANNEL_ID = "1473787601520693331"; // القناة اللي أرسلتها

async function sendPage() {
  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    if (!channel || !channel.permissionsFor(channel.guild.members.me).has(["SendMessages", "AttachFiles"])) {
      console.warn("⚠️ لا توجد قناة صالحة للإرسال أو البوت لا يملك صلاحيات كافية");
      return;
    }

    const url = `https://quran.ksu.edu.sa/png_big/${currentPage}.png`;
    const response = await axios({ url, method: "GET", responseType: "arraybuffer", timeout: 15000 });
    const modifiedImage = await sharp(response.data).png().toBuffer();
    const attachment = new AttachmentBuilder(modifiedImage, { name: `page-${currentPage}.png` });

    await channel.send({ content: `📖 صفحة ${currentPage}`, files: [attachment] });
    console.log(`✅ تم إرسال الصفحة ${currentPage} إلى القناة المحددة`);

    currentPage++;
    if (currentPage > 604) {
      currentPage = 1;
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
  pageInterval = setInterval(sendPage, 10 * 60 * 1000); // كل 10 دقائق
});

// ======================
process.on("unhandledRejection", error => console.error("Unhandled promise rejection:", error));

// ======================
// تسجيل الدخول
// ======================
client.login(TOKEN)
  .then(() => console.log("✅ تم تسجيل الدخول بنجاح"))
  .catch(err => { console.error("❌ فشل تسجيل الدخول:", err); process.exit(1); });
