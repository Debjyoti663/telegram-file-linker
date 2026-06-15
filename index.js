const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const axios = require('axios');

// ======================================================================
// ⚠️ ১. আপনার আসল টেলিগ্রাম বট টোকেনটি নিচের কোটেশনের (' ') ভেতরে বসান
const token = '8626568842:AAEpCRNsK2H-t6vEtkYwJiYVY2KOCaX2R1M';
const bot = new TelegramBot(token, { polling: true });

const app = express();

// ⚠️ ২. আপনার রেন্ডার伺服ার (Render Server) এর লিংকটি এখানে বসান
const SERVER_URL = process.env.SERVER_URL || 'https://telegram-file-linker.onrender.com'; 

// ⚠️ ৩. আপনার ExoClick VAST Ad লিংকটি এখানে দেওয়া আছে
const VIDEO_AD_URL = 'https://s.magsrv.com/v1/vast.php?idz=5948080';
// ======================================================================

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    if (msg.video || msg.document) {
        const fileId = msg.video ? msg.video.file_id : msg.document.file_id;
        
        // 🎯 এখানে বড় ফাইলের এরর হ্যান্ডলারটি পার্মানেন্টলি বসিয়ে দেওয়া হয়েছে
        bot.getFile(fileId).then((file) => {
            const filePath = file.file_path;
            const directLink = `${SERVER_URL}/file/${filePath}`;
            
            bot.sendMessage(chatId, `🎯 আপনার ভিডিওর স্থায়ী ডাইরেক্ট লিংক (With ExoClick Ads):\n\n${directLink}\n\n(এই লিংকটি সরাসরি ওটিটি অ্যাপের প্লেয়ারে বসিয়ে দিন)`);
        }).catch((err) => {
            // যদি ভিডিওর সাইজ ২০ মেগাবাইটের বেশি হয়, বট ক্র্যাশ না করে এই মেসেজটি দেবে
            bot.sendMessage(chatId, `⚠️ ভাই, এই ভিডিওর সাইজ অনেক বড় (২০ এমবির বেশি)!\n\nটেলিগ্রাম বটের ফ্রি লিমিটের কারণে সরাসরি এত বড় ফাইল পাঠানো যাবে না।\n\n💡 সমাধান: টেস্ট করার জন্য প্রথমে ৫-১০ এমবির একটি ছোট ভিডিও পাঠান। আর বড় ভিডিওর জন্য ওটিকে .zip ফাইল বানিয়ে বটে আপলোড করুন, তাহলে লিংক চলে আসবে।`);
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
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Expose-Headers', 'X-Video-Ad-Tag');
        res.setHeader('X-Video-Ad-Tag', VIDEO_AD_URL);

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
