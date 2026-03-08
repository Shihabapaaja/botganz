const TelegramBot = require('node-telegram-bot-api');
const { token } = require("./config")

const bot = new TelegramBot(token, { polling: true });

bot.on("polling_error", e => console.log("POLLING:", e.message))
process.on("unhandledRejection", e => console.log(e))
process.on("uncaughtException", e => console.log(e))

const START_PHOTO_PATH = 'https://o.uguu.se/MnSGDCJh.jpg'; // Atau URL publik
 const PRICELIST_PHOTO_PATH = 'https://o.uguu.se/MnSGDCJh.jpg';
 const PAYMENT_PHOTO_PATH = 'https://o.uguu.se/tmyQpCvH.jpg';
 // Fitur /start
 bot.onText(/^\/start$/, (msg) => {
     const chatId = msg.chat.id;
     const username = msg.from.username || 'Tidak ada username';
     const caption = `BOT ORDER VIDEO VVIP BY CIA\n\nHALO KAK ${username} INGIN BELI VIDEO VVIP TERBARU? KLIK TOMBOL DI BAWAH SINI! 👇`;
     // Tombol inline (di bawah teks pesan)
     const inlineKeyboard = {
         inline_keyboard: [
             [
                 { text: 'PRICELIST', callback_data: 'show_pricelist' },
                 { text: 'PAYMENT', callback_data: 'show_payment' }
             ]
         ]
     };
     // Kirim foto beserta caption dan tombol inline
     bot.sendPhoto(chatId, START_PHOTO_PATH, {
         caption: caption,
         reply_markup: inlineKeyboard
     }).catch(err => console.error('Error saat mengirim start photo:', err));
 });
 // Tangani callback dari tombol inline
 bot.on('callback_query', (callbackQuery) => {
     const chatId = callbackQuery.message.chat.id;
     const action = callbackQuery.data;
     const messageId = callbackQuery.message.message_id;
     // Hapus tombol sebelumnya agar tidak berulang
     bot.editMessageReplyMarkup({}, { chat_id: chatId, message_id: messageId })
         .catch(err => console.error('Error saat menghapus markup:', err));
     if (action === 'show_pricelist') {
         const pricelistCaption = `VIP CIAAA\n\n\n{VIP OMECK}
• Update setiap hari
• Media terbaru
• Media rare item
{PRICE :15K}\n\n\n{VIP NGENSKUY}
• Update setiap hari
• Media terbaru
• Media rare item
{PRICE :10K}\n\n\n{VIP FULLPACK}
• Update setiap hari
• Media terbaru
• Media rare item
• Kumpulan pap/vid naked
{PRICE :15K}\n\n\n{VIP HIJAB}
• Update setiap hari
• Media terbaru
• Media rare item
• Kumpulan 'HIJAB' sagapung
{PRICE :15K}\n\n\n{VIP TALENT}
• Update setiap hari
• Media terbaru
• Media rare item
• Kumpulan pap/vid naked
• Kumpulan vid pribadi talent viral
{PRICE :10K}\n\n\n{VIP PELAJAR}
• Update setiap hari
• Media terbaru
• Media rare item
• Kumpulan pap/vid naked
• Kumpulan vid pelajar hypersex
{PRICE :10K}\n\n\n{VIP HIJAB GEAL GEOL}
• Update setiap hari
• Media terbaru
• Media rare item
• Kumpulan pap/vid body cewe berhijab 
• Kumpulan cewe berhijab sporty olahraga
{PRICE : 10K}\n\n{ALL VIP BISA DI SAVE/DI SIMPAN KE GALERI}\nALL VIP SPECIAL PRICE :
40.000`;
         bot.sendPhoto(chatId, PRICELIST_PHOTO_PATH, {
             caption: pricelistCaption
         }).catch(err => console.error('Error saat mengirim pricelist photo:', err));
     } else if (action === 'show_payment') {
         const paymentCaption = `Kirimkan bukti pembayaran mu ke @ownervipciaa untuk konfirmasi pembayaran\n\nJika akunmu mengalami limit (dibatasi oleh pihak telegram) Kirim saja username akun mu di bot nya (dengan kirim foto juga).`;
         bot.sendPhoto(chatId, PAYMENT_PHOTO_PATH, {
             caption: paymentCaption
         }).catch(err => console.error('Error saat mengirim payment photo:', err));
     }
 });