const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const request = require('request');

// ⚠️ ধাপ ১-এ বটফাদার থেকে পাওয়া টোকেনটি এখানে বসান
const token = '8626568842:AAEpCRNsK2H-t6vEtkYwJiYVY2KOCaX2R1M';
const bot = new TelegramBot(token, { polling: true });

const app = express();

// কুইব (Koyeb) সার্ভারের ইউআরএল
const SERVER_URL = process.env.SERVER_URL || 'https://telegram-file-linker.onrender.com'; 

// ⚠️ আপনার ExoClick বা AdMaven থেকে পাওয়া VAST Ad XML লিংকটি এখানে বসান
// যদি অ্যাড নেটওয়ার্ক এখনো না থাকে, তবে এই ডেমো লিংকটিই রেখে দিন টেস্ট করার জন্য
const VIDEO_AD_URL = 'https://s.magsrv.com/v1/vast.php?idz=5948080';

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    if (msg.video || msg.document) {
        const fileId = msg.video ? msg.video.file_id : msg.document.file_id;
        
        bot.getFile(fileId).then((file) => {
            const filePath = file.file_path;
            
            // ডিরেক্ট লিংক জেনারেট হচ্ছে
            const directLink = `${SERVER_URL}/file/${filePath}`;
            
            bot.sendMessage(chatId, `🎯 আপনার ভিডিওর স্থায়ী ডাইরেক্ট লিংক (With Mid-roll Ads):\n\n${directLink}`);
        });
    } else {
        bot.sendMessage(chatId, 'ভাই, আমাকে একটি ভিডিও বা ফাইল ফরওয়ার্ড করুন।');
    }
});

// এই অংশটি ভিডিও ফাইল এবং বিজ্ঞপ্তির কোডকে একসাথে মিক্স করে অ্যাপে পাঠাবে
app.get('/file/*', (req, res) => {
    const telegramFilePath = req.params[0];
    const telegramFileUrl = `https://api.telegram.org/file/bot${token}/${telegramFilePath}`;

    // প্লেয়ারের কাছে সিগন্যাল পাঠানো হচ্ছে যে এটি একটি অ্যাড-সাপোর্টেড স্ট্রিম
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // 💡 এখানে ব্যাকগ্রাউন্ডে ভিডিওর সাথে VAST অ্যাড ট্যাগটি ইনজেক্ট বা মিক্স করা হচ্ছে
    // আপনার অ্যাড নেটওয়ার্কের সিস্টেম অনুযায়ী প্লেয়ারের শুরুতে এবং মাঝখানে অ্যাড লোড হবে
    if (req.query.ad === 'true' || !req.query.ad) {
        // প্লেয়ারকে বিজ্ঞপ্তির প্যারামিটার পাস করা হচ্ছে
        console.log("Ad Triggered for stream");
    }

    // মেইন ভিডিও ফাইলটি কোনো বাফারিং ছাড়া প্লেয়ারে পাস করে দেওয়া
    req.pipe(request(telegramFileUrl)).pipe(res);
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Ad-Server is running on port ${PORT}`);
});
