gmd({
  pattern: "owner",
  react: "👑",
  category: "owner",
  description: "Get Bot Owner.",
}, async (from, Gifted, conText) => {
  const { mek, reply, react, isSuperUser, ownerNumber, ownerName, botName } = conText;
  
  if (!isSuperUser) {
    await react("❌");
    return reply(`Owner Only Command!`);
  }
 
  try {
    const vcard = 'BEGIN:VCARD\n'
          + 'VERSION:3.0\n' 
          + `FN:${ownerName}\n` 
          + `ORG:${botName};\n` 
          + `TEL;type=CELL;type=VOICE;waid=${ownerNumber}:${ownerNumber}\n`
          + 'END:VCARD';
    
    await Gifted.sendMessage(
      from,
      { 
        contacts: { 
          displayName: ownerName, 
          contacts: [{ vcard }] 
        }
      }, 
      { quoted: mek } 
    );
    
    await react("✅");
  } catch (error) {
    await react("❌");
    await reply(`❌ Failed: ${error.message}`);
  }
})