const mineflayer = require('mineflayer');
const fs = require('fs');
const chalk = require('chalk');
const Table = require('cli-table3');
const moment = require('moment');

/* ================= CONFIG ================= */
const HOST = 'asia.hylexmc.net';
const VERSION = '1.8.9';
const PASSWORD = '220879max';
const ACCOUNTS = [
  { username: 'hitune' },
  { username: 'GoonMaster12' },
  { username: 'GoonMaster13' },
  { username: 'ElvaChan' }
];

/* ================= GLOBAL STATS ================= */
const stats = {
  startTime: Date.now(),
  botsOnline: 0,
  reconnects: 0,
  totalMessages: 0
};
const botStats = {};
const liveChat = [];

/* ================= UTIL ================= */
function time() {
  return new Date().toLocaleTimeString();
}

function formatUptime(ms) {
  const d = moment.duration(ms);
  return `${d.hours()}h ${d.minutes()}m ${d.seconds()}s`;
}

function log(name, msg) {
  const line = `[${time()}] [${name}] ${msg}`;
  fs.appendFileSync('chatlog.log', line + '\n');
}

function addChatLine(text) {
  if (liveChat.length >= 15) liveChat.shift();
  liveChat.push(text);
}

/* ================= DASHBOARD ================= */
function renderDashboard() {
  console.clear();
  console.log(
    chalk.cyan.bold(
      `╔══════════════════════════════════════════════════════╗
║                    HYLEX CONTROL PANEL               ║
╚══════════════════════════════════════════════════════╝`
    )
  );

  console.log(
    chalk.green('Server: ') + HOST +
      '   ' +
    chalk.yellow('Uptime: ') + formatUptime(Date.now() - stats.startTime) +
      '   ' +
    chalk.magenta('Online: ') + stats.botsOnline +
      '   ' +
    chalk.red('Reconnects: ') + stats.reconnects +
      '   ' +
    chalk.blue('Total Msg: ') + stats.totalMessages
  );

  console.log('\n');

  const table = new Table({
    head: ['Username', 'Status', 'Messages', 'Promos', 'Kills']
  });

  for (const name in botStats) {
    const b = botStats[name];
    table.push([
      name,
      b.status,
      b.messages,
      b.promos,
      b.kills
    ]);
  }

  console.log(table.toString());
  console.log(chalk.cyan.bold('\n━━━━━━━━━━ LIVE CHAT ━━━━━━━━━━\n'));
  liveChat.forEach(line => console.log(line));
}

setInterval(renderDashboard, 1000);

/* ================= BOT SYSTEM ================= */
function startBot(account) {
  let bot;
  let loginCooldown = false;
  let hubCooldown = false;
  let promoInterval = null;
  let pwInterval = null;
  let killAuraInterval = null;
  let hubInterval = null;

  botStats[account.username] = {
    status: chalk.red('OFFLINE'),
    messages: 0,
    promos: 0,
    kills: 0
  };

  function clearAll() {
    if (promoInterval) clearInterval(promoInterval);
    if (pwInterval) clearInterval(pwInterval);
    if (killAuraInterval) clearInterval(killAuraInterval);
    if (hubInterval) clearInterval(hubInterval);
    promoInterval = null;
    pwInterval = null;
    killAuraInterval = null;
    hubInterval = null;
  }

  function create() {
    bot = mineflayer.createBot({
      host: HOST,
      username: account.username,
      version: VERSION
    });

    bot.once('spawn', () => {
      stats.botsOnline++;
      botStats[account.username].status = chalk.green('ONLINE');

      setTimeout(() => {
        bot.chat('/login ' + PASSWORD);
      }, 2000);

      setTimeout(() => tryCompass(), 3000);
      startHubWatcher();
    });

    function tryCompass() {
      try {
        bot.setQuickBarSlot(0);
        bot.activateItem();
      } catch {}
    }

    function startHubWatcher() {
      if (hubInterval) return;
      hubInterval = setInterval(() => {
        if (!bot.inventory) return;
        if (hubCooldown) return;

        const slot0 = bot.inventory.slots[36];
        if (slot0 && slot0.name === 'compass') {
          hubCooldown = true;
          tryCompass();
          setTimeout(() => hubCooldown = false, 5000);
        }
      }, 4000);
    }

    bot.on('windowOpen', async (window) => {
      if (!window || !window.slots) return;

      let grassSlot = null;
      for (const [slot, item] of Object.entries(window.slots)) {
        if (item && item.name === 'grass') {
          grassSlot = Number(slot);
        }
      }
      if (grassSlot === null) return;

      try {
        await new Promise(r => setTimeout(r, 900));
        await bot.clickWindow(grassSlot, 0, 0);
      } catch { return; }

      setTimeout(() => {
        if (account.username === 'hitune') {
          bot.chat('/home farm');
          startKillAura();
        }
        if (
          account.username === 'GoonMaster12' ||
          account.username === 'GoonMaster13' ||
          account.username === 'ElvaChan'
        ) {
          startPWLoop();
        }
      }, 2000);
    });

    function startPWLoop() {
      if (pwInterval) return;
      let command = '';
      if (account.username === 'GoonMaster12') command = '/pw afkmax';
      if (account.username === 'GoonMaster13') command = '/pw afkmax2';
      if (account.username === 'ElvaChan') command = '/pw afkmax3';
      bot.chat(command);
      pwInterval = setInterval(() => {
        bot.chat(command);
      }, 10000);
    }

    if (account.username === 'GoonMaster12') {
      promoInterval = setInterval(() => {
        if (fs.existsSync('off')) return;
        bot.chat('Guys /pw MaxXP is the first XP farm that reach 1k+ visits!!!!');
        botStats[account.username].promos++;
        stats.totalMessages++;
      }, 60000);
    }

    bot.on('chat', (user, message) => {
      stats.totalMessages++;
      botStats[account.username].messages++;

      const formatted =
        chalk.gray(`[${time()}]`) +
        ' ' +
        chalk.blue(account.username) +
        ' <' +
        chalk.green(user) +
        '> ' +
        chalk.white(message);

      addChatLine(formatted);
      log(account.username, `<${user}> ${message}`);

      if (message.toLowerCase().includes('/login') && !loginCooldown) {
        loginCooldown = true;
        bot.chat('/login ' + PASSWORD);
        setTimeout(() => loginCooldown = false, 5000);
      }
    });

    function startKillAura() {
      if (killAuraInterval) return;

      const allowed = [
        'Skeleton','Zombie','Pig','Cow','Hoglin',
        'Polar Bear','Sheep','Spider','Evoker',
        'Elder Guardian','Blaze','Mooshroom',
        'Chicken','Cave Spider','Wither Skeleton'
      ];

      bot.on('entityGone', (entity) => {
        if (account.username !== 'hitune') return;
        if (!entity || entity.type !== 'mob') return;
        if (!entity.displayName) return;
        if (!allowed.includes(entity.displayName)) return;
        if (!bot.entity) return;

        const dist = bot.entity.position.distanceTo(entity.position);
        if (dist <= 6) {
          botStats[account.username].kills++;
        }
      });

      killAuraInterval = setInterval(() => {
        if (!bot.entity) return;

        const target = bot.nearestEntity(e =>
          e &&
          e.type === 'mob' &&
          e.displayName &&
          allowed.includes(e.displayName)
        );
        if (!target) return;

        const dist = bot.entity.position.distanceTo(target.position);
        if (dist > 4) return;

        bot.lookAt(target.position.offset(0, 1.5, 0), true);
        bot.attack(target);
      }, 500);
    }

    bot.on('end', () => {
      stats.botsOnline--;
      stats.reconnects++;
      botStats[account.username].status = chalk.red('OFFLINE');
      clearAll();
      setTimeout(create, 10000);
    });

    bot.on('error', () => {});
  }

  create();
}

for (const acc of ACCOUNTS) {
  startBot(acc);
}
