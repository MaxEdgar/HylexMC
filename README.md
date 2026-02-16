# HYLEX Automation System
## Version V1.1

A resilient Mineflayer-based Minecraft automation framework designed for long-term survival persistence, hub recovery, crash prevention, and continuous task execution.

---

# Project Overview

HYLEX Automation System V1.1 is a multi-account Minecraft automation framework built using Mineflayer (1.8.9 compatible).

It is designed to:

- Automatically login on spawn
- Automatically rejoin survival if sent to hub
- Automatically resume account-specific tasks
- Prevent inventory transaction crashes
- Recover from disconnections
- Provide structured monitoring via a live terminal dashboard
- Maintain long-term uptime with minimal supervision

Version V1.1 introduces hardened inventory transaction handling and improved stability logic.

---

# Core Features

## 1. Auto Login System

- After spawning, bot waits 2 seconds
- Automatically sends:

  /login 220879max

- Listens for "/login" in chat
- If detected, re-sends login command (5-second cooldown)

Purpose:
Ensures authentication continuity after reconnect or server prompt.

---

## 2. Hub Auto-Recovery System

Every 4 seconds the bot checks:

- Hotbar slot 1 (inventory slot index 36)
- If the item is a compass

If compass detected:

1. Right-click compass
2. Wait for server GUI
3. Detect grass item in menu
4. Safely click grass to join survival

Protection:
- clickWindow wrapped in async try/catch
- If server rejects transaction → process does NOT crash
- Automatic retry loop

Purpose:
Automatically rejoins survival if bot is kicked to hub.

---

## 3. Survival Task Resumption

After joining survival:

For account "hitune":
- Executes:
  /home farm
- Starts Kill Aura system

For account "GoonMaster12":
- Executes:
  /pw afkmax
- Starts Promo system

Triggers on:
- Initial startup
- Hub recovery
- Reconnect
- Any survival rejoin

---

## 4. Kill Aura Engine

Interval: 500ms

Logic:
- Finds nearest entity
- Must be mob type
- Must match allowed mob list
- Must be within 4 blocks

If valid:
- Bot looks at target
- Attacks entity

Protection:
- Interval cannot stack
- Cleared on reconnect
- No duplicate loops
- No memory leak

---

## 5. Promo Automation Engine

Runs only on leader account (GoonMaster12).

Interval: 60 seconds

Message:
  am drunk ah!

Toggle system using file:

To stop promo:
  touch off

To resume promo:
  rm off

No need to restart script.

---

## 6. Reconnect System

On disconnect:
- Mark bot offline
- Increment reconnect counter
- Clear promo interval
- Clear kill aura interval
- Wait 10 seconds
- Reconnect automatically

After reconnect:
- Login resumes
- Hub detection resumes
- Survival commands resume

---

## 7. Crash-Safe Inventory Handling (V1.1 Critical Fix)

Previous Issue:

Error:
Server didn't respond to transaction for clicking on slot X

Old behavior:
- Node process crashed
- All bots stopped
- Profit loss

V1.1 behavior:
- clickWindow wrapped in try/catch
- Transaction failure logged safely
- Process continues running
- Hub watcher retries
- No full process termination

This is the primary stability improvement in V1.1.

---

## 8. Live Dashboard

Updates every second.

Displays:
- Server
- Uptime
- Bots online
- Reconnect count
- Total messages
- Per-bot message count
- Promo count
- Structured live chat feed

Libraries used:
- chalk
- cli-table3
- moment

Dashboard is isolated from critical logic to prevent crashes.

---

# Installation Guide

## Requirements

- Node.js (Recommended v18–v22)
- Termux, Linux, or Windows
- Stable internet connection

---

## 1. Clone Repository

git clone https://github.com/YOUR_USERNAME/hylex-automation.git
cd hylex-automation

---

## 2. Install Dependencies

npm install

---

## 3. Run

node index.js

---

# GitHub Mobile Usage Guide

GitHub Mobile is used for:

- Editing files
- Committing updates
- Managing README
- Creating branches
- Creating releases

It is NOT used to run the bot.

Workflow:

1. Edit files in GitHub Mobile.
2. Commit changes.
3. In Termux or PC:
   git pull
4. Restart bot if required.

---

# Debugging & Stress Test Results

## Test 1: Hub Transfer

Action:
- Forced teleport to hub.

Result:
- Compass detected within 4 seconds.
- Grass clicked safely.
- Survival joined.
- Commands resumed.
- No crash.

---

## Test 2: Inventory Transaction Failure

Simulated server rejecting click transaction.

Console output:

Grass click transaction failed (safe skipped)

Result:
- Process remained active.
- Retry occurred automatically.
- No crash.
- No bot termination.

---

## Test 3: Network Disconnect

Action:
- Forced disconnect.

Expected:
- Reconnect after 10 seconds.
- Resume login.
- Resume survival logic.

Observed:
- Successful reconnection.
- No duplicate intervals.
- No memory leak.
- Full task resumption.

---

## Test 4: Promo Toggle

Created file:
touch off

Result:
- Promo stopped next cycle.

Deleted file:
rm off

Result:
- Promo resumed automatically.

---

# What If Scenarios

What if compass is not in slot 1?
Bot assumes survival and does nothing.

What if grass item changes?
Survival join will not trigger.
Hub watcher continues checking.

What if click transaction fails repeatedly?
Process continues running.
Retry every 4 seconds.
No crash.

What if bot disconnects repeatedly?
Reconnect loop continues.
Intervals safely cleared.
System remains stable.

---

# Known Limitations

- Relies on compass being in hotbar slot 1
- Relies on grass item representing survival
- No scoreboard-based state detection
- No anti-detection randomization
- External watchdog (PM2) recommended

---

# Production Recommendation

For maximum uptime:

Install PM2:

npm install -g pm2
pm2 start index.js --name hylex
pm2 save

Ensures:
- Auto restart if process crashes
- Background execution
- Persistent runtime

---

# Version Changelog

## V1.1

- Fixed Mineflayer inventory transaction crash
- Added safe clickWindow handling
- Prevented process termination on inventory error
- Stabilized kill aura interval management
- Improved reconnect reliability
- Preserved full feature set
- Confirmed no interval stacking
- Confirmed crash resilience under stress testing

---

# Conclusion

HYLEX Automation System V1.1 is a self-recovering, crash-resistant automation framework built for persistent Minecraft survival operation.

It is designed to:

- Recover from hub transfers
- Recover from disconnects
- Avoid inventory transaction crashes
- Maintain task continuity
- Protect long-term uptime

System is stable under normal server conditions and suitable for unattended execution in controlled environments.
