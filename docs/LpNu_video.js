gmd({
    pattern: "video",
    aliases: ["ytmp4doc", "mp4", "ytmp4", "dlmp4"],
    category: "downloader",
    react: "🎥",
    description: "Download Video from Youtube"
  },
  async (from, Gifted, conText) => {
    const { q, mek, reply, react, sender, botPic, botName, botFooter, newsletterUrl, newsletterJid, gmdJson, gmdBuffer, formatVideo, GiftedTechApi, GiftedApiKey } = conText;

    if (!q) {
      await react("❌");
      return reply("Please provide a video name or youtube url");
    }

    try {
      const searchResponse = await gmdJson(`https://yts.giftedtech.co.ke/?q=${encodeURIComponent(q)}`);
      
      if (!searchResponse || !Array.isArray(searchResponse.videos)) {
        await react("❌");
        return reply("Invalid response from search API. Please try again.");
      }

      if (searchResponse.videos.length === 0) {
        await react("❌");
        return reply("No results found for your search.");
      }
      
      const firstVideo = searchResponse.videos[0];
      const videoUrl = firstVideo.url;
      
      const videoApis = [
        `${GiftedTechApi}/api/download/ytmp4?apikey=${GiftedApiKey}&url=${encodeURIComponent(videoUrl)}`,
        `${GiftedTechApi}/api/download/mp4?apikey=${GiftedApiKey}&url=${encodeURIComponent(videoUrl)}`,
        `${GiftedTechApi}/api/download/ytv?apikey=${GiftedApiKey}&url=${encodeURIComponent(videoUrl)}`,
        `${GiftedTechApi}/api/download/dlmp4?apikey=${GiftedApiKey}&url=${encodeURIComponent(videoUrl)}`,
        `${GiftedTechApi}/api/download/ytvideo?apikey=${GiftedApiKey}&url=${encodeURIComponent(videoUrl)}`,
        `${GiftedTechApi}/api/download/ytvid?apikey=${GiftedApiKey}&url=${encodeURIComponent(videoUrl)}`
      ];

      let downloadUrl = null;

      for (const api of videoApis) {
        try {
          const response = await gmdJson(api);
          if (response.result?.download_url) {
            downloadUrl = response.result.download_url;
            break;
          }
        } catch (e) {
          console.log(`API ${api} failed: ${e.message}`);
        }
      }
      
      if (!downloadUrl) {
        await react("❌");
        return reply("Failed to get download URL for the video.");
      }

      const buffer = await gmdBuffer(downloadUrl);
      const convertedBuffer = await formatVideo(buffer);
      if (buffer instanceof Error) {
        await react("❌");
        return reply("Failed to download the video file.");
      }

      const infoMess = {
        image: { url: firstVideo.thumbnail || botPic },
        caption: `> *${botName} 𝐕𝐈𝐃𝐄𝐎 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄𝐑*  
╭───────────────◆  
│⿻ *Title:* ${firstVideo.name}
│⿻ *Duration:* ${firstVideo.duration}
╰────────────────◆  
⏱ *Session expires in 2 minutes*
╭───────────────◆
│Reply With:
│1️⃣ To Download Video 🎥 
│2️⃣ To Download as Document 📄
╰────────────────◆`,
        contextInfo: {
          mentionedJid: [sender],
          forwardingScore: 5,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: newsletterJid,
            newsletterName: botName,
            serverMessageId: 143
          }
        }
      };

      const messageSent = await Gifted.sendMessage(from, infoMess, { quoted: mek });
      const messageId = messageSent.key.id;
      
      const handleResponse = async (event) => {
        const messageData = event.messages[0];
        if (!messageData.message) return;
        const isReplyToDownloadPrompt = messageData.message.extendedTextMessage?.contextInfo?.stanzaId === messageId;
        if (!isReplyToDownloadPrompt) return;
        const messageContent = messageData.message.conversation || messageData.message.extendedTextMessage?.text;
        await react("⬇️");
        
        try {
          switch (messageContent.trim()) {
            case "1":
              await Gifted.sendMessage(from, {
                video: convertedBuffer,
                mimetype: "video/mp4",
                pvt: true,
                fileName: `${firstVideo.name}.mp4`.replace(/[^\w\s.-]/gi, ''),
                caption: `🎥 ${firstVideo.name}`,
              }, { quoted: messageData });
              break;
              
            case "2":
              await Gifted.sendMessage(from, {
                document: convertedBuffer,
                mimetype: "video/mp4",
                fileName: `${firstVideo.name}.mp4`.replace(/[^\w\s.-]/gi, ''),
                caption: `📄 ${firstVideo.name}`,
              }, { quoted: messageData });
              break;
              
            default:
              await reply("Invalid option selected. Please reply with:\n1️⃣ For Video\n2️⃣ For Document", messageData);
              return;
          }
          await react("✅");
        } catch (error) {
          console.error("Error sending media:", error);
          await react("❌");
          await reply("Failed to send media. Please try again.", messageData);
        }
      };

      let sessionExpired = false;
      
      const timeoutHandler = () => {
        sessionExpired = true;
        Gifted.ev.off("messages.upsert", handleResponse);
      };

      setTimeout(timeoutHandler, 120000);
      
      Gifted.ev.on("messages.upsert", handleResponse);
      
    } catch (error) {
      console.error("Error during download process:", error);
      await react("❌");
      return reply("Oops! Something went wrong. Please try again.");
    }
  }
)