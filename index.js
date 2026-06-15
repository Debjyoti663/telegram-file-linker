const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const { exec } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');

// ⚠️ ১. আপনার টেলিগ্রাম বট টোকেন বসান
const token = '8626568842:AAEpCRNsK2H-t6vEtkYwJiYVY2KOCaX2R1M';
const bot = new TelegramBot(token, { polling: true });

const app = express();
const downloadsDir = path.join(__dirname, 'downloads');

// ডাউনলোড ফোল্ডার না থাকলে তৈরি করবে
if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir);
}

// রেন্ডার সার্ভারের লিংক এনভায়রনমেন্ট ভ্যারিয়েবল থেকে নেবে
const SERVER_URL = process.env.SERVER_URL || 'https://telegram-file-linker.onrender.com';

// ডাউনলোড করা ফাইলগুলো ইন্টারনেটে এক্সেস করার জন্য স্ট্যাটিক ফোল্ডার সেটআপ
app.use('/download', express.static(downloadsDir));

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text) return;

    if (text === '/start') {
        return bot.sendMessage(chatId, 'ভাই, আমাকে একটি .mpd লিংক দিন। আমি ওটিকে সরাসরি .mp4 ডাউনলোড লিংকে কনভার্ট করে দেব।');
    }

    // লিংক চেক
    if (text.includes('.mpd') || text.includes('.m3u8')) {
        bot.sendMessage(chatId, '🔄 লিংক প্রসেস হচ্ছে... সার্ভারে ভিডিও ডাউনলোড এবং কনভার্ট করা শুরু হয়েছে। কিছুটা সময় লাগতে পারে ভাই, অপেক্ষা করুন।');

        const fileId = `video_${Date.now()}.mp4`;
        const outputPath = path.join(downloadsDir, fileId);

        // FFmpeg কমান্ড (ভিডিও এবং অডিও স্ট্রিম জোড়া দিয়ে mp4 বানাবে)
        // নোট: যদি ভিডিওতে ClearKey বা Widevine DRM থাকে, তবে নিচে -c copy এর আগে ডিক্রিপশন কী কমান্ড পাস করতে হবে
        const ffmpegCommand = `"${ffmpegPath}" -i "${text}" -c copy -bsf:a aac_adtstoasc "${outputPath}"`;

        exec(ffmpegCommand, (error, stdout, stderr) => {
            if (error) {
                console.error(`FFmpeg Error: ${error.message}`);
                return bot.sendMessage(chatId, `❌ দুঃখিত ভাই! ভিডিওটি প্রসেস করা যায়নি। সার্ভার এরর: ${error.message}`);
            }

            // ডাউনলোড করার ডাইরেক্ট ইউআরএল জেনারেট
            const directDownloadLink = `${SERVER_URL}/download/${fileId}`;

            bot.sendMessage(chatId, `🎯 আপনার ফাইল রেডি! নিচে সরাসরি .mp4 ডাউনলোড লিংক দেওয়া হলো:\n\n${directDownloadLink}\n\n💡 নোট: এই লিংকে ক্লিক করলেই ডাউনলোড শুরু হবে। সার্ভারের স্পেস খালি রাখতে ২৪ ঘণ্টা পর ফাইলটি অটো ডিলিট হয়ে যেতে পারে।`);
        });
    } else {
        bot.sendMessage(chatId, 'ভাই, দয়া করে একটি সঠিক .mpd বা .m3u8 লিংক পাঠান।');
    }
});

// সার্ভার পোর্ট সেটিংস
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`MPD Downloader Server is running on port ${PORT}`);
});
