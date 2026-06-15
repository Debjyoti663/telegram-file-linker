const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const axios = require('axios');

// ======================================================================
// ⚠️ ১. আপনার আসল টেলিগ্রাম বট টোকেনটি নিচের কোটেশনের (' ') ভেতরে বসান
const token = '8626568842:AAEpCRNsK2H-t6vEtkYwJiYVY2KOCaX2R1M';
const bot = new TelegramBot(token, { polling: true });

const app = express();

// ⚠️ ২. আপনার রেন্ডার সার্ভারের পুরো লিংকটি নিচের কোটেশনের (' ') ভেতরে বসান
const SERVER_URL = process.env.SERVER_URL || 'https://telegram-file-linker.onrender.com'; 

// ⚠️ ৩. আপনার ExoClick VAST Ad লিংকটি এখানে পার্মানেন্ট সেট করা আছে, এটা হাত দেওয়ার দরকার নেই
const VIDEO_AD_URL = 'https://s.magsrv.com/v1/vast.php?idz=5948080';
// ======================================================================

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    if (msg.video || msg.document) {
        const fileId = msg.video ? msg.video.file_id : msg.document.file_id;
        
        bot.getFile(fileId).then((file) => {
            const filePath = file.file_path;
            
            // বট যে লিংকটি দেবে, সেটির সাথে বিজ্ঞপ্তির ট্যাগ যুক্ত করে দেওয়া হচ্ছে
            const directLink = `${SERVER_URL}/file/${filePath}`;
            
            bot.sendMessage(chatId, `🎯 আপনার ভিডিওর স্থায়ী ডাইরেক্ট লিংক (With ExoClick Ads):\n\n${directLink}\n\n(এই লিংকটি সরাসরি ওটিটি অ্যাপের প্লেয়ারে বসিয়ে দিন)`);
        });
    } else {
        bot.sendMessage(chatId, 'ভাই, আমাকে একটি ভিডিও বা ফাইল ফরওয়ার্ড করুন, আমি অ্যাড-সহ লিংক তৈরি করে দিচ্ছি।');
    }
});

// ভিডিও এবং অ্যাড স্ক্রিপ্ট একসাথে প্লেয়ারে পাস করার মেইন পাইপলাইন
app.get('/file/*', async (req, res) => {
    const telegramFilePath = req.params[0];
    const telegramFileUrl = `https://api.telegram.org/file/bot${token}/${telegramFilePath}`;

    try {
        // প্লেয়ার রিড করার জন্য হেডার এবং এক্সোক্লিক অ্যাড কোড ইনজেক্ট করা হচ্ছে
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Expose-Headers', 'X-Video-Ad-Tag');
        res.setHeader('X-Video-Ad-Tag', VIDEO_AD_URL); // অ্যাপের প্লেয়ার এই হেডার থেকে অ্যাড রিসিভ করবে

        const response = await axios({
            method: 'get',
            url: telegramFileUrl,
            responseType: 'stream'
        });

        response.data.pipe(res);
    } catch (error) {
        console.error('Streaming error:', error.message);
        res.status(500).send('Error streaming file');
    }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Secure Ad-Server is running on port ${PORT}`);
});
