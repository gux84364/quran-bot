const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');
const axios = require('axios');
const sharp = require('sharp');  // مكتبة sharp لتحرير الصور

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const TOKEN = "MTQ3Mzc4NTcwNDEwNTUwOTEwNA.GYHDdc.5VpxWTxHrX4syT00wFBAFtE78-CS8sPrVNcsgM";  // ضع توكن البوت الجديد هنا
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

  // 🔹 تعديل الوقت: كل 10 دقائق
  setInterval(async () => {
    await sendPage();
  }, 10 * 60 * 1000);  // 10 دقائق = 600,000 ملي ثانية
});


client.login(TOKEN);
