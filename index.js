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
  },
  {
    name: 'ابدأ_من',
    description: 'يبدأ إرسال الصفحات من رقم محدد',
    options: [
      {
        name: 'رقم_الصفحة',
        type: 4, // نوع الرقم Integer
        description: 'أدخل رقم الصفحة التي تريد البدء منها',
        required: true
      }
    ]
  }
];

// ======================
// التعامل مع أوامر البوت
// ======================
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

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
