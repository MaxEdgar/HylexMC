const mineflayer = require('mineflayer')
const fs = require('fs')
const chalk = require('chalk')
const Table = require('cli-table3')
const moment = require('moment')
 
/* ================= CONFIG ================= */
 
const HOST = 'asia.hylexmc.net'
const VERSION = '1.8.9'
const PASSWORD = '220879max'
 
const ACCOUNTS = [
  { username: 'hitune' }
]
 
/* ================= GLOBAL STATS ================= */
 
const stats = {
  startTime: Date.now(),
  botsOnline: 0,
  reconnects: 0,
  totalMessages: 0
}
 
const botStats = {}
const liveChat = []
 
/* ================= UTIL ================= */
 
function time() {
  return new Date().toLocaleTimeString()
}
 
function formatUptime(ms) {
  const d = moment.duration(ms)
  return `${d.hours()}h ${d.minutes()}m ${d.seconds()}s`
}
 
function log(name, msg) {
  const line = `[${time()}] [${name}] ${msg}`
  fs.appendFileSync('chatlog.log', line + '\n')
}
 
function addChatLine(text) {
  if (liveChat.length >= 15) liveChat.shift()
  liveChat.push(text)
}
 
/* ================= DASHBOARD ================= */
 
function renderDashboard() {
 
  console.clear()
 
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════╗
║                    HYLEX CONTROL PANEL               ║
╚══════════════════════════════════════════════════════╝
`))
 
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
  )
 
  console.log('\n')
 
  const table = new Table({
    head: ['Username', 'Status', 'Messages', 'Kills']
  })
 
  for (const name in botStats) {
 
    const b = botStats[name]
 
    table.push([
      name,
      b.status,
      b.messages,
      b.kills
    ])
  }
 
  console.log(table.toString())
 
  console.log(chalk.cyan.bold('\n━━━━━━━━━━ LIVE CHAT ━━━━━━━━━━\n'))
  liveChat.forEach(line => console.log(line))
}
 
setInterval(renderDashboard, 1000)
 
/* ================= BOT SYSTEM ================= */
 
function startBot(account) {
 
  let bot
  let loginCooldown = false
  let hubCooldown = false
  let killAuraInterval = null
  let hubInterval = null
 
  botStats[account.username] = {
    status: chalk.red('OFFLINE'),
    messages: 0,
    kills: 0
  }
 
  function clearAll() {
 
    if (killAuraInterval) clearInterval(killAuraInterval)
    if (hubInterval) clearInterval(hubInterval)
 
    killAuraInterval = null
    hubInterval = null
  }
 
  function create() {
 
    bot = mineflayer.createBot({
      host: HOST,
      username: account.username,
      version: VERSION
    })
 
    bot.once('spawn', () => {
 
      stats.botsOnline++
      botStats[account.username].status = chalk.green('ONLINE')
 
      setTimeout(() => {
        bot.chat('/login ' + PASSWORD)
      }, 3000)
 
      setTimeout(() => tryCompass(), 5000)
 
      startHubWatcher()
    })
 
    /* ================= HUB WATCHER ================= */
 
    function tryCompass() {
      try {
        bot.setQuickBarSlot(0)
        bot.activateItem()
      } catch {}
    }
 
    function startHubWatcher() {
 
      if (hubInterval) return
 
      hubInterval = setInterval(() => {
 
        if (!bot.inventory) return
        if (hubCooldown) return
 
        const slot0 = bot.inventory.slots[36]
 
        if (slot0 && slot0.name === 'compass') {
 
          hubCooldown = true
          tryCompass()
 
          setTimeout(() => hubCooldown = false, 5000)
        }
 
      }, 4000)
    }
 
    /* ================= SERVER SELECT ================= */
 
    bot.on('windowOpen', async (window) => {
 
      if (!window || !window.slots) return
 
      let grassSlot = null
 
      for (const [slot, item] of Object.entries(window.slots)) {
        if (item && item.name === 'grass') {
          grassSlot = Number(slot)
        }
      }
 
      if (grassSlot === null) return
 
      try {
        await new Promise(r => setTimeout(r, 1000))
        await bot.clickWindow(grassSlot, 0, 0)
      } catch {
        return
      }
 
      setTimeout(() => {
 
        if (account.username === 'hitune') {
          bot.chat('/home farm')
          startKillAura()
        }
 
      }, 3000)
    })
 
    /* ================= CHAT ================= */
 
    bot.on('chat', (user, message) => {
 
      stats.totalMessages++
      botStats[account.username].messages++
 
      const formatted =
        chalk.gray(`[${time()}]`) +
        ' ' +
        chalk.blue(account.username) +
        ' <' +
        chalk.green(user) +
        '> ' +
        chalk.white(message)
 
      addChatLine(formatted)
      log(account.username, `<${user}> ${message}`)
 
      if (message.toLowerCase().includes('/login') && !loginCooldown) {
        loginCooldown = true
        bot.chat('/login ' + PASSWORD)
        setTimeout(() => loginCooldown = false, 5000)
      }
    })
 
    /* ================= KILL COUNTER ================= */
 
    bot.on('entityGone', (entity) => {
 
      if (!entity || entity.type !== 'mob') return
      if (!entity.displayName) return
      if (!bot.entity) return
 
      const dist = bot.entity.position.distanceTo(entity.position)
 
      if (dist <= 6) {
        botStats[account.username].kills++
      }
    })
 
    /* ================= KILLAURA ================= */
 
    function startKillAura() {
 
      if (killAuraInterval) return
 
      const allowed = [
        'Skeleton','Zombie','Vindicator','Evoker','Blaze','Creeper',
        'Wither Skeleton','Guardian','Elder Guardian','Iron Golem',
        'Pig','Cow','Mooshroom','Rabbit','Polar Bear','Sheep',
        'Spider','Cave Spider','Hoglin'
      ]
 
      let lastAttack = 0
      const ATTACK_COOLDOWN = 600
 
      killAuraInterval = setInterval(() => {
 
        if (!bot.entity) return
 
        const now = Date.now()
 
        if (now - lastAttack < ATTACK_COOLDOWN) return
 
        const mobs = Object.values(bot.entities).filter(e =>
          e &&
          e.type === 'mob' &&
          e.displayName &&
          allowed.includes(e.displayName)
        )
 
        if (mobs.length === 0) return
 
        const targets = mobs
          .sort((a, b) =>
            bot.entity.position.distanceTo(a.position) -
            bot.entity.position.distanceTo(b.position)
          )
          .slice(0, 3)
 
        for (const target of targets) {
 
          const dist = bot.entity.position.distanceTo(target.position)
 
          if (dist > 6) continue
 
          bot.lookAt(target.position.offset(0, 1.5, 0), true)
          bot.attack(target)
 
          lastAttack = now
          break
        }
 
      }, 50)
    }
 
    /* ================= RECONNECT ================= */
 
    bot.on('end', () => {
 
      stats.botsOnline--
      stats.reconnects++
      botStats[account.username].status = chalk.red('OFFLINE')
 
      clearAll()
 
      setTimeout(create, 10000)
    })
 
    bot.on('error', () => {})
  }
 
  create()
}
 
for (const acc of ACCOUNTS) {
  startBot(acc)
}
