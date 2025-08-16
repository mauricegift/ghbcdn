gmd({
    pattern: "giftedcdn",
    react: "⬆️",
    category: "uploader",
    description: "Upload any file to GiftedCDN",
}, async (from, Gifted, conText) => {
    await handleUpload(from, Gifted, conText, 'giftedcdn');
})