const { REST, Routes } = require("@discordjs/rest");

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const rest = new REST({ version: "10" }).setToken(TOKEN);

async function deleteAllCommands() {
  try {
    // يحذف جميع الأوامر العالمية
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });
    console.log("✅ تم حذف جميع أوامر السلاش من Discord");
  } catch (err) {
    console.error("❌ خطأ حذف الأوامر:", err);
  }
}

deleteAllCommands();
