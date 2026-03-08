const TelegramBot = require("node-telegram-bot-api")
const axios = require("axios")
const fs = require('fs-extra');
const JsConfuser = require('js-confuser');
const archiver = require('archiver');
const AdmZip = require('adm-zip');
const chalk = require('chalk');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const path = require('path');
const https = require('https');
const FormData = require("form-data");
const { token } = require("./config")
const { VERCEL_TOKEN } = require('./config');
const moment = require('moment');
const acorn = require('acorn');
const { v4: uuidv4 } = require('uuid');
const fileType = require('file-type');
const crypto = require('crypto');
const sharp = require('sharp');
const { execSync, spawn } = require('child_process');
const { writeFileSync, readFileSync, existsSync, mkdirSync, copyFileSync, readdirSync, unlinkSync } = require("fs");
const apiBaseUrl = 'https://api-ikyzxc.vercel.app/ai/ai4chat/chat';
const apiReplyMessageIds = new Set();
const apiBaseUrll = 'https://api-ikyzxc.vercel.app/ai/fixerror';
 // Inisialisasi bot //
 const manualPassword = 'ganz'; //
function initBot() {
const bot = new TelegramBot(token, { polling: true })

// ===============================
// DEBUG
// ===============================
bot.on("polling_error", e => console.log("POLLING:", e.message))
process.on("unhandledRejection", e => console.log(e))
process.on("uncaughtException", e => console.log(e))
 
 const TMP_DIR = path.join(__dirname, 'tmp_enc');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

async function downloadFileContent(fileId) {
  try {
    const fileLink = await bot.getFileLink(fileId);
    const res = await axios.get(fileLink, { responseType: 'text' });
    return res.data;
  } catch (err) {
    throw new Error('Gagal mengunduh file: ' + (err.message || err));
  }
}

async function sendOrEditProgress(chatId, messageId, text) {
  try {
    if (messageId) {
      await bot.editMessageText(text, { chat_id: chatId, message_id: messageId, parse_mode: 'Markdown' });
      return messageId;
    } else {
      const sent = await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      return sent.message_id;
    }
  } catch (e) {
    try {
      const sent = await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      return sent.message_id;
    } catch (e2) {
      return null;
    }
  }
}

function isFileTooLarge(fileSize) {
  const MAX_SIZE = 10 * 1024 * 1024;
  if (!fileSize) return false;
  return fileSize > MAX_SIZE;
}

async function obfuscateWithConfig(fileContent, config) {
  const obf = await JsConfuser.obfuscate(fileContent, config);
  const obfCode = obf.code || obf;
  if (typeof obfCode !== 'string') throw new Error('Hasil obfuscation bukan string');
  return obfCode;
}

const obfuscateTimeLocked = async (fileContent, days) => {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + parseInt(days));
  const expiryTimestamp = expiryDate.getTime();
  try {
    const wrapped = `(function(){const expiry=${expiryTimestamp};if(new Date().getTime()>expiry){throw new Error('Script has expired after ${days} days');}\n${fileContent}\n})();`;
    const obfuscated = await JsConfuser.obfuscate(wrapped, {
      target: "node",
      compact: true,
      renameVariables: true,
      renameGlobals: true,
      identifierGenerator: "randomized",
      stringCompression: true,
      stringConcealing: true,
      stringEncoding: true,
      controlFlowFlattening: 0.75,
      flatten: true,
      shuffle: true,
      rgf: false,
      opaquePredicates: { count: 6, complexity: 4 },
      dispatcher: true,
      globalConcealing: true,
      lock: {
        selfDefending: true,
        antiDebug: (code) => `if(typeof debugger!=='undefined'||process.env.NODE_ENV==='debug')throw new Error('Debugging disabled');${code}`,
        integrity: true,
        tamperProtection: (code) => `if(!((function(){return eval('1+1')===2;})()))throw new Error('Tamper detected');${code}`,
      },
      duplicateLiteralsRemoval: true,
    });
    const obfuscatedCode = obfuscated.code || obfuscated;
    if (typeof obfuscatedCode !== "string") throw new Error("Hasil obfuscation bukan string");
    return obfuscatedCode;
  } catch (error) {
    throw new Error(`Gagal obfuscate: ${error.message}`);
  }
};

const obfuscateQuantum = async (fileContent) => {
  const generateTimeBasedIdentifier = () => {
    const timeStamp = new Date().getTime().toString().slice(-5);
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$#@&*";
    let identifier = "qV_";
    for (let i = 0; i < 7; i++) {
      identifier += chars[Math.floor((parseInt(timeStamp[i % 5] || '0') + i * 2) % chars.length)];
    }
    return identifier;
  };

  const currentMilliseconds = new Date().getMilliseconds();
  const phantomCode = currentMilliseconds % 3 === 0 ? `if(Math.random()>0.999)console.log('PhantomTrigger');` : "";

  try {
    const obfuscated = await JsConfuser.obfuscate(fileContent + phantomCode, {
      target: "node",
      compact: true,
      renameVariables: true,
      renameGlobals: true,
      identifierGenerator: generateTimeBasedIdentifier,
      stringCompression: true,
      stringConcealing: false,
      stringEncoding: true,
      controlFlowFlattening: 0.85,
      flatten: true,
      shuffle: true,
      rgf: true,
      opaquePredicates: { count: 8, complexity: 5 },
      dispatcher: true,
      globalConcealing: true,
      lock: {
        selfDefending: true,
        antiDebug: (code) => `if(typeof debugger!=='undefined'||(typeof process!=='undefined'&&process.env.NODE_ENV==='debug'))throw new Error('Debugging disabled');${code}`,
        integrity: true,
        tamperProtection: (code) => `if(!((function(){return eval('1+1')===2;})()))throw new Error('Tamper detected');${code}`,
      },
      duplicateLiteralsRemoval: true,
    });
    let obfuscatedCode = obfuscated.code || obfuscated;
    if (typeof obfuscatedCode !== "string") throw new Error("Hasil obfuscation bukan string");

    const key = currentMilliseconds % 256;
    obfuscatedCode = `(function(){let k=${key};return function(c){return c.split('').map((x,i)=>String.fromCharCode(x.charCodeAt(0)^(k+(i%16)))).join('');}('${obfuscatedCode}');})()`;
    return obfuscatedCode;
  } catch (error) {
    throw new Error(`Gagal obfuscate: ${error.message}`);
  }
};

const getSiuCalcrickObfuscationConfig = () => {
  const generateSiuCalcrickName = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let randomPart = "";
    for (let i = 0; i < 6; i++) {
      randomPart += chars[Math.floor(Math.random() * chars.length)];
    }
    return `CalceKarik和SiuSiu无与伦比的帅气${randomPart}`;
  };

  return {
    target: "node",
    compact: true,
    renameVariables: true,
    renameGlobals: true,
    identifierGenerator: generateSiuCalcrickName,
    stringCompression: true,
    stringEncoding: true,
    stringSplitting: true,
    controlFlowFlattening: 0.95,
    shuffle: true,
    rgf: false,
    flatten: true,
    duplicateLiteralsRemoval: true,
    deadCode: true,
    calculator: true,
    opaquePredicates: true,
    lock: {
      selfDefending: true,
      antiDebug: true,
      integrity: true,
      tamperProtection: true,
    },
  };
};

const getCustomObfuscationConfig = (customString) => {
  return {
    target: "node",
    compact: true,
    renameVariables: true,
    renameGlobals: true,
    stringCompression: true,
    stringEncoding: true,
    stringSplitting: true,
    controlFlowFlattening: 0.95,
    shuffle: true,
    rgf: false,
    flatten: true,
    duplicateLiteralsRemoval: true,
    deadCode: true,
    calculator: true,
    opaquePredicates: true,
    identifierGenerator: function () {
      return `${customString}` + Math.random().toString(36).substring(7);
    },
    lock: {
      selfDefending: true,
      antiDebug: true,
      integrity: true,
      tamperProtection: true,
    },
  };
};

const getNebulaObfuscationConfig = () => {
  const generateNebulaName = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const prefix = "NX";
    let randomPart = "";
    for (let i = 0; i < 4; i++) randomPart += chars[Math.floor(Math.random() * chars.length)];
    return `${prefix}${randomPart}`;
  };

  return {
    target: "node",
    compact: true,
    renameVariables: true,
    renameGlobals: true,
    identifierGenerator: generateNebulaName,
    stringCompression: true,
    stringConcealing: false,
    stringEncoding: true,
    stringSplitting: false,
    controlFlowFlattening: 0.75,
    flatten: true,
    shuffle: true,
    rgf: true,
    deadCode: true,
    opaquePredicates: true,
    dispatcher: true,
    globalConcealing: true,
    objectExtraction: true,
    duplicateLiteralsRemoval: true,
    lock: {
      selfDefending: true,
      antiDebug: true,
      integrity: true,
      tamperProtection: true,
    },
  };
};

const getNovaObfuscationConfig = () => {
  const generateNovaName = () => "var_" + Math.random().toString(36).substring(7);

  return {
    target: "node",
    calculator: false,
    compact: true,
    controlFlowFlattening: 1,
    deadCode: 1,
    dispatcher: true,
    duplicateLiteralsRemoval: 1,
    es5: true,
    flatten: true,
    globalConcealing: true,
    hexadecimalNumbers: 1,
    identifierGenerator: generateNovaName,
    lock: { antiDebug: true, integrity: true, selfDefending: true },
    minify: true,
    movedDeclarations: true,
    objectExtraction: true,
    opaquePredicates: true,
    renameGlobals: true,
    renameVariables: true,
    shuffle: true,
    stack: true,
    stringCompression: true,
    stringConcealing: true,
  };
};

const getStrongObfuscationConfig = () => {
  return {
    target: "node",
    calculator: true,
    compact: true,
    hexadecimalNumbers: true,
    controlFlowFlattening: 0.75,
    deadCode: 0.2,
    dispatcher: true,
    duplicateLiteralsRemoval: 0.75,
    flatten: true,
    globalConcealing: true,
    identifierGenerator: "zeroWidth",
    minify: true,
    movedDeclarations: true,
    objectExtraction: true,
    opaquePredicates: 0.75,
    renameVariables: true,
    renameGlobals: true,
    stringConcealing: true,
    stringCompression: true,
    stringEncoding: true,
    stringSplitting: 0.75,
    rgf: false,
  };
};

const getArabObfuscationConfig = () => {
  const arabicChars = ["أ","ب","ت","ث","ج","ح","خ","د","ذ","ر","ز","س","ش","ص","ض","ط","ظ","ع","غ","ف","ق","ك","ل","م","ن","ه","و","ي"];
  const generateArabicName = () => {
    const length = Math.floor(Math.random() * 4) + 3;
    let name = "";
    for (let i = 0; i < length; i++) name += arabicChars[Math.floor(Math.random() * arabicChars.length)];
    return name;
  };

  return {
    target: "node",
    compact: true,
    renameVariables: true,
    renameGlobals: true,
    identifierGenerator: () => generateArabicName(),
    stringEncoding: true,
    stringSplitting: true,
    controlFlowFlattening: 0.95,
    shuffle: true,
    duplicateLiteralsRemoval: true,
    deadCode: true,
    calculator: true,
    opaquePredicates: true,
    lock: { selfDefending: true, antiDebug: true, integrity: true, tamperProtection: true },
  };
};

const getJapanxArabObfuscationConfig = () => {
  const japaneseXArabChars = [
    "あ","い","う","え","お","か","き","く","け","こ","さ","し","す","せ","そ","た","ち","つ","て","と","な","に","ぬ","ね","の","は","ひ","ふ","へ","ほ","ま","み","む","め","も","や","ゆ","よ",
    "أ","ب","ت","ث","ج","ح","خ","د","ذ","ر","ز","س","ش","ص","ض","ط","ظ","ع","غ","ف","ق","ك","ل","م","ن","ه","و","ي",
    "ら","り","る","れ","ろ","わ","を","ん"
  ];
  const generateJapaneseXArabName = () => {
    const length = Math.floor(Math.random() * 4) + 3;
    let name = "";
    for (let i = 0; i < length; i++) name += japaneseXArabChars[Math.floor(Math.random() * japaneseXArabChars.length)];
    return name;
  };

  return {
    target: "node",
    compact: true,
    renameVariables: true,
    renameGlobals: true,
    identifierGenerator: () => generateJapaneseXArabName(),
    stringCompression: true,
    stringConcealing: true,
    stringEncoding: true,
    stringSplitting: true,
    controlFlowFlattening: 0.95,
    flatten: true,
    shuffle: true,
    rgf: false,
    dispatcher: true,
    duplicateLiteralsRemoval: true,
    deadCode: true,
    calculator: true,
    opaquePredicates: true,
    lock: { selfDefending: true, antiDebug: true, integrity: true, tamperProtection: true },
  };
};

const getJapanObfuscationConfig = () => {
  const japaneseChars = ["あ","い","う","え","お","か","き","く","け","こ","さ","し","す","せ","そ","た","ち","つ","て","と","な","に","ぬ","ね","の","は","ひ","ふ","へ","ほ","ま","み","む","め","も","や","ゆ","よ","ら","り","る","れ","ろ","わ","を","ん"];
  const generateJapaneseName = () => {
    const length = Math.floor(Math.random() * 4) + 3;
    let name = "";
    for (let i = 0; i < length; i++) name += japaneseChars[Math.floor(Math.random() * japaneseChars.length)];
    return name;
  };

  return {
    target: "node",
    compact: true,
    renameVariables: true,
    renameGlobals: true,
    identifierGenerator: () => generateJapaneseName(),
    stringEncoding: true,
    stringSplitting: true,
    controlFlowFlattening: 0.9,
    flatten: true,
    shuffle: true,
    duplicateLiteralsRemoval: true,
    deadCode: true,
    calculator: true,
    opaquePredicates: true,
    lock: { selfDefending: true, antiDebug: true, integrity: true, tamperProtection: true },
  };
};

const getChinaObfuscationConfig = () => {
  const chineseChars = [
    "高","宝","座","齐","峰","龙","天","明","华","杰","强","伟","安","浩","晨","洋","亮","鹏","翔","诚",
    "贤","宁","康","忠","志","思","宇","恒","靖","瑞","恩","麟","昊","逸","旭","文","昌","豪","涛"
  ];
  const generateChineseName = () => {
    const length = Math.floor(Math.random() * 4) + 3;
    let name = "";
    for (let i = 0; i < length; i++) {
      name += chineseChars[Math.floor(Math.random() * chineseChars.length)];
    }
    return name;
  };
  return {
    target: "node",
    compact: true,
    renameVariables: true,
    renameGlobals: true,
    identifierGenerator: () => generateChineseName(),
    stringCompression: true,
    stringConcealing: false,
    stringEncoding: true,
    stringSplitting: true,
    controlFlowFlattening: 0.90,
    flatten: true,
    dispatcher: true,
    shuffle: true,
    duplicateLiteralsRemoval: true,
    deadCode: true,
    calculator: true,
    opaquePredicates: true,
    lock: {
      selfDefending: true,
      antiDebug: true,
      integrity: true,
      tamperProtection: true,
    },
  };
};

 async function showProgress(chatId, initialMsg, finalMsg) {
  let message = await bot.sendMessage(chatId, initialMsg);

  for (let i = 10; i <= 100; i += 10) {
    const filled = "█".repeat(i / 10);
    const empty = "▒".repeat(10 - i / 10);
    const bar = `[${filled}${empty}] ${i}%`;

    await bot.editMessageText(`⏳ Progress:\n${bar}`, {
      chat_id: chatId,
      message_id: message.message_id
    });
  }

  await bot.editMessageText(finalMsg, {
    chat_id: chatId,
    message_id: message.message_id,
    parse_mode: 'HTML'
  });
}
  
const searchCache = {};
 // Fungsi untuk membersihkan judul lagu dari karakter yang tidak perlu
 const cleanTitle = (title) => {
   return title.replace(/[^\w\s\-.,()]/gi, '').trim();
 };
 /**
  * Fungsi untuk mencari video YouTube berdasarkan query
  */
 async function ytSearch(query) {
   // Validasi query tidak boleh kosong
   if (!query || typeof query !== 'string' || query.trim() === '') {
     console.error("Query tidak boleh kosong atau tidak valid");
     return [];
   }
   try {
     const encodedQuery = encodeURIComponent(query.trim());
     const res = await axios.get(
       `https://api-ikyzxc.vercel.app/search/youtube?apikey=kyzz&query=${encodedQuery}`
     );
     // Sesuaikan dengan struktur respons API yang benar
     if (res.data?.status === true && Array.isArray(res.data?.result)) {
       // Format hasil agar konsisten dengan yang dibutuhkan di fitur play
       return res.data.result.slice(0, 6).map(item => ({
         id: item.link.split('v=')[1], // Ambil video ID dari link
         title: item.title,
         author: item.channel,
         link: item.link,
         duration: item.duration
       }));
     }
     return [];
   } catch (error) {
     console.error("Kesalahan saat melakukan pencarian:", error.response?.data || error.message);
     // Tampilkan pesan error spesifik dari API jika ada
     if (error.response?.data === "This may be an unsupported webpage type. Please check the webpage or try again later.") {
       console.error("API gagal: Query tidak didukung atau ada masalah dengan layanan");
     }
     return [];
   }
 }
 /**
  * Fungsi untuk mendapatkan tautan unduhan audio MP3
  */
 async function ytdwl(videoUrl) {
   // Validasi URL video tidak boleh kosong
   if (!videoUrl || typeof videoUrl !== 'string' || videoUrl.trim() === '') {
     console.error("URL video tidak boleh kosong atau tidak valid");
     return null;
   }
   try {
     const encodedVideoUrl = encodeURIComponent(videoUrl.trim());
     const response = await axios.get(
       `https://api-ikyzxc.vercel.app/download/ytmp3?apikey=kyzz&url=${encodedVideoUrl}`
     );
     // Periksa status dan struktur respons API
     if (response.data?.status === true && response.data?.result?.dlink) {
       return response.data.result.dlink;
     }
     console.warn("Struktur respons tidak sesuai atau tidak ada tautan unduhan");
     return null;
   } catch (error) {
     console.error("Kesalahan saat mengambil tautan unduhan:", error.response?.data || error.message);
     // Tampilkan pesan error spesifik dari API jika ada
     if (error.response?.data === "This may be an unsupported webpage type. Please check the webpage or try again later.") {
       console.error("API gagal: URL video tidak didukung atau ada masalah dengan layanan");
     }
     return null;
   }
 }
 /**
  * Fitur perintah /play untuk mencari lagu
  */
 bot.onText(/\/play(?:\s+(.+))?/i, async (msg, match) => {
   const chatId = msg.chat.id;
   const query = match[1];
   // Cek jika tidak ada query yang dimasukkan
   if (!query) {
     return bot.sendMessage(
       chatId,
       "⚠️ Format Salah!\nContoh:\n/play Jendela Kelas 1"
     );
   }
   // Kirim pesan loading
   const loadingMsg = await bot.sendMessage(chatId, "🔍 Mencari lagu... Mohon tunggu...");
   try {
     const results = await ytSearch(query);
     // Cek jika tidak ada hasil pencarian
     if (!results.length) {
       return bot.editMessageText("❌ Lagu tidak ditemukan atau terjadi kesalahan pada layanan pencarian", {
         chat_id: chatId,
         message_id: loadingMsg.message_id
       });
     }
     // Simpan hasil ke cache
     searchCache[chatId] = results;
     // Buat tombol inline untuk pilihan lagu
     const inlineButtons = results.map((item, index) => [
       {
         text: `🎵 ${cleanTitle(item.title)} (${item.duration})`,
         callback_data: `pick_${index}`
       }
     ]);
     // Edit pesan loading menjadi pilihan lagu
     await bot.editMessageText("🎧 Silakan pilih lagu yang ingin Anda putar:", {
       chat_id: chatId,
       message_id: loadingMsg.message_id,
       reply_markup: {
         inline_keyboard: inlineButtons
       }
     });
   } catch (err) {
     console.error("Kesalahan pada fitur /play:", err);
     await bot.editMessageText("❌ Terjadi kesalahan saat mencari lagu", {
       chat_id: chatId,
       message_id: loadingMsg.message_id
     });
   }
 });
 /**
  * Fitur menangani callback dari tombol inline
  */
 bot.on("callback_query", async (callbackQuery) => {
   const q = callbackQuery;
   const chatId = q.message.chat.id;
   const messageId = q.message.message_id;
   const callbackData = q.data;
   // Hanya tangani callback dengan awalan "pick_"
   if (!callbackData.startsWith("pick_")) return;
   try {
     const index = Number(callbackData.split("_")[1]);
     const savedResults = searchCache[chatId];
     // Cek jika cache tidak ada atau index tidak valid
     if (!savedResults || typeof savedResults[index] === 'undefined') {
       await bot.answerCallbackQuery(q.id, { text: "⚠️ Hasil pencarian sudah kadaluarsa, silakan cari lagi" });
       return bot.editMessageText("⚠️ Hasil pencarian kadaluarsa\nSilakan kirim perintah /play lagi", {
         chat_id: chatId,
         message_id: messageId
       });
     }
     const selectedSong = savedResults[index];
     // Hapus tombol inline dan beritahu pengguna bahwa lagu sedang diunduh
     await bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: messageId });
     await bot.answerCallbackQuery(q.id, { text: `🎧 Sedang mengunduh: ${cleanTitle(selectedSong.title)}` });
     // Dapatkan tautan audio
     const audioUrl = await ytdwl(selectedSong.link);
     // Cek jika gagal mendapatkan tautan audio
     if (!audioUrl) {
       return bot.sendMessage(chatId, "❌ Gagal mengunduh audio\nMohon coba lagi nanti atau pilih lagu lain");
     }
     // Kirim audio ke chat
     await bot.sendAudio(chatId, audioUrl, {
       caption: `🎧 <b>${cleanTitle(selectedSong.title)}</b>\n👤 ${selectedSong.author || "Unknown Artist"}`,
       parse_mode: "HTML",
       title: cleanTitle(selectedSong.title),
       performer: selectedSong.author || "Unknown Artist"
     });
     // Hapus data dari cache setelah selesai
     delete searchCache[chatId];
   } catch (err) {
     console.error("Kesalahan pada callback query:", err);
     await bot.answerCallbackQuery(q.id, { text: "❌ Terjadi kesalahan saat memproses pilihan Anda" });
     bot.sendMessage(chatId, "❌ Gagal memutar lagu, silakan coba lagi");
   }
 });

 const { URL } = require('url');
 const groupOnlyMode = true;
const isGroup = (msg) => {
     return msg.chat.type === 'group' || msg.chat.type === 'supergroup';
 };
 // Fungsi untuk memeriksa apakah URL valid
 const isValidUrl = (string) => {
     try {
         new URL(string);
         return true;
     } catch (_) {
         return false;
     }
 };
 // Fungsi penanganan error khusus untuk file audio tidak valid
 const handleAudioSendError = async (chatId, spotifyUrl, error) => {
     let errorMessage = "❌ Gagal mengirim lagu karena masalah pada file audio.\n\n";
     
     // Analisis jenis error
     if (error.message.includes('File type is not supported')) {
         errorMessage += "Penyebab: Format file audio tidak didukung oleh Telegram.\n";
         errorMessage += "Format yang diterima: MP3, OGG, M4A (dengan konfigurasi yang benar).\n";
     } else if (error.message.includes('url is invalid')) {
         errorMessage += "Penyebab: URL file audio tidak valid atau server tidak mengizinkan akses.\n";
     } else if (error.message.includes('timeout')) {
         errorMessage += "Penyebab: Waktu tunggu habis saat mencoba mengakses file audio.\n";
     } else {
         errorMessage += `Penyebab: ${error.message}\n`;
     }
     
     // Berikan alternatif kepada pengguna
     errorMessage += `\n💡 Alternatif: Silakan dengarkan lagu secara resmi melalui Spotify\n🔗 ${spotifyUrl}`;
     
     await bot.sendMessage(chatId, errorMessage);
 };
 // Command /spotifysearch - hanya ambil 1 data hasil
 bot.onText(/^\/spotifysearch (.+)$/, async (msg, match) => {
     const currentTime = Math.floor(Date.now() / 1000);
     const messageTime = msg.date;
     if (currentTime - messageTime > 1) return;
     if (groupOnlyMode && !isGroup(msg)) {
         return bot.sendMessage(msg.chat.id, "bot hanya dapat digunakan didalam grup");
     }
     const query = match[1];
     const apiUrl = `https://ikyyzyyrestapi.my.id/search/spotify?query=${encodeURIComponent(query)}`;
     try {
         const { data } = await axios.get(apiUrl, { timeout: 15000 });
         if (!data.status || !data.tracks?.length) {
             return bot.sendMessage(msg.chat.id, "❌ Lagu tidak ditemukan. Coba dengan kata kunci lain.");
         }
         // Ambil hanya 1 data hasil pertama
         const track = data.tracks[0];
         const { name, artist, album, length, release, cover, link } = track;
         const caption = `🎵 *Judul:* ${name}\n🎤 *Artis:* ${artist.join(', ')}\n💿 *Album:* ${album}\n⏱ *Durasi:* ${length}\n📅 *Rilis:* ${release}`;
         
         const options = {
             caption: caption,
             parse_mode: 'Markdown',
             reply_markup: {
                 inline_keyboard: [
                     [
                         { text: '🔗 Buka Spotify', url: link },
                         { text: '⬇ Coba Dapatkan Lagu', callback_data: `download_${link}` }
                     ]
                 ]
             }
         };
         // Kirim dengan cover atau tanpa jika tidak valid
         if (isValidUrl(cover)) {
             try {
                 await bot.sendPhoto(msg.chat.id, cover, options);
             } catch {
                 await bot.sendMessage(msg.chat.id, caption, { parse_mode: 'Markdown', ...options.reply_markup });
             }
         } else {
             await bot.sendMessage(msg.chat.id, caption + "\n⚠️ Gambar cover tidak tersedia", { parse_mode: 'Markdown', ...options.reply_markup });
         }
     } catch (error) {
         console.error("Error pada pencarian:", error);
         const errorMsg = error.response ? `Kode error: ${error.response.status} - ${error.response.statusText}` : error.message;
         bot.sendMessage(msg.chat.id, `⚠️ Terjadi kesalahan saat mengambil data pencarian:\n${errorMsg}`);
     }
 });
 // Command /spotifysearch tanpa argumen
 bot.onText(/^\/spotifysearch$/, (msg) => {
     if (groupOnlyMode && !isGroup(msg)) {
         return bot.sendMessage(msg.chat.id, "bot hanya dapat digunakan didalam grup");
     }
     bot.sendMessage(msg.chat.id, "❌ Harap masukkan kata kunci pencarian!\n\nFormat: `/spotifysearch <judul lagu>`", { parse_mode: 'Markdown' });
 });
 // Handler callback download - fokus pada penanganan error audio
 bot.on('callback_query', async (callbackQuery) => {
     const msg = callbackQuery.message;
     const chatId = msg.chat.id;
     const callbackId = callbackQuery.id;
     const data = callbackQuery.data;
     const match = data.match(/^download_(https:\/\/open\.spotify\.com\/track\/.+)$/);
     if (match) {
         const spotifyUrl = match[1];
         const apiUrl = `https://ikyyzyyrestapi.my.id/download/spotifydl?apikey=kyzz&url=${encodeURIComponent(spotifyUrl)}`;
         try {
             await bot.answerCallbackQuery(callbackId, { text: '🔍 Sedang memproses lagu...', show_alert: false });
             
             // Ambil data dari API unduhan
             const downloadResponse = await axios.get(apiUrl, { timeout: 20000 });
             if (!downloadResponse.data || !downloadResponse.data.status) {
                 const errorDetail = downloadResponse.data?.message || "Tidak ada pesan error dari API";
                 return bot.sendMessage(chatId, `❌ Gagal mengambil data unduhan:\n${errorDetail}`);
             }
             // Ambil data sesuai format API yang diberikan
             const { metadata, download: audioUrl } = downloadResponse.data.result;
             const { song_name, artist } = metadata;
             // Validasi dasar URL audio
             if (!isValidUrl(audioUrl)) {
                 return handleAudioSendError(chatId, spotifyUrl, new Error("URL file audio tidak valid atau tidak dapat diakses"));
             }
             // Coba kirim audio dengan berbagai penanganan error
             try {
                 console.log("Mencoba mengirim audio:", audioUrl);
                 await bot.sendAudio(chatId, audioUrl, { 
                     title: song_name || "Lagu Spotify", 
                     performer: artist || "Unknown Artist",
                     timeout: 30000
                 });
                 bot.sendMessage(chatId, "✅ Lagu berhasil dikirim!");
             } catch (sendError) {
                 console.error("Error saat mengirim audio:", sendError);
                 // Panggil fungsi penanganan error khusus
                 await handleAudioSendError(chatId, spotifyUrl, sendError);
             }
         } catch (error) {
             console.error("Error pada proses unduhan:", error);
             let errorMsg = "⚠️ Terjadi kesalahan saat mengambil data unduhan.\n";
             
             if (error.response) {
                 errorMsg += `Kode error: ${error.response.status}\n`;
                 errorMsg += `Pesan: ${JSON.stringify(error.response.data)}`;
             } else if (error.request) {
                 errorMsg += "Tidak ada respons dari server API unduhan.\n";
                 errorMsg += `💡 Silakan coba lagi nanti atau dengarkan melalui Spotify: ${spotifyUrl}`;
             } else {
                 errorMsg += `Pesan error: ${error.message}\n`;
                 errorMsg += `💡 Silakan dengarkan melalui Spotify: ${spotifyUrl}`;
             }
             bot.sendMessage(chatId, errorMsg);
         }
     }
 });

// Handler untuk command /iqc
 bot.onText(/^\/iqc(.+)?$/, async (msg, match) => {
   const chatId = msg.chat.id;
   const text = match[1] ? match[1].trim() : '';
   // Cek jika tidak ada teks setelah command
   if (!text) {
     return bot.sendMessage(
       chatId,
       "⚠ Gunakan: `/iqc jam|batre|carrier|pesan`\nContoh: `/iqc 18:00|40|Indosat|hai hai`",
       { parse_mode: "Markdown" }
     );
   }
   // Pisahkan parameter berdasarkan |
   let [time, battery, carrier, ...msgParts] = text.split("|");
   // Validasi parameter
   if (!time || !battery || !carrier || msgParts.length === 0) {
     return bot.sendMessage(
       chatId,
       "⚠ Format salah!\nGunakan: `/iqc jam|batre|carrier|pesan`\nContoh: `/iqc 18:00|40|Indosat|hai hai`",
       { parse_mode: "Markdown" }
     );
   }
   // Kirim pesan loading
   await bot.sendMessage(chatId, "⏳ Tunggu sebentar...");
   try {
     // Siapkan parameter URL dengan encode
     let messageText = encodeURIComponent(msgParts.join("|").trim());
     let url = `https://brat.siputzx.my.id/iphone-quoted?time=${encodeURIComponent(time)}&batteryPercentage=${battery}&carrierName=${encodeURIComponent(carrier)}&messageText=${messageText}&emojiStyle=apple`;
     // Ambil data dari API
     let res = await fetch(url);
     if (!res.ok) {
       return bot.sendMessage(chatId, "❌ Gagal mengambil data dari API.");
     }
     // Konversi respons ke buffer
     const arrayBuffer = await res.arrayBuffer();
     const buffer = Buffer.from(arrayBuffer);
     // Kirim foto dengan caption
     await bot.sendPhoto(chatId, buffer, { caption: "✅ Nih hasilnya" });
   } catch (e) {
     console.error(e);
     bot.sendMessage(chatId, "❌ Terjadi kesalahan saat menghubungi API.");
   }
 });

bot.onText(/^\/tourl$/, async (msg) => {
   const chatId = msg.chat.id;
   const messageId = msg.message_id;
   // Cek apakah command merupakan reply ke pesan lain
   if (!msg.reply_to_message ||
       (!msg.reply_to_message.document &&
        !msg.reply_to_message.photo &&
        !msg.reply_to_message.video)) {
     return bot.sendMessage(
       chatId,
       "❌ Silakan *reply* file/foto/video dengan command /tourl",
       { parse_mode: "Markdown" }
     );
   }
   const replied = msg.reply_to_message;
   let fileId, fileName;
   // Tentukan file_id dan nama file berdasarkan tipe konten
   if (replied.document) {
     fileId = replied.document.file_id;
     fileName = replied.document.file_name || `file_${Date.now()}`;
   } else if (replied.photo) {
     fileId = replied.photo[replied.photo.length - 1].file_id; // Ambil resolusi tertinggi
     fileName = `photo_${Date.now()}.jpg`;
   } else if (replied.video) {
     fileId = replied.video.file_id;
     fileName = `video_${Date.now()}.mp4`;
   } else {
     return bot.sendMessage(chatId, "❌ File tidak didukung.");
   }
   try {
     // Kirim pesan proses dan simpan ID pesannya
     const processingMsg = await bot.sendMessage(chatId, "⏳ Mengupload ke Catbox...");
     const processingMsgId = processingMsg.message_id;
     // Ambil detail file dari Telegram API
     const file = await bot.getFile(fileId);
     const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
     // Download stream file dari Telegram
     const fileStream = await axios.get(fileUrl, { responseType: "stream" });
     // Siapkan form data untuk upload ke Catbox
     const form = new FormData();
     form.append("reqtype", "fileupload");
     form.append("fileToUpload", fileStream.data, {
       filename: fileName,
       contentType: fileStream.headers["content-type"]
     });
     // Lakukan upload ke Catbox
     const uploadRes = await axios.post(
       "https://catbox.moe/user/api.php",
       form,
       { headers: form.getHeaders() }
     );
     const result = uploadRes.data.trim();
     // Cek apakah upload berhasil
     if (!result.startsWith("http")) {
       return bot.editMessageText(
         `❌ Catbox Error:\n${result}`,
         { chat_id: chatId, message_id: processingMsgId }
       );
     }
     // Update pesan proses dengan hasil sukses
     await bot.editMessageText(
       `✅ *Upload Berhasil!*\n📎 URL:\n${result}`,
       {
         chat_id: chatId,
         message_id: processingMsgId,
         parse_mode: "Markdown"
       }
     );
   } catch (err) {
     console.error("Kesalahan saat upload:", err);
     bot.sendMessage(chatId, "❌ Terjadi kesalahan saat upload ke Catbox.");
   }
 });
 
 bot.onText(/^\/dunia$/, async (msg) => {
   const chatId = msg.chat.id;
   await bot.sendMessage(chatId, "🌍 Sedang mengambil berita dunia...");
   try {
     const url = "https://feeds.bbci.co.uk/news/world/rss.xml";
     const res = await fetch(url);
     if (!res.ok) throw new Error("Gagal mengambil RSS feed");
     
     const xml = await res.text();
     // Ekstrak 5 judul dan link dari RSS
     const itemMatches = [...xml.matchAll(/<item>.*?<title><!\[CDATA\[(.*?)\]\]><\/title>.*?<link>(.*?)<\/link>/gs)];
     if (itemMatches.length === 0) throw new Error("Data kosong");
     const items = itemMatches
       .slice(0, 5)
       .map(match => `• [${match[1]}](${match[2]})`)
       .join("\n\n");
     const message = `🌎 *Berita Dunia Terbaru*\n\n${items}\n\n📰 _Sumber: ©Ganz News_`;
     await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
   } catch (e) {
     console.error(e);
     await bot.sendMessage(chatId, "⚠️ Gagal mengambil berita dunia. Coba lagi nanti.");
   }
 });


bot.onText(/\/ssweb (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const url = match[1];

  if (!url.startsWith("http")) {
    return bot.sendMessage(chatId, "❌ Tolong kirim link website valid (awali dengan http/https).");
  }

  try {
    await bot.sendMessage(chatId, "📸 Sedang mengambil screenshot...");

    // API utama (enzoxavier)
    const apiUrl = `https://api.enzoxavier.biz.id/api/ssweb?url=${encodeURIComponent(url)}`;
    let res;

    try {
      res = await axios.get(apiUrl, { responseType: "arraybuffer" });
    } catch (err) {
      console.log("API enzoxavier gagal, fallback ke Thum.io");
      // Fallback pakai Thum.io
      const fallbackUrl = `https://image.thum.io/get/fullpage/${encodeURIComponent(url)}`;
      res = await axios.get(fallbackUrl, { responseType: "arraybuffer" });
    }

    // Kirim foto ke Telegram
    await bot.sendPhoto(chatId, res.data, {
      caption: `✅ Screenshot dari:\n${url}`,
      filename: "screenshot.png",
      contentType: "image/png"
    });

  } catch (err) {
    console.error("SSWEB ERROR:", err.response?.data || err.message);
    // Pastikan objek bot dapat diakses di sini
    await bot.sendMessage(chatId, `❌ Gagal ambil screenshot: ${err.message || 'Tipe halaman tidak didukung'}`);
  }
});


bot.onText(/^\/(nulis)(.+)?$/, async (msg, match) => {
   const chatId = msg.chat.id;
   // Ambil teks yang akan ditulis setelah command
   const text = match[2] ? match[2].trim() : '';
   // Cek jika tidak ada teks yang dimasukkan
   if (!text) {
     return bot.sendMessage(chatId, 'mau nulis apa kak..');
   }
   try {
     // Buat URL API dengan parameter yang dienkode
     const imageUrl = `https://api-ikyzxc.vercel.app/canvas/nulis?apikey=kyzz&text=${encodeURIComponent(text)}`;
     
     // Kirim gambar beserta caption
     await bot.sendPhoto(chatId, imageUrl, {
       caption: 'berhasil..'
     });
   } catch (err) {
     console.error(err);
     bot.sendMessage(chatId, 'yah Error kak laporankan ke owner agar di perbaiki');
   }
 });
 
 bot.onText(/^\/brat/, async (msg) => {
   const chatId = msg.chat.id;
   const text = msg.text.split(" ").slice(1).join(" ");
   
   if (!text) return bot.sendMessage(chatId, "🪧 ☇ Format: /brat Ganz Ganteng Banget Jir");
   try {
     const apiURL = `https://api-ikyzxc.vercel.app/canvas/bratv1?apikey=kyzz&text=${encodeURIComponent(text)}`;
     const res = await axios.get(apiURL, { responseType: "arraybuffer" });
     await bot.sendSticker(chatId, Buffer.from(res.data));
   } catch (e) {
     console.error("Error saat membuat stiker:", e);
     bot.sendMessage(chatId, "❌ Gagal membuat stiker brat.");
   }
 });
 
const TicTacToe = require("./database/tictactoe");
let activeGames = {};
// Penyimpanan skor global pemain (akan terreset jika bot dimatikan)
let playerScores = {};

// Fungsi bantu untuk membuat mention pengguna
const formatUserMention = (userId, userName) => `[${userName || 'Pengguna'}](tg://user?id=${userId})`;

// Fungsi bantu untuk merender papan permainan
const renderGameBoard = (boardArray) => {
    const symbolMap = {
        'X': '❌',
        'O': '⭕',
        '1': '1️⃣',
        '2': '2️⃣',
        '3': '3️⃣',
        '4': '4️⃣',
        '5': '5️⃣',
        '6': '6️⃣',
        '7': '7️⃣',
        '8': '8️⃣',
        '9': '9️⃣'
    };
    const row1 = boardArray.slice(0, 3).map(s => symbolMap[s]).join(' ');
    const row2 = boardArray.slice(3, 6).map(s => symbolMap[s]).join(' ');
    const row3 = boardArray.slice(6, 9).map(s => symbolMap[s]).join(' ');
    return `\n${row1}\n${row2}\n${row3}\n`;
};

// Fungsi buat nama room otomatis pendek
const generateAutoRoomName = () => {
    const prefix = 'TTT';
    const randomNum = Math.floor(10 + Math.random() * 90); // Angka acak 2 digit
    return `${prefix}-${randomNum}`;
};

// Fungsi hitung skor berdasarkan jumlah kotak tersisa
const calculateScore = (emptySlots) => {
    // Aturan skor: semakin banyak kotak kosong saat menang, skor semakin tinggi
    switch(emptySlots) {
        case 6: return 100; // Menang di langkah ke-3 (paling cepat)
        case 5: return 75;  // Menang di langkah ke-4
        case 4: return 50;  // Menang di langkah ke-5
        case 3: return 30;  // Menang di langkah ke-6
        case 2: return 15;  // Menang di langkah ke-7
        case 1: return 5;   // Menang di langkah ke-8
        default: return 0;
    }
};

// Fungsi perbarui skor pemain
const updatePlayerScore = (userId, points) => {
    if (!playerScores[userId]) {
        playerScores[userId] = {
            total: 0,
            wins: 0,
            draws: 0,
            losses: 0
        };
    }

    playerScores[userId].total += points;
    if (points > 0) {
        playerScores[userId].wins += 1;
    } else if (points === 0) {
        playerScores[userId].draws += 1;
    } else {
        playerScores[userId].losses += 1;
    }
};

// Fungsi bersihkan sesi tidak aktif
const cleanUpInactiveGames = () => {
    const now = Date.now();
    const INACTIVE_THRESHOLD = 60000; // 1 menit
    Object.keys(activeGames).forEach(gameKey => {
        const game = activeGames[gameKey];
        if (now - game.lastActivityAt >= INACTIVE_THRESHOLD) {
            const msg = `⚠️ Sesi permainan *"${game.roomName}"* dihapus karena tidak aktif selama 1 menit.`;
            try {
                if (game.playerXChatId) bot.sendMessage(game.playerXChatId, msg, { parse_mode: 'Markdown' });
                if (game.playerOChatId) bot.sendMessage(game.playerOChatId, msg, { parse_mode: 'Markdown' });
            } catch (e) {
                console.log(`Gagal kirim pemberitahuan: ${e.message}`);
            }
            delete activeGames[gameKey];
        }
    });
};
setInterval(cleanUpInactiveGames, 30000);

// Handler perintah utama
// - /ttc = buat room baru otomatis
// - /ttc [nama-room] = gabung room (maks 2 pemain)
bot.onText(/^\/(tictactoe|ttc|ttt)(\s+([a-zA-Z0-9_-]{1,10}))?$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const userName = msg.from.first_name || 'Pengguna';
    const targetRoom = match[3] ? match[3].trim().toUpperCase() : null;

    // Cek jika pengguna sudah ada di permainan lain
    const existingGame = Object.values(activeGames).find(
        game => [game.game.playerX, game.game.playerO].includes(userId)
    );
    if (existingGame) {
        return bot.sendMessage(chatId, 
            `Kamu sedang dalam permainan *"${existingGame.roomName}"*!\nKetik /delttc untuk keluar atau lanjutkan bermain.`, 
            { parse_mode: 'Markdown' }
        );
    }

    // Jika ada target room = coba gabung
    if (targetRoom) {
        const waitingGame = Object.values(activeGames).find(
            game => game.state === 'WAITING' && game.roomName === targetRoom
        );

        if (!waitingGame) {
            return bot.sendMessage(chatId, `❌ Ruangan *"${targetRoom}"* tidak ditemukan!`, { parse_mode: 'Markdown' });
        }

        if (waitingGame.game.playerX === userId) {
            return bot.sendMessage(chatId, '❌ Kamu tidak bisa bergabung ke room yang kamu buat sendiri!', { parse_mode: 'Markdown' });
        }

        // Pembatasan maksimal 2 pemain per room
        if (waitingGame.playerOChatId !== null) {
            return bot.sendMessage(chatId, `❌ Ruangan *"${targetRoom}"* sudah penuh (maksimal 2 pemain)!`, { parse_mode: 'Markdown' });
        }

        // Gabungkan pemain ke room
        waitingGame.playerOChatId = chatId;
        waitingGame.game.playerO = userId;
        waitingGame.state = 'PLAYING';
        waitingGame.lastActivityAt = Date.now();

        // Dapatkan nama pemain X
        let playerXName = 'Pengguna';
        try {
            const data = await bot.getChat(waitingGame.game.playerX);
            playerXName = data.first_name || playerXName;
        } catch (e) {}

        // Tampilkan papan permainan
        const board = waitingGame.game.render();
        const boardStr = renderGameBoard(board);
        const turnMention = formatUserMention(waitingGame.game.currentTurn, playerXName);
        const gameMsg = `
*🎮 PERMAINAN DIMULAI*
*Nama Ruangan:* ${waitingGame.roomName}
${boardStr}
Giliran: ${turnMention}
💡 Aturan Skor: Semakin cepat menang, skor semakin tinggi!
❌: ${formatUserMention(waitingGame.game.playerX, playerXName)}
⭕: ${formatUserMention(userId, userName)}
        `;

        try {
            await bot.sendMessage(waitingGame.playerXChatId, gameMsg, { parse_mode: 'Markdown' });
            await bot.sendMessage(chatId, gameMsg, { parse_mode: 'Markdown' });
        } catch (e) {
            bot.sendMessage(chatId, '⚠️ Gagal kirim pesan ke pemain lain!', { parse_mode: 'Markdown' });
            delete activeGames[waitingGame.roomId];
        }
    } 
    // Jika tidak ada target room = buat room baru
    else {
        const autoRoom = generateAutoRoomName();
        const newGameId = `ttt-${Date.now()}`;

        activeGames[newGameId] = {
            roomId: newGameId,
            roomName: autoRoom,
            playerXChatId: chatId,
            playerOChatId: null,
            game: new TicTacToe(userId),
            state: 'WAITING',
            createdAt: Date.now(),
            lastActivityAt: Date.now()
        };

        bot.sendMessage(chatId, 
            `✅ Ruangan baru dibuat!\n*Nama Ruangan:* ${autoRoom}\nTemanmu bisa gabung dengan */ttc ${autoRoom}*\n💡 Skor berdasarkan kecepatan menang!`, 
            { parse_mode: 'Markdown' }
        );
    }
});

// Handler aksi permainan (nomor 1-9 atau surrender)
bot.onText(/^([1-9]|surrender|give up)$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const userName = msg.from.first_name || 'Pengguna';
    const input = msg.text.trim().toLowerCase();

    // Cari permainan aktif pengguna
    const userGame = Object.values(activeGames).find(
        game => [game.game.playerX, game.game.playerO].includes(userId)
    );
    if (!userGame) {
        const waitingGame = Object.values(activeGames).find(
            game => game.game.playerX === userId && game.state === 'WAITING'
        );
        if (waitingGame) {
            return bot.sendMessage(chatId, 
                `⚠️ Tunggu pemain lain gabung ke ruangan *"${waitingGame.roomName}"*!\nBeritahu temanmu untuk ketik */ttc ${waitingGame.roomName}*`, 
                { parse_mode: 'Markdown' }
            );
        } else {
            return bot.sendMessage(chatId, '❌ Kamu tidak sedang dalam permainan apapun!', { parse_mode: 'Markdown' });
        }
    }

    // Perbarui waktu aktivitas
    userGame.lastActivityAt = Date.now();
    let isSurrender = ['surrender', 'give up'].includes(input);
    let statusCode = 1;
    let gameEnded = false;
    let winner = null;
    let emptySlots = 0;
    let winnerPoints = 0;
    let loserPoints = 0;

    // Proses langkah permainan
    if (!isSurrender) {
        const position = parseInt(input);
        const isPlayerO = userId === userGame.game.playerO ? 1 : 0;
        statusCode = userGame.game.turn(isPlayerO, position);

        const errorMsgs = {
            '-3': '❌ Permainan sudah berakhir!',
            '-2': '❌ Bukan giliranmu!',
            '-1': '❌ Posisi tidak valid (gunakan 1-9)!',
            '0': '❌ Posisi sudah ditempati!'
        };
        if (statusCode < 1) {
            return bot.sendMessage(chatId, errorMsgs[statusCode], { parse_mode: 'Markdown' });
        }

        // Hitung jumlah kotak kosong
        const board = userGame.game.render();
        emptySlots = board.filter(s => !['X', 'O'].includes(s)).length;
    } else {
        // Jika menyerah
        winner = userId === userGame.game.playerX ? userGame.game.playerO : userGame.game.playerX;
        winnerPoints = 10; // Skor untuk menang karena lawan menyerah
        loserPoints = -5;  // Penalti untuk menyerah
        gameEnded = true;
    }

    // Cek status akhir permainan
    if (!isSurrender) {
        winner = userGame.game.winner;
        gameEnded = winner || userGame.game.board === 511;

        if (winner) {
            winnerPoints = calculateScore(emptySlots);
            loserPoints = 0;
        } else if (gameEnded) {
            winnerPoints = 0;
            loserPoints = 0;
        }
    }

    // Perbarui skor jika permainan berakhir
    if (gameEnded) {
        if (winner) {
            updatePlayerScore(winner, winnerPoints);
            const loserId = winner === userGame.game.playerX ? userGame.game.playerO : userGame.game.playerX;
            updatePlayerScore(loserId, loserPoints);
        } else {
            updatePlayerScore(userGame.game.playerX, 0);
            updatePlayerScore(userGame.game.playerO, 0);
        }
    }

    // Siapkan pesan hasil
    const board = userGame.game.render();
    const boardStr = renderGameBoard(board);
    let gameMsg = '';
    let playerXName = 'Pengguna', playerOName = 'Pengguna';
    let scoreX = playerScores[userGame.game.playerX]?.total || 0;
    let scoreO = playerScores[userGame.game.playerO]?.total || 0;

    try {
        const dataX = await bot.getChat(userGame.game.playerX);
        const dataO = await bot.getChat(userGame.game.playerO);
        playerXName = dataX.first_name || playerXName;
        playerOName = dataO.first_name || playerOName;
    } catch (e) {}

    if (gameEnded) {
        gameMsg = `
*🎮 PERMAINAN SELESAI*
*Nama Ruangan:* ${userGame.roomName}
${boardStr}
${winner 
    ? `${formatUserMention(winner, winner === userGame.game.playerX ? playerXName : playerOName)} MENANG! 🎉\n💯 Skor yang didapat: ${winnerPoints}` 
    : '🤝 PERMAINAN SERI!'}
❌: ${formatUserMention(userGame.game.playerX, playerXName)} | Total Skor: ${scoreX}
⭕: ${formatUserMention(userGame.game.playerO, playerOName)} | Total Skor: ${scoreO}
        `;
        delete activeGames[userGame.roomId];
    } else {
        const turnId = userGame.game.currentTurn;
        const turnName = turnId === userGame.game.playerX ? playerXName : playerOName;
        const turnMention = formatUserMention(turnId, turnName);
        
        gameMsg = `
*🎮 PERMAINAN BERLANJUT*
*Nama Ruangan:* ${userGame.roomName}
${boardStr}
Giliran: ${turnMention}
❌: ${formatUserMention(userGame.game.playerX, playerXName)} | Total Skor: ${scoreX}
⭕: ${formatUserMention(userGame.game.playerO, playerOName)} | Total Skor: ${scoreO}
        `;
    }

    // Kirim pesan ke kedua pemain
    try {
        await bot.sendMessage(userGame.playerXChatId, gameMsg, { parse_mode: 'Markdown' });
        await bot.sendMessage(userGame.playerOChatId, gameMsg, { parse_mode: 'Markdown' });
    } catch (e) {
        bot.sendMessage(chatId, '⚠️ Gagal kirim pembaruan, permainan diakhiri!', { parse_mode: 'Markdown' });
        delete activeGames[userGame.roomId];
    }
});

// Handler perintah /delttc untuk keluar permainan
bot.onText(/^\/(delttc|delttt)$/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const userName = msg.from.first_name || 'Pengguna';

    const gameKey = Object.keys(activeGames).find(
        key => [activeGames[key].game.playerX, activeGames[key].game.playerO].includes(userId)
    );

    if (gameKey) {
        const deletedGame = activeGames[gameKey];
        const exitMsg = `⚠️ Pemain ${formatUserMention(userId, userName)} telah keluar dari permainan!`;

        try {
            if (deletedGame.state === 'PLAYING' && deletedGame.playerOChatId) {
                const otherChatId = deletedGame.game.playerX === userId ? deletedGame.playerOChatId : deletedGame.playerXChatId;
                bot.sendMessage(otherChatId, exitMsg, { parse_mode: 'Markdown' });
            }
        } catch (e) {}

        delete activeGames[gameKey];
        bot.sendMessage(chatId, '✅ Sesi permainan berhasil dihapus!', { parse_mode: 'Markdown' });
    } else {
        bot.sendMessage(chatId, '❌ Kamu tidak sedang dalam permainan apapun!', { parse_mode: 'Markdown' });
    }
});

// Handler perintah /listttc untuk melihat daftar ruangan yang sedang menunggu
bot.onText(/^\/listttc$/, async (msg) => {
    const chatId = msg.chat.id;
    const waitingGames = Object.values(activeGames).filter(game => game.state === 'WAITING');

    if (waitingGames.length === 0) {
        return bot.sendMessage(chatId, 'ℹ️ Tidak ada ruangan permainan TicTacToe yang sedang menunggu pemain.', { parse_mode: 'Markdown' });
    }

    let listMsg = '*📋 DAFTAR RUANGAN PERMAINAN YANG SEDANG MENUNGGU:*\n';
    for (const game of waitingGames) {
        let creatorName = 'Pembuat';
        let creatorTotalScore = 0;

        // Dapatkan nama dan skor pembuat ruangan jika tersedia
        try {
            const creatorData = await bot.getChat(game.game.playerX);
            creatorName = creatorData.first_name || creatorName;
            creatorTotalScore = playerScores[game.game.playerX]?.total || 0;
        } catch (e) {}

        listMsg += `- *Nama Ruangan:* ${game.roomName}\n` +
                   `  *Pembuat:* ${formatUserMention(game.game.playerX, creatorName)}\n` +
                   `  *Total Skor Pembuat:* ${creatorTotalScore}\n` +
                   `  *Cara Gabung:* /ttc ${game.roomName}\n` +
                   `  *Status:* Menunggu pemain kedua\n\n`;
    }

    // Batasi panjang pesan agar tidak melebihi batas Telegram
    if (listMsg.length > 4096) {
        listMsg = '*📋 DAFTAR RUANGAN PERMAINAN YANG SEDANG MENUNGGU:*\n' +
                  '⚠️ Jumlah ruangan terlalu banyak, hanya menampilkan sebagian:\n\n';
        const limitedGames = waitingGames.slice(0, 10); // Tampilkan maksimal 10 ruangan
        for (const game of limitedGames) {
            let creatorName = 'Pembuat';
            try {
                const creatorData = await bot.getChat(game.game.playerX);
                creatorName = creatorData.first_name || creatorName;
            } catch (e) {}
            listMsg += `- *Nama Ruangan:* ${game.roomName}\n` +
                       `  *Pembuat:* ${formatUserMention(game.game.playerX, creatorName)}\n` +
                       `  *Cara Gabung:* /ttc ${game.roomName}\n\n`;
        }
    }

    bot.sendMessage(chatId, listMsg, { parse_mode: 'Markdown' });
});

 // Tangani perintah /ai dengan pesan tambahan
 bot.onText(/^\/ai (.+)$/, async (msg, match) => {
     const chatId = msg.chat.id;
     const userQuestion = match[1];
     try {
         const apiUrl = `${apiBaseUrl}?apikey=kyzz&question=${encodeURIComponent(userQuestion)}`;
         const response = await axios.get(apiUrl);
         const aiResponse = response.data.result;
         // Kirim jawaban API dan simpan ID pesannya
         const sentApiReply = await bot.sendMessage(chatId, aiResponse);
         apiReplyMessageIds.add(sentApiReply.message_id);
     } catch (error) {
         console.error('Kesalahan:', error);
         bot.sendMessage(chatId, 'Maaf, terjadi kesalahan saat mengambil respons AI.');
     }
 });
 // Tangani kasus hanya mengetik /ai tanpa pesan
 bot.onText(/^\/ai$/, (msg) => {
     const chatId = msg.chat.id;
     bot.sendMessage(chatId, 'Silakan tambahkan pesan setelah perintah /ai. Contoh: /ai halo ai apa kabar');
 });
 // Tangani pesan reply yang hanya ditujukan ke jawaban API
 bot.on('message', async (msg) => {
     // Cek kondisi:
     // 1. Pesan adalah reply
     // 2. Pesan yang direply adalah dari bot
     // 3. ID pesan yang direply ada di daftar jawaban API
     if (
         msg.reply_to_message &&
         msg.reply_to_message.from.is_bot &&
         apiReplyMessageIds.has(msg.reply_to_message.message_id)
     ) {
         const chatId = msg.chat.id;
         const userReplyText = msg.text;
         try {
             const apiUrl = `${apiBaseUrl}?apikey=kyzz&question=${encodeURIComponent(userReplyText)}`;
             const response = await axios.get(apiUrl);
             const aiResponse = response.data.result;
             // Kirim jawaban baru dari API dan simpan ID pesannya
             const sentNewApiReply = await bot.sendMessage(chatId, aiResponse, {
                 reply_to_message_id: msg.message_id // Balas langsung ke pesan user
             });
             apiReplyMessageIds.add(sentNewApiReply.message_id);
         } catch (error) {
             console.error('Kesalahan:', error);
             bot.sendMessage(chatId, 'Maaf, terjadi kesalahan saat mengambil respons AI.');
         }
     }
 });
 
 bot.onText(/^\/metaai (.+)$/, async (msg, match) => {
     const chatId = msg.chat.id;
     const userQuestion = match[1];
     try {
         const apiUrl = `https://ikyyzyyrestapi.my.id/ai/metaai?apikey=kyzz&text=${encodeURIComponent(userQuestion)}`;
         const response = await axios.get(apiUrl);
         const aiResponse = response.data.result;
         // Kirim jawaban API dan simpan ID pesannya
         const sentApiReply = await bot.sendMessage(chatId, aiResponse);
         apiReplyMessageIds.add(sentApiReply.message_id);
     } catch (error) {
         console.error('Kesalahan:', error);
         bot.sendMessage(chatId, 'Maaf, terjadi kesalahan saat mengambil respons AI.');
     }
 });
 // Tangani kasus hanya mengetik /ai tanpa pesan
 bot.onText(/^\/metaai$/, (msg) => {
     const chatId = msg.chat.id;
     bot.sendMessage(chatId, 'Silakan tambahkan pesan setelah perintah /ai. Contoh: /ai halo ai apa kabar');
 });
 // Tangani pesan reply yang hanya ditujukan ke jawaban API
 bot.on('message', async (msg) => {
     // Cek kondisi:
     // 1. Pesan adalah reply
     // 2. Pesan yang direply adalah dari bot
     // 3. ID pesan yang direply ada di daftar jawaban API
     if (
         msg.reply_to_message &&
         msg.reply_to_message.from.is_bot &&
         apiReplyMessageIds.has(msg.reply_to_message.message_id)
     ) {
         const chatId = msg.chat.id;
         const userReplyText = msg.text;
         try {
             const apiUrl = `https://ikyyzyyrestapi.my.id/ai/metaai?apikey=kyzz&text=${encodeURIComponent(userReplyText)}`;
             const response = await axios.get(apiUrl);
             const aiResponse = response.data.result;
             // Kirim jawaban baru dari API dan simpan ID pesannya
             const sentNewApiReply = await bot.sendMessage(chatId, aiResponse, {
                 reply_to_message_id: msg.message_id // Balas langsung ke pesan user
             });
             apiReplyMessageIds.add(sentNewApiReply.message_id);
         } catch (error) {
             console.error('Kesalahan:', error);
             bot.sendMessage(chatId, 'Maaf, terjadi kesalahan saat mengambil respons AI.');
         }
     }
 });
 
 bot.onText(/^\/geminiai (.+)$/, async (msg, match) => {
     const chatId = msg.chat.id;
     const userQuestion = match[1];
     try {
         const apiUrl = `https://ikyyzyyrestapi.my.id/ai/gemini?apikey=kyzz&q=${encodeURIComponent(userQuestion)}`;
         const response = await axios.get(apiUrl);
         const aiResponse = response.data.result;
         // Kirim jawaban API dan simpan ID pesannya
         const sentApiReply = await bot.sendMessage(chatId, aiResponse);
         apiReplyMessageIds.add(sentApiReply.message_id);
     } catch (error) {
         console.error('Kesalahan:', error);
         bot.sendMessage(chatId, 'Maaf, terjadi kesalahan saat mengambil respons AI.');
     }
 });
 // Tangani kasus hanya mengetik /ai tanpa pesan
 bot.onText(/^\/geminiai$/, (msg) => {
     const chatId = msg.chat.id;
     bot.sendMessage(chatId, 'Silakan tambahkan pesan setelah perintah /ai. Contoh: /ai halo ai apa kabar');
 });
 // Tangani pesan reply yang hanya ditujukan ke jawaban API
 bot.on('message', async (msg) => {
     // Cek kondisi:
     // 1. Pesan adalah reply
     // 2. Pesan yang direply adalah dari bot
     // 3. ID pesan yang direply ada di daftar jawaban API
     if (
         msg.reply_to_message &&
         msg.reply_to_message.from.is_bot &&
         apiReplyMessageIds.has(msg.reply_to_message.message_id)
     ) {
         const chatId = msg.chat.id;
         const userReplyText = msg.text;
         try {
             const apiUrl = `https://ikyyzyyrestapi.my.id/ai/gemini?apikey=kyzz&q=${encodeURIComponent(userReplyText)}`;
             const response = await axios.get(apiUrl);
             const aiResponse = response.data.result;
             // Kirim jawaban baru dari API dan simpan ID pesannya
             const sentNewApiReply = await bot.sendMessage(chatId, aiResponse, {
                 reply_to_message_id: msg.message_id // Balas langsung ke pesan user
             });
             apiReplyMessageIds.add(sentNewApiReply.message_id);
         } catch (error) {
             console.error('Kesalahan:', error);
             bot.sendMessage(chatId, 'Maaf, terjadi kesalahan saat mengambil respons AI.');
         }
     }
 });
 
 bot.onText(/^\/publicai (.+)$/, async (msg, match) => {
     const chatId = msg.chat.id;
     const userQuestion = match[1];
     try {
         const apiUrl = `https://ikyyzyyrestapi.my.id/ai/publicai?apikey=kyzz&q=${encodeURIComponent(userQuestion)}`;
         const response = await axios.get(apiUrl);
         const aiResponse = response.data.result;
         // Kirim jawaban API dan simpan ID pesannya
         const sentApiReply = await bot.sendMessage(chatId, aiResponse);
         apiReplyMessageIds.add(sentApiReply.message_id);
     } catch (error) {
         console.error('Kesalahan:', error);
         bot.sendMessage(chatId, 'Maaf, terjadi kesalahan saat mengambil respons AI.');
     }
 });
 // Tangani kasus hanya mengetik /ai tanpa pesan
 bot.onText(/^\/publicai$/, (msg) => {
     const chatId = msg.chat.id;
     bot.sendMessage(chatId, 'Silakan tambahkan pesan setelah perintah /ai. Contoh: /ai halo ai apa kabar');
 });
 // Tangani pesan reply yang hanya ditujukan ke jawaban API
 bot.on('message', async (msg) => {
     // Cek kondisi:
     // 1. Pesan adalah reply
     // 2. Pesan yang direply adalah dari bot
     // 3. ID pesan yang direply ada di daftar jawaban API
     if (
         msg.reply_to_message &&
         msg.reply_to_message.from.is_bot &&
         apiReplyMessageIds.has(msg.reply_to_message.message_id)
     ) {
         const chatId = msg.chat.id;
         const userReplyText = msg.text;
         try {
             const apiUrl = `https://ikyyzyyrestapi.my.id/ai/publicai?apikey=kyzz&q=${encodeURIComponent(userReplyText)}`;
             const response = await axios.get(apiUrl);
             const aiResponse = response.data.result;
             // Kirim jawaban baru dari API dan simpan ID pesannya
             const sentNewApiReply = await bot.sendMessage(chatId, aiResponse, {
                 reply_to_message_id: msg.message_id // Balas langsung ke pesan user
             });
             apiReplyMessageIds.add(sentNewApiReply.message_id);
         } catch (error) {
             console.error('Kesalahan:', error);
             bot.sendMessage(chatId, 'Maaf, terjadi kesalahan saat mengambil respons AI.');
         }
     }
 });
 
 // Fungsi untuk memanggil API dan mengirim respons ke user
 const callFixErrorApi = async (chatId, inputText, replyToMsgId = null) => {
     try {
         const apiUrl = `${apiBaseUrll}?apikey=kyzz&text=${encodeURIComponent(inputText)}`;
         const response = await axios.get(apiUrl);
         const aiResponse = response.data.result;
         // Kirim jawaban API dan simpan ID pesannya
         const sentMsg = await bot.sendMessage(chatId, aiResponse, {
             reply_to_message_id: replyToMsgId
         });
         apiReplyMessageIds.add(sentMsg.message_id);
     } catch (error) {
         console.error('Kesalahan akses API:', error);
         bot.sendMessage(chatId, 'Maaf, terjadi kesalahan saat memproses permintaan Anda.', {
             reply_to_message_id: replyToMsgId
         });
     }
 };
 
 // Perintah utama: /fixerror [teks] atau hanya /fixerror untuk dokumen
 bot.onText(/^\/fixerror(?: (.+))?$/, async (msg, match) => {
     const chatId = msg.chat.id;
     const userText = match[1]; // Ambil teks setelah /fixerror jika ada
     // Jika ada teks langsung dari perintah
     if (userText) {
         await callFixErrorApi(chatId, userText, msg.message_id);
     }
     // Jika tidak ada teks, cek apakah perintah adalah reply ke dokumen/teks
     else if (msg.reply_to_message) {
         const repliedMsg = msg.reply_to_message;
         // Jika yang direply adalah teks
         if (repliedMsg.text) {
             await callFixErrorApi(chatId, repliedMsg.text, msg.message_id);
         }
         // Jika yang direply bukan teks/dokumen
         else {
             bot.sendMessage(chatId, 'Mohon reply ke teks. atau tambahkan teks setelah /fixerror.', {
                 reply_to_message_id: msg.message_id
             });
         }
     }
     // Jika tidak ada teks dan tidak reply ke apa-apa
     else {
         bot.sendMessage(chatId, 'Cara penggunaan:\n /fixerror [teks yang perlu diperbaiki atau kirimkan pertanyaan]\n');
     }
 });
 // Tangani reply langsung ke jawaban API (tanpa perlu mengetik /fixerror lagi)
 bot.on('message', async (msg) => {
     // Cek apakah pesan adalah reply ke jawaban API dari fitur fixerror
     if (
         msg.reply_to_message &&
         msg.reply_to_message.from.is_bot &&
         apiReplyMessageIds.has(msg.reply_to_message.message_id)
     ) {
         const chatId = msg.chat.id;
         let inputContent = '';
         // Jika yang dikirim adalah teks
         if (msg.text) {
             inputContent = msg.text;
         }
         // Jika bukan teks/dokumen
         else {
             bot.sendMessage(chatId, 'Mohon kirim teks untuk diperbaiki.', {
                 reply_to_message_id: msg.message_id
             });
             return;
         }
         // Panggil API dengan konten yang diterima
         await callFixErrorApi(chatId, inputContent, msg.message_id);
     }
 });
 
 const callFixErrorApii = async (chatId, inputText, replyToMsgId = null) => {
     try {
         const apiUrl = `https://api-ikyzxc.vercel.app/ai/openai?apikey=kyzz&text=${encodeURIComponent(inputText)}`;
         const response = await axios.get(apiUrl);
         const aiResponse = response.data.result;
         // Kirim jawaban API dan simpan ID pesannya
         const sentMsg = await bot.sendMessage(chatId, aiResponse, {
             reply_to_message_id: replyToMsgId
         });
         apiReplyMessageIds.add(sentMsg.message_id);
     } catch (error) {
         console.error('Kesalahan akses API:', error);
         bot.sendMessage(chatId, 'Maaf, terjadi kesalahan saat memproses permintaan Anda.', {
             reply_to_message_id: replyToMsgId
         });
     }
 };
 
 bot.onText(/^\/checkerror(?: (.+))?$/, async (msg, match) => {
     const chatId = msg.chat.id;
     const userText = match[1]; // Ambil teks setelah /fixerror jika ada
     // Jika ada teks langsung dari perintah
     if (userText) {
         await callFixErrorApii(chatId, userText, msg.message_id);
     }
     // Jika tidak ada teks, cek apakah perintah adalah reply ke dokumen/teks
     else if (msg.reply_to_message) {
         const repliedMsg = msg.reply_to_message;
         // Jika yang direply adalah teks
         if (repliedMsg.text) {
             await callFixErrorApii(chatId, repliedMsg.text, msg.message_id);
         }
         // Jika yang direply bukan teks/dokumen
         else {
             bot.sendMessage(chatId, 'Mohon reply ke teks. atau tambahkan teks setelah /checkerror.', {
                 reply_to_message_id: msg.message_id
             });
         }
     }
     // Jika tidak ada teks dan tidak reply ke apa-apa
     else {
         bot.sendMessage(chatId, 'Cara penggunaan:\n /checkerror [teks yang perlu diperbaiki atau kirimkan pertanyaan]\n');
     }
 });
 // Tangani reply langsung ke jawaban API (tanpa perlu mengetik /fixerror lagi)
 bot.on('message', async (msg) => {
     // Cek apakah pesan adalah reply ke jawaban API dari fitur fixerror
     if (
         msg.reply_to_message &&
         msg.reply_to_message.from.is_bot &&
         apiReplyMessageIds.has(msg.reply_to_message.message_id)
     ) {
         const chatId = msg.chat.id;
         let inputContent = '';
         // Jika yang dikirim adalah teks
         if (msg.text) {
             inputContent = msg.text;
         }
         // Jika bukan teks/dokumen
         else {
             bot.sendMessage(chatId, 'Mohon kirim teks untuk diperbaiki.', {
                 reply_to_message_id: msg.message_id
             });
             return;
         }
         // Panggil API dengan konten yang diterima
         await callFixErrorApii(chatId, inputContent, msg.message_id);
     }
 });

// Set untuk menyimpan ID pesan balasan dari bot
const idPesanBalasanBot = new Set();

// Fungsi untuk membuat konten teks dokumen
const buatKontenDokumen = (dataHasil) => {
    const infoHeader = dataHasil.result.result.header;
    const detailItem = dataHasil.result.result.items;

    let konten = `=========================================
        HASIL PEMERIKSAAN IMEI
=========================================
Dibuat oleh: ${dataHasil.creator}
Waktu Permintaan: ${new Date(dataHasil.timestamp).toLocaleString('id-ID')}
Waktu Respon API: ${dataHasil.responseTime}

=========================================
        INFORMASI UTAMA PERANGKAT
=========================================
Merek          : ${infoHeader.brand}
Model          : ${infoHeader.model}
Nomor IMEI     : ${infoHeader.imei}
Link Gambar    : ${infoHeader.photo}

`;

    // Tambahkan detail spesifikasi
    detailItem.forEach(item => {
        if (item.role === 'header') {
            konten += `\n=========================================\n        ${item.title.toUpperCase()}\n=========================================\n`;
        } else if (item.role === 'item') {
            konten += `${item.title.padEnd(20)} : ${item.content}\n`;
        } else if (item.role === 'button') {
            konten += `${item.title.padEnd(20)} : ${item.content}\n`;
        }
    });

    konten += `\n=========================================
*Catatan: Link tambahan mungkin tidak dapat diakses karena jenis halaman tidak didukung*
=========================================`;
    return konten;
};

// Fungsi untuk memanggil API dan mengirim dokumen
const periksaIMEI = async (idChat, nomorIMEI, idPesanBalasan) => {
    try {
        const urlAPI = `https://api-ikyzxc.vercel.app/tools/imei?apikey=kyzz&imei=${encodeURIComponent(nomorIMEI)}`;
        const respons = await axios.get(urlAPI);
        const dataHasil = respons.data;

        if (!dataHasil.status) {
            await bot.sendMessage(idChat, '⚠️ Maaf, tidak dapat mendapatkan data dari server.', { reply_to_message_id: idPesanBalasan });
            return;
        }

        // Buat konten dokumen
        const kontenDokumen = buatKontenDokumen(dataHasil);
        // Tentukan nama file
        const namaFile = `Hasil_Pemeriksaan_IMEI_${nomorIMEI}.txt`;
        const pathFile = path.join(__dirname, namaFile);

        // Tulis konten ke file lokal
        fs.writeFileSync(pathFile, kontenDokumen, 'utf8');

        // Kirim file sebagai dokumen ke Telegram
        const pesanDikirim = await bot.sendDocument(idChat, pathFile, {
            caption: `📄 Hasil Pemeriksaan IMEI untuk nomor *${nomorIMEI}*`,
            reply_to_message_id: idPesanBalasan,
            parse_mode: 'Markdown'
        });

        // Hapus file lokal setelah dikirim agar tidak menumpuk
        fs.unlinkSync(pathFile);

        idPesanBalasanBot.add(pesanDikirim.message_id);

    } catch (kesalahan) {
        console.error('❌ Kesalahan saat memproses:', kesalahan);
        await bot.sendMessage(idChat, '⚠️ Maaf, terjadi kesalahan saat memproses permintaan Anda.', {
            reply_to_message_id: idPesanBalasan
        });
    }
};

// Tangani perintah /checkimei
bot.onText(/^\/checkimei(?: (.+))?$/, async (pesan, kecocokan) => {
    const idChat = pesan.chat.id;
    const nomorIMEI = kecocokan[1];

    if (nomorIMEI) {
        await periksaIMEI(idChat, nomorIMEI, pesan.message_id);
    } else if (pesan.reply_to_message && pesan.reply_to_message.text) {
        await periksaIMEI(idChat, pesan.reply_to_message.text, pesan.message_id);
    } else {
        await bot.sendMessage(idChat, '📝 *CARA PENGGUNAAN:*\n/checkimei [nomor imei]\n\nContoh: /checkimei 812405731928523', {
            reply_to_message_id: pesan.message_id,
            parse_mode: 'Markdown'
        });
    }
});

// Tangani balasan langsung ke dokumen hasil pemeriksaan
bot.on('message', async (pesan) => {
    if (pesan.reply_to_message && pesan.reply_to_message.from.is_bot && idPesanBalasanBot.has(pesan.reply_to_message.message_id)) {
        const idChat = pesan.chat.id;
        if (pesan.text) {
            await periksaIMEI(idChat, pesan.text, pesan.message_id);
        } else {
            await bot.sendMessage(idChat, '❌ Mohon kirim nomor IMEI dalam bentuk teks.', {
                reply_to_message_id: pesan.message_id
            });
        }
    }
});

// Logika Check Operator \\

const buatKontenDokumenn = (dataHasil) => {
    let konten = `=========================================
        HASIL CEK OPERATOR NOMOR HP
=========================================
Status Pengecekan  : ${dataHasil.status ? 'Berhasil' : 'Gagal'}
Creator API        : Ganzz Alwayss
-----------------------------------------
Nomor HP Asli      : ${dataHasil.result.phone.replace('62', '0')}
Nomor HP Internasional : ${dataHasil.result.phone}
Nama Operator      : ${dataHasil.result.operator}
=========================================
Catatan: Semua data diambil dari API resmi
=========================================`;
    return konten;
};

// Fungsi untuk memanggil API dan mengirim hasil sebagai dokumen
const cekOperator = async (idChat, nomorHp, idPesanBalasan) => {
    try {
        // Siapkan URL API dengan nomor HP yang dienkode
        const urlAPI = `https://api-ikyzxc.vercel.app/tools/operator?apikey=kyzz&phone=${encodeURIComponent(nomorHp)}`;
        const respons = await axios.get(urlAPI);
        const dataHasil = respons.data;

        // Cek status respons API
        if (!dataHasil.status) {
            await bot.sendMessage(idChat, '⚠️ Maaf, tidak dapat mengambil data operator.', {
                reply_to_message_id: idPesanBalasan
            });
            return;
        }

        // Buat konten dokumen
        const kontenDokumen = buatKontenDokumenn(dataHasil);
        // Tentukan nama file dengan nomor HP agar unik
        const namaFile = `Hasil_Cek_Operator_${dataHasil.result.phone}.txt`;
        const pathFile = path.join(__dirname, namaFile);

        // Tulis konten ke file lokal
        fs.writeFileSync(pathFile, kontenDokumen, 'utf8');

        // Kirim file sebagai dokumen ke Telegram
        await bot.sendDocument(idChat, pathFile, {
            caption: `📄 Hasil Cek Operator untuk Nomor *${dataHasil.result.phone.replace('62', '0')}*`,
            reply_to_message_id: idPesanBalasan,
            parse_mode: 'Markdown'
        });

        // Hapus file lokal setelah dikirim agar tidak menumpuk
        fs.unlinkSync(pathFile);

    } catch (kesalahan) {
        console.error('❌ Kesalahan saat memproses permintaan:', kesalahan);
        await bot.sendMessage(idChat, '⚠️ Maaf, terjadi kesalahan saat mengecek operator. Silakan periksa nomor HP atau coba lagi nanti.', {
            reply_to_message_id: idPesanBalasan
        });
    }
};

// Tangani perintah /cekoperator
bot.onText(/^\/operatorchecking(?: (.+))?$/, async (pesan, kecocokan) => {
    const idChat = pesan.chat.id;
    const nomorHp = kecocokan[1];
    const idPesanBalasan = pesan.message_id;

    // Jika pengguna langsung memasukkan nomor HP setelah perintah
    if (nomorHp) {
        await cekOperator(idChat, nomorHp, idPesanBalasan);
    } 
    // Jika pengguna membalas pesan teks yang berisi nomor HP
    else if (pesan.reply_to_message && pesan.reply_to_message.text) {
        await cekOperator(idChat, pesan.reply_to_message.text, idPesanBalasan);
    } 
    // Jika tidak ada nomor HP yang diberikan
    else {
        await bot.sendMessage(idChat, '❌ *FORMAT SALAH!* ❌\n\n📌 Cara penggunaan: `/operatorchecking nomor telepon`\n\n✨ Contoh: `/operatorchecking 081376547865`', {
            reply_to_message_id: idPesanBalasan,
            parse_mode: 'Markdown'
        });
    }
});


// Tangani perintah /cekoperator
bot.onText(/^\/operatorchecking(?: (.+))?$/, async (pesan, kecocokan) => {
    const idChat = pesan.chat.id;
    const nomorHp = kecocokan[1];

    // Jika pengguna langsung memasukkan nomor HP setelah perintah
    if (nomorHp) {
        await cekOperator(idChat, nomorHp, pesan.message_id);
    } 
    // Jika pengguna membalas pesan teks yang berisi nomor HP
    else if (pesan.reply_to_message && pesan.reply_to_message.text) {
        await cekOperator(idChat, pesan.reply_to_message.text, pesan.message_id);
    } 
    // Jika tidak ada nomor HP yang diberikan
    else {
        await bot.sendMessage(idChat, '📝 *CARA PENGGUNAAN:*\n/cekoperator [nomor HP yang akan diperiksa]\n\nContoh: /cekoperator 081376547865', {
            reply_to_message_id: idPesan.message_id,
            parse_mode: 'Markdown'
        });
    }
});

 // Handler perintah /tofigure
 const BASE_API_URL = 'https://api-ikyzxc.vercel.app/edit/tofigure?apikey=kyzz&image=';
 // Handler perintah /tofigure
 bot.onText(/^\/tofigure(.+)?$/, async (msg, match) => {
     const chatId = msg.chat.id;
     const imageLink = match[1]?.trim();
     if (!imageLink) {
         return bot.sendMessage(chatId, '❌ Gagal! Silakan sertakan link foto setelah perintah, contoh: /tofigure https://link-foto-anda.com/foto.jpg');
     }
     try {
         const fullApiUrl = BASE_API_URL + encodeURIComponent(imageLink);
         // Ambil respons JSON dari API
         const apiResponse = await axios.get(fullApiUrl);
         const apiData = apiResponse.data;
         // Kirim foto dari URL generated.url beserta caption data respons
         await bot.sendPhoto(chatId, apiData.generated.url, {
             caption: JSON.stringify(apiData, null, 2)
         });
     } catch (error) {
         console.error('Kesalahan:', error.message);
         let errorMsg = '❌ Terjadi kesalahan! ';
         if (error.response?.data) {
             errorMsg += JSON.stringify(error.response.data);
         } else if (error.message.includes('The file type is not currently supported')) {
             errorMsg += 'The file type is not currently supported. Please try another file type.';
         } else {
             errorMsg += error.message;
         }
         bot.sendMessage(chatId, errorMsg);
     }
 });
 
  async function sendVideoStickerFromAPI(chatId, text) {
     try {
         const encodedText = encodeURIComponent(text);
         const apiUrl = `https://indictivecore-api.vercel.app/imagecreator/bratvid?apikey=pixz&text=${encodedText}`;
         const response = await axios({
             method: 'get',
             url: apiUrl,
             responseType: 'stream',
         });
         const tempFilePath = path.join(__dirname, 'temp-sticker.webm');
         const writer = fs.createWriteStream(tempFilePath);
         response.data.pipe(writer);
         await new Promise((resolve, reject) => {
             writer.on('finish', resolve);
             writer.on('error', reject);
         });
         await bot.sendSticker(chatId, tempFilePath);
         bot.sendMessage(chatId, 'Sticker video dari API berhasil dikirim! 🎉');
         fs.unlinkSync(tempFilePath);
     } catch (error) {
         console.error('Error:', error);
         if (error.response?.data?.includes('The file type is not currently supported')) {
             bot.sendMessage(chatId, 'Gagal mengambil sticker: Jenis file tidak didukung oleh sistem API. ❌');
         } else {
             bot.sendMessage(chatId, 'Gagal mengambil atau mengirim sticker. Periksa koneksi atau parameter. ❌');
         }
     }
 }
 // Command /videobrat yang membutuhkan input teks
 bot.onText(/^\/videobrat (.+)$/, (msg, match) => {
     const chatId = msg.chat.id;
     const inputText = match[1]; // Ambil teks yang dimasukkan pengguna
     if (!inputText) {
         bot.sendMessage(chatId, 'Penggunaan salah! Contoh: /videobrat tekss');
         return;
     }
     bot.sendMessage(chatId, 'Sedang membuat sticker video, tunggu sebentar... ⏳');
     sendVideoStickerFromAPI(chatId, inputText);
 });
 // Peringatan jika tidak memasukkan teks
 bot.onText(/^\/videobrat$/, (msg) => {
     const chatId = msg.chat.id;
     bot.sendMessage(chatId, 'Mohon masukkan teks setelah perintah! Contoh: /videobrat tekss');
 });
 
 bot.onText(/^\/removebg (.+)$/, async (msg, match) => {
     const chatId = msg.chat.id;
     const inputLink = match[1]; // Ambil link foto dari input pengguna
     try {
         bot.sendMessage(chatId, 'Sedang memproses penghapusan latar belakang... ⏳');
         // Encode link foto agar aman untuk URL API
         const encodedImageUrl = encodeURIComponent(inputLink);
         const apiUrl = `https://indictivecore-api.vercel.app/tools/removebg?apikey=pixz&url=${encodedImageUrl}`;
         // Panggil API dan dapatkan hasil sebagai stream
         const apiResponse = await axios({
             method: 'get',
             url: apiUrl,
             responseType: 'stream',
         });
         // Kirim hasil langsung ke pengguna tanpa menyimpan file
         await bot.sendPhoto(chatId, apiResponse.data);
         bot.sendMessage(chatId, 'Hasil penghapusan latar belakang berhasil dikirim! ✨');
     } catch (error) {
         console.error('Error proses removebg:', error);
         let errorMsg = 'Gagal memproses foto. Periksa link foto atau koneksi Anda. ❌';
         if (error.response?.data?.includes('This may be an unsupported webpage type')) {
             errorMsg = 'Gagal memproses: Jenis halaman/web tidak didukung oleh API. Pastikan link adalah foto publik yang valid. ❌';
         }
         bot.sendMessage(chatId, errorMsg);
     }
 });
 // Peringatan jika tidak memasukkan link foto
 bot.onText(/^\/removebg$/, (msg) => {
     const chatId = msg.chat.id;
     bot.sendMessage(chatId, 'Penggunaan salah! Silakan masukkan link foto setelah perintah.\nContoh: /removebg https://contoh.com/foto.jpg');
 });
 
 bot.onText(/^\/toghibli (.+)$/, async (msg, match) => {
     const chatId = msg.chat.id;
     const inputLink = match[1]; // Ambil link foto dari input pengguna
     try {
         bot.sendMessage(chatId, 'Sedang memproses foto ke ghibli... ⏳');
         // Encode link foto agar aman untuk URL API
         const encodedImageUrl = encodeURIComponent(inputLink);
         const apiUrl = `https://indictivecore-api.vercel.app/tools/toghibli?apikey=pixz&url=${encodedImageUrl}`;
         // Panggil API dan dapatkan hasil sebagai stream
         const apiResponse = await axios({
             method: 'get',
             url: apiUrl,
             responseType: 'stream',
         });
         // Kirim hasil langsung ke pengguna tanpa menyimpan file
         await bot.sendPhoto(chatId, apiResponse.data);
         bot.sendMessage(chatId, 'Hasil convert foto ke gambar ghibli berhasil dikirim! ✨');
     } catch (error) {
         console.error('Error proses removebg:', error);
         let errorMsg = 'Gagal memproses foto. Periksa link foto atau koneksi Anda. ❌';
         if (error.response?.data?.includes('This may be an unsupported webpage type')) {
             errorMsg = 'Gagal memproses: Jenis halaman/web tidak didukung oleh API. Pastikan link adalah foto publik yang valid. ❌';
         }
         bot.sendMessage(chatId, errorMsg);
     }
 });
 // Peringatan jika tidak memasukkan link foto
 bot.onText(/^\/toghibli$/, (msg) => {
     const chatId = msg.chat.id;
     bot.sendMessage(chatId, 'Penggunaan salah! Silakan masukkan link foto setelah perintah.\nContoh: /toghibli https://contoh.com/foto.jpg');
 });
 
 bot.onText(/^\/tozombie (.+)$/, async (msg, match) => {
     const chatId = msg.chat.id;
     const inputLink = match[1]; // Ambil link foto dari input pengguna
     try {
         bot.sendMessage(chatId, 'Sedang memproses convert foto ke gambar zombie... ⏳');
         // Encode link foto agar aman untuk URL API
         const encodedImageUrl = encodeURIComponent(inputLink);
         const apiUrl = `https://indictivecore-api.vercel.app/tools/tozombie?apikey=pixz&url=${encodedImageUrl}`;
         // Panggil API dan dapatkan hasil sebagai stream
         const apiResponse = await axios({
             method: 'get',
             url: apiUrl,
             responseType: 'stream',
         });
         // Kirim hasil langsung ke pengguna tanpa menyimpan file
         await bot.sendPhoto(chatId, apiResponse.data);
         bot.sendMessage(chatId, 'Hasil convert foto ke gambar zombie berhasil dikirim! ✨');
     } catch (error) {
         console.error('Error proses removebg:', error);
         let errorMsg = 'Gagal memproses foto. Periksa link foto atau koneksi Anda. ❌';
         if (error.response?.data?.includes('This may be an unsupported webpage type')) {
             errorMsg = 'Gagal memproses: Jenis halaman/web tidak didukung oleh API. Pastikan link adalah foto publik yang valid. ❌';
         }
         bot.sendMessage(chatId, errorMsg);
     }
 });
 // Peringatan jika tidak memasukkan link foto
 bot.onText(/^\/tozombie$/, (msg) => {
     const chatId = msg.chat.id;
     bot.sendMessage(chatId, 'Penggunaan salah! Silakan masukkan link foto setelah perintah.\nContoh: /tozombie https://contoh.com/foto.jpg');
 });
 
 const API_URL = 'https://ikyyzyyrestapi.my.id/random/ppcouple?apikey=kyzz';
 // Fungsi untuk mengunduh gambar ke lokal
 async function downloadImage(url, filename) {
   const filePath = path.join(__dirname, filename);
   const response = await axios.get(url, { responseType: 'stream' });
   return new Promise((resolve, reject) => {
     const writer = fs.createWriteStream(filePath);
     response.data.pipe(writer);
     writer.on('finish', () => resolve(filePath));
     writer.on('error', reject);
   });
 }
 bot.onText(/^ppcouple$/, async (msg) => {
   const chatId = msg.chat.id;
   try {
     const response = await axios.get(API_URL);
     const data = response.data;
     
     if (data.status) {
       const linkCowo = data.result.cowo;
       const linkCewe = data.result.cewe;
       // Kirim gambar cowok dengan cara mengunduh dulu
       try {
         const filePathCowo = await downloadImage(linkCowo, 'cowo.jpg');
         await bot.sendPhoto(chatId, filePathCowo, {
           caption: 'Ini gambar untuk cowok 🧑'
         });
         fs.unlinkSync(filePathCowo); // Hapus file setelah dikirim
       } catch (err) {
         console.error('Gagal kirim gambar cowok:', err);
         await bot.sendMessage(chatId, '❌ Maaf, gagal mengirim gambar untuk cowok. Kemungkinan link gambar sudah tidak valid atau tipe file tidak didukung.');
       }
       // Kirim gambar cewek dengan cara mengunduh dulu
       try {
         const filePathCewe = await downloadImage(linkCewe, 'cewe.jpg');
         await bot.sendPhoto(chatId, filePathCewe, {
           caption: 'Ini gambar untuk cewek 👩'
         });
         fs.unlinkSync(filePathCewe); // Hapus file setelah dikirim
       } catch (err) {
         console.error('Gagal kirim gambar cewek:', err);
         await bot.sendMessage(chatId, '❌ Maaf, gagal mengirim gambar untuk cewek. Kemungkinan link gambar sudah tidak valid atau tipe file tidak didukung.');
       }
     } else {
       bot.sendMessage(chatId, '⚠️ Maaf, gagal mengambil data gambar dari server.');
     }
   } catch (error) {
     console.error('Error akses API:', error);
     bot.sendMessage(chatId, '⚠️ Terjadi kesalahan saat menghubungi API, silakan coba lagi nanti.');
   }
 });
 
 const API_BASE_URL = 'https://ikyyzyyrestapi.my.id/download/jadwalsholat?apikey=kyzz&kota=';
 // Tangani perintah /jadwalsholat
 bot.onText(/^\/jadwalsholat (.+)$/, async (msg, match) => {
   const chatId = msg.chat.id;
   const kota = match[1]; // Ambil nama kota dari input pengguna
   try {
     const response = await axios.get(`${API_BASE_URL}${encodeURIComponent(kota)}`);
     const data = response.data;
     if (data.status) {
       // Ambil hanya bagian result dan konversi ke teks yang sama persis dengan struktur API
       const resultText = JSON.stringify(data.result, null, 2);
       await bot.sendMessage(chatId, resultText);
     } else {
       await bot.sendMessage(chatId, "Gagal mendapatkan data jadwal sholat.");
     }
   } catch (error) {
     console.error('Error:', error);
     await bot.sendMessage(chatId, "Terjadi kesalahan saat mengambil data atau kota tidak ditemukan.");
   }
 });
 
 const userState = {};
 // Command /gethtml
 bot.onText(/^\/gethtml(?:\s+(.+))?$/, async (msg, match) => {
   const chatId = msg.chat.id;
   const link = match[1]; // Ambil link yang dikirim bersama command
   if (!link || !link.startsWith('http')) {
     // Jika tidak ada link atau link tidak valid
     bot.sendMessage(chatId, "💬 Kirim link website kamu (contoh: https://namaproject.com)");
     return;
   }
   try {
     // Tampilkan pesan progres
     await bot.sendMessage(chatId, "🔎 Mengambil HTML dari link...");
     
     // Ambil konten HTML dari link
     const res = await axios.get(link);
     const htmlContent = res.data;
     const filename = `Ganz_Track.html`;
     const filePath = path.join(__dirname, filename);
     // Tulis konten ke file
     fs.writeFileSync(filePath, htmlContent, 'utf8');
     
     // Kirim file ke pengguna
     await bot.sendDocument(chatId, filePath, {
       caption: `✅ Source code berhasil diambil dari:\n${link}`
     });
     // Hapus file setelah dikirim
     fs.unlinkSync(filePath);
     await bot.sendMessage(chatId, "📥 Download selesai!");
   } catch (err) {
     // Tampilkan pesan error jika gagal
     bot.sendMessage(chatId, `❌ Gagal mengambil HTML:\n${err.message}`);
   }
 });
 
 function ffmpegConvert(buffer, args = [], ext = '', ext2 = '') {
  return new Promise((resolve, reject) => {
    try {
      const tmpDir = path.join(process.cwd(), 'tmp')
      if (!existsSync(tmpDir)) mkdirSync(tmpDir)

      const tmp = path.join(tmpDir, `${Date.now()}.${ext}`)
      const out = `${tmp}.${ext2}`
      writeFileSync(tmp, buffer)

      const ff = spawn('ffmpeg', ['-y', '-i', tmp, ...args, out])

      ff.on('error', reject)
      ff.on('close', (code) => {
        try {
          unlinkSync(tmp)
          if (code !== 0) return reject(new Error('ffmpeg error'))
          const data = readFileSync(out)
          resolve({
            data,
            filename: out,
            delete: () => unlinkSync(out)
          })
        } catch (e) {
          reject(e)
        }
      })
    } catch (e) {
      reject(e)
    }
  })
};

 function toWebp(buffer, ext, pack = 'Bot Ganz', author = 'Ganzz Alwayss') {
   return ffmpegConvert(buffer, [
     '-vf', 'scale=512:512:force_original_aspect_ratio=decrease',
     '-c:v', 'libwebp',
     '-qscale', '80',
     '-lossless', '0',
     '-metadata', `title=${pack}`,
     '-metadata', `author=${author}`
   ], ext, 'webp')
 };
 // Command /sticker
 bot.onText(/^\/sticker$/, async (msg) => {
   const chatId = msg.chat.id;
   try {
     const reply = msg.reply_to_message;
     if (!reply || !reply.photo) {
       return bot.sendMessage(chatId, '📸 Balas foto dengan perintah /sticker biar dijadiin sticker!');
     }
     const packName = "Bot Ganz";
     const authorName = "Ganzz Alwayss";
     const photo = reply.photo.pop();
     const fileInfo = await bot.getFile(photo.file_id);
     const fileUrl = `https://api.telegram.org/file/bot${token}/${fileInfo.file_path}`;
     const res = await axios.get(fileUrl, { responseType: 'arraybuffer' });
     await bot.sendMessage(chatId, `🧩 Lagi bikin sticker...`);
     const webp = await toWebp(res.data, 'jpg', packName, authorName);
     await bot.sendSticker(chatId, webp.data);
     webp.delete();
   } catch (err) {
     console.error(err);
     bot.sendMessage(chatId, `❌ Gagal bikin sticker: ${err.message}`);
   }
 });
 
const GUIDE_MESSAGE = `ℹ️ <b>Cara Penggunaan Fitur /deploy:</b>
 1. Pastikan Anda memiliki berkas dengan ekstensi <code>.html</code> (hanya berkas HTML yang didukung!).
 2. Kirim berkas HTML tersebut ke obrolan ini.
 3. <b>Reply</b> ke pesan berkas tersebut, lalu ketik <code>/deploy</code>.
 4. Setelah itu, ikuti petunjuk untuk memasukkan nama website (tanpa spasi).
 ❌ <b>Perhatian:</b> Berkas selain .html tidak akan diproses!`;
 // Handler perintah /deploy
 bot.onText(/^\/deploy$/, async (msg) => {
   const chatId = msg.chat.id;
   const replyToMsg = msg.reply_to_message;
   // Cek apakah pengguna mereply pesan
   if (!replyToMsg) {
     return bot.sendMessage(chatId, GUIDE_MESSAGE, { parse_mode: 'HTML' });
   }
   // Cek apakah pesan yang direply adalah berkas
   if (!replyToMsg.document) {
     return bot.sendMessage(chatId, `❌ Anda harus mereply <b>berkas</b> untuk melakukan deploy!\n\n${GUIDE_MESSAGE}`, { parse_mode: 'HTML' });
   }
   const file = replyToMsg.document;
   // Cek ekstensi berkas
   if (!file.file_name?.endsWith('.html')) {
     return bot.sendMessage(chatId, `❌ Hanya berkas dengan ekstensi <code>.html</code> yang didukung!\n\n${GUIDE_MESSAGE}`, { parse_mode: 'HTML' });
   }
   try {
     const link = await bot.getFileLink(file.file_id);
     const htmlFile = await axios.get(link, { responseType: 'arraybuffer' });
     const path = `./${chatId}_deploy.html`;
     fs.writeFileSync(path, htmlFile.data);
     userState[chatId] = { path, step: 'waiting_project_name' };
     bot.sendMessage(chatId, '✅ Berkas HTML diterima!\n\n💬 Sekarang kirim <b>nama website</b> Anda (tanpa spasi, hanya huruf, angka, atau tanda hubung).', { parse_mode: 'HTML' });
   } catch (err) {
     bot.sendMessage(chatId, '❌ Gagal mengunduh berkas. Silakan coba lagi nanti.');
   }
 });
 // Handler untuk menerima nama website setelah berkas diterima
 bot.on('message', async (msg) => {
   const chatId = msg.chat.id;
   const text = msg.text?.trim();
   const state = userState[chatId];
   // Hanya proses jika dalam state menunggu nama website dan pesan bukan perintah
   if (state?.step === 'waiting_project_name' && typeof text === 'string' && !text.startsWith('/')) {
     const filePath = state.path;
     const projectName = text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''); // Bersihkan nama
     if (!projectName) {
       return bot.sendMessage(chatId, '❌ Nama website tidak valid! Harap masukkan nama tanpa spasi dan karakter khusus selain tanda hubung.');
     }
     try {
       // Tampilkan pesan progres
       const progressMsg = await bot.sendMessage(chatId, '🚀 Deploy website dimulai...', { parse_mode: 'HTML' });
       await new Promise(resolve => setTimeout(resolve, 1000));
       await bot.editMessageText('🔧 Menyelesaikan proses deploy...', { chat_id: chatId, message_id: progressMsg.message_id });
       // Baca dan konversi berkas ke Base64
       const htmlBase64 = fs.readFileSync(filePath, { encoding: 'base64' });
       // Kirim permintaan ke Vercel API
       const payload = {
         name: projectName,
         files: [{ file: 'index.html', data: htmlBase64, encoding: 'base64' }],
         projectSettings: {
           framework: null,
           devCommand: null,
           installCommand: null,
           buildCommand: null,
           outputDirectory: '.',
           rootDirectory: null
         }
       };
       await axios.post('https://api.vercel.com/v13/deployments', payload, {
         headers: {
           Authorization: `Bearer ${VERCEL_TOKEN}`,
           'Content-Type': 'application/json'
         }
       });
       // Format tanggal dalam Bahasa Indonesia
       moment.locale('id');
       const date = moment().format('DD MMMM YYYY, HH:mm');
       const reply = `✅ <b>Website berhasil dibuat!</b>\n\n` +
                     `📛 <b>Nama:</b> ${projectName}\n` +
                     `🔗 <b>Link:</b> https://${projectName}.vercel.app\n` +
                     `🗓️ <b>Dibuat:</b> ${date}`;
       await bot.editMessageText(reply, { chat_id: chatId, message_id: progressMsg.message_id, parse_mode: 'HTML' });
     } catch (err) {
       const errorMsg = err.response?.data || err.message;
       bot.sendMessage(chatId, `❌ Gagal upload ke Vercel:\n${JSON.stringify(errorMsg)}`, { parse_mode: 'HTML' });
     } finally {
       // Bersihkan berkas dan state
       if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
       delete userState[chatId];
     }
   }
 });
 
 bot.onText(/\/groupinfo/, async (msg) => {
try {
    const chatId = msg.chat.id;
    if (!chatId) return;

    // Hanya berfungsi di grup
    if (msg.chat.type === "private") {
      return bot.sendMessage(chatId, "❌ Command ini hanya bisa digunakan di grup!");
    }

    const chat = await bot.getChat(chatId);
    const administrators = await bot.getChatAdministrators(chatId);
    const chatInfo = await bot.getChat(chatId);

     const chatMembers = chatInfo.members_count; // Ambil jumlah member dari data chat

    const admins = administrators.map(admin => {
      const user = admin.user;
      return `├ ${user.first_name || ""} ${user.last_name || ""} ${user.username ? `(@${user.username})` : ""} - ${admin.status === "creator" ? "👑 Creator" : "🛡️ Admin"}`;
    }).join('\n');

    const text = `
<blockquote>📊 INFORMASI GRUP</blockquote>

<b>📛 Nama Grup:</b> ${chat.title}
<b>🆔 ID Grup:</b> <code>${chat.id}</code>
<b>👥 Jumlah Member:</b> ${chatMembers}
<b>🔒 Tipe Grup:</b> ${chat.type === "supergroup" ? "Supergroup" : "Group"}
<b>📝 Deskripsi:</b> ${chat.description || "Tidak ada"}

<blockquote>👑 ADMINISTRATOR</blockquote>
${admins}

<b>📅 Dibuat:</b> ${new Date(chat.date * 1000).toLocaleDateString('id-ID')}
    `.trim();

    await bot.sendMessage(chatId, text, {
      parse_mode: "HTML",
      reply_to_message_id: msg.message_id,
      disable_web_page_preview: true
    });

  } catch (err) {
    console.error("Error di /groupinfo:", err);
  }
});

// Endpoint API cek ID Telegram 📡
 const CEKID_API_ENDPOINT = 'https://ikyyzyyrestapi.my.id/tools/telegram/cekid';
 // Tangani perintah /cekid 📝
 bot.onText(/^\/cekid(?:\s+(.+))?$/, async (msg, match) => {
   const chatId = msg.chat.id;
   const input = match[1]; // Ambil bagian setelah /cekid 🧐
   // Peringatan jika format salah ⚠️
   if (!input) {
     return bot.sendMessage(chatId, 
       `❌ *FORMAT PERINTAH SALAH NIH BOSS!* ❌\n\n` +
       `📌 Cara penggunaan yang BENAR:\n` +
       `👉 /cekid @username\n\n` +
       `✨ Contoh yang benar:\n` +
       `🤩 /cekid @GanzzzAlwayss\n\n` +
       `Jangan lupa ya kakak, harus ada tandanya @ nya! 🥰`
     );
   }
   if (!input.startsWith('@')) {
     return bot.sendMessage(chatId, 
       `❌ *UHUY, ADA YANG KURANG NIH!* ❌\n\n` +
       `📌 Username harus diawali dengan tanda *@* dong!\n` +
       `👉 Format yang benar: /cekid @${input}\n\n` +
       `✨ Contoh:\n` +
       `🤩 /cekid @${input}\n\n` +
       `Tambahin aja @ didepannya ya! 😊`
     );
   }
   const username = input.trim();
   bot.sendMessage(chatId, 
     `🔍 *SEDANG MENGECEK INFORMASI...* 🔍\n\n` +
     `👤 Sedang mencari data untuk akun: *${username}*\n` +
     `⏳ Mohon tunggu sebentar ya kakak...\n` +
     `✨ Semoga cepat ya! 🚀`
   );
   try {
     // Kirim permintaan ke API 📤
     const apiResponse = await axios.get(CEKID_API_ENDPOINT, {
       params: { username: username }
     });
     // Parse data respons API 📥
     const data = apiResponse.data;
     const result = data.result;
     // Susun caption dengan banyak emoji 🎨
     const caption = 
       `🎉 *INFORMASI AKUN TELEGRAM BERHASIL DITEMUKAN!* 🎉\n\n` +
       `👤 *Username:* ${result.username}\n` +
       `🆔 *ID Akun:* ${result.id}\n` +
       `💬 *Nama Lengkap:* ${result.name}\n` +
       `🗂️ *Tipe Akun:* ${result.type}\n` +
       `✅ *Terverifikasi:* ${result.verified ? '✅ YA (Akun Resmi)' : '❌ TIDAK'}\n` +
       `⚠️ *Scam:* ${result.scam ? '🔴 YA (Hindari!)' : '🟢 TIDAK'}\n` +
       `❌ *Palsu:* ${result.fake ? '🔴 YA (Akun Palsu)' : '🟢 TIDAK'}\n` +
       `🔒 *Dibatasi:* ${result.restricted ? '🔴 YA (Akun Dibatasi)' : '🟢 TIDAK'}\n\n` +
       `💡 *API Dibuat Oleh:* ${data.creator}\n` +
       `🌟 *Semoga informasi ini bermanfaat ya!* 🌟`;
     // Kirim foto beserta caption 📸
     await bot.sendPhoto(chatId, result.photo, { 
       caption: caption,
       parse_mode: 'Markdown' // Agar format teks dengan * jadi tebal
     });
   } catch (error) {
     let errorMsg = 
       `😢 *WADUH, TERJADI KESALAHAN!* 😢\n\n` +
       `❌ *Pesan Kesalahan:* ${error.message}\n`;
     if (error.response) {
       errorMsg += `📊 *Detail dari API:* ${JSON.stringify(error.response.data)}\n\n`;
     }
     errorMsg += `🤔 *Mungkin username salah atau API sedang sibuk ya kakak!* 🤗`;
     bot.sendMessage(chatId, errorMsg, { parse_mode: 'Markdown' });
   }
 });

const nsfwTypes = [

   "hentai",

   "thigh",

   "ass",

   "pussy",

   "boobs",

   "bj",

   "anal",

   "gonewild",

   "kitsune",

   "neko"

 ];
bot.onText(/^\/nsfw$/, async (msg) => {
   const { id } = msg.from;
   try {
     const type = nsfwTypes[Math.floor(Math.random() * nsfwTypes.length)];
     const { data } = await axios.get(`https://nekobot.xyz/api/image?type=${type}`);
     if (!data.message) {
       return bot.sendMessage(msg.chat.id, "❌ Gambar tidak ditemukan.");
     }
     await bot.sendPhoto(msg.chat.id, data.message, {
       caption: `🔞 ${type}`
     });
   } catch (err) {
     console.error("Error NSFW:", err.message);
     bot.sendMessage(msg.chat.id, "❌ Gagal mengambil data.");
   }
 });
 
 // URL API quiz
 const APII_URL = 'https://ikyyzyyrestapi.my.id/games/pilihanganda';
 // Tangani perintah /start atau /quiz untuk memulai permainan
 bot.onText(/\/(tekateki|quiz)/, async (msg) => {
   const chatId = msg.chat.id;
   try {
     // Ambil data dari API
     const response = await axios.get(APII_URL);
     const quizData = response.data.result;
     // Siapkan opsi jawaban dalam format polling
     const options = [
       `a) ${quizData.options.a}`,
       `b) ${quizData.options.b}`,
       `c) ${quizData.options.c}`,
       `d) ${quizData.options.d}`
     ];
     // Kirim polling quiz
     bot.sendPoll(
       chatId,
       `❓ Type: ${quizData.category} - ${quizData.question}`,
       options,
       {
         is_anonymous: false,
         type: 'quiz',
         correct_option_id: getOptionIndex(quizData.answer),
         explanation: getExplanation(quizData.answer, quizData.options),
         explanation_parse_mode: 'Markdown'
       }
     );
   } catch (error) {
     console.error('Error mengambil data atau mengirim quiz:', error);
     bot.sendMessage(chatId, '⚠️ Terjadi kesalahan saat memuat quiz, coba lagi nanti.');
   }
 });
 // Fungsi untuk mendapatkan index opsi yang benar
 function getOptionIndex(answerKey) {
   switch (answerKey.toLowerCase()) {
     case 'a': return 0;
     case 'b': return 1;
     case 'c': return 2;
     case 'd': return 3;
     default: return 0;
   }
 }
 // Fungsi untuk membuat penjelasan hasil
 function getExplanation(correctKey, options) {
   const correctAnswer = options[correctKey];
   return `✅ *Jawaban Benar:* ${correctKey}) ${correctAnswer}\n❌ *Jawaban Salah?* Silakan coba quiz lain dengan perintah /quiz!`;
 };
 
 // URL dasar API Text-to-Speech
 const TTS_API_URL = 'https://ikyyzyyrestapi.my.id/tools/tts';
 // Tangani perintah /texttoaudio
 bot.onText(/\/tts(?:\s+(.+))?/, async (msg, match) => {
   const chatId = msg.chat.id;
   const textToConvert = match[1]; // Ambil teks yang ingin dikonversi dari pesan
   // Jika tidak ada teks yang dimasukkan
   if (!textToConvert) {
     bot.sendMessage(chatId, '❌ *Format Salah!* \nCara penggunaan yang benar: `/texttoaudio Teks yang ingin diubah menjadi suara`\nContoh: `/tts Halo semuanya`', { parse_mode: 'Markdown' });
     return;
   }
   try {
     // Ambil data dari API dengan teks yang dimasukkan pengguna
     const response = await axios.get(`${TTS_API_URL}?q=${encodeURIComponent(textToConvert)}`, {
       responseType: 'stream' // Mengambil sebagai stream untuk file audio
     });
     // Tentukan path penyimpanan file sementara
     const audioPath = path.join(__dirname, 'audio.mp3');
     const writer = fs.createWriteStream(audioPath);
     // Simpan stream ke file
     response.data.pipe(writer);
     writer.on('finish', async () => {
       // Kirim file audio ke pengguna
       await bot.sendAudio(chatId, audioPath, { title: 'Text-to-Audio Hasil.mp3' });
       // Hapus file sementara setelah dikirim
       fs.unlinkSync(audioPath);
     });
     writer.on('error', (err) => {
       console.error('Error menyimpan file audio:', err);
       bot.sendMessage(chatId, '⚠️ *Terjadi kesalahan saat menyimpan file audio!*', { parse_mode: 'Markdown' });
       if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
     });
   } catch (error) {
     console.error('Error mengambil data dari API:', error);
     // Berikan notifikasi sesuai jenis kesalahan
     if (error.response?.data?.includes('The file type is not currently supported')) {
       bot.sendMessage(chatId, '❌ *Gagal Mendapatkan Audio!* \nPesan dari API: "The file type is not currently supported. Please try another file type."', { parse_mode: 'Markdown' });
     } else {
       bot.sendMessage(chatId, '⚠️ *Terjadi kesalahan saat mengakses API atau mengambil audio!* Silakan coba lagi nanti.', { parse_mode: 'Markdown' });
     }
   }
 });
 
 // URL dasar API FF Stalk
 const STALK_API_URL = 'https://ikyyzyyrestapi.my.id/stalk/epepid';
 // Tangani perintah /ffstalk
 bot.onText(/^\/ffstalk(?:\s+(\d+))?$/, async (msg, match) => {
   const chatId = msg.chat.id;
   const userId = match[1]; // Ambil ID yang dimasukkan pengguna
   // Jika tidak ada ID yang dimasukkan
   if (!userId) {
     bot.sendMessage(chatId, 
       '❌ *FORMAT SALAH!* \nCara penggunaan yang benar: `/ffstalk ID_AKUN`\nContoh: `/ffstalk 222789189`', 
       { parse_mode: 'Markdown' }
     );
     return;
   }
   try {
     // Ambil data dari API dengan ID yang dimasukkan
     const response = await axios.get(`${STALK_API_URL}?uid=${userId}`);
     const data = response.data;
     if (data.status) {
       // Format pesan dengan tulisan biasa dan emoji yang cocok
       const pesan = `
 ✨ *INFORMASI AKUN FREE FIRE* ✨
 🆔 *UID AKUN:* ${data.data.uid}
 👤 *NAMA AKUN:* ${data.data.name}
 📊 *LEVEL AKUN:* ${data.data.level}
 🌍 *REGION:* ${data.data.region}
 ❤️ *JUMLAH LIKE:* ${data.data.likes}
 🏆 *BR RANK POINT:* ${data.data.br_rank_point}
 🎯 *CS RANK POINT:* ${data.data.cs_rank_point}
 🤝 *NAMA GUILD:* ${data.data.guild_name}
 📅 *AKUN DIBUAT:* ${data.data.created_at}
 🔄 *LOGIN TERAKHIR:* ${data.data.last_login}
       `;
       
       await bot.sendMessage(chatId, pesan, { parse_mode: 'Markdown' });
     } else {
       await bot.sendMessage(chatId, '⚠️ *Gagal mengambil data akun!* Mungkin ID yang dimasukkan salah.', { parse_mode: 'Markdown' });
     }
   } catch (error) {
     console.error('Error akses API:', error);
     await bot.sendMessage(chatId, '❌ *Terjadi kesalahan!* Silakan cek ID kembali atau coba lagi nanti.', { parse_mode: 'Markdown' });
   }
 });
 
 // URL dasar API pembuat QR Code
 const QR_API_URL = 'https://ikyyzyyrestapi.my.id/tools/qrcode';
 // Fungsi untuk mengunduh file sementara
 async function downloadFile(url, filename) {
   const filePath = path.join(__dirname, filename);
   try {
     const response = await axios.get(url, { responseType: 'stream' });
     return new Promise((resolve, reject) => {
       const writer = fs.createWriteStream(filePath);
       response.data.pipe(writer);
       writer.on('finish', () => resolve(filePath));
       writer.on('error', reject);
     });
   } catch (err) {
     throw new Error(err.message || 'Gagal mengunduh file');
   }
 }
 // Tangani perintah /texttoqr
 bot.onText(/^\/texttoqr(?:\s+(.+))?$/, async (msg, match) => {
   const chatId = msg.chat.id;
   const textToConvert = match[1]; // Ambil teks yang ingin dibuat QR Code
   // Jika tidak ada teks yang dimasukkan
   if (!textToConvert) {
     await bot.sendMessage(chatId, 
       '❌ *FORMAT SALAH!* \nCara penggunaan yang benar: `/texttoqr TeksYangInginDibuatQR`\nContoh: `/texttoqr Halo Semuanya`', 
       { parse_mode: 'Markdown' }
     );
     return;
   }
   try {
     // Buat URL lengkap dengan teks yang dimasukkan pengguna
     const fullApiUrl = `${QR_API_URL}?text=${encodeURIComponent(textToConvert)}`;
     
     // Coba kirim langsung atau unduh dulu lalu kirim
     try {
       // Coba kirim langsung dari URL API
       await bot.sendPhoto(chatId, fullApiUrl, {
         caption: `✅ QR Code untuk teks: "${textToConvert}" 📱`
       });
     } catch (directErr) {
       console.error('Gagal kirim langsung:', directErr);
       // Jika gagal, coba unduh dulu lalu kirim
       try {
         const qrFilePath = await downloadFile(fullApiUrl, 'qrcode.png');
         await bot.sendPhoto(chatId, qrFilePath, {
           caption: `✅ QR Code untuk teks: "${textToConvert}" 📱`
         });
         fs.unlinkSync(qrFilePath); // Hapus file setelah dikirim
       } catch (downloadErr) {
         // Tampilkan pesan kesalahan sesuai yang tercatat
         await bot.sendMessage(chatId, 
           '❌ *GAGAL MEMBUAT ATAU MENGIRIM QR CODE!* \nPesan dari server: "The file type is not currently supported. Please try another file type."\nSilakan coba lagi nanti atau periksa API.', 
           { parse_mode: 'Markdown' }
         );
       }
     }
   } catch (error) {
     console.error('Error akses API:', error);
     await bot.sendMessage(chatId, 
       '⚠️ *TERJADI KESALAHAN SAAT MENGHUBUNGI SERVER!* \nSilakan coba lagi nanti.', 
       { parse_mode: 'Markdown' }
     );
   }
 });
 
// URL dasar API Stalk TikTok
 const TIKTOK_STALK_API = 'https://ikyyzyyrestapi.my.id/stalk/tiktokv2';
 const API_KEY = 'kyzz';
 // Fungsi untuk mengunduh avatar sementara
 async function downloadAvatar(url, filename) {
   const filePath = path.join(__dirname, filename);
   try {
     const response = await axios.get(url, { responseType: 'stream' });
     return new Promise((resolve, reject) => {
       const writer = fs.createWriteStream(filePath);
       response.data.pipe(writer);
       writer.on('finish', () => resolve(filePath));
       writer.on('error', reject);
     });
   } catch (err) {
     throw new Error(err.message);
   }
 }
 // Tangani perintah /tiktokstalk
 bot.onText(/^\/stalktiktok(?:\s+(.+))?$/, async (msg, match) => {
   const chatId = msg.chat.id;
   const username = match[1];
   if (!username) {
     await bot.sendMessage(chatId, 
       '❌ *FORMAT SALAH!* \nCara penggunaan yang benar: `/tiktokstalk UsernameTikTok`\nContoh: `/stalktiktok ganzz.alwayss`', 
       { parse_mode: 'Markdown' }
     );
     return;
   }
   try {
     const response = await axios.get(`${TIKTOK_STALK_API}?apikey=${API_KEY}&username=${encodeURIComponent(username)}`);
     const data = response.data;
     if (data.status) {
       const userData = data.result.user;
       
       // Format semua informasi menjadi satu caption
       const fullCaption = `
 ✨ *INFORMASI AKUN TIKTOK* ✨
 👤 Username: ${userData.username}
 👥 Followers: ${userData.followers} 📈
 🫂 Following: ${userData.following} 📊
 ❤️ Total Likes: ${userData.likes} ❤️‍🔥
 🆔 Sec UID: ${userData.sec_uid}
       `;
       // Kirim gambar dengan caption lengkap
       try {
         await bot.sendPhoto(chatId, userData.avatar, {
           caption: fullCaption,
           parse_mode: 'Markdown'
         });
       } catch (avatarErr) {
         console.error('Gagal kirim avatar langsung:', avatarErr);
         try {
           const avatarPath = await downloadAvatar(userData.avatar, 'tiktok_avatar.jpg');
           await bot.sendPhoto(chatId, avatarPath, {
             caption: fullCaption,
             parse_mode: 'Markdown'
           });
           fs.unlinkSync(avatarPath);
         } catch (downloadErr) {
           // Jika gambar gagal dikirim, kirim informasi saja
           await bot.sendMessage(chatId, 
             `⚠️ *FOTO PROFIL TIDAK DAPAT DIKIRIM* \nPesan kesalahan: "The file type is not currently supported."\n\n${fullCaption}`, 
             { parse_mode: 'Markdown' }
           );
         }
       }
     } else {
       await bot.sendMessage(chatId, '⚠️ *Gagal mengambil data akun TikTok!* Mungkin username salah.', { parse_mode: 'Markdown' });
     }
   } catch (error) {
     console.error('Error akses API:', error);
     await bot.sendMessage(chatId, 
       '❌ *TERJADI KESALAHAN!* Silakan coba lagi nanti.', 
       { parse_mode: 'Markdown' }
     );
   }
 });
 
 const CUACA_API_URL = 'https://ikyyzyyrestapi.my.id/Info/cuaca?apikey=kyzz&query='; // URL API sudah diperbarui
 // Tangani perintah /cekcuaca
 bot.onText(/^\/cekcuaca(?:\s+(.+))?$/, async (msg, match) => {
   const chatId = msg.chat.id;
   const namaKota = match[1]; // Ambil nama kota yang dimasukkan pengguna
   // Jika tidak ada nama kota yang dimasukkan
   if (!namaKota) {
     await bot.sendMessage(chatId, 
       '❌ *FORMAT SALAH!* \nCara penggunaan yang benar: `/cekcuaca NamaKota`\nContoh: `/cekcuaca Jakarta`', 
       { parse_mode: 'Markdown' }
     );
     return;
   }
   try {
     // Ambil data dari API (sesuaikan parameter dengan kebutuhan aktual API)
     const response = await axios.get(`${CUACA_API_URL}${encodeURIComponent(namaKota)}`);
     const data = response.data;
     if (data.status) {
       const cuacaData = data.result;
       // Format pesan dengan teks biasa dan emoji yang cocok
       const pesanCuaca = `
 ℹ️ *INFO CUACA* ℹ️
 📍 Lokasi: ${cuacaData.lokasi}
 📅 Waktu: ${cuacaData.waktu}
 ☁️ Kondisi: ${cuacaData.kondisi}
 🌡️ Suhu: ${cuacaData.suhu}
 💧 Kelembapan: ${cuacaData.kelembapan}
 💨 Kecepatan Angin: ${cuacaData.angin}
       `;
       
       await bot.sendMessage(chatId, pesanCuaca, { parse_mode: 'Markdown' });
     } else {
       await bot.sendMessage(chatId, `⚠️ *Gagal mengambil data cuaca!* Mungkin nama kota "${namaKota}" tidak ditemukan.`, { parse_mode: 'Markdown' });
     }
   } catch (error) {
     console.error('Error akses API cuaca:', error);
     await bot.sendMessage(chatId, 
       '❌ *TERJADI KESALAHAN SAAT MENGAMBIL DATA CUACA!* \nSilakan cek nama kota kembali atau coba lagi nanti.', 
       { parse_mode: 'Markdown' }
     );
   }
 });
 
 const CECAN_API_BASE_URL = 'https://ikyyzyyrestapi.my.id/random/cecan/hijaber';
 // Fungsi untuk mengunduh gambar sementara
 async function downloadImage(url, filename) {
   const filePath = path.join(__dirname, filename);
   try {
     const response = await axios.get(url, { responseType: 'stream' });
     return new Promise((resolve, reject) => {
       const writer = fs.createWriteStream(filePath);
       response.data.pipe(writer);
       writer.on('finish', () => resolve(filePath));
       writer.on('error', reject);
     });
   } catch (err) {
     throw new Error(err.message);
   }
 }
 // Tangani perintah /cecanhijab
 bot.onText(/^\/cecanhijab$/, async (msg) => {
   const chatId = msg.chat.id;
   // Tambahkan parameter timestamp untuk menghindari cache
   const randomUrl = `${CECAN_API_BASE_URL}?t=${Date.now()}`;
   try {
     await bot.sendMessage(chatId, '🔄 Sedang mengambil gambar baru... Tunggu sebentar ya!');
     
     // Coba kirim gambar langsung dengan URL yang sudah ditambahkan timestamp
     await bot.sendPhoto(chatId, randomUrl, {
       caption: '✨ Gambar dari fitur Cecan Hijab ✨\n⚠️ Jika gambar masih sama, kemungkinan API belum menyediakan gambar acak yang berbeda.'
     });
   } catch (directErr) {
     console.error('Gagal kirim gambar langsung:', directErr);
     // Coba unduh dulu jika kirim langsung gagal
     try {
       const imgPath = await downloadImage(randomUrl, `cecan_hijab_${Date.now()}.jpg`);
       await bot.sendPhoto(chatId, imgPath, {
         caption: '✨ Gambar dari fitur Cecan Hijab ✨\n⚠️ Jika gambar masih sama, kemungkinan API belum menyediakan gambar acak yang berbeda.'
       });
       fs.unlinkSync(imgPath); // Hapus file setelah dikirim
     } catch (downloadErr) {
       // Tampilkan pesan kesalahan sesuai yang tercatat
       await bot.sendMessage(chatId, 
         '❌ *GAGAL MENGAMBIL ATAU MENGIRIM GAMBAR!* \nPesan dari server: "The file type is not currently supported. Please try another file type."', 
         { parse_mode: 'Markdown' }
       );
     }
   }
 });
 
 const CECAN_API_BASE_URLL = 'https://ikyyzyyrestapi.my.id/random/cecan/china';
 // Fungsi untuk mengunduh gambar sementara
 async function downloadImage(url, filename) {
   const filePath = path.join(__dirname, filename);
   try {
     const response = await axios.get(url, { responseType: 'stream' });
     return new Promise((resolve, reject) => {
       const writer = fs.createWriteStream(filePath);
       response.data.pipe(writer);
       writer.on('finish', () => resolve(filePath));
       writer.on('error', reject);
     });
   } catch (err) {
     throw new Error(err.message);
   }
 }
 // Tangani perintah /cecanhijab
 bot.onText(/^\/cecanchina$/, async (msg) => {
   const chatId = msg.chat.id;
   // Tambahkan parameter timestamp untuk menghindari cache
   const randomUrl = `${CECAN_API_BASE_URLL}?t=${Date.now()}`;
   try {
     await bot.sendMessage(chatId, '🔄 Sedang mengambil gambar baru... Tunggu sebentar ya!');
     
     // Coba kirim gambar langsung dengan URL yang sudah ditambahkan timestamp
     await bot.sendPhoto(chatId, randomUrl, {
       caption: '✨ Gambar dari fitur Cecan China ✨\n⚠️ Jika gambar masih sama, kemungkinan API belum menyediakan gambar acak yang berbeda.'
     });
   } catch (directErr) {
     console.error('Gagal kirim gambar langsung:', directErr);
     // Coba unduh dulu jika kirim langsung gagal
     try {
       const imgPath = await downloadImage(randomUrl, `cecan_china_${Date.now()}.jpg`);
       await bot.sendPhoto(chatId, imgPath, {
         caption: '✨ Gambar dari fitur Cecan China ✨\n⚠️ Jika gambar masih sama, kemungkinan API belum menyediakan gambar acak yang berbeda.'
       });
       fs.unlinkSync(imgPath); // Hapus file setelah dikirim
     } catch (downloadErr) {
       // Tampilkan pesan kesalahan sesuai yang tercatat
       await bot.sendMessage(chatId, 
         '❌ *GAGAL MENGAMBIL ATAU MENGIRIM GAMBAR!* \nPesan dari server: "The file type is not currently supported. Please try another file type."', 
         { parse_mode: 'Markdown' }
       );
     }
   }
 });
 
 const CECAN_API_BASE_URLLL = 'https://ikyyzyyrestapi.my.id/random/cecan/indonesia';
 // Fungsi untuk mengunduh gambar sementara
 async function downloadImage(url, filename) {
   const filePath = path.join(__dirname, filename);
   try {
     const response = await axios.get(url, { responseType: 'stream' });
     return new Promise((resolve, reject) => {
       const writer = fs.createWriteStream(filePath);
       response.data.pipe(writer);
       writer.on('finish', () => resolve(filePath));
       writer.on('error', reject);
     });
   } catch (err) {
     throw new Error(err.message);
   }
 }
 // Tangani perintah /cecanhijab
 bot.onText(/^\/cecanindo$/, async (msg) => {
   const chatId = msg.chat.id;
   // Tambahkan parameter timestamp untuk menghindari cache
   const randomUrl = `${CECAN_API_BASE_URLLL}?t=${Date.now()}`;
   try {
     await bot.sendMessage(chatId, '🔄 Sedang mengambil gambar baru... Tunggu sebentar ya!');
     
     // Coba kirim gambar langsung dengan URL yang sudah ditambahkan timestamp
     await bot.sendPhoto(chatId, randomUrl, {
       caption: '✨ Gambar dari fitur Cecan Indonesia ✨\n⚠️ Jika gambar masih sama, kemungkinan API belum menyediakan gambar acak yang berbeda.'
     });
   } catch (directErr) {
     console.error('Gagal kirim gambar langsung:', directErr);
     // Coba unduh dulu jika kirim langsung gagal
     try {
       const imgPath = await downloadImage(randomUrl, `cecan_indonesia_${Date.now()}.jpg`);
       await bot.sendPhoto(chatId, imgPath, {
         caption: '✨ Gambar dari fitur Cecan Indonesia ✨\n⚠️ Jika gambar masih sama, kemungkinan API belum menyediakan gambar acak yang berbeda.'
       });
       fs.unlinkSync(imgPath); // Hapus file setelah dikirim
     } catch (downloadErr) {
       // Tampilkan pesan kesalahan sesuai yang tercatat
       await bot.sendMessage(chatId, 
         '❌ *GAGAL MENGAMBIL ATAU MENGIRIM GAMBAR!* \nPesan dari server: "The file type is not currently supported. Please try another file type."', 
         { parse_mode: 'Markdown' }
       );
     }
   }
 });
 
 const CECAN_API_BASE_URLLLL = 'https://ikyyzyyrestapi.my.id/random/cecan/japan';
 // Fungsi untuk mengunduh gambar sementara
 async function downloadImage(url, filename) {
   const filePath = path.join(__dirname, filename);
   try {
     const response = await axios.get(url, { responseType: 'stream' });
     return new Promise((resolve, reject) => {
       const writer = fs.createWriteStream(filePath);
       response.data.pipe(writer);
       writer.on('finish', () => resolve(filePath));
       writer.on('error', reject);
     });
   } catch (err) {
     throw new Error(err.message);
   }
 }
 // Tangani perintah /cecanhijab
 bot.onText(/^\/cecanjapan$/, async (msg) => {
   const chatId = msg.chat.id;
   // Tambahkan parameter timestamp untuk menghindari cache
   const randomUrl = `${CECAN_API_BASE_URLLLL}?t=${Date.now()}`;
   try {
     await bot.sendMessage(chatId, '🔄 Sedang mengambil gambar baru... Tunggu sebentar ya!');
     
     // Coba kirim gambar langsung dengan URL yang sudah ditambahkan timestamp
     await bot.sendPhoto(chatId, randomUrl, {
       caption: '✨ Gambar dari fitur Cecan Jepang ✨\n⚠️ Jika gambar masih sama, kemungkinan API belum menyediakan gambar acak yang berbeda.'
     });
   } catch (directErr) {
     console.error('Gagal kirim gambar langsung:', directErr);
     // Coba unduh dulu jika kirim langsung gagal
     try {
       const imgPath = await downloadImage(randomUrl, `cecan_japan_${Date.now()}.jpg`);
       await bot.sendPhoto(chatId, imgPath, {
         caption: '✨ Gambar dari fitur Cecan Jepang ✨\n⚠️ Jika gambar masih sama, kemungkinan API belum menyediakan gambar acak yang berbeda.'
       });
       fs.unlinkSync(imgPath); // Hapus file setelah dikirim
     } catch (downloadErr) {
       // Tampilkan pesan kesalahan sesuai yang tercatat
       await bot.sendMessage(chatId, 
         '❌ *GAGAL MENGAMBIL ATAU MENGIRIM GAMBAR!* \nPesan dari server: "The file type is not currently supported. Please try another file type."', 
         { parse_mode: 'Markdown' }
       );
     }
   }
 });
 
 const CECAN_API_BASE_URLLLLL = 'https://ikyyzyyrestapi.my.id/random/cecan/korea';
 // Fungsi untuk mengunduh gambar sementara
 async function downloadImage(url, filename) {
   const filePath = path.join(__dirname, filename);
   try {
     const response = await axios.get(url, { responseType: 'stream' });
     return new Promise((resolve, reject) => {
       const writer = fs.createWriteStream(filePath);
       response.data.pipe(writer);
       writer.on('finish', () => resolve(filePath));
       writer.on('error', reject);
     });
   } catch (err) {
     throw new Error(err.message);
   }
 }
 // Tangani perintah /cecanhijab
 bot.onText(/^\/cecankorea$/, async (msg) => {
   const chatId = msg.chat.id;
   // Tambahkan parameter timestamp untuk menghindari cache
   const randomUrl = `${CECAN_API_BASE_URLLLLL}?t=${Date.now()}`;
   try {
     await bot.sendMessage(chatId, '🔄 Sedang mengambil gambar baru... Tunggu sebentar ya!');
     
     // Coba kirim gambar langsung dengan URL yang sudah ditambahkan timestamp
     await bot.sendPhoto(chatId, randomUrl, {
       caption: '✨ Gambar dari fitur Cecan Korean ✨\n⚠️ Jika gambar masih sama, kemungkinan API belum menyediakan gambar acak yang berbeda.'
     });
   } catch (directErr) {
     console.error('Gagal kirim gambar langsung:', directErr);
     // Coba unduh dulu jika kirim langsung gagal
     try {
       const imgPath = await downloadImage(randomUrl, `cecan_korean_${Date.now()}.jpg`);
       await bot.sendPhoto(chatId, imgPath, {
         caption: '✨ Gambar dari fitur Cecan Korea ✨\n⚠️ Jika gambar masih sama, kemungkinan API belum menyediakan gambar acak yang berbeda.'
       });
       fs.unlinkSync(imgPath); // Hapus file setelah dikirim
     } catch (downloadErr) {
       // Tampilkan pesan kesalahan sesuai yang tercatat
       await bot.sendMessage(chatId, 
         '❌ *GAGAL MENGAMBIL ATAU MENGIRIM GAMBAR!* \nPesan dari server: "The file type is not currently supported. Please try another file type."', 
         { parse_mode: 'Markdown' }
       );
     }
   }
 });
 
 const CECAN_API_BASE_UR = 'https://ikyyzyyrestapi.my.id/random/cecan/malaysia';
 // Fungsi untuk mengunduh gambar sementara
 async function downloadImage(url, filename) {
   const filePath = path.join(__dirname, filename);
   try {
     const response = await axios.get(url, { responseType: 'stream' });
     return new Promise((resolve, reject) => {
       const writer = fs.createWriteStream(filePath);
       response.data.pipe(writer);
       writer.on('finish', () => resolve(filePath));
       writer.on('error', reject);
     });
   } catch (err) {
     throw new Error(err.message);
   }
 }
 // Tangani perintah /cecanhijab
 bot.onText(/^\/cecanmalaysia$/, async (msg) => {
   const chatId = msg.chat.id;
   // Tambahkan parameter timestamp untuk menghindari cache
   const randomUrl = `${CECAN_API_BASE_UR}?t=${Date.now()}`;
   try {
     await bot.sendMessage(chatId, '🔄 Sedang mengambil gambar baru... Tunggu sebentar ya!');
     
     // Coba kirim gambar langsung dengan URL yang sudah ditambahkan timestamp
     await bot.sendPhoto(chatId, randomUrl, {
       caption: '✨ Gambar dari fitur Cecan Malaysia ✨\n⚠️ Jika gambar masih sama, kemungkinan API belum menyediakan gambar acak yang berbeda.'
     });
   } catch (directErr) {
     console.error('Gagal kirim gambar langsung:', directErr);
     // Coba unduh dulu jika kirim langsung gagal
     try {
       const imgPath = await downloadImage(randomUrl, `cecan_malaysia_${Date.now()}.jpg`);
       await bot.sendPhoto(chatId, imgPath, {
         caption: '✨ Gambar dari fitur Cecan Malaysia ✨\n⚠️ Jika gambar masih sama, kemungkinan API belum menyediakan gambar acak yang berbeda.'
       });
       fs.unlinkSync(imgPath); // Hapus file setelah dikirim
     } catch (downloadErr) {
       // Tampilkan pesan kesalahan sesuai yang tercatat
       await bot.sendMessage(chatId, 
         '❌ *GAGAL MENGAMBIL ATAU MENGIRIM GAMBAR!* \nPesan dari server: "The file type is not currently supported. Please try another file type."', 
         { parse_mode: 'Markdown' }
       );
     }
   }
 });
 
 const CECAN_API_BASE_U = 'https://ikyyzyyrestapi.my.id/random/cecan/thailand';
 // Fungsi untuk mengunduh gambar sementara
 async function downloadImage(url, filename) {
   const filePath = path.join(__dirname, filename);
   try {
     const response = await axios.get(url, { responseType: 'stream' });
     return new Promise((resolve, reject) => {
       const writer = fs.createWriteStream(filePath);
       response.data.pipe(writer);
       writer.on('finish', () => resolve(filePath));
       writer.on('error', reject);
     });
   } catch (err) {
     throw new Error(err.message);
   }
 }
 // Tangani perintah /cecanhijab
 bot.onText(/^\/cecanthailand$/, async (msg) => {
   const chatId = msg.chat.id;
   // Tambahkan parameter timestamp untuk menghindari cache
   const randomUrl = `${CECAN_API_BASE_U}?t=${Date.now()}`;
   try {
     await bot.sendMessage(chatId, '🔄 Sedang mengambil gambar baru... Tunggu sebentar ya!');
     
     // Coba kirim gambar langsung dengan URL yang sudah ditambahkan timestamp
     await bot.sendPhoto(chatId, randomUrl, {
       caption: '✨ Gambar dari fitur Cecan Thailand ✨\n⚠️ Jika gambar masih sama, kemungkinan API belum menyediakan gambar acak yang berbeda.'
     });
   } catch (directErr) {
     console.error('Gagal kirim gambar langsung:', directErr);
     // Coba unduh dulu jika kirim langsung gagal
     try {
       const imgPath = await downloadImage(randomUrl, `cecan_thailand_${Date.now()}.jpg`);
       await bot.sendPhoto(chatId, imgPath, {
         caption: '✨ Gambar dari fitur Cecan Thailand ✨\n⚠️ Jika gambar masih sama, kemungkinan API belum menyediakan gambar acak yang berbeda.'
       });
       fs.unlinkSync(imgPath); // Hapus file setelah dikirim
     } catch (downloadErr) {
       // Tampilkan pesan kesalahan sesuai yang tercatat
       await bot.sendMessage(chatId, 
         '❌ *GAGAL MENGAMBIL ATAU MENGIRIM GAMBAR!* \nPesan dari server: "The file type is not currently supported. Please try another file type."', 
         { parse_mode: 'Markdown' }
       );
     }
   }
 });
 
 const CECAN_API_BASE = 'https://ikyyzyyrestapi.my.id/random/cecan/vietnam';
 // Fungsi untuk mengunduh gambar sementara
 async function downloadImage(url, filename) {
   const filePath = path.join(__dirname, filename);
   try {
     const response = await axios.get(url, { responseType: 'stream' });
     return new Promise((resolve, reject) => {
       const writer = fs.createWriteStream(filePath);
       response.data.pipe(writer);
       writer.on('finish', () => resolve(filePath));
       writer.on('error', reject);
     });
   } catch (err) {
     throw new Error(err.message);
   }
 }
 // Tangani perintah /cecanhijab
 bot.onText(/^\/cecanvietnam$/, async (msg) => {
   const chatId = msg.chat.id;
   // Tambahkan parameter timestamp untuk menghindari cache
   const randomUrl = `${CECAN_API_BASE}?t=${Date.now()}`;
   try {
     await bot.sendMessage(chatId, '🔄 Sedang mengambil gambar baru... Tunggu sebentar ya!');
     
     // Coba kirim gambar langsung dengan URL yang sudah ditambahkan timestamp
     await bot.sendPhoto(chatId, randomUrl, {
       caption: '✨ Gambar dari fitur Cecan Vietnam ✨\n⚠️ Jika gambar masih sama, kemungkinan API belum menyediakan gambar acak yang berbeda.'
     });
   } catch (directErr) {
     console.error('Gagal kirim gambar langsung:', directErr);
     // Coba unduh dulu jika kirim langsung gagal
     try {
       const imgPath = await downloadImage(randomUrl, `cecan_vietnam_${Date.now()}.jpg`);
       await bot.sendPhoto(chatId, imgPath, {
         caption: '✨ Gambar dari fitur Cecan Vietnam ✨\n⚠️ Jika gambar masih sama, kemungkinan API belum menyediakan gambar acak yang berbeda.'
       });
       fs.unlinkSync(imgPath); // Hapus file setelah dikirim
     } catch (downloadErr) {
       // Tampilkan pesan kesalahan sesuai yang tercatat
       await bot.sendMessage(chatId, 
         '❌ *GAGAL MENGAMBIL ATAU MENGIRIM GAMBAR!* \nPesan dari server: "The file type is not currently supported. Please try another file type."', 
         { parse_mode: 'Markdown' }
       );
     }
   }
 });
 
 bot.onText(/^\/texttoimage (.+)$/, async (msg, match) => {
   const chatId = msg.chat.id;
   const textPrompt = match[1]; // Ambil teks yang dimasukkan pengguna
   try {
     // Panggil API untuk menghasilkan gambar
     const response = await fetch(`https://ikyyzyyrestapi.my.id/ai/text2img?apikey=kyzz&text=${encodeURIComponent(textPrompt)}`);
     const data = await response.json();
     if (data.status && data.result?.url) {
       // Kirim gambar ke pengguna
       await bot.sendPhoto(chatId, data.result.url, {
    caption: `☄️ Status: ${data.result.status}\n🧒 Creator: Ganzz Alwayss\n⛅ Link Foto: ${data.result.url}\n💌 Gambar dihasilkan dari prompt: "${data.result.prompt}"` // Caption yang diinginkan
  });
     } else {
       await bot.sendMessage(chatId, 'Gagal menghasilkan gambar dari API.');
     }
   } catch (error) {
     console.error(error);
     await bot.sendMessage(chatId, 'Terjadi kesalahan saat memproses permintaan.');
   }
 });
 // Tangkap kasus tidak ada teks setelah perintah
 bot.onText(/^\/texttoimage$/, (msg) => {
   const chatId = msg.chat.id;
   bot.sendMessage(chatId, 'Format salah! Gunakan format: /texttoimage [teks yang ingin diubah jadi gambar]');
 });
 
 // Fungsi untuk mengambil cuplikan kode dengan baris yang menandai error
 function getSnippet(lines, line, range = 2) {
   const start = Math.max(0, line - range - 1);
   const end = Math.min(lines.length - 1, line + range - 1);
   let out = [];
   for (let i = start; i <= end; i++) {
     const mark = i + 1 === line ? "👉" : "  ";
     out.push(`${mark} ${i + 1} | ${lines[i] || ''}`);
   }
   return out.join("\n");
 }
 // Fungsi untuk menampilkan progress bar
 async function showProgress(chatId, bot) {
   const steps = [
     "▰▱▱▱▱▱▱▱▱▱ 10%",
     "▰▰▱▱▱▱▱▱▱▱ 20%",
     "▰▰▰▱▱▱▱▱▱▱ 30%",
     "▰▰▰▰▱▱▱▱▱▱ 40%",
     "▰▰▰▰▰▱▱▱▱▱ 50%",
     "▰▰▰▰▰▰▱▱▱▱ 60%",
     "▰▰▰▰▰▰▰▱▱▱ 70%",
     "▰▰▰▰▰▰▰▰▱▱ 80%",
     "▰▰▰▰▰▰▰▰▰▱ 90%",
     "▰▰▰▰▰▰▰▰▰▰ 100%"
   ];
   // Kirim pesan awal progress
   const msg = await bot.sendMessage(chatId, 
     "<b>🔎 Memulai Analisis</b>\n<pre>▱▱▱▱▱▱▱▱▱▱ 0%</pre>", 
     { parse_mode: "HTML" }
   );
   // Update progress setiap 300ms
   for (const bar of steps) {
     await new Promise(r => setTimeout(r, 300));
     await bot.editMessageText(
       `<b>🔎 Menganalisis Kode</b>\n<pre>${bar}</pre>`,
       {
         chat_id: chatId,
         message_id: msg.message_id,
         parse_mode: "HTML"
       }
     );
   }
 }
 // Command /cekfunc
 bot.onText(/^\/cekfunc$/, async (msg) => {
   const chatId = msg.chat.id;
   const replyMsg = msg.reply_to_message;
   // Cek apakah merespons pesan dengan dokumen
   if (!replyMsg || !replyMsg.document) {
     return bot.sendMessage(chatId, "❌ Reply file .js lalu ketik /cekfunc");
   }
   // Cek ekstensi file
   if (!replyMsg.document.file_name.endsWith(".js")) {
     return bot.sendMessage(chatId, "❌ File harus berekstensi .js");
   }
   try {
     // Kirim header
     await bot.sendMessage(chatId, 
       "```\n-------------------------\nInput received\nRunning parser\n-------------------------\n```", 
       { parse_mode: "Markdown" }
     );
     // Tampilkan progress bar
     await showProgress(chatId, bot);
     // Ambil link file dari Telegram
     const fileLink = await bot.getFileLink(replyMsg.document.file_id);
     const res = await fetch(fileLink);
     const code = await res.text();
     try {
       // Parse kode untuk cek sintaks
       acorn.parse(code, {
         ecmaVersion: "latest",
         sourceType: "module"
       });
       // Cek apakah ada async function
       if (!/async\s+function/.test(code)) {
         await bot.sendMessage(chatId, 
           "```\n⚠️ PERINGATAN!\nFunction tidak menggunakan async function.\n```", 
           { parse_mode: "Markdown" }
         );
       }
       // Kirim pesan sukses
       await bot.sendMessage(chatId, 
         "<pre>✅ Function Valid Dan Tidak Ditemukan Error Syntax</pre>", 
         { parse_mode: "HTML" }
       );
     } catch (err) {
       const lines = code.split("\n");
       const line = err.loc?.line || 0;
       const col = err.loc?.column || 0;
       const snippet = line ? getSnippet(lines, line) : "Tidak Tersedia";
       // Kirim info error
       await bot.sendMessage(chatId, 
         `<pre>❌ ERROR TERDETEKSI</pre>\n<b>${err.message}\nLokasi : Line ${line} : ${col}</b>`, 
         { parse_mode: "HTML" }
       );
       // Kirim cuplikan kode
       await bot.sendMessage(chatId, `<pre>${snippet}</pre>`, { parse_mode: "HTML" });
     }
   } catch (e) {
     console.error(e);
     await bot.sendMessage(chatId, "❌ Gagal memproses file.");
   }
 });
 
 // URL API yang diberikan
 const API_URLL = 'https://ikyyzyyrestapi.my.id/Info/ml';
 // Command /eventsml
 bot.onText(/^\/eventsml$/, async (msg) => {
     const chatId = msg.chat.id;
     try {
         // Kirim pesan loading sementara
         await bot.sendMessage(chatId, "🔍 Sedang mengambil data event MLBB terbaru... Tunggu sebentar ya!");
         // Ambil data dari API
         const response = await fetch(API_URLL);
         if (!response.ok) throw new Error('Gagal mengambil data dari API');
         
         const data = await response.json();
         // Cek apakah API mengembalikan sukses
         if (!data.success || !data.events) {
             return bot.sendMessage(chatId, "❌ Maaf, tidak dapat menemukan data event MLBB saat ini.");
         }
         // Siapkan pesan respons dengan format teks biasa + emoji
         let eventMessage = "🎉 *DAFTAR EVENT MOBILE LEGENDS TERBARU* 🎉\n\n";
         
         data.events.forEach((event, index) => {
             eventMessage += `${index + 1}. ✨ *${event.eventTitle}*\n`;
             eventMessage += `🗓️ Waktu: ${event.startDate} - ${event.endDate}\n`;
             eventMessage += `ℹ️ Deskripsi: ${event.shortDesc}\n`;
             eventMessage += `🔗 Info lengkap: ${event.link}\n\n`;
         });
         // Kirim pesan akhir
         await bot.sendMessage(chatId, eventMessage);
     } catch (error) {
         console.error('Error:', error);
         await bot.sendMessage(chatId, "❌ Terjadi kesalahan saat memuat data event. Silakan coba lagi nanti.");
     }
 });
 
 const API_BAS = 'https://ikyyzyyrestapi.my.id/search/lyrics?apikey=kyzz&query=';
 // Command /searchlyrics <nama lagu>
 bot.onText(/^\/searchlyrics (.+)$/, async (msg, match) => {
     const chatId = msg.chat.id;
     const songQuery = match[1]; // Ambil nama lagu dari input user
     try {
         // Kirim pesan loading
         await bot.sendMessage(chatId, "🔍 Sedang mencari lirik lagu... Tunggu ya!");
         // Panggil API dengan query yang dimasukkan user
         const encodedQuery = encodeURIComponent(songQuery);
         const response = await fetch(`${API_BAS}${encodedQuery}`);
         
         if (!response.ok) throw new Error('Gagal mengambil data dari API');
         
         const data = await response.json();
         // Cek status API dan apakah ada hasil
         if (!data.status || !data.result || data.result.length === 0) {
             return bot.sendMessage(chatId, "❌ Maaf, lagu tidak ditemukan atau tidak ada data yang tersedia.");
         }
         // Ambil hanya hasil paling atas (index 0)
         const topResult = data.result[0];
         // Siapkan pesan respons tanpa duration dan instrumental
         let replyMessage = `✨ *HASIL PENCARIAN LIRIK: ${songQuery.toUpperCase()}* ✨\n\n`;
         replyMessage += `ID: ${topResult.id}\n`;
         replyMessage += `Nama Lagu: ${topResult.name}\n`;
         replyMessage += `Nama Track: ${topResult.trackName}\n`;
         replyMessage += `Artis: ${topResult.artistName}\n`;
         replyMessage += `Album: ${topResult.albumName}\n`;
         replyMessage += `Lirik Biasa:\n${topResult.plainLyrics}\n`;
         replyMessage += `Lirik Bersinkronisasi:\n${topResult.syncedLyrics}`;
         // Kirim pesan akhir dalam format teks biasa
         await bot.sendMessage(chatId, replyMessage);
     } catch (error) {
         console.error('Error:', error);
         await bot.sendMessage(chatId, "❌ Terjadi kesalahan saat mencari lirik. Silakan coba lagi nanti.");
     }
 });
 // Tangani jika user hanya mengetik /searchlyrics tanpa nama lagu
 bot.onText(/^\/searchlyrics$/, (msg) => {
     const chatId = msg.chat.id;
     bot.sendMessage(chatId, "⚠️ Gunakan format yang benar!\nContoh: /searchlyrics Jendela kelas satu");
 });
 
 const ANIME_API_BASE_URL = 'https://ikyyzyyrestapi.my.id/random/animehot';
 // Fungsi untuk mengunduh gambar sementara
 async function downloadImage(url, filename) {
   const filePath = path.join(__dirname, filename);
   try {
     const response = await axios.get(url, { responseType: 'stream' });
     return new Promise((resolve, reject) => {
       const writer = fs.createWriteStream(filePath);
       response.data.pipe(writer);
       writer.on('finish', () => resolve(filePath));
       writer.on('error', reject);
     });
   } catch (err) {
     throw new Error(err.message);
   }
 }
 // Tangani perintah /cecanhijab
 bot.onText(/^\/animehot$/, async (msg) => {
   const chatId = msg.chat.id;
   // Tambahkan parameter timestamp untuk menghindari cache
   const randomUrl = `${ANIME_API_BASE_URL}?t=${Date.now()}`;
   try {
     await bot.sendMessage(chatId, '🔄 Sedang mengambil gambar baru... Tunggu sebentar ya!');
     
     // Coba kirim gambar langsung dengan URL yang sudah ditambahkan timestamp
     await bot.sendPhoto(chatId, randomUrl, {
       caption: '✨ Gambar dari fitur Anime Hot ✨\n⚠️ Jika gambar masih sama, kemungkinan API belum menyediakan gambar acak yang berbeda.'
     });
   } catch (directErr) {
     console.error('Gagal kirim gambar langsung:', directErr);
     // Coba unduh dulu jika kirim langsung gagal
     try {
       const imgPath = await downloadImage(randomUrl, `anime_hot_${Date.now()}.jpg`);
       await bot.sendPhoto(chatId, imgPath, {
         caption: '✨ Gambar dari fitur Anime Hot ✨\n⚠️ Jika gambar masih sama, kemungkinan API belum menyediakan gambar acak yang berbeda.'
       });
       fs.unlinkSync(imgPath); // Hapus file setelah dikirim
     } catch (downloadErr) {
       // Tampilkan pesan kesalahan sesuai yang tercatat
       await bot.sendMessage(chatId, 
         '❌ *GAGAL MENGAMBIL ATAU MENGIRIM GAMBAR!* \nPesan dari server: "The file type is not currently supported. Please try another file type."', 
         { parse_mode: 'Markdown' }
       );
     }
   }
 });
 
const BLUE_API_BASE_URL = 'https://ikyyzyyrestapi.my.id/random/blue-archive?apikey=kyzz';
 // Fungsi untuk mengunduh gambar dari URL dan menyimpannya sementara
 async function downloadImageFromUrl(url, filename) {
   const filePath = path.join(__dirname, filename);
   try {
     const response = await axios.get(url, { responseType: 'stream' });
     return new Promise((resolve, reject) => {
       const writer = fs.createWriteStream(filePath);
       response.data.pipe(writer);
       writer.on('finish', () => resolve(filePath));
       writer.on('error', (err) => {
         if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
         reject(err);
       });
     });
   } catch (err) {
     throw new Error(`Gagal mengunduh gambar dari URL: ${err.message}`);
   }
 }
 // Fungsi untuk menyimpan buffer gambar menjadi file sementara
 async function saveImageFromBuffer(buffer, filename) {
   const filePath = path.join(__dirname, filename);
   try {
     await fs.promises.writeFile(filePath, buffer);
     return filePath;
   } catch (err) {
     throw new Error(`Gagal menyimpan gambar dari buffer: ${err.message}`);
   }
 }
 // Tangani perintah /bluearchive
 bot.onText(/^\/bluearchive$/, async (msg) => {
   const chatId = msg.chat.id;
   const apiUrl = `${BLUE_API_BASE_URL}${BLUE_API_BASE_URL.includes('?') ? '&' : '?'}t=${Date.now()}`;
   try {
     await bot.sendMessage(chatId, '🔄 Sedang mengambil data gambar... Tunggu sebentar ya!');
     const response = await axios.get(apiUrl, {
       responseType: 'arraybuffer',
       validateStatus: (status) => status >= 200 && status < 300
     });
     let imageSource = null;
     const contentType = response.headers['content-type'] || '';
     // Kasus 1: API mengembalikan file gambar langsung
     if (contentType.startsWith('image/')) {
       const buffer = Buffer.from(response.data);
       
       // Verifikasi tipe file dengan cara yang jelas
       let fileTypeData = null;
       try {
         fileTypeData = await fileType.fromBuffer(buffer);
       } catch (typeErr) {
         console.warn('Verifikasi tipe file gagal, pakai tipe dari header:', typeErr.message);
         const ext = contentType.split('/')[1] || 'jpg';
         fileTypeData = { mime: contentType, ext: ext };
       }
       if (!fileTypeData || !fileTypeData.mime.startsWith('image/')) {
         throw new Error('The file type is not currently supported. Please try another file type.');
       }
       const tempFilePath = await saveImageFromBuffer(buffer, `blue_archive_file_${Date.now()}.${fileTypeData.ext}`);
       imageSource = tempFilePath;
     // Kasus 2: API mengembalikan JSON yang berisi URL gambar
     } else if (contentType.includes('json')) {
       try {
         const jsonString = Buffer.from(response.data).toString('utf8');
         const jsonData = JSON.parse(jsonString);
         const imageUrl = jsonData.imageUrl || jsonData.url || jsonData.link;
         
         if (!imageUrl) throw new Error('JSON tidak punya URL gambar yang valid.');
         const headCheck = await axios.head(imageUrl);
         if (!headCheck.headers['content-type']?.startsWith('image/')) {
           throw new Error('The file type is not currently supported. Please try another file type.');
         }
         const tempFilePath = await downloadImageFromUrl(imageUrl, `blue_archive_url_${Date.now()}.jpg`);
         imageSource = tempFilePath;
       } catch (jsonErr) {
         throw new Error(`Gagal baca JSON: ${jsonErr.message}`);
       }
     // Kasus tidak dikenali
     } else {
       throw new Error('The file type is not currently supported. Please try another file type.');
     }
     // Kirim gambar ke user
     await bot.sendPhoto(chatId, imageSource, {
       caption: '✨ Gambar dari fitur Blue Archive ✨'
     });
     // Hapus file sementara setelah dikirim
     if (imageSource && fs.existsSync(imageSource)) {
       fs.unlinkSync(imageSource);
     }
   } catch (error) {
     console.error('Detail Error:', error);
     const errorMsg = error.message.includes('supported') 
       ? '❌ *GAGAL MENGAMBIL ATAU MENGIRIM GAMBAR!* \nPesan dari server: "The file type is not currently supported. Please try another file type."'
       : `❌ *GAGAL MENGAMBIL ATAU MENGIRIM GAMBAR!* \nPesan kesalahan: ${error.message}`;
     
     await bot.sendMessage(chatId, errorMsg, { parse_mode: 'Markdown' });
   }
 });
 
 const ANIME_URL = 'https://ikyyzyyrestapi.my.id/anime/otakudesu/search?query=';
 // Nama diubah menjadi searchCachee
 const searchCachee = new Map();
 const TEMP_FOLDER = path.join(__dirname, 'temp_images');
 if (!fs.existsSync(TEMP_FOLDER)) fs.mkdirSync(TEMP_FOLDER);
 // Fungsi buat caption (tanpa Markdown agar tidak ada konflik)
 function getAnimeCaption(animeData) {
   const shortTitle = animeData.title.length > 50 ? `${animeData.title.substring(0, 50)}...` : animeData.title;
   return `✨ HASIL PENCARIAN ANIME ✨\n\n` +
          `📝 Judul: ${shortTitle}\n` +
          `🎯 Genre: ${animeData.genres.replace('Genres : ', '')}\n` +
          `✅ Status: ${animeData.status.replace('Status : ', '')}\n` +
          `🔗 Link Detail: ${animeData.url}`;
 }
 // Fungsi unduh gambar ke folder sementara
 function downloadImage(url, filename) {
   return new Promise((resolve, reject) => {
     const filePath = path.join(TEMP_FOLDER, filename);
     const file = fs.createWriteStream(filePath);
     https.get(url, (response) => {
       if (response.statusCode !== 200) {
         return reject(new Error('Gambar tidak ditemukan'));
       }
       response.pipe(file);
       file.on('finish', () => resolve(filePath));
       file.on('error', (err) => {
         fs.unlinkSync(filePath);
         reject(err);
       });
     }).on('error', (err) => {
       reject(err);
     });
   });
 }
 // Fungsi buat tombol navigasi (tanpa karakter khusus)
 function getNavigationButtons(currentIndex, totalResults, cacheKey) {
   const buttons = [];
   const row = [];
   if (currentIndex > 0) {
     row.push({ text: '⬅️ Sebelumnya', callback_data: `anime_prev_${currentIndex}_${cacheKey}` });
   }
   if (currentIndex < totalResults - 1) {
     row.push({ text: 'Selanjutnya ➡️', callback_data: `anime_next_${currentIndex}_${cacheKey}` });
   }
   if (row.length > 0) buttons.push(row);
   return { reply_markup: { inline_keyboard: buttons } };
 }
 // Tangani perintah /searchanime
 bot.onText(/^\/searchanime (.+)$/, async (msg, match) => {
   const chatId = msg.chat.id;
   const animeQuery = match[1].trim();
   const cacheKey = `search_${chatId}_${Date.now()}`;
   try {
     await bot.sendMessage(chatId, '🔍 Sedang mencari anime... Tunggu ya!');
     // Panggil API
     const encodedQuery = encodeURIComponent(animeQuery);
     const response = await axios.get(`${ANIME_URL}${encodedQuery}`, { timeout: 10000 });
     const apiData = response.data;
     if (!apiData.status || apiData.total === 0) {
       return bot.sendMessage(chatId, '❌ TIDAK DITEMUKAN HASIL PENCARIAN');
     }
     const animeResults = apiData.result;
     // Menggunakan searchCachee untuk menyimpan data
     searchCachee.set(cacheKey, { query: animeQuery, results: animeResults });
     const firstAnime = animeResults[0];
     const navButtons = getNavigationButtons(0, animeResults.length, cacheKey);
     try {
       // Coba unduh gambar dulu lalu kirim sebagai lampiran
       const tempFileName = `anime_${Date.now()}.jpg`;
       const imagePath = await downloadImage(firstAnime.thumb, tempFileName);
       
       // Kirim gambar sebagai lampiran + caption teks biasa
       await bot.sendPhoto(chatId, imagePath, {
         caption: getAnimeCaption(firstAnime),
         ...navButtons
       });
       // Hapus gambar sementara
       fs.unlinkSync(imagePath);
     } catch (imgErr) {
       console.warn('Gagal kirim gambar, kirim hanya teks:', imgErr.message);
       // Kirim hanya teks jika gagal unduh gambar
       await bot.sendMessage(chatId, getAnimeCaption(firstAnime), navButtons);
     }
   } catch (error) {
     console.error('Error Utama:', error);
     const errMsg = error.response?.data?.description || error.message;
     await bot.sendMessage(chatId, `❌ GAGAL MENGAMBIL DATA ANIME!\nPesan kesalahan: ${errMsg}`);
   }
 });
 // Tangani klik tombol
 bot.on('callback_query', async (callbackQuery) => {
   const { id, data, message } = callbackQuery;
   const { chat: { id: chatId }, message_id: msgId } = message;
   if (!data.startsWith('anime_')) return;
   try {
     const [_, action, currentIndexStr, cacheKey] = data.split('_');
     const currentIndex = parseInt(currentIndexStr);
     // Mengecek data di searchCachee
     if (!searchCachee.has(cacheKey)) {
       return bot.answerCallbackQuery(id, { text: '❌ Data pencarian sudah kadaluarsa!' });
     }
     // Mengambil data dari searchCachee
     const { results: animeResults } = searchCachee.get(cacheKey);
     const newIndex = action === 'prev' ? currentIndex - 1 : currentIndex + 1;
     const targetAnime = animeResults[newIndex];
     const navButtons = getNavigationButtons(newIndex, animeResults.length, cacheKey);
     const caption = getAnimeCaption(targetAnime);
     try {
       // Coba unduh gambar baru
       const tempFileName = `anime_${Date.now()}.jpg`;
       const imagePath = await downloadImage(targetAnime.thumb, tempFileName);
       // Edit pesan dengan gambar baru
       await bot.editMessageMedia(
         {
           type: 'photo',
           media: imagePath,
           caption: caption
         },
         {
           chat_id: chatId,
           message_id: msgId,
           reply_markup: navButtons.reply_markup
         }
       );
       fs.unlinkSync(imagePath);
     } catch (imgErr) {
       console.warn('Gagal ganti gambar, ganti hanya teks:', imgErr.message);
       // Edit hanya teks jika gagal
       await bot.editMessageText(caption, {
         chat_id: chatId,
         message_id: msgId,
         reply_markup: navButtons.reply_markup
       });
     }
     await bot.answerCallbackQuery(id);
   } catch (error) {
     console.error('Error Tombol:', error);
     const errMsg = error.response?.data?.description || error.message;
     await bot.answerCallbackQuery(id, { text: `❌ Gagal ganti hasil: ${errMsg}` });
   }
 });
 // Tangani perintah tanpa parameter
 bot.onText(/^\/searchanime$/, (msg) => {
   bot.sendMessage(msg.chat.id, '⚠️ FORMAT SALAH!\nContoh: /searchanime One Punch Man');
 });

bot.onText(/^\/fakecall (.+)$/, async (msg, match) => {
   const chatId = msg.chat.id;
   try {
     const args = match[1].trim();
     const parts = args.split('|').map(p => p.trim());
     
     const name = parts[0] || 'Unknown';
     const duration = parts[1] || '13.50';
     const avatar = parts[2] || 'https://files.catbox.moe/xhrbzw.jpg';
     await bot.sendMessage(chatId, '🔔 Membuat fakecall...');
     const apiUrl = `https://api.zenzxz.my.id/api/maker/fakecall?nama=${encodeURIComponent(name)}&durasi=${encodeURIComponent(duration)}&avatar=${encodeURIComponent(avatar)}`;
     const response = await axios.get(apiUrl, { 
       responseType: 'arraybuffer', 
       timeout: 20000 
     });
     await bot.sendPhoto(
       chatId, 
       Buffer.from(response.data), 
       { caption: `✅ Fakecall untuk: ${name}\n⏱ Durasi: ${duration}` }
     );
   } catch (err) {
     console.error('Error /fakecall:', err);
     // Beritahu pengguna jika ada masalah dengan tipe halaman atau API
     if (err.message.includes('unsupported') || err.response?.status >= 400) {
       bot.sendMessage(chatId, '❌ Gagal membuat fakecall. Kemungkinan tipe halaman tidak didukung atau API bermasalah. Cek parameter atau coba lagi nanti.');
     } else {
       bot.sendMessage(chatId, '❌ Gagal membuat fakecall. Cek kembali parameter atau coba lagi nanti.');
     }
   }
 });
 // Handler jika /fakecall tanpa parameter
 bot.onText(/^\/fakecall$/, (msg) => {
   const chatId = msg.chat.id;
   bot.sendMessage(chatId, '⚠️ Gunakan: /fakecall nama|durasi|avatar_url\nContoh: /fakecall ganz|13.50|https://files.catbox.moe/xhrbzw.jpg');
 });
 // Perintah /fakestory
 bot.onText(/^\/fakestory (.+)$/, async (msg, match) => {
   const chatId = msg.chat.id;
   try {
     const text = match[1].trim();
     const [username, caption, ppurl] = text.split('|').map(a => a.trim());
     if (!username || !caption || !ppurl) {
       return bot.sendMessage(
         chatId,
         '⚠️ Format salah!\n\nContoh:\n`/fakestory ganz | Development of Bots | https://files.catbox.moe/xhrbzw.jpg`',
         { parse_mode: 'Markdown' }
       );
     }
     const apiUrl = `https://api.zenzxz.my.id/api/maker/fakestory?username=${encodeURIComponent(username)}&caption=${encodeURIComponent(caption)}&ppurl=${encodeURIComponent(ppurl)}`;
     await bot.sendPhoto(chatId, apiUrl);
   } catch (err) {
     console.error('Error /fakestory:', err);
     if (err.message.includes('unsupported') || err.response?.status >= 400) {
       bot.sendMessage(chatId, '❌ Gagal membuat fake story. Kemungkinan tipe halaman tidak didukung atau API bermasalah.');
     } else {
       bot.sendMessage(chatId, '❌ Gagal membuat fake story.');
     }
   }
 });
 // Handler jika /fakestory tanpa parameter
 bot.onText(/^\/fakestory$/, (msg) => {
   const chatId = msg.chat.id;
   bot.sendMessage(
     chatId,
     '⚠️ Format salah!\n\nContoh:\n`/fakestory ganz | Development of Bots | https://files.catbox.moe/xhrbzw.jpg`',
     { parse_mode: 'Markdown' }
   );
 });
 // Perintah /fakecoment (perbaiki nama perintah jika perlu menjadi /fakecomment)
 bot.onText(/^\/fakecoment (.+)$/, async (msg, match) => {
   const chatId = msg.chat.id;
   try {
     const args = match[1].trim().split('|').map(a => a.trim());
     const name = args[0];
     const comment = args[1];
     const ppurl = args[2];
     if (!name || !comment || !ppurl) {
       return bot.sendMessage(
         chatId,
         '⚠️ Format salah!\n\nContoh:\n`/fakecoment ganz | Development | https://files.catbox.moe/xhrbzw.jpg`',
         { parse_mode: 'Markdown' }
       );
     }
     const apiUrl = `https://api.zenzxz.my.id/api/maker/fakefb?name=${encodeURIComponent(name)}&comment=${encodeURIComponent(comment)}&ppurl=${encodeURIComponent(ppurl)}`;
     await bot.sendPhoto(chatId, apiUrl);
   } catch (err) {
     console.error('Error /fakecoment:', err);
     if (err.message.includes('unsupported') || err.response?.status >= 400) {
       bot.sendMessage(chatId, '❌ Gagal membuat fake komentar. Kemungkinan tipe halaman tidak didukung atau API bermasalah.');
     } else {
       bot.sendMessage(chatId, '❌ Gagal membuat fake komentar.');
     }
   }
 });
 // Handler jika /fakecoment tanpa parameter
 bot.onText(/^\/fakecoment$/, (msg) => {
   const chatId = msg.chat.id;
   bot.sendMessage(
     chatId,
     '⚠️ Format salah!\n\nContoh:\n`/fakecoment ganz | Development | https://files.catbox.moe/xhrbzw.jpg`',
     { parse_mode: 'Markdown' }
   );
 });

const OCR_API_URL = 'https://ikyyzyyrestapi.my.id/tools/ocr';
const TEMP_DIR = './temp_images';
// Tambah alternatif hosting
const UPLOAD_SERVICES = [
  { name: 'Catbox', url: 'https://catbox.moe/user/api.php' },
  { name: 'Litterbox', url: 'https://litterbox.catbox.moe/resources/internals/api.php' }
];

if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);

// Fitur /readimage
bot.onText(/^\/readimage$/, async (msg) => {
  const chatId = msg.chat.id;
  const replyMsg = msg.reply_to_message;

  if (!replyMsg || !replyMsg.photo) {
    return bot.sendMessage(chatId, '⚠️ Mohon reply ke foto terlebih dahulu!');
  }

  let tempFilePath = null;
  try {
    // Langkah 1: Unduh foto dari Telegram
    const photo = replyMsg.photo[replyMsg.photo.length - 1];
    tempFilePath = path.join(TEMP_DIR, `${uuidv4()}.jpg`);
    const fileStream = fs.createWriteStream(tempFilePath);
    const file = await bot.getFileStream(photo.file_id);
    
    await new Promise((resolve, reject) => {
      file.pipe(fileStream);
      fileStream.on('finish', resolve);
      fileStream.on('error', (err) => reject(new Error(`Gagal simpan foto: ${err.message}`)));
    });

    // Langkah 2: Upload ke hosting (coba alternatif jika salah satu gagal)
    let imageUrl = null;
    for (const service of UPLOAD_SERVICES) {
      try {
        const formData = new FormData();
        formData.append('reqtype', 'fileupload');
        formData.append('fileToUpload', fs.createReadStream(tempFilePath));
        // Untuk Litterbox tambah param expire
        if (service.name === 'Litterbox') formData.append('time', '1h');

        const uploadRes = await axios.post(service.url, formData, {
          headers: formData.getHeaders(),
          timeout: 15000 // Batasi waktu tunggu
        });

        imageUrl = uploadRes.data.trim();
        if (imageUrl) {
          console.log(`Berhasil upload ke ${service.name}: ${imageUrl}`);
          break;
        }
      } catch (uploadErr) {
        console.log(`Gagal upload ke ${service.name}: ${uploadErr.message}`);
        continue;
      }
    }

    if (!imageUrl) throw new Error('Semua layanan hosting sementara tidak dapat diakses');

    // Langkah 3: Panggil API OCR
    const ocrRes = await axios.get(OCR_API_URL, {
      params: { url: imageUrl },
      timeout: 15000
    });

    if (!ocrRes.data.status) throw new Error('API OCR mengembalikan status gagal');
    const ocrText = ocrRes.data.result.text || '❌ Tidak ada teks terdeteksi';
    bot.sendMessage(chatId, `📝 Hasil OCR:\n${ocrText}`);

  } catch (error) {
    console.error('Error detail:', error);
    let errorMsg = '❌ Terjadi kesalahan:\n';
    if (error.response?.status === 502) {
      errorMsg += '- API OCR atau hosting sedang down\n- Coba lagi nanti atau hubungi pengelola API';
    } else {
      errorMsg += error.message;
    }
    bot.sendMessage(chatId, errorMsg);
  } finally {
    // Bersihkan file sementara meskipun error
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
});

const NIAT_SHOLAT_API_URL = 'https://ikyyzyyrestapi.my.id/islamic/niatsholat';
// Fitur /niatsholat <nama_sholat>
 bot.onText(/^\/niatsholat (.+)$/, async (msg, match) => {
   const chatId = msg.chat.id;
   const namaSholat = match[1].trim().toLowerCase(); // Ubah ke huruf kecil agar tidak sensitif kapital
   try {
     // Panggil API dengan parameter nama sholat
     const response = await axios.get(NIAT_SHOLAT_API_URL, {
       params: { sholat: namaSholat },
       timeout: 15000
     });
     const data = response.data;
     // Cek apakah status API berhasil
     if (!data.status) {
       return bot.sendMessage(chatId, `❌ *Maaf!* ❌\nNama sholat *${namaSholat}* tidak ditemukan 😔\nCoba yang lain ya, contoh: Subuh, Dzuhur, Ashar, Maghrib, Isya`, { parse_mode: 'Markdown' });
     }
     // Siapkan pesan dengan emoji dan format menarik
     const pesanNiat = 
       `🤲 *NIAT SHOLAT ${data.sholat.toUpperCase()}* 🤲\n\n` +
       `📜 *Arab:* \n${data.result.arab} 🕌\n\n` +
       `🔠 *Latin:* \n${data.result.latin} ✍️\n\n` +
       `💬 *Arti:* \n${data.result.arti} ❤️\n\n` +
       `✨ *Semoga ibadah kita lancar dan diterima oleh Allah SWT ya!* ✨\n` +
       `🤲 *Aamiin Ya Robbal Alamin* 🤲`;
     // Kirim pesan ke pengguna
     bot.sendMessage(chatId, pesanNiat, { parse_mode: 'Markdown' });
   } catch (error) {
     console.error('Error detail:', error);
     let pesanError = `⚠️ *Terjadi Kesalahan!* ⚠️\n`;
     if (error.response?.status === 502) {
       pesanError += `🔌 API sedang tidak bisa diakses nih 😢\nCoba lagi nanti ya teman! 🔄`;
     } else if (error.code === 'ECONNABORTED') {
       pesanError += `⏳ Waktu tunggu terlalu lama nih 😅\nCoba lagi nanti ya! 🔄`;
     } else {
       pesanError += `❓ *Pesan Error:* ${error.message}\nCek nama sholat atau coba lagi nanti ya! 😊`;
     }
     bot.sendMessage(chatId, pesanError, { parse_mode: 'Markdown' });
   }
 });
 // Jika pengguna mengetik /niatsholat tanpa nama sholat
 bot.onText(/^\/niatsholat$/, (msg) => {
   const chatId = msg.chat.id;
   bot.sendMessage(chatId, 
     `❓ *Maaf!* ❓\nKamu lupa tulis nama sholatnya 😅\n` +
     `💡 Contoh penggunaan: \`/niatsholat Maghrib\`\n` +
     `📌 Daftar sholat yang bisa dicoba: Subuh, Dzuhur, Ashar, Maghrib, Isya 🌟`, 
     { parse_mode: 'Markdown' }
   );
 });

const KISAH_NABI_API_URL = 'https://ikyyzyyrestapi.my.id/islamic/kisahnabi';
// Fitur Utama /kisahnabi <nama_nabi>
 bot.onText(/^\/kisahnabi (.+)$/, async (msg, match) => {
   const chatId = msg.chat.id;
   const namaNabi = match[1].trim().toLowerCase(); // Tidak sensitif huruf besar/kecil
   try {
     // Panggil API Kisah Nabi
     const response = await axios.get(KISAH_NABI_API_URL, {
       params: { nabi: namaNabi },
       timeout: 15000
     });
     const data = response.data;
     // Cek Status Respons API
     if (!data.status) {
       return bot.sendMessage(chatId, 
         `❌ *Maaf Bosque!* ❌\nKisah Nabi *${namaNabi}* tidak ditemukan di database 😔\n` +
         `Coba nama lain ya, contoh: Muhammad, Musa, Ibrahim 🌟`,
         { parse_mode: 'Markdown' }
       );
     }
     // Format Mukjizat Menjadi Daftar dengan Emoji
     const daftarMukjizat = data.result.mukjizat.map((mukjizat, index) => 
       `${index + 1}. ${mukjizat} ✨`
     ).join('\n');
     // Siapkan Pesan dengan Emoji dan Format Menarik
     const pesanKisah = 
       `🤲 *KISAH NABI ${data.nabi.toUpperCase()}* 🤲\n\n` +
       `💫 *Nama Lengkap:*\n${data.result.nama} 🌟\n\n` +
       `📅 *Tempat & Tahun Kelahiran:*\n${data.result.kelahiran} 📍\n\n` +
       `📖 *Ringkasan Kisah:*\n${data.result.kisah} 💫\n\n` +
       `✨ *Mukjizat yang Diberikan Allah SWT:*\n${daftarMukjizat}\n\n` +
       `🤲 *Semoga kita bisa meneladani kebaikan dan kesabaran para nabi ya!* 🤲\n` +
       `🕋 *Aamiin Ya Robbal Alamin* 🕋`;
     // Kirim Pesan ke Pengguna
     bot.sendMessage(chatId, pesanKisah, { parse_mode: 'Markdown' });
   } catch (error) {
     console.error('Detail Error:', error);
     let pesanError = `⚠️ *Ada Masalah Gan!* ⚠️\n`;
     
     if (error.response?.status === 502) {
       pesanError += `🔌 API sedang tidak bisa diakses nih 😢\nCoba lagi nanti ya! 🔄`;
     } else if (error.code === 'ECONNABORTED') {
       pesanError += `⏳ Waktu tunggu terlalu lama nih 😅\nCoba lagi aja ya teman! 🔄`;
     } else {
       pesanError += `❓ *Pesan Error:* ${error.message}\nCek nama nabi atau coba lagi nanti ya! 😊`;
     }
     bot.sendMessage(chatId, pesanError, { parse_mode: 'Markdown' });
   }
 });
 // Jika Pengguna Lupa Menulis Nama Nabi
 bot.onText(/^\/kisahnabi$/, (msg) => {
   const chatId = msg.chat.id;
   bot.sendMessage(chatId, 
     `❓ *Waduh, Lupa Ya?* ❓\nKamu belum tulis nama nabi yang ingin dicari 😅\n` +
     `💡 Contoh penggunaan: \`/kisahnabi Muhammad\`\n` +
     `📌 Beberapa nama nabi yang bisa dicoba: Muhammad, Musa, Ibrahim, Isa 🌟`,
     { parse_mode: 'Markdown' }
   );
 });
 
 // Endpoint API yang akan digunakan
 const WANTED_API_ENDPOINT = 'https://ikyyzyyrestapi.my.id/canvas/image/wanted';
 // Tangani perintah /wanted yang digunakan dengan mereply foto
 bot.onText(/^\/wanted/, async (msg) => {
   const chatId = msg.chat.id;
   const replyToMessage = msg.reply_to_message;
   // Cek apakah perintah digunakan dengan mereply pesan yang berisi foto
   if (!replyToMessage || !replyToMessage.photo) {
     return bot.sendMessage(chatId, '⚠️ Gunakan perintah /wanted dengan cara mereply foto yang ingin diubah menjadi Wanted Meme ya!');
   }
   try {
     bot.sendMessage(chatId, '⚙️ Sedang memproses gambar Anda ke API...');
     // Ambil versi foto dengan resolusi tertinggi
     const highestResPhoto = replyToMessage.photo.pop();
     // Dapatkan link unduhan sementara foto dari server Telegram
     const telegramImageUrl = await bot.getFileLink(highestResPhoto.file_id);
     // Kirim permintaan ke API dengan URL foto dari Telegram
     const apiResponse = await axios.get(WANTED_API_ENDPOINT, {
       params: { url: telegramImageUrl },
       responseType: 'stream' // Ambil hasil gambar sebagai stream
     });
     // Kirimkan hasil gambar dari API langsung ke pengguna
     await bot.sendPhoto(chatId, apiResponse.data, {
       caption: '✅ Berhasil! Ini gambar Anda yang sudah diubah menjadi Wanted Meme:'
     });
   } catch (error) {
     let errorMessage = '❌ Terjadi kesalahan saat memproses gambar.';
     if (error.response && error.response.data) {
       // Baca pesan kesalahan dari API jika ada
       const apiError = await error.response.data.toString('utf8');
       errorMessage += `\nPesan dari API: ${apiError || 'Tipe file tidak didukung atau URL tidak valid'}`;
     } else {
       errorMessage += `\nDetail: ${error.message}`;
     }
     bot.sendMessage(chatId, errorMessage);
   }
 });
 
 const WALLPAPER_API_BASE_URLLLLL = 'https://ikyyzyyrestapi.my.id/wallpaper/random';
 // Fungsi untuk mengunduh gambar sementara
 async function downloadImage(url, filename) {
   const filePath = path.join(__dirname, filename);
   try {
     const response = await axios.get(url, { responseType: 'stream' });
     return new Promise((resolve, reject) => {
       const writer = fs.createWriteStream(filePath);
       response.data.pipe(writer);
       writer.on('finish', () => resolve(filePath));
       writer.on('error', reject);
     });
   } catch (err) {
     throw new Error(err.message);
   }
 }
 // Tangani perintah /cecanhijab
 bot.onText(/^\/randomwallpaper$/, async (msg) => {
   const chatId = msg.chat.id;
   // Tambahkan parameter timestamp untuk menghindari cache
   const randomUrl = `${WALLPAPER_API_BASE_URLLLLL}?t=${Date.now()}`;
   try {
     await bot.sendMessage(chatId, '🔄 Sedang mengambil gambar baru... Tunggu sebentar ya!');
     
     // Coba kirim gambar langsung dengan URL yang sudah ditambahkan timestamp
     await bot.sendPhoto(chatId, randomUrl, {
       caption: '✨ Gambar dari fitur Random Wallpapper ✨\n⚠️ Jika gambar masih sama, kemungkinan API belum menyediakan gambar acak yang berbeda.'
     });
   } catch (directErr) {
     console.error('Gagal kirim gambar langsung:', directErr);
     // Coba unduh dulu jika kirim langsung gagal
     try {
       const imgPath = await downloadImage(randomUrl, `random_wallpapper_${Date.now()}.jpg`);
       await bot.sendPhoto(chatId, imgPath, {
         caption: '✨ Gambar dari fitur Random Wallpapper ✨\n⚠️ Jika gambar masih sama, kemungkinan API belum menyediakan gambar acak yang berbeda.'
       });
       fs.unlinkSync(imgPath); // Hapus file setelah dikirim
     } catch (downloadErr) {
       // Tampilkan pesan kesalahan sesuai yang tercatat
       await bot.sendMessage(chatId, 
         '❌ *GAGAL MENGAMBIL ATAU MENGIRIM GAMBAR!* \nPesan dari server: "The file type is not currently supported. Please try another file type."', 
         { parse_mode: 'Markdown' }
       );
     }
   }
 });
 
 const BLUR_API_ENDPOINT = 'https://ikyyzyyrestapi.my.id/image/blur';
 // Tangani perintah /wanted yang digunakan dengan mereply foto
 bot.onText(/^\/toblur/, async (msg) => {
   const chatId = msg.chat.id;
   const replyToMessage = msg.reply_to_message;
   // Cek apakah perintah digunakan dengan mereply pesan yang berisi foto
   if (!replyToMessage || !replyToMessage.photo) {
     return bot.sendMessage(chatId, '⚠️ Gunakan perintah /wanted dengan cara mereply foto yang ingin diubah menjadi Wanted Meme ya!');
   }
   try {
     bot.sendMessage(chatId, '⚙️ Sedang memproses gambar Anda ke API...');
     // Ambil versi foto dengan resolusi tertinggi
     const highestResPhoto = replyToMessage.photo.pop();
     // Dapatkan link unduhan sementara foto dari server Telegram
     const telegramImageUrl = await bot.getFileLink(highestResPhoto.file_id);
     // Kirim permintaan ke API dengan URL foto dari Telegram
     const apiResponse = await axios.get(BLUR_API_ENDPOINT, {
       params: { url: telegramImageUrl },
       responseType: 'stream' // Ambil hasil gambar sebagai stream
     });
     // Kirimkan hasil gambar dari API langsung ke pengguna
     await bot.sendPhoto(chatId, apiResponse.data, {
       caption: '✅ Berhasil! Ini gambar Anda yang sudah diubah menjadi Wanted Meme:'
     });
   } catch (error) {
     let errorMessage = '❌ Terjadi kesalahan saat memproses gambar.';
     if (error.response && error.response.data) {
       // Baca pesan kesalahan dari API jika ada
       const apiError = await error.response.data.toString('utf8');
       errorMessage += `\nPesan dari API: ${apiError || 'Tipe file tidak didukung atau URL tidak valid'}`;
     } else {
       errorMessage += `\nDetail: ${error.message}`;
     }
     bot.sendMessage(chatId, errorMessage);
   }
 });
 
 const CONVERT_API_ENDPOINT = 'https://ikyyzyyrestapi.my.id/convert-mp3';
 // 📝 Tangani Perintah /tomp3
 bot.onText(/^\/tomp3/, async (msg) => {
   const chatId = msg.chat.id;
   const replyToMessage = msg.reply_to_message;
   // ⚠️ Peringatan Jika Format Salah
   if (!replyToMessage) {
     return bot.sendMessage(chatId, 
       `❌ *FORMAT PERINTAH SALAH NIH!* ❌\n\n` +
       `📌 Cara Pakainya:\n` +
       `👉 Reply video yang mau diubah jadi audio, lalu kirim *\/tomp3*\n\n` +
       `✨ Contoh:\n` +
       `1. Kirim/ambil video yang mau diubah 🎥\n` +
       `2. Reply video itu, lalu ketik *\/tomp3* 🎧\n\n` +
       `Yuk coba lagi ya kak! 😊`
     );
   }
   if (!replyToMessage.video && !replyToMessage.document) {
     return bot.sendMessage(chatId, 
       `❌ *YANG DI-REPLY HARUS VIDEO DONG!* ❌\n\n` +
       `📌 Harap reply file dengan format video (mp4, dll) ya kak! 🎥\n` +
       `Jangan reply foto, pesan teks, atau file lain ya! 😅`
     );
   }
   try {
     // 📥 Ambil File Video dari Telegram
     bot.sendMessage(chatId, 
       `✨ *PROSES DIMULAI BOSS!* ✨\n\n` +
       `📥 Sedang mengambil video yang kamu reply... 🎥\n` +
       `⏳ Mohon tunggu sebentar ya kakak! 🤗`
     );
     // Pilih file video yang valid
     const mediaFile = replyToMessage.video ? replyToMessage.video : replyToMessage.document;
     const fileLink = await bot.getFileLink(mediaFile.file_id);
     // 📤 Kirim ke API untuk Konversi
     bot.sendMessage(chatId, 
       `⚙️ *SEDANG MENGUBAH VIDEO JADI AUDIO...* ⚙️\n\n` +
       `🎧 Sedang proses konversi ke format MP3\n` +
       `💪 Sabar ya kak, sebentar lagi jadi! 🚀`
     );
     const apiResponse = await axios.get(CONVERT_API_ENDPOINT, {
       params: { url: fileLink }
     });
     // 📊 Parse Hasil Konversi
     const data = apiResponse.data;
     const audioUrl = data.result.url;
     // 🎧 Kirim Audio Hasil Konversi
     await bot.sendAudio(chatId, audioUrl, {
       caption: 
         `🎉 *SELAMAT! VIDEO BERHASIL DIUBAH JADI AUDIO!* 🎉\n\n` +
         `🎵 *Format:* ${data.result.format.toUpperCase()}\n` +
         `🤝 *Dibuat Oleh:* Ganzz Alwayss\n` +
         `🔗 *Link Download Audio:* ${audioUrl}\n\n` +
         `Semoga suka dengan hasilnya ya kak! 🥰`
     });
   } catch (error) {
     let errorMsg = 
       `😢 *WADUH, ADA KESALAHAN NIH!* 😢\n\n` +
       `❌ *Pesan Kesalahan:* ${error.message}\n`;
     if (error.response) {
       errorMsg += `📊 *Detail dari API:* ${JSON.stringify(error.response.data)}\n\n`;
     }
     errorMsg += `🤔 *Mungkin video tidak didukung atau API sedang sibuk ya! Coba lagi nanti aja kak!* 🤗`;
     bot.sendMessage(chatId, errorMsg, { parse_mode: 'Markdown' });
   }
 });
 
const UPSCALE_API_ENDPOINT = 'https://ikyyzyyrestapi.my.id/tools/upscale';
 const API_KEYY = 'kyzz'; 
 const UPLOAD_IMAGE_API = 'https://catbox.moe/user/api.php';
 const TEMPS_FOLDER = './temps_foto';
 // Buat folder sementara jika belum ada
 if (!fs.existsSync(TEMPS_FOLDER)) {
   fs.mkdirSync(TEMPS_FOLDER);
 }
 
 // 📝 Tangani Perintah /hd
 bot.onText(/^\/hd/, async (msg) => {
   const chatId = msg.chat.id;
   const replyToMessage = msg.reply_to_message;
   // ⚠️ Peringatan Format Salah
   if (!replyToMessage) {
     return bot.sendMessage(chatId, 
       `❌ *FORMAT PERINTAH SALAH BOSS!* ❌\n\n` +
       `📌 Cara Pakainya:\n` +
       `👉 Reply foto yang mau dijadikan HD, lalu kirim *\/hd*\n\n` +
       `✨ Contoh: Reply foto lalu ketik *\/hd* 🚀`
     );
   }
   if (!replyToMessage.photo && !replyToMessage.document) {
     return bot.sendMessage(chatId, 
       `❌ *YANG DI-REPLY HARUS FOTO DONG!* ❌\n\n` +
       `📌 Harap reply file gambar (JPG/PNG) ya kak! 📸`
     );
   }
   if (replyToMessage.document && !replyToMessage.document.mime_type.startsWith('image/')) {
     return bot.sendMessage(chatId, 
       `❌ *FILE INI BUKAN FOTO!* ❌\n\n` +
       `📌 Harap reply file dengan format gambar ya kak! 📸`
     );
   }
   const tempFilesToClean = [];
   try {
     await bot.sendMessage(chatId, `✨ *PROSES DIMULAI KAK!* ✨\n\n📥 Sedang mengambil foto... 📸`);
     // 📥 Langkah 1: Ambil & Konversi Foto Awal ke JPG
     const mediaFile = replyToMessage.photo ? replyToMessage.photo.pop() : replyToMessage.document;
     const fileLink = await bot.getFileLink(mediaFile.file_id);
     
     const imageDownload = await axios.get(fileLink, { 
       responseType: 'arraybuffer',
       timeout: 30000
     });
     const tempOriginalPath = path.join(TEMPS_FOLDER, `original_${Date.now()}.jpg`);
     tempFilesToClean.push(tempOriginalPath);
     
     await sharp(imageDownload.data)
       .toFormat('jpeg', { quality: 90 })
       .toFile(tempOriginalPath);
     await bot.sendMessage(chatId, `📤 *SEDANG UNGGAH FOTO KE SERVER...* 📤`);
     // 📤 Langkah 2: Unggah ke Catbox
     const form = new FormData();
     form.append('reqtype', 'fileupload');
     form.append('fileToUpload', fs.createReadStream(tempOriginalPath), {
       filename: `foto_${Date.now()}.jpg`,
       contentType: 'image/jpeg'
     });
     const uploadResult = await axios.post(UPLOAD_IMAGE_API, form, {
       headers: form.getHeaders(),
       timeout: 30000
     });
     const uploadedUrl = uploadResult.data.trim();
     if (!uploadedUrl || !uploadedUrl.startsWith('https')) {
       throw new Error(`Gagal dapatkan URL publik: ${uploadResult.data}`);
     }
     await bot.sendMessage(chatId, `✅ *FOTO BERHASIL DIUNGGAH!* ✅\n🔗 URL: ${uploadedUrl}\n⚙️ Sedang jadikan HD... 💪`);
     // 🚀 Langkah 3: Kirim ke API Upscale (ambil respon JSON bukan gambar)
     const upscaleResult = await axios.get(UPSCALE_API_ENDPOINT, {
       params: { apikey: API_KEYY, url: uploadedUrl },
       timeout: 60000
     });
     // Cek apakah respon API valid
     if (!upscaleResult.data.status || !upscaleResult.data.result?.result_url) {
       throw new Error(`Respon API tidak valid: ${JSON.stringify(upscaleResult.data)}`);
     }
     const hdImageUrl = upscaleResult.data.result.result_url;
     await bot.sendMessage(chatId, `✅ *FOTO BERHASIL DI-HD-KAN!* ✅\n🔗 Link Hasil: ${hdImageUrl}\n📥 Sedang unduh gambar... 💾`);
     // 📥 Langkah 4: Unduh Gambar dari Link Hasil API
     let hdImageData;
     try {
       hdImageData = await axios.get(hdImageUrl, {
         responseType: 'arraybuffer',
         timeout: 60000
       });
     } catch (downloadErr) {
       // Jika link hasil tidak bisa diakses (sesuai informasi yang diberikan)
       await bot.sendMessage(chatId, `⚠️ *GAGAL UNDUH GAMBAR DARI LINK HASIL!* ⚠️\n\n💡 *Solusi:* Silakan buka link di bawah ini melalui browser Anda:\n${hdImageUrl}`);
       return;
     }
     // 🎨 Langkah 5: Optimasi Gambar Sebelum Kirim
     await bot.sendMessage(chatId, `🖼️ *SEDANG OPTIMASI FOTO...* 🛠️`);
     const optimizedImagePath = path.join(TEMPS_FOLDER, `hd_optimized_${Date.now()}.jpg`);
     tempFilesToClean.push(optimizedImagePath);
     await sharp(hdImageData.data)
       .toFormat('jpeg', { quality: 80 })
       .resize({ width: 1920, withoutEnlargement: true })
       .toFile(optimizedImagePath);
     // 📸 Langkah 6: Kirim Foto ke Pengguna
     await bot.sendPhoto(chatId, fs.createReadStream(optimizedImagePath), {
       caption: 
         `🎉 *SELAMAT! FOTO BERHASIL JADI HD!* 🎉\n\n` +
         `🔑 *API Key:* ${API_KEYY}\n` +
         `📏 *Scale:* ${upscaleResult.data.result.scale}x\n` +
         `💾 *Ukuran File:* ${(fs.statSync(optimizedImagePath).size / 1024 / 1024).toFixed(2)} MB\n\n` +
         `Semoga suka ya kak! 🥰`
     }, {
       filename: 'hd_foto.jpg',
       contentType: 'image/jpeg'
     });
     await bot.sendMessage(chatId, `🗑️ *File sementara sudah dibersihkan!* 🧹`);
   } catch (error) {
     let errorMsg = `😢 *WADUH, ADA KESALAHAN!* 😢\n\n❌ *Pesan:* ${error.message}\n`;
     if (error.response) {
       errorMsg += `📊 *Kode Status:* ${error.response.status || 'Tidak Diketahui'}\n`;
       errorMsg += `📝 *Detail:* ${typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data)}\n`;
     }
     // Tambah pesan jika link hasil tidak bisa diakses
     if (error.message.includes('Failed to access the webpage') || error.config?.url === 'https://get1.imglarger.com/upscaler/results/') {
       errorMsg += `\n💡 *Solusi:* Link hasil dari API tidak dapat diakses saat ini. Silakan coba lagi nanti, atau Anda bisa mencoba membuka link hasil yang diberikan melalui browser.`;
     }
     errorMsg += `\n🤔 *Coba cek lagi foto atau coba nanti aja ya kak!* 🤗`;
     await bot.sendMessage(chatId, errorMsg, { parse_mode: 'Markdown' });
   } finally {
     // Bersihkan file sementara
     tempFilesToClean.forEach(file => {
       try {
         if (fs.existsSync(file)) fs.unlinkSync(file);
       } catch (cleanupErr) {
         console.log(`Gagal bersihkan file ${file}: ${cleanupErr.message}`);
       }
     });
   }
 });

bot.onText(/^\/cekgempa$/, async (msg) => {
   const chatId = msg.chat.id;
   try {
     // Ambil data dari API
     const response = await axios.get('https://ikyyzyyrestapi.my.id/api/info/cekgempa');
     const gempaData = response.data;
     // Kirim pesan teks biasa dengan banyak emoji 🤩
     const pesanGempa = `
 ✨ *INFO GEMPA TERBARU* ✨
 📅 Waktu: ${gempaData.result.waktu} ⏰
 📍 Koordinat: ${gempaData.result.koordinat.latitude} | ${gempaData.result.koordinat.longitude} 🗺️
 ⚡ Magnitude: ${gempaData.result.magnitude} 🌋
 📏 Kedalaman: ${gempaData.result.kedalaman} 🕳️
 🏞️ Wilayah: ${gempaData.result.wilayah} 🏘️
 🤲 Dirasakan: ${gempaData.result.dirasakan} 🙋‍♀️🙋‍♂️
 🌊 Potensi: ${gempaData.result.potensi} ❌✅
 💡 Sumber: ${gempaData.source} 🛰️
     `;
     await bot.sendMessage(chatId, pesanGempa, { parse_mode: 'Markdown' });
     // Kirim lokasi dengan caption yang menarik 📍
     const latitude = parseFloat(gempaData.result.koordinat.latitude.replace(' LS', ''));
     const longitude = parseFloat(gempaData.result.koordinat.longitude.replace(' BT', ''));
     const captionLokasi = `🗺️ *LOKASI GEMPA* 🗺️\n📅 Waktu: ${gempaData.result.waktu}\n⚡ Magnitude: ${gempaData.result.magnitude}`;
     
     await bot.sendLocation(chatId, latitude, longitude, { caption: captionLokasi, parse_mode: 'Markdown' });
   } catch (error) {
     console.error('Error:', error);
     bot.sendMessage(chatId, '❌ Gagal mengambil data gempa nih! Silakan coba lagi nanti ya kak 🙏');
   }
 });
 
 // Fitur /tematelegram
bot.onText(/^\/tematelegram (.+)$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const teks = match[1];
    let currentIndex = 0;
    let hasilData = [];

    try {
        const response = await axios.get(`https://ikyyzyyrestapi.my.id/search/tematele?q=${encodeURIComponent(teks)}`);
        const data = response.data;

        if (data.status && data.results && data.results[teks]) {
            hasilData = data.results[teks];
            
            // Fungsi untuk membuat atau mengedit pesan foto
            const kirimAtauEditFoto = (index) => {
                const item = hasilData[index];
                const totalOpsi = hasilData.length;
                const caption = `✨ *OPSI ${index + 1} DARI ${totalOpsi} TEMATIK TERBARU!* ✨\n\n` +
                                `🔗 *LINK TEMA TELEGRAM:* ${item.link}\n` +
                                `🖼️ *PREVIEW TAMPILAN:* Iniiii diaa tampilannya yang keceee! 🤩\n` +
                                `💫 *CREATOR:* IkyyOfficiall 🛠️\n` +
                                `📌 *INFO:* Klik link di atas buat pasang tema nih boskuh! 🚀\n` +
                                `🔢 *SEKARANG DI:* Opsi ${index + 1}/${totalOpsi}`;

                // Tombol dengan emoji
                const keyboard = {
                    inline_keyboard: [
                        [
                            {
                                text: `${index < totalOpsi - 1 ? '➡️ LANJUT' : '🔄 ULANGI'}`,
                                callback_data: `tematele_${teks}_${index < totalOpsi - 1 ? index + 1 : 0}`
                            }
                        ]
                    ]
                };

                // Jika ini pesan pertama, kirim baru; jika tidak, edit pesan yang ada
                if (index === 0) {
                    bot.sendPhoto(chatId, item.preview, {
                        caption: caption,
                        reply_markup: keyboard
                    }).then(sentMsg => {
                        // Simpan ID pesan agar bisa di-edit nanti (bisa disimpan di variabel atau database)
                        global.temateleLastMsgId = sentMsg.message_id;
                    });
                } else {
                    bot.editMessageMedia(
                        {
                            type: 'photo',
                            media: item.preview,
                            caption: caption
                        },
                        {
                            chat_id: chatId,
                            message_id: global.temateleLastMsgId,
                            reply_markup: keyboard
                        }
                    );
                }
            };

            // Kirim pesan pertama
            kirimAtauEditFoto(currentIndex);

            // Tangani klik tombol
            bot.on('callback_query', (callbackQuery) => {
                const action = callbackQuery.data;
                const msg = callbackQuery.message;
                if (action.startsWith('tematele_')) {
                    const parts = action.split('_');
                    const queryTeks = parts[1];
                    const newIndex = parseInt(parts[2]);
                    
                    // Cek apakah query sama dengan yang sedang berjalan
                    if (queryTeks === teks && newIndex < hasilData.length) {
                        kirimAtauEditFoto(newIndex);
                        bot.answerCallbackQuery(callbackQuery.id, { text: `${newIndex === 0 ? '🔄 Kembali ke awal!' : '➡️ Berpindah ke opsi selanjutnya!'} 🎉` });
                    }
                }
            });
        } else {
            bot.sendMessage(chatId, `😢 *MAAAF BANGETTT!* 😢\n\nTidak dapat menemukan tema apapun dengan kata kunci *"${teks}"* 📛\nCoba pakai kata kunci lain yang lebih jelas ya! 🤔✨`);
        }
    } catch (error) {
        console.error('Error:', error);
        bot.sendMessage(chatId, `⚠️ *YAHHH, ADA MASALAH NIH!* ⚠️\n\nGagal ngambil data dari server API 🛑\nCoba lagi beberapa saat kemudian ya teman! 🙏❤️`);
    }
});

 
 // Penangan perintah "nanobanana" dan "editimg"
 bot.onText(/^\/(nanobanana|editimg)\s?(.*)$/, async (pesan, cocok) => {
   const idObrolan = pesan.chat.id;
   const idPengguna = pesan.from.id;
   const idPesan = pesan.message_id;
   const prompt = cocok[2];
   // Cek apakah membalas foto
   if (!pesan.reply_to_message || !pesan.reply_to_message.photo) {
     return bot.sendMessage(idObrolan, '❌ Reply ke foto dengan:\n/editimg <prompt>', {
       reply_to_message_id: idPesan
     });
   }
   // Cek prompt
   if (!prompt) {
     return bot.sendMessage(idObrolan, '❌ Prompt nya mana jir', {
       reply_to_message_id: idPesan
     });
   }
   // Kirim pesan loading
   const pesanLoading = await bot.sendMessage(idObrolan, '🍌 NanoBanana proses...', {
     reply_to_message_id: idPesan
   });
   const idPesanLoading = pesanLoading.message_id;
   try {
     // Ambil foto dengan resolusi tertinggi
     const foto = pesan.reply_to_message.photo[pesan.reply_to_message.photo.length - 1];
     const infoBerkas = await bot.getFile(foto.file_id);
     const urlBerkasTg = `https://api.telegram.org/file/bot${token}/${infoBerkas.file_path}`;
     // Ambil aliran berkas
     const aliran = await axios.get(urlBerkasTg, {
       responseType: 'stream',
       headers: { 'User-Agent': 'Mozilla/5.0' }
     });
     // Siapkan data formulir untuk pengunggahan
     const namaBerkas = `nanobanana_${Date.now()}.jpg`;
     const tipeMime = mime.lookup(namaBerkas) || 'image/jpeg';
     const formulir = new FormData();
     formulir.append('file', aliran.data, {
       filename: namaBerkas,
       contentType: tipeMime
     });
     // Unggah berkas
     const responUnggah = await axios.post('https://ikyyzx-uploader.lol/upload', formulir, {
       headers: {
         ...formulir.getHeaders(),
         Accept: 'application/json'
       },
       maxBodyLength: Infinity,
       maxContentLength: Infinity
     });
     if (!responUnggah.data?.success || !responUnggah.data?.url) {
       console.log('KESALAHAN UNGGAH:', responUnggah.data);
       throw new Error('Upload gagal');
     }
     // Panggil API penyunting
     const urlApi = 'https://ikyyzyyrestapi.my.id/edit/nanobanana';
     const { data } = await axios.get(urlApi, {
       params: {
         image: responUnggah.data.url,
         prompt
       }
     });
     if (!data.status || !data.result_image) {
       throw new Error('Edit gagal');
     }
     // Kirim foto hasil
     await bot.sendPhoto(idObrolan, data.result_image, {
       caption: `🍌 NanoBanana selesai\n🎫 Sisa limit: ${getLimit(idPengguna)}`,
       reply_to_message_id: pesan.reply_to_message.message_id
     });
     // Hapus pesan loading
     await bot.deleteMessage(idObrolan, idPesanLoading);
   } catch (kesalahan) {
     console.error('Kesalahan NanoBanana:', kesalahan?.response?.data || kesalahan);
     bot.sendMessage(idObrolan, '❌ Gagal edit gambar', {
       reply_to_message_id: idPesan
     });
     // Coba hapus pesan loading jika memungkinkan
     try {
       await bot.deleteMessage(idObrolan, idPesanLoading);
     } catch (kesalahanHapus) {
       console.error('Gagal hapus pesan loading:', kesalahanHapus);
     }
   }
 });
 
const DELAY_MIN = 500;
 const DELAY_MAX = 2000;
 let botActive = true;
 // ✅ Emoji VALID & TERUJI Telegram API
 const VALID_EMOJI_POOL = [
   "👍", "❤️", "🔥", "👌", "🙏", "💯", "🎉", "😀"
 ];
 // Fungsi Kirim Reaksi dengan Format Benar
 async function sendValidReaction(chatId, messageId, emoji) {
   try {
     // Format data reaksi sesuai standar Telegram API
     const reactionData = {
       chat_id: chatId,
       message_id: messageId,
       reaction: JSON.stringify([{ type: "emoji", emoji: emoji }]) // Kirim sebagai string JSON yang valid
     };
     // Kirim request langsung ke Telegram API dengan axios
     const response = await axios.post(
       `https://api.telegram.org/bot${token}/setMessageReaction`,
       reactionData,
       { headers: { "Content-Type": "application/json" } }
     );
     console.log(`✅ Reaksi ${emoji} berhasil dikirim!`, response.data);
     return true;
   } catch (err) {
     console.error(`❌ Gagal kirim ${emoji}:`, err.response?.data || err.message);
     return false;
   }
 }
 // Deteksi Postingan Channel & Kirim Reaksi
 bot.on("channel_post", async (msg) => {
   console.log("\n📢 Postingan Ditemukan:");
   console.log(`ID Channel: ${msg.chat.id}, ID Pesan: ${msg.message_id}`);
   if (!botActive) return;
   // Pilih emoji random dari pool valid
   const selectedEmoji = VALID_EMOJI_POOL[Math.floor(Math.random() * VALID_EMOJI_POOL.length)];
   const delay = Math.floor(Math.random() * (DELAY_MAX - DELAY_MIN)) + DELAY_MIN;
   // Tunggu sebelum kirim
   await new Promise(r => setTimeout(r, delay));
   // Kirim reaksi dengan format yang benar
   await sendValidReaction(msg.chat.id, msg.message_id, selectedEmoji);
 });
 // Perintah Admin
 bot.onText(/\/on/, (msg) => {
   botActive = true;
   bot.sendMessage(msg.chat.id, "✅ Bot auto-reaksi AKTIF!");
 });
 bot.onText(/\/off/, (msg) => {
   botActive = false;
   bot.sendMessage(msg.chat.id, "⛔ Bot auto-reaksi NON-AKTIF!");
 });
 
const TARGET_CHANNEL = '@info_update_bot_react';
const searchCacheee = {}; // Nama diubah dari searchCache menjadi searchCacheee

// Fungsi yang diubah nama: cleanTitle -> cleanTitlee
const cleanTitlee = (title) => {
  return title.replace(/[^\w\s\-.,()]/gi, '').trim();
};

async function ytsSearchh(query) {
   // Validasi query tidak boleh kosong
   if (!query || typeof query !== 'string' || query.trim() === '') {
     console.error("Query tidak boleh kosong atau tidak valid");
     return [];
   }
   try {
     const encodedQuery = encodeURIComponent(query.trim());
     const res = await axios.get(
       `https://api-ikyzxc.vercel.app/search/youtube?apikey=kyzz&query=${encodedQuery}`
     );
     // Sesuaikan dengan struktur respons API yang benar
     if (res.data?.status === true && Array.isArray(res.data?.result)) {
       // Format hasil agar konsisten dengan yang dibutuhkan di fitur play
       return res.data.result.slice(0, 6).map(item => ({
         id: item.link.split('v=')[1], // Ambil video ID dari link
         title: item.title,
         author: item.channel,
         link: item.link,
         duration: item.duration
       }));
     }
     return [];
   } catch (error) {
     console.error("Kesalahan saat melakukan pencarian:", error.response?.data || error.message);
     // Tampilkan pesan error spesifik dari API jika ada
     if (error.response?.data === "This may be an unsupported webpage type. Please check the webpage or try again later.") {
       console.error("API gagal: Query tidak didukung atau ada masalah dengan layanan");
     }
     return [];
   }
 }

async function ytdwll(videoUrl) {
   // Validasi URL video tidak boleh kosong
   if (!videoUrl || typeof videoUrl !== 'string' || videoUrl.trim() === '') {
     console.error("URL video tidak boleh kosong atau tidak valid");
     return null;
   }
   try {
     const encodedVideoUrl = encodeURIComponent(videoUrl.trim());
     const response = await axios.get(
       `https://api-ikyzxc.vercel.app/download/ytmp3?apikey=kyzz&url=${encodedVideoUrl}`
     );
     // Periksa status dan struktur respons API
     if (response.data?.status === true && response.data?.result?.dlink) {
       return response.data.result.dlink;
     }
     console.warn("Struktur respons tidak sesuai atau tidak ada tautan unduhan");
     return null;
   } catch (error) {
     console.error("Kesalahan saat mengambil tautan unduhan:", error.response?.data || error.message);
     // Tampilkan pesan error spesifik dari API jika ada
     if (error.response?.data === "This may be an unsupported webpage type. Please check the webpage or try again later.") {
       console.error("API gagal: URL video tidak didukung atau ada masalah dengan layanan");
     }
     return null;
   }
 }

// FITUR UTAMA: /chplay
bot.onText(/^\/chplay (.+)$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const query = match[1];

  const loadingMsg = await bot.sendMessage(chatId, "🔍 Mencari lagu...");
  try {
    // Pencarian langsung pakai ytsSearchh tanpa pemisahan variabel
    const results = await ytsSearchh(query);
    if (!results.length) {
      await bot.editMessageText("❌ Lagu tidak ditemukan!", {
        chat_id: chatId,
        message_id: loadingMsg.message_id
      });
      return;
    }

    searchCacheee[chatId] = results;
    const inlineButtons = results.map((item, index) => [
      { text: `🎵 ${cleanTitlee(item.title)} (${item.duration})`, callback_data: `pilih_${index}` }
    ]);

    await bot.editMessageText("🎧 Pilih lagu yang ingin dikirim:", {
      chat_id: chatId,
      message_id: loadingMsg.message_id,
      reply_markup: { inline_keyboard: inlineButtons }
    });

  } catch (err) {
    await bot.editMessageText(`❌ ERROR: ${err.message}`, {
      chat_id: chatId,
      message_id: loadingMsg.message_id
    });
  }
});

// HANDLE CALLBACK (PERBAIKAN DI SINI!)
bot.on('callback_query', async (q) => {
  const chatId = q.message.chat.id;
  const index = parseInt(q.data.split('_')[1]);
  const results = searchCacheee[chatId];
  if (!results || !results[index]) {
    await bot.answerCallbackQuery(q.id, { text: "⚠️ Hasil pencarian kadaluarsa!" });
    return;
  }

  const selected = results[index];
  await bot.answerCallbackQuery(q.id, { text: `📥 Mengirim ${cleanTitlee(selected.title)}...` });
  
  const audio = await ytdwll(selected.link);
  if (!audio) {
    await bot.sendMessage(chatId, "❌ Gagal unduh audio!");
    return;
  }

  // PERBAIKAN: HAPUS .dlink KARENA audio SUDAH MERUPAKAN TAUTAN LANGSUNG
  await bot.sendAudio(TARGET_CHANNEL, audio, {
    caption: `🎶 <b>${cleanTitlee(selected.title)}</b>\n👤 ${selected.author}`,
    parse_mode: 'HTML'
  });
  await bot.sendMessage(chatId, `✅ Berhasil kirim ke ${TARGET_CHANNEL}`);
  delete searchCacheee[chatId];
});

// Daftar perintah yang didukung
const SAD_COMMANDS = Array.from({ length: 55 }, (_, i) => `/sad${i + 1}`);

// Tangani pesan yang sesuai dengan perintah sad1 hingga sad55
bot.onText(/^\/sad (\d+)$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const cmdNumber = match[1];
    const command = `sad${cmdNumber}`;

    // Validasi apakah perintah ada dalam rentang yang didukung
    if (parseInt(cmdNumber) < 1 || parseInt(cmdNumber) > 55) {
        return bot.sendMessage(chatId, '⚠️ Perintah tidak valid! Gunakan perintah dari /sad1 hingga /sad 55.');
    }

    try {
        const audioLink = `https://raw.githubusercontent.com/Leoo7z/Music/main/sad-music/${command}.mp3`;
        
        // PERHATIAN: Berdasarkan informasi yang ada, URL direktori tersebut mengembalikan pesan kesalahan "This may be an unsupported webpage type. Please check the webpage or try again later." Sumber audio kemungkinan tidak dapat diakses atau jenis halamannya tidak didukung.
        await bot.sendAudio(chatId, audioLink, {
            caption: `🎵 Memutar ${command}`
        }, {
            reply_to_message_id: msg.message_id
        });

    } catch (err) {
        let errorMsg = `❌ Terjadi kesalahan: ${err.message}`;
        if (err.message.includes('unsupported') || err.message.includes('not found')) {
            errorMsg += '\n\nCatatan: Sumber audio dari https://raw.githubusercontent.com/Leoo7z/Music/main/sad-music/ kemungkinan tidak dapat diakses atau tidak mendukung jenis konten yang diminta. Silakan periksa kembali sumbernya atau coba nanti.';
        }
        bot.sendMessage(chatId, errorMsg);
    }
});

// Konfigurasi nama bot untuk stiker
const namaBot = "NamaBotMu";
const APIII_URL = "https://tenor.googleapis.com/v2/featured?key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&contentfilter=high&media_filter=png_transparent&component=proactive&collection=emoji_kitchen_v5&q=";

// Fungsi untuk mengubah gambar jadi stiker
async function convertToSticker(imageUrl, outputPath) {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    await sharp(response.data)
        .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(outputPath);
    return outputPath;
}

// Tangani perintah /emojimix
bot.onText(/^\/emojimix (.+)$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const q = match[1];
    const [emoji1, emoji2] = q.split('+').map(part => part.trim());

    // Validasi input emoji
    if (!emoji1 || !emoji2) {
        return bot.sendMessage(chatId, `⚠️ Penggunaan Salah!\nKetik: /emojimix 😄+😏`);
    }

    try {
        await bot.sendMessage(chatId, "🔄 Proses...");

        // Fetch data dari API Tenor
        let anu;
        try {
            const requestUrl = `${APIII_URL}${encodeURIComponent(emoji1)}_${encodeURIComponent(emoji2)}`;
            anu = await axios.get(requestUrl);
        } catch (err) {
            let errorMsg = `❌ Gagal mengakses API Emoji Mix: ${err.response?.data || err.message}`;
            // Berikan informasi terkait kesalahan sumber daya
            errorMsg += '\n\nCatatan: Berdasarkan data yang ada, URL API tersebut mengembalikan pesan "This may be an unsupported webpage type. Please check the webpage or try again later." Kemungkinan API saat ini tidak dapat diakses atau tidak mendukung jenis permintaan yang dibuat.';
            return bot.sendMessage(chatId, errorMsg);
        }

        // Kirim stiker ke chat
        if (anu.data.results.length === 0) {
            return bot.sendMessage(chatId, "❌ Tidak ditemukan hasil campuran emoji!");
        }

        for (let res of anu.data.results) {
            const tempPath = path.join(__dirname, `temp_sticker_${Date.now()}.png`);
            try {
                await convertToSticker(res.url, tempPath);
                await bot.sendSticker(chatId, tempPath, {
                    reply_to_message_id: msg.message_id,
                    sticker_set_name: namaBot,
                    author_name: namaBot
                });
            } finally {
                // Hapus file sementara
                try { fs.unlinkSync(tempPath) } catch (e) { console.log('Gagal hapus file:', e) }
            }
        }

    } catch (err) {
        bot.sendMessage(chatId, `❌ Terjadi kesalahan: ${err.message}`);
    }
});

// Tangani perintah tanpa argumen
bot.onText(/^\/emojimix$/, (msg) => {
    bot.sendMessage(msg.chat.id, `⚠️ Penggunaan Salah!\nKetik: /emojimix 😄+😏`);
});

bot.onText(/^\/ping$/, async (msg) => {
     const chatId = msg.chat.id;
     const start = Date.now();
     // Kirim pesan awal
     const sentMsg = await bot.sendMessage(chatId, "Yameteh.");
     // Edit pesan sesuai jeda waktu
     setTimeout(async () => {
         try {
             await bot.editMessageText("Kudasai..", {
                 chat_id: chatId,
                 message_id: sentMsg.message_id
             });
         } catch (err) {
             console.error("Gagal edit pesan pertama:", err);
         }
     }, 300);
     setTimeout(async () => {
         try {
             await bot.editMessageText("Ahh Crot...", {
                 chat_id: chatId,
                 message_id: sentMsg.message_id
             });
         } catch (err) {
             console.error("Gagal edit pesan kedua:", err);
         }
     }, 600);
     setTimeout(async () => {
         const latency = Date.now() - start;
         try {
             await bot.editMessageText(`Crot Nya Enak!\n⚡ ${latency} ms`, {
                 chat_id: chatId,
                 message_id: sentMsg.message_id
             });
         } catch (err) {
             console.error("Gagal edit pesan ketiga:", err);
         }
     }, 900);
 });
 
 bot.onText(/^\/bahlilbrat/, async (msg) => {
   const chatId = msg.chat.id;
   const text = msg.text.split(" ").slice(1).join(" ");
   
   if (!text) return bot.sendMessage(chatId, "🪧 ☇ Format: /bahlilbrat Bahlil Ganteng Banget Jir");
   try {
     const apiURL = `https://ikyyzyyrestapi.my.id/maker/bratbahlil?text=${encodeURIComponent(text)}`;
     const res = await axios.get(apiURL, { responseType: "arraybuffer" });
     await bot.sendSticker(chatId, Buffer.from(res.data));
   } catch (e) {
     console.error("Error saat membuat stiker:", e);
     bot.sendMessage(chatId, "❌ Gagal membuat stiker brat.");
   }
 });

// API Endpoints dan Kunci
const BUILD_API_URL = 'https://web2app.joomods.web.id/api/build';
const RESULT_API_URL = 'https://web2app.joomods.web.id/api/result';
const API_BUILD = 'JooModdss-541429';

// Konfigurasi pengecekan ulang status
const CHECK_INTERVAL = 30000; // Cek setiap 30 detik
const MAX_CHECK_ATTEMPTS = 20; // Maksimal cek 20x (total 10 menit)

// Pesan cara penggunaan
const USAGE_TEXT = `Cara penggunaan fitur /webtoapk:
Ketik perintah dengan format berikut (gunakan "|" sebagai pembatas):
/webtoapk <NamaAplikasi>| <URLWebsite>| <URLIkon>

Contoh:
/webtoapk TicTacToe By Ganz| https://contoh-game.id| https://contoh-ikon.id/icon.jpg`;

// Tangani perintah /webtoapk
bot.onText(/^\/webtoapk (.+)$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const args = match[1].split('|').map(item => item.trim());

  if (args.length < 3 || args.some(item => item === '')) {
    bot.sendMessage(chatId, USAGE_TEXT);
    return;
  }

  const [appName, appUrl, iconUrl] = args;

  try {
    // Kirim permintaan build awal
    const buildResponse = await axios.get(BUILD_API_URL, {
      params: {
        apikey: API_BUILD,
        appName: appName,
        appUrl: appUrl,
        iconUrl: iconUrl
      },
      timeout: 15000,
      responseType: 'text'
    });

    const parsedBuild = JSON.parse(buildResponse.data);
    let buildData = Array.isArray(parsedBuild) && parsedBuild.length > 0 
      ? JSON.parse(parsedBuild[0].text_block[0].text) 
      : parsedBuild;

    if (!buildData.success || !buildData.jobId) {
      return bot.sendMessage(chatId, `Gagal memulai pembuatan aplikasi: ${buildData.message || 'Tidak ada pesan kesalahan'}`);
    }

    // Kirim pesan awal bahwa proses sedang berjalan
    const initialMessage = `Build started

• App: ${buildData.appName || appName}
• Plan: ${buildData.plan}
• Remaining: ${buildData.remaining}
• ID: ${buildData.jobId}

Sedang memproses, mohon tunggu... (mungkin memakan waktu hingga 10 menit)`;
    bot.sendMessage(chatId, initialMessage);

    // Fungsi untuk mengecek status secara berkala
    let attempt = 0;
    const checkStatus = setInterval(async () => {
      attempt++;
      try {
        const resultResponse = await axios.get(RESULT_API_URL, {
          params: { jobId: buildData.jobId },
          timeout: 15000,
          responseType: 'text'
        });

        const parsedResult = JSON.parse(resultResponse.data);
        let resultData = Array.isArray(parsedResult) && parsedResult.length > 0 
          ? JSON.parse(parsedResult[0].text_block[0].text) 
          : parsedResult;

        console.log(`Cek ke-${attempt} - Status: ${resultData.status}`);

        // Jika status selesai atau maksimal percobaan tercapai
        if (resultData.status === 'done') {
          clearInterval(checkStatus);
          const resultMessage = `Build selesai!

• Creator: ${resultData.creator}
• Status: ${resultData.status}
• Link Unduh: ${resultData.download}`;
          bot.sendMessage(chatId, resultMessage);
        } else if (resultData.status === 'failed' || attempt >= MAX_CHECK_ATTEMPTS) {
          clearInterval(checkStatus);
          const errorMsg = attempt >= MAX_CHECK_ATTEMPTS 
            ? `Waktu tunggu habis (maksimal 10 menit). Silakan cek kembali dengan ID: ${buildData.jobId}`
            : `Proses build gagal! Status: ${resultData.status}`;
          bot.sendMessage(chatId, errorMsg);
        }

      } catch (checkError) {
        console.error(`Error pada cek ke-${attempt}:`, checkError.message);
        if (attempt >= MAX_CHECK_ATTEMPTS) {
          clearInterval(checkStatus);
          bot.sendMessage(chatId, `Gagal mengecek status setelah beberapa percobaan. Silakan cek kembali secara manual dengan ID: ${buildData.jobId}`);
        }
      }
    }, CHECK_INTERVAL);

  } catch (buildError) {
    console.error('Error utama:', buildError.message);
    const errorMsg = `Gagal mengirim permintaan ke API pembuatan aplikasi. Penyebab: ${buildError.message}`;
    bot.sendMessage(chatId, errorMsg);
  }
});

// Tangani perintah /webtoapk tanpa argumen
bot.onText(/^\/webtoapk$/, (msg) => {
  bot.sendMessage(msg.chat.id, USAGE_TEXT);
});

// Async function untuk mengunduh file
async function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      response.pipe(fileStream);
      fileStream.on('finish', () => fileStream.close(resolve));
    }).on('error', (err) => {
      fs.unlink(destPath, () => reject(err));
    });
  });
}


// Handler command /toimg
bot.onText(/^\/toimg$/, async (msg) => {
  const chatId = msg.chat.id;
  const rep = msg.reply_to_message;

  if (!rep || !rep.sticker) {
    return bot.sendMessage(chatId, "❗ Reply ke sticker!");
  }

  const sticker = rep.sticker;
  // Buat key pendek dari file_id (ambil 8 karakter awal)
  const shortFileId = sticker.file_id.substring(0, 8);
  // Gabungkan type, key pendek, dan user_id dengan pemisah _
  const callbackDataPhoto = `st2img_p_${shortFileId}_${msg.from.id}`;
  const callbackDataVideo = `st2img_v_${shortFileId}_${msg.from.id}`;

  const options = {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🖼️ Jadi Foto", callback_data: callbackDataPhoto }],
        [{ text: "🎥 Jadi Video", callback_data: callbackDataVideo }]
      ]
    }
  };
  // Simpan file_id lengkap di objek sementara dengan key pendek
  const tempKey = `${shortFileId}_${msg.from.id}`;
  bot.stickerTemp = bot.stickerTemp || {};
  bot.stickerTemp[tempKey] = sticker.file_id;

  return bot.sendMessage(chatId, "Pilih format output:", options);
});


// Handler callback query
bot.on('callback_query', async (callbackQuery) => {
  const callbackId = callbackQuery.id;
  const userId = callbackQuery.from.id;
  const data = callbackQuery.data;

  if (!data.startsWith("st2img_")) {
    return;
  }

  const parts = data.split("_");
  if (parts.length !== 4) {
    return bot.answerCallbackQuery(callbackId, {
      text: "❌ Format data salah",
      show_alert: true
    });
  }

  const [_, type, shortFileId, storedUserId] = parts;
  if (storedUserId !== userId.toString()) {
    return bot.answerCallbackQuery(callbackId, {
      text: "⚠️ Ini bukan tombol kamu!",
      show_alert: true
    });
  }

  // Ambil file_id lengkap dari penyimpanan sementara
  const tempKey = `${shortFileId}_${userId}`;
  const fileId = bot.stickerTemp?.[tempKey];
  if (!fileId) {
    return bot.answerCallbackQuery(callbackId, {
      text: "❌ Data tidak ditemukan",
      show_alert: true
    });
  }

  try {
    const file = await bot.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
    const tempFilePath = path.join(__dirname, `temp_sticker_${Date.now()}.webp`);

    await downloadFile(fileUrl, tempFilePath);

    if (type === "p") {
      await bot.sendPhoto(callbackQuery.message.chat.id, tempFilePath, { caption: "🖼️ Converted ke foto" });
    } else if (type === "v") {
      await bot.sendVideo(callbackQuery.message.chat.id, tempFilePath, { caption: "🎥 Converted ke video" });
    }

    // Hapus data setelah selesai
    delete bot.stickerTemp[tempKey];
    fs.unlinkSync(tempFilePath);
    await bot.answerCallbackQuery(callbackId);

  } catch (e) {
    console.error(e);
    const tempFilePath = path.join(__dirname, `temp_sticker_${Date.now()}.webp`);
    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    delete bot.stickerTemp?.[tempKey];
    await bot.answerCallbackQuery(callbackId, {
      text: "❌ Gagal convert",
      show_alert: true
    });
  }
});

const JADIANIME_API_ENDPOINT = 'https://ikyyzyyrestapi.my.id/edit/jadianime';
 // Tangani perintah /toanime - kirim kedua gambar langsung tanpa tombol
 bot.onText(/^\/toanime/, async (msg) => {
   const chatId = msg.chat.id;
   const replyToMessage = msg.reply_to_message;
   if (!replyToMessage || !replyToMessage.photo) {
     return bot.sendMessage(chatId, '⚠️ Gunakan perintah /toanime dengan cara mereply foto yang ingin diubah menjadi anime ya!');
   }
   try {
     const loadingMsg = await bot.sendMessage(chatId, '⚙️ Sedang memproses gambar Anda ke API...');
     
     const highestResPhoto = replyToMessage.photo.pop();
     const telegramImageUrl = await bot.getFileLink(highestResPhoto.file_id);
     const apiResponse = await axios.get(JADIANIME_API_ENDPOINT, {
       params: { url: telegramImageUrl }
     });
     const { result } = apiResponse.data;
     // Hapus pesan loading agar tidak berantakan
     await bot.deleteMessage(chatId, loadingMsg.message_id);
     // Kirim kedua gambar secara berurutan dengan caption yang jelas
     await bot.sendPhoto(chatId, result.anime1, {
       caption: '✅ Hasil Anime 2D:'
     });
     await bot.sendPhoto(chatId, result.anime2, {
       caption: '✅ Hasil Anime 4D:'
     });
   } catch (error) {
     let errorMessage = '❌ Terjadi kesalahan saat memproses gambar.';
     if (error.response && error.response.data) {
       const apiError = typeof error.response.data === 'string' 
         ? error.response.data 
         : JSON.stringify(error.response.data);
       errorMessage += `\nPesan dari API: ${apiError || 'Tipe file tidak didukung atau URL tidak valid'}`;
     } else {
       errorMessage += `\nDetail: ${error.message}`;
     }
     await bot.sendMessage(chatId, errorMessage);
   }
 });
 
 const WELCOME_PHOTO_URL = 'https://files.catbox.moe/wxcfcx.jpg';
 // Menyimpan status fitur /setwelcome per grup (key: chatId, value: boolean)
 const welcomeStatus = new Map();
 // Handler perintah /setwelcome on/off
 bot.onText(/^\/setwelcome (.+)$/, async (msg, match) => {
   const chatId = msg.chat.id;
   const action = match[1].toLowerCase().trim();
   const senderId = msg.from.id;
   try {
     // Verifikasi apakah pengirim adalah admin atau pembuat grup
     const chatMember = await bot.getChatMember(chatId, senderId);
     const isAuthorized = ['creator', 'administrator'].includes(chatMember.status);
     if (!isAuthorized) {
       return bot.sendMessage(chatId, "❌ Maaf, hanya admin atau pemilik grup yang bisa mengatur fitur ini!");
     }
     if (action === 'on') {
       welcomeStatus.set(chatId, true);
       bot.sendMessage(chatId, "✅ Fitur selamat datang berhasil diaktifkan! Bot akan menyambut member baru dengan foto dan pesan hangat 😊");
     } else if (action === 'off') {
       welcomeStatus.set(chatId, false);
       bot.sendMessage(chatId, "❎ Fitur selamat datang berhasil dinonaktifkan!");
     } else {
       bot.sendMessage(chatId, "⚠️ Perintah tidak valid! Gunakan format: `/setwelcome on` atau `/setwelcome off`");
     }
   } catch (error) {
     console.error("Kesalahan saat memproses /setwelcome:", error);
     bot.sendMessage(chatId, "⚠️ Terjadi kesalahan saat mengolah perintah! Silakan coba lagi nanti.");
   }
 });
 // Handler event member baru bergabung ke grup
 bot.on('new_chat_members', async (msg) => {
   const chatId = msg.chat.id;
   const newMembers = msg.new_chat_members;
   // Cek apakah fitur aktif untuk grup ini
   if (!welcomeStatus.get(chatId)) return;
   // Kirim pesan sambutan untuk setiap member baru (kecuali bot)
   for (const member of newMembers) {
     if (member.is_bot) continue;
     const welcomeText = `
 👋 HALLOOOO ${member.first_name || 'Teman Baru'}! 🎉
 Selamat datang di grup kita yang luar biasa ini! 🤩 Semoga kamu merasa betah dan bisa berbagi banyak hal menarik serta bermanfaat bersama kami ya! 📢
 Jangan lupa membaca peraturan grup terlebih dahulu agar kita bisa berinteraksi dengan nyaman dan harmonis bersama-sama! 🙏✨
     `;
     try {
       await bot.sendPhoto(chatId, WELCOME_PHOTO_URL, {
         caption: welcomeText,
         parse_mode: 'HTML'
       });
     } catch (error) {
       console.error("Kesalahan saat mengirim foto dan pesan sambutan:", error);
       bot.sendMessage(chatId, `👋 Selamat datang, ${member.first_name}! Semoga betah di grup ini ya! 😊`);
     }
   }
 });
 
 // Verifikasi pengguna dari username
 async function verifyUserByUsername(username) {
   try {
     const cleanUsername = username.startsWith('@') ? username.slice(1) : username;
     const user = await bot.getChat(`@${cleanUsername}`);
     return user ? user.id : null;
   } catch (error) {
     return null;
   }
 }
 // Ambil data pengguna dari reply pesan
 async function getUserFromReply(msg) {
   if (!msg.reply_to_message) return null;
   const repliedUser = msg.reply_to_message.from;
   try {
     await bot.getChatMember(msg.chat.id, repliedUser.id);
     return repliedUser;
   } catch (error) {
     return null;
   }
 }
 // Cek apakah pengirim adalah admin/pemilik grup
 async function isAuthorizedAdmin(chatId, userId) {
   try {
     const chatMember = await bot.getChatMember(chatId, userId);
     return ['creator', 'administrator'].includes(chatMember.status);
   } catch (error) {
     return false;
   }
 }
 // --- Handler Perintah /promote ---
 // Mendukung: /promote [@username] [title] | /promote [title] (reply pesan) | /promote [@username] | /promote (reply pesan)
 bot.onText(/^\/promote(?:\s+(@?\w+))?(?:\s+(.+))?$/, async (msg, match) => {
   const chatId = msg.chat.id;
   const senderId = msg.from.id;
   const [_, inputUsername, inputTitle] = match;
   let targetUser = null;
   let adminTitle = "";
   // Cek tipe chat
   if (msg.chat.type !== 'group' && msg.chat.type !== 'supergroup') {
     return bot.sendMessage(chatId, "❌ Fitur ini hanya bisa digunakan di grup/supergroup!");
   }
   // Verifikasi hak akses pengirim
   if (!await isAuthorizedAdmin(chatId, senderId)) {
     return bot.sendMessage(chatId, "❌ Maaf, hanya admin/pemilik grup yang bisa menggunakan perintah ini!");
   }
   // --- Tentukan target pengguna dan judul ---
   if (msg.reply_to_message) {
     // Kasus 1: Reply pesan (dengan atau tanpa judul)
     targetUser = await getUserFromReply(msg);
     if (!targetUser) return bot.sendMessage(chatId, "❌ Pengguna yang direply tidak ditemukan di grup!");
     adminTitle = inputUsername || inputTitle || ""; // Jika ada teks setelah /promote = judul
   } else if (inputUsername) {
     // Kasus 2: Pakai username (dengan atau tanpa judul)
     const targetUserId = await verifyUserByUsername(inputUsername);
     if (!targetUserId) return bot.sendMessage(chatId, `❌ Pengguna ${inputUsername} tidak ditemukan di Telegram!`);
     
     // Cek apakah pengguna ada di grup
     try {
       const chatMember = await bot.getChatMember(chatId, targetUserId);
       if (chatMember.status === 'left' || chatMember.status === 'kicked') {
         return bot.sendMessage(chatId, `❌ Pengguna ${inputUsername} tidak ada di grup ini!`);
       }
       targetUser = chatMember.user;
     } catch (error) {
       return bot.sendMessage(chatId, "❌ Gagal mengambil data pengguna dari grup!");
     }
     adminTitle = inputTitle || ""; // Jika ada teks setelah username = judul
   } else {
     // Kasus salah penggunaan
     return bot.sendMessage(chatId, `⚠️ Cara penggunaan yang benar:\n• /promote @GanzzAlwayss\n• /promote @GanzzAlwayss My Friend\n• Reply pesan pengguna + /promote\n• Reply pesan pengguna + /promote Team Leader`);
   }
   // --- Lakukan promosi ---
   try {
     // Promosikan dengan hak akses default
     await bot.promoteChatMember(chatId, targetUser.id, {
       can_change_info: false,
       can_post_messages: false,
       can_edit_messages: false,
       can_delete_messages: true,
       can_invite_users: true,
       can_restrict_members: true,
       can_pin_messages: true,
       can_promote_members: false
     });
     // Set judul jika ada
     if (adminTitle) {
       // Batasi judul maksimal 16 karakter (aturan Telegram)
       const trimmedTitle = adminTitle.slice(0, 16);
       await bot.setChatAdministratorCustomTitle(chatId, targetUser.id, trimmedTitle);
     } else {
       // Kosongkan judul jika tidak diberikan
       await bot.setChatAdministratorCustomTitle(chatId, targetUser.id, "");
     }
     // Tampilkan pesan sukses
     const displayName = targetUser.username ? `@${targetUser.username}` : targetUser.first_name;
     const titleText = adminTitle ? `dengan judul "${adminTitle.slice(0, 16)}"` : "tanpa judul";
     bot.sendMessage(chatId, `✅ Berhasil mempromosikan ${displayName} ${titleText} menjadi admin grup! 🎉`);
   } catch (error) {
     console.error("Kesalahan promosi:", error);
     bot.sendMessage(chatId, "⚠️ Terjadi kesalahan! Pastikan bot punya hak 'can_promote_members' dan 'can_change_info'.");
   }
 });
 // --- Handler Perintah /demote ---
 // Mendukung: /demote [@username] | /demote (reply pesan)
 bot.onText(/^\/demote(?:\s+(@?\w+))?$/, async (msg, match) => {
   const chatId = msg.chat.id;
   const senderId = msg.from.id;
   const targetUsername = match[1];
   let targetUser = null;
   // Cek tipe chat
   if (msg.chat.type !== 'group' && msg.chat.type !== 'supergroup') {
     return bot.sendMessage(chatId, "❌ Fitur ini hanya bisa digunakan di grup/supergroup!");
   }
   // Verifikasi hak akses pengirim
   if (!await isAuthorizedAdmin(chatId, senderId)) {
     return bot.sendMessage(chatId, "❌ Maaf, hanya admin/pemilik grup yang bisa menggunakan perintah ini!");
   }
   // --- Tentukan target pengguna ---
   if (msg.reply_to_message) {
     targetUser = await getUserFromReply(msg);
     if (!targetUser) return bot.sendMessage(chatId, "❌ Pengguna yang direply tidak ditemukan di grup!");
   } else if (targetUsername) {
     const targetUserId = await verifyUserByUsername(targetUsername);
     if (!targetUserId) return bot.sendMessage(chatId, `❌ Pengguna ${targetUsername} tidak ditemukan di Telegram!`);
     
     // Cek apakah pengguna ada di grup
     try {
       const chatMember = await bot.getChatMember(chatId, targetUserId);
       if (chatMember.status === 'left' || chatMember.status === 'kicked') {
         return bot.sendMessage(chatId, `❌ Pengguna ${targetUsername} tidak ada di grup ini!`);
       }
       targetUser = chatMember.user;
     } catch (error) {
       return bot.sendMessage(chatId, "❌ Gagal mengambil data pengguna dari grup!");
     }
   } else {
     return bot.sendMessage(chatId, `⚠️ Cara penggunaan yang benar:\n• /demote @GanzzAlwayss\n• Reply pesan pengguna + /demote`);
   }
   // --- Lakukan demosi ---
   try {
     const targetChatMember = await bot.getChatMember(chatId, targetUser.id);
     
     // Validasi status target
     if (!['administrator', 'creator'].includes(targetChatMember.status)) {
       return bot.sendMessage(chatId, "❌ Pengguna tersebut bukan admin!");
     }
     if (targetChatMember.status === 'creator') {
       return bot.sendMessage(chatId, "❌ Tidak bisa mendemote pemilik grup!");
     }
     // Demote menjadi member biasa
     await bot.promoteChatMember(chatId, targetUser.id, {
       can_change_info: false,
       can_post_messages: false,
       can_edit_messages: false,
       can_delete_messages: false,
       can_invite_users: false,
       can_restrict_members: false,
       can_pin_messages: false,
       can_promote_members: false
     });
     // Hapus judul admin
     await bot.setChatAdministratorCustomTitle(chatId, targetUser.id, "");
     // Tampilkan pesan sukses
     const displayName = targetUser.username ? `@${targetUser.username}` : targetUser.first_name;
     bot.sendMessage(chatId, `✅ Berhasil mendemote ${displayName} menjadi member biasa!`);
   } catch (error) {
     console.error("Kesalahan demosi:", error);
     bot.sendMessage(chatId, "⚠️ Terjadi kesalahan! Pastikan bot punya hak 'can_promote_members'.");
   }
 });

bot.onText(/\/spotify(.+)?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const query = match[1];
  
  // Validasi format perintah
  if (!query || query.trim() === '') {
    return bot.sendMessage(chatId, `
<b>❌ OOPS! FORMAT PERINTAH SALAH NIH ❌</b>
<i>📝 Caranya gampang kok, pakai seperti ini:</i>
<code>/spotify [nama lagu atau penyanyi yang kamu cari]</code>
💡 Contoh penggunaan:
<code>/spotify Jendela kelas satu</code>
atau
<code>/spotify Iwan Fals</code>
🤗 Yuk coba lagi dengan format yang bener ya!
`, { parse_mode: "HTML" });
  }

  let loadingMsgId;
  try {
    // Kirim pesan loading
    const loadingMsg = await bot.sendMessage(chatId, `
<b>✨ 🔍 SPOTIFY MUSIC FINDER 🔍 ✨</b>
<i>🔊 Sedang mencari suara yang kamu inginkan... Tunggu sebentar ya!</i>
`, { parse_mode: "HTML" });
    loadingMsgId = loadingMsg.message_id;

    // Panggil API
    const apiUrl = `http://api.deline.web.id/downloader/ytplay?q=${encodeURIComponent(query.trim())}`;
    const { data } = await axios.get(apiUrl);

    // Hapus pesan loading
    await bot.deleteMessage(chatId, loadingMsgId);

    // Cek status API
    if (!data.status || !data.result) {
      return bot.sendMessage(chatId, `
<b>❌ MUSIK TIDAK DITEMUKAN ❌</b>
<i>😢 Maaf ya, lagu atau penyanyi yang kamu cari tidak bisa kami temukan di sistem.</i>
`, { parse_mode: "HTML" });
    }

    // Ekstrak data yang dibutuhkan dari API
    const { title, thumbnail, dlink, url } = data.result;
    // Format nama file sesuai judul lengkap dari API
    const validFileName = `${title.replace(/[^\w\s.-]/g, '_').replace(/\s+/g, '_')}.mp3`;

    // Caption yang sesuai dengan hasil yang ditemukan
    const caption = `
<blockquote>
<b>🎵 MUSIK DITEMUKAN 🎵</b>

📌 <b>JUDUL LAGU</b> : ${title}
</blockquote>
`;

    // Kirim foto cover langsung tanpa catch
    await bot.sendPhoto(chatId, thumbnail, {
      caption: caption,
      parse_mode: "HTML",
      disable_web_page_preview: false
    });

    // Kirim audio dengan thumbnail dan nama file sesuai hasil API tanpa catch
    await bot.sendAudio(chatId, dlink, {
      title: title,
      performer: title,
      thumb: thumbnail,
      filename: validFileName
    });

  } catch (err) {
    console.error('❌ Kesalahan sistem:', err);
    if (loadingMsgId) {
      await bot.deleteMessage(chatId, loadingMsgId).catch(() => {});
    }
    bot.sendMessage(chatId, `
<b>⚠️ WADUH, TERJADI KESALAHAN! ⚠️</b>
<i>🔧 Sepertinya ada masalah dengan sistem, API, atau file yang tidak valid. Coba lagi nanti ya teman!</i>
`, { parse_mode: "HTML" });
  }
});

bot.onText(/^\/(createsc|createscript)(?:\s+(.+))?$/, async (msg, match) => {
   try {
     const text = match[2];
     const theuser_id = msg.chat.id
     const pushname = msg.from.first_name || msg.from.username || 'user';
     const userWa = '6285659202292';
     let tuttks = `\n--- Gunakan format: ---\n/createsc <namaBot>|<namaOwner>|<fitur1>,<fitur2>,...\n\n--- Contoh : ---\n/createsc Ghost Spirit|Ganzz Alwayss|brat,qc,play,pinterest\n\nKetik /listfitur untuk melihat fitur tersedia.`;
     if (!text) {
       return bot.sendPhoto(theuser_id, 'https://files.catbox.moe/xhrbzw.jpg', {
         caption: tuttks,
         parse_mode: 'Markdown',
         reply_markup: { remove_keyboard: true }
       });
     }
     const mycfitur = require('./lib/casefitur.json');
     const [namaBot, namaOwner, fiturInput] = text.split('|');
     if (!namaBot || !namaOwner || !fiturInput) {
       return bot.sendPhoto(theuser_id, 'https://files.catbox.moe/xhrbzw.jpg', {
         caption: 'Format salah. Contoh:\n/createsc Botku|Namaku|brat,qc,play'
       });
     }
     let features = fiturInput.toLowerCase() === 'allfitur' 
       ? mycfitur.map(f => f.name) 
       : fiturInput.split(',').map(f => f.trim());
     const tempZipPath = './lib/disini.zip';
     if (!fs.existsSync(tempZipPath)) {
       return bot.sendMessage(theuser_id, 'File base script tidak ditemukan di ./lib/disini.zip');
     }
     let zip = new AdmZip(tempZipPath);
     let extractPath = `./temp/extracted_${pushname}`;
     zip.extractAllTo(extractPath, true);
     const caseFilePath = `${extractPath}/case.js`;
     let caseContent = fs.readFileSync(caseFilePath, 'utf-8');
     let newFunctions = '';
     const validFeatures = [];
     bot.sendMessage(theuser_id, `💾 Menambah Fitur:\n\n${features.join('\n')}\n\nke case.js ..`);
     for (let i = 0; i < features.length; i++) {
       let feature = features[i].trim();
       let featureData = mycfitur.find(f => f.name === feature);
       if (!featureData) {
         bot.sendMessage(theuser_id, `⚠️ *Fitur "${feature}" tidak ditemukan!*`);
         continue;
       }
       if (!newFunctions.includes(featureData.function) && !caseContent.includes(featureData.function)) {
         newFunctions += `${featureData.function}\n`;
       }
       if (!caseContent.includes(featureData.casenya)) {
         caseContent = caseContent.replace(
           'switch (command) {',
           `${featureData.function}\nswitch (command) {\n${featureData.casenya}`
         );
       }
       if (featureData.upFile && featureData.upFile.length > 0) {
         featureData.upFile.forEach(file => {
           const filePath = Object.keys(file)[0];
           const fileContent = file[filePath];
           const fileDirectory = path.join(extractPath, filePath);
           const dirPath = path.dirname(fileDirectory);
           if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
           fs.writeFileSync(fileDirectory, fileContent, 'utf-8');
         });
       }
       validFeatures.push(feature);
       await new Promise(resolve => setTimeout(resolve, 1000));
     }
     fs.writeFileSync(caseFilePath, caseContent, 'utf-8');
     // PERBAIKAN: Regex lebih fleksibel untuk settings.js
     const settingsFilePath = `${extractPath}/settings.js`;
     let settingsContent = fs.readFileSync(settingsFilePath, 'utf-8');
     settingsContent = settingsContent
       .replace(/global\.owner\s*=\s*['"].*['"]/g, `global.owner = "${userWa}"`)
       .replace(/global\.namabot\s*=\s*['"].*['"]/g, `global.namabot = '${namaBot}'`)
       .replace(/global\.ownername\s*=\s*['"].*['"]/g, `global.ownername = '${namaOwner}'`);
     fs.writeFileSync(settingsFilePath, settingsContent, 'utf-8');
     fs.writeFileSync(`${extractPath}/database/owner.json`, JSON.stringify([userWa]), 'utf-8');
     const listMenuPath = `${extractPath}/lib/listmenu.json`;
     let listMenu = fs.existsSync(listMenuPath) 
       ? JSON.parse(fs.readFileSync(listMenuPath)) 
       : ["addprem", "delprem", "ping", "public", "self", "owner"];
     validFeatures.forEach(feature => {
       if (!listMenu.includes(feature)) listMenu.push(feature);
     });
     fs.writeFileSync(listMenuPath, JSON.stringify(listMenu, null, 2), 'utf-8');
     // PERBAIKAN: Pastikan nama file ZIP lokal benar dan kirim dengan buffer yang jelas
     let newZip = new AdmZip();
     newZip.addLocalFolder(extractPath);
     const outputZipName = `SC ${namaBot}.zip`;
     const outputZipPath = `./temp/${outputZipName}`;
     newZip.writeZip(outputZipPath);
     if (validFeatures.length === 0) {
       return bot.sendMessage(theuser_id, "❌ Tidak ada fitur yang valid!");
     }
     // Kirim file dengan menyertakan nama file secara eksplisit
     await bot.sendDocument(theuser_id, fs.createReadStream(outputZipPath), {
       filename: outputZipName,
       caption: `✅ Berhasil dibuat!\n\n𝗡𝗮𝗺𝗮 𝗕𝗼𝘁: ${namaBot}\n𝗢𝘄𝗻𝗲𝗿: ${namaOwner}\n𝗙𝗶𝘁𝘂𝗿: ${validFeatures.join(', ')}\n\nMau Rename? https://eriza-renamesc.vercel.app`
     });
     fs.rmSync(extractPath, { recursive: true, force: true });
     fs.unlinkSync(outputZipPath);
   } catch (err) {
     console.error(err);
     bot.sendMessage(msg.from.id, `Terjadi kesalahan: ${err.message}`);
   }
 });

bot.onText(/^\/(listfitur|listfitursc)$/, (msg) => {
     
     let filePath = './lib/casefitur.json';
     if (!fs.existsSync(filePath)) {
         return bot.sendMessage(msg.from.id, '❌ File casefitur.json tidak ditemukan!');
     }
     try {
         let rawData = fs.readFileSync(filePath);
         let fiturList = JSON.parse(rawData);
         if (!Array.isArray(fiturList) || fiturList.length === 0) {
             return bot.sendMessage(msg.chat.id, '⚠️ Tidak ada fitur yang tersedia.');
         }
         let fiturNames = fiturList.map(f => `<╺ > ┃  ${f.name}`).join('\n');
         let message = `💬 Daftar Fitur yang Tersedia:\n[ Total Fitur = ${fiturList.length} ]\n\n${fiturNames}`;
         bot.sendMessage(msg.chat.id, message);
     } catch (error) {
         console.error(error);
         bot.sendMessage(msg.chat.id, '❌ Terjadi kesalahan saat membaca daftar fitur.');
     }
 });
 
 bot.onText(/^\/timelock(?:\s+(\d+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const days = match && match[1] ? parseInt(match[1], 10) : 30;

  if (!msg.reply_to_message || !msg.reply_to_message.document)
    return bot.sendMessage(chatId, '❌ Balas file .js dengan perintah: /timelock <days>');
  const doc = msg.reply_to_message.document;
  if (!doc.file_name.endsWith('.js'))
    return bot.sendMessage(chatId, '❌ Error: file harus berekstensi .js');
  if (isFileTooLarge(doc.file_size))
    return bot.sendMessage(chatId, '❌ Ukuran file terlalu besar! Maksimum 10 MB.');

  const progressMsg = await bot.sendMessage(chatId, `⚙️ PROSES OBFUSCATE BY GHOST SPIRIT (𖥊) (${doc.file_name})...`);
  try {
    const content = await downloadFileContent(doc.file_id);
    const obfCode = await obfuscateTimeLocked(content, days);
    const filename = `BY-GHOST SPIRIT-timelock-${days}d-${doc.file_name}`;
    const tmp = path.join(TMP_DIR, filename);
    fs.writeFileSync(tmp, obfCode);
    await bot.sendDocument(chatId, fs.createReadStream(tmp), { caption: `✅ OBFUSCATE BY GHOST SPIRIT` });
    fs.unlinkSync(tmp);
    await sendOrEditProgress(chatId, progressMsg.message_id, '✅ Selesai!');
  } catch (e) {
    await bot.sendMessage(chatId, `❌ Gagal: ${e.message}`);
  }
});

bot.onText(/^\/quantum/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  if (!msg.reply_to_message?.document)
    return bot.sendMessage(chatId, '❌ Balas file .js dengan perintah: /quantum');
  const doc = msg.reply_to_message.document;
  if (!doc.file_name.endsWith('.js'))
    return bot.sendMessage(chatId, '❌ Error: file harus berekstensi .js');
  if (isFileTooLarge(doc.file_size))
    return bot.sendMessage(chatId, '❌ Ukuran file terlalu besar! Maksimum 10 MB.');

  const msgP = await bot.sendMessage(chatId, `⚙️ PROSES OBFUSCATE BY GHOST SPIRIT (𖥊) (${doc.file_name})...`);
  try {
    const content = await downloadFileContent(doc.file_id);
    const obf = await obfuscateQuantum(content);
    const fn = `BY-GHOST SPIRIT-quantum-${doc.file_name}`;
    const tmp = path.join(TMP_DIR, fn);
    fs.writeFileSync(tmp, obf);
    await bot.sendDocument(chatId, fs.createReadStream(tmp), { caption: `✅ OBFUSCATE BY GHOST SPIRIT` });
    fs.unlinkSync(tmp);
    await sendOrEditProgress(chatId, msgP.message_id, '✅ Selesai!');
  } catch (err) {
    await bot.sendMessage(chatId, `❌ Gagal: ${err.message}`);
  }
});

bot.onText(/^\/encsiu/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  if (!msg.reply_to_message?.document)
    return bot.sendMessage(chatId, '❌ Balas file .js dengan perintah: /encsiu');
  const doc = msg.reply_to_message.document;
  if (!doc.file_name.endsWith('.js'))
    return bot.sendMessage(chatId, '❌ Error: file harus berekstensi .js');
  if (isFileTooLarge(doc.file_size))
    return bot.sendMessage(chatId, '❌ Ukuran file terlalu besar! Maksimum 10 MB.');

  const msgP = await bot.sendMessage(chatId, `⚙️ PROSES OBFUSCATE BY GHOST SPIRIT (𖥊) (${doc.file_name})...`);
  try {
    const content = await downloadFileContent(doc.file_id);
    const config = getSiuCalcrickObfuscationConfig();
    const obf = await obfuscateWithConfig(content, config);
    const fn = `BY-GHOST SPIRIT-encsiu-${doc.file_name}`;
    const tmp = path.join(TMP_DIR, fn);
    fs.writeFileSync(tmp, obf);
    await bot.sendDocument(chatId, fs.createReadStream(tmp), { caption: `✅ OBFUSCATE BY GHOST SPIRIT` });
    fs.unlinkSync(tmp);
    await sendOrEditProgress(chatId, msgP.message_id, '✅ Selesai!');
  } catch (err) {
    await bot.sendMessage(chatId, `❌ Gagal: ${err.message}`);
  }
});

bot.onText(/^\/encjapan/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  if (!msg.reply_to_message?.document)
    return bot.sendMessage(chatId, '❌ Balas file .js dengan perintah: /encjapan');
  const doc = msg.reply_to_message.document;
  if (!doc.file_name.endsWith('.js'))
    return bot.sendMessage(chatId, '❌ Error: file harus berekstensi .js');
  if (isFileTooLarge(doc.file_size))
    return bot.sendMessage(chatId, '❌ Ukuran file terlalu besar! Maksimum 10 MB.');

  const msgP = await bot.sendMessage(chatId, `⚙️ PROSES OBFUSCATE BY GHOST SPIRIT (𖥊) (${doc.file_name})...`);
  try {
    const content = await downloadFileContent(doc.file_id);
    const config = getJapanObfuscationConfig();
    const obf = await obfuscateWithConfig(content, config);
    const fn = `BY-GHOST SPIRIT-encjapan-${doc.file_name}`;
    const tmp = path.join(TMP_DIR, fn);
    fs.writeFileSync(tmp, obf);
    await bot.sendDocument(chatId, fs.createReadStream(tmp), { caption: `✅ OBFUSCATE BY GHOST SPIRIT` });
    fs.unlinkSync(tmp);
    await sendOrEditProgress(chatId, msgP.message_id, '✅ Selesai!');
  } catch (err) {
    await bot.sendMessage(chatId, `❌ Gagal: ${err.message}`);
  }
});

bot.onText(/^\/enccina/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  if (!msg.reply_to_message?.document)
    return bot.sendMessage(chatId, '❌ Balas file .js dengan perintah: /enccina');
  const doc = msg.reply_to_message.document;
  if (!doc.file_name.endsWith('.js'))
    return bot.sendMessage(chatId, '❌ Error: file harus berekstensi .js');
  if (isFileTooLarge(doc.file_size))
    return bot.sendMessage(chatId, '❌ Ukuran file terlalu besar! Maksimum 10 MB.');

  const msgP = await bot.sendMessage(chatId, `⚙️ PROSES OBFUSCATE BY GHOST SPIRIT (𖥊) (${doc.file_name})...`);
  try {
    const content = await downloadFileContent(doc.file_id);
    const config = getChinaObfuscationConfig();
    const obf = await obfuscateWithConfig(content, config);
    const fn = `BY-GHOST SPIRIT-enccina-${doc.file_name}`;
    const tmp = path.join(TMP_DIR, fn);
    fs.writeFileSync(tmp, obf);
    await bot.sendDocument(chatId, fs.createReadStream(tmp), { caption: `✅ OBFUSCATE BY GHOST SPIRIT` });
    fs.unlinkSync(tmp);
    await sendOrEditProgress(chatId, msgP.message_id, '✅ Selesai!');
  } catch (err) {
    await bot.sendMessage(chatId, `❌ Gagal: ${err.message}`);
  }
});


bot.onText(/^\/encarab/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  if (!msg.reply_to_message?.document)
    return bot.sendMessage(chatId, '❌ Balas file .js dengan perintah: /encarab');
  const doc = msg.reply_to_message.document;
  if (!doc.file_name.endsWith('.js'))
    return bot.sendMessage(chatId, '❌ Error: file harus berekstensi .js');
  if (isFileTooLarge(doc.file_size))
    return bot.sendMessage(chatId, '❌ Ukuran file terlalu besar! Maksimum 10 MB.');

  const msgP = await bot.sendMessage(chatId, `⚙️ PROSES OBFUSCATE BY GHOST SPIRIT (𖥊) (${doc.file_name})...`);
  try {
    const content = await downloadFileContent(doc.file_id);
    const config = getArabObfuscationConfig();
    const obf = await obfuscateWithConfig(content, config);
    const fn = `BY-GHOST SPIRIT-encarab-${doc.file_name}`;
    const tmp = path.join(TMP_DIR, fn);
    fs.writeFileSync(tmp, obf);
    await bot.sendDocument(chatId, fs.createReadStream(tmp), { caption: `✅ OBFUSCATE BY GHOST SPIRIT` });
    fs.unlinkSync(tmp);
    await sendOrEditProgress(chatId, msgP.message_id, '✅ Selesai!');
  } catch (err) {
    await bot.sendMessage(chatId, `❌ Gagal: ${err.message}`);
  }
});

bot.onText(/^\/encjpnxarb/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!msg.reply_to_message?.document)
    return bot.sendMessage(chatId, '❌ Balas file .js dengan perintah: /encjpnxarb');
  const doc = msg.reply_to_message.document;
  if (!doc.file_name.endsWith('.js'))
    return bot.sendMessage(chatId, '❌ File harus berekstensi .js');
  if (isFileTooLarge(doc.file_size))
    return bot.sendMessage(chatId, '❌ Ukuran file terlalu besar! Maksimum 10 MB.');

  const msgP = await bot.sendMessage(chatId, `⚙️ PROSES OBFUSCATE BY GHOST SPIRIT (𖥊) (${doc.file_name})...`);
  try {
    const content = await downloadFileContent(doc.file_id);
    const config = getJapanxArabObfuscationConfig();
    const obf = await obfuscateWithConfig(content, config);

    const fn = `BY-GHOST SPIRIT-encjpnxarb-${doc.file_name}`;
    const tmp = path.join(TMP_DIR, fn);
    fs.writeFileSync(tmp, obf, 'utf8');

    await sendOrEditProgress(chatId, msgP.message_id, `⚙️ Menyimpan hasil...`);
    await bot.sendDocument(chatId, fs.createReadStream(tmp), { caption: `✅ OBFUSCATE BY GHOST SPIRIT` });
    fs.unlinkSync(tmp);
    await sendOrEditProgress(chatId, msgP.message_id, '✅ Selesai!');
  } catch (err) {
    console.error('ENCJPNXARB ERROR:', err);
    await bot.sendMessage(chatId, `❌ Gagal: ${err.message || err}`);
  }
});

bot.onText(/^\/encnebula/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!msg.reply_to_message?.document)
    return bot.sendMessage(chatId, '❌ Balas file .js dengan perintah: /encnebula');
  const doc = msg.reply_to_message.document;
  if (!doc.file_name.endsWith('.js'))
    return bot.sendMessage(chatId, '❌ File harus berekstensi .js');
  if (isFileTooLarge(doc.file_size))
    return bot.sendMessage(chatId, '❌ Ukuran file terlalu besar! Maksimum 10 MB.');

  const msgP = await bot.sendMessage(chatId, `⚙️ PROSES OBFUSCATE BY GHOST SPIRIT (𖥊) (${doc.file_name})...`);
  try {
    const content = await downloadFileContent(doc.file_id);
    const config = getNebulaObfuscationConfig();
    const obf = await obfuscateWithConfig(content, config);

    const fn = `BY-GHOST SPIRIT-encnebula-${doc.file_name}`;
    const tmp = path.join(TMP_DIR, fn);
    fs.writeFileSync(tmp, obf, 'utf8');

    await sendOrEditProgress(chatId, msgP.message_id, `⚙️ Menyimpan hasil...`);
    await bot.sendDocument(chatId, fs.createReadStream(tmp), { caption: `✅ OBFUSCATE BY GHOST SPIRIT` });
    fs.unlinkSync(tmp);
    await sendOrEditProgress(chatId, msgP.message_id, '✅ Selesai!');
  } catch (err) {
    console.error('ENCNEBULA ERROR:', err);
    await bot.sendMessage(chatId, `❌ Gagal: ${err.message || err}`);
  }
});

bot.onText(/^\/encnova/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!msg.reply_to_message?.document)
    return bot.sendMessage(chatId, '❌ Balas file .js dengan perintah: /encnova');
  const doc = msg.reply_to_message.document;
  if (!doc.file_name.endsWith('.js'))
    return bot.sendMessage(chatId, '❌ File harus berekstensi .js');
  if (isFileTooLarge(doc.file_size))
    return bot.sendMessage(chatId, '❌ Ukuran file terlalu besar! Maksimum 10 MB.');

  const msgP = await bot.sendMessage(chatId, `⚙️ PROSES OBFUSCATE BY GHOST SPIRIT (𖥊) (${doc.file_name})...`);
  try {
    const content = await downloadFileContent(doc.file_id);
    const config = getNovaObfuscationConfig();
    const obf = await obfuscateWithConfig(content, config);

    const fn = `BY-GHOST SPIRIT-encnova-${doc.file_name}`;
    const tmp = path.join(TMP_DIR, fn);
    fs.writeFileSync(tmp, obf, 'utf8');

    await sendOrEditProgress(chatId, msgP.message_id, `⚙️ Menyimpan hasil...`);
    await bot.sendDocument(chatId, fs.createReadStream(tmp), { caption: `✅ OBFUSCATE BY GHOST SPIRIT` });
    fs.unlinkSync(tmp);
    await sendOrEditProgress(chatId, msgP.message_id, '✅ Selesai!');
  } catch (err) {
    console.error('ENCNOVA ERROR:', err);
    await bot.sendMessage(chatId, `❌ Gagal: ${err.message || err}`);
  }
});

bot.onText(/^\/encstrong/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!msg.reply_to_message?.document)
    return bot.sendMessage(chatId, '❌ Balas file .js dengan perintah: /encstrong');
  const doc = msg.reply_to_message.document;
  if (!doc.file_name.endsWith('.js'))
    return bot.sendMessage(chatId, '❌ File harus berekstensi .js');
  if (isFileTooLarge(doc.file_size))
    return bot.sendMessage(chatId, '❌ Ukuran file terlalu besar! Maksimum 10 MB.');

  const msgP = await bot.sendMessage(chatId, `⚙️ PROSES OBFUSCATE BY GHOST SPIRIT (𖥊) (${doc.file_name})...`);
  try {
    const content = await downloadFileContent(doc.file_id);
    const config = getStrongObfuscationConfig();
    const obf = await obfuscateWithConfig(content, config);

    const fn = `BY-GHOST SPIRIT-encstrong-${doc.file_name}`;
    const tmp = path.join(TMP_DIR, fn);
    fs.writeFileSync(tmp, obf, 'utf8');

    await sendOrEditProgress(chatId, msgP.message_id, `⚙️ Menyimpan hasil...`);
    await bot.sendDocument(chatId, fs.createReadStream(tmp), { caption: `✅ OBFUSCATE BY GHOST SPIRIT` });
    fs.unlinkSync(tmp);
    await sendOrEditProgress(chatId, msgP.message_id, '✅ Selesai!');
  } catch (err) {
    console.error('encstrong ERROR:', err);
    await bot.sendMessage(chatId, `❌ Gagal: ${err.message || err}`);
  }
});

const getUptime = () => {
  const uptimeSeconds = process.uptime();
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = Math.floor(uptimeSeconds % 60);

  return `${hours}h ${minutes}m ${seconds}s`;
};
const uptime = getUptime();
 const kategoriFitur = {
   "utama": {
     nama: "📌 UTAMA",
     fitur: "📋 UTAMA\n\n• /jadwalsholat - Jadwal Sholat\n• /dunia - Berita Dunia\n• /searchanime - Cari Anime\n• /fakecall - telepon palsu\n• /fakestory - story palsu\n• /fakecoment - fake coment fb\n• /eventsml - event game mobile legend\n• /ssweb - Screenshot Website\n• /tourl - Upload Foto ke Link\n• /iqc - iPhone Quoted"
   },
   "musik": {
     nama: "🎵 MUSIK",
     fitur: "📋 MUSIK\n\n• /play - Judul Lagu\n• /spotify - Judul Lagu\n• /searchlyrics - search lirik lagu\n• /tiktok - Link TikTok"
   },
   "sticker": {
     nama: "🏷️ STICKER",
     fitur: "📋 STICKER\n\n• /brat - Sticker Brat\n• /videobrat - Sticker Brat Video\n• /qc - Sticker QC\n• /sticker - Buat Sticker dari Foto"
   },
   "gambar": {
     nama: "✏️ GAMBAR",
     fitur: "📋 GAMBAR & TEKS\n\n• /nulis - Tulis Teks\n• /removebg - Hapus Background\n• /toghibli - Gaya Ghibli\n• /tozombie - Gaya Zombie\n• /toanime - Gaya Anime\n• /gethtml - Cari Kode HTML"
   },
   "couple": {
     nama: "❤️ COUPLE",
     fitur: "📋 COUPLE & INDONESIA\n\n• /ppcouple - Foto Profile Couple\n• /cecanhijab - Foto Hijab\n• /cecanindo - Foto Indonesia"
   },
   "cecan": {
     nama: "🌏 CECAN",
     fitur: "📋 CECAN NEGARA LAIN\n\n• /cecanchina - China\n• /animehot - Gambar Anime Hot\n• /bluearchive - Gambar Blue Archive\n• /cecanvietnam - Vietnam\n• /cecanmalaysia - Malaysia\n• /cecanjapan - Jepang\n• /cecankorea - Korea\n• /cecanthailand - Thailand"
   },
   "ai": {
     nama: "🤖 AI",
     fitur: "📋 KECERDASAN BUATAN\n\n• /ai - Chat AI\n• /metaai - Meta AI WhatsApp\n• /geminiai - AI Gemini\n• /publicai - AI Public"
   },
   "tekno": {
     nama: "🛠️ TEKNO",
     fitur: "📋 TEKNO & PERBAIKI\n\n• /fixerror - Perbaiki Error\n• /checkerror - Cek Error\n• /cekfunc - Check Error Function\n• /checkimei - Cek IMEI HP\n• /operatorchecking - Cek Operator"
   },
   "web": {
     nama: "💻 WEB",
     fitur: "📋 WEB & GRUP\n\n• /deploy - Deploy ke Vercel\n• /groupinfo - Info Grup\n• /cekid - Cek ID Telegram\n• /webtoapk - convert web"
   },
   "fun": {
     nama: "🎮 FUN",
     fitur: "📋 FUN & KHUSUS\n\n• /ttc - Tic Tac Toe\n• /quiz - Quiz Tebak\n• /tts - Teks ke Suara\n• /readimage - baca tulisan di gambar\n• /texttoqr - Teks ke QR Code\n• /texttoimage - Ubah Teks Menjadi Gambar\n• /ffstalk - Cari Akun FF\n• /stalktiktok - Cari Akun TikTok\n• /cekcuaca - Cek Cuaca\n• /nsfw - Konten 18+\n• /toimg - reply sticker"
   },
   "contoh": {
     nama: "🎚️ GROUP & TOOLS",
     fitur: "• /setwelcome - Wellcome\n• /promote - admin\n• /demote - undadmin\n• /createsc - create script\n• /randomwallpaper - random\n• /toblur - blur"
   },
      "enc": {
     nama: "⌭ ENCRYPT",
     fitur: `( ⌭ ) Menu Obfuscate
• /timelock - hari
• /quantum
• /encsiu
• /enccina
• /encjapan
• /encarab
• /encjpnxarb
• /encnebula
• /encnova
• /encstrong`
   },
   // Kategori baru
   "tools": {
     nama: "🧰 TOOLS",
     fitur: "📋 FITUR TOOLS\n\n• /niatsholat - niat sholat\n• /kisahnabi - kisah² nabi\n• /wanted - wanted\n• /tomp3 - convert\n• /hd - upscale\n• /cekgempa - cek gempa\n• /tematelegram - tema\n• /nanobanana - edit image\n• /chplay - play ch\n• /sad - sad 1-55\n• /emojimix - mix emoji\n• /ping - cek koneksi\n• /bahlilbrat - Brat bahlil"
   }
 };

function Tombolawal() {
    return{
        reply_markup: {
            inline_keyboard:[
                [
                 {text: '📚 𝕬𝖑𝖑 𝕸𝖊𝖓𝖚', callback_data: 'menu', style: "Primary"},
                ],
                [
           {text: '👑 𝕺𝖜𝖓𝖊𝖗', url: 'https://t.me/GanzzzAlwayss', style: "Danger"},
           {text: '➕ 𝕬𝖉𝖉 𝕭𝖔𝖙', url: 'https://t.me/mdtele_byganz_bot?startgroup=true', style: "Success"}
           ]

         ]
      }
   };
 }
    
 // Tombol rata ke samping dengan warna Primary, Danger, Success saja
 
function tombolUtama(page = 1) {

  let keyboard = [];

  // ================= PAGE 1 =================
  if (page === 1) {
    keyboard = [
      [
        { text: kategoriFitur.utama.nama, callback_data: 'utama', style: 'Primary' },
        { text: kategoriFitur.musik.nama, callback_data: 'musik', style: 'Primary' }
      ],
      [
        { text: kategoriFitur.sticker.nama, callback_data: 'sticker', style: 'Success' },
        { text: kategoriFitur.gambar.nama, callback_data: 'gambar', style: 'Success' }
      ],
      [
        { text: kategoriFitur.couple.nama, callback_data: 'couple', style: 'Danger' },
        { text: kategoriFitur.cecan.nama, callback_data: 'cecan', style: 'Danger' }
      ],
      [
        { text: "➡️ NEXT", callback_data: 'menu_2', style: 'Danger' }
      ]
    ];
  }

  // ================= PAGE 2 =================
  if (page === 2) {
    keyboard = [
      [
        { text: kategoriFitur.ai.nama, callback_data: 'ai', style: 'Primary' },
        { text: kategoriFitur.tekno.nama, callback_data: 'tekno', style: 'Primary' }
      ],
      [
        { text: kategoriFitur.web.nama, callback_data: 'web', style: 'Danger' },
        { text: kategoriFitur.fun.nama, callback_data: 'fun', style: 'Danger' }
      ],
      [
        { text: kategoriFitur.contoh.nama, callback_data: 'contoh', style: 'Success' },
        { text: kategoriFitur.enc.nama, callback_data: 'enc', style: 'Success' }
      ],
      [
        { text: "⬅️ BACK", callback_data: 'menu_1', style: 'Danger' },
        { text: "➡️ NEXT", callback_data: 'menu_3', style: 'Danger' }
      ]
    ];
  }

  // ================= PAGE 3 =================
  if (page === 3) {
    keyboard = [
      [
        { text: kategoriFitur.tools.nama, callback_data: 'tools', style: 'Danger' }
      ],
      [
        { text: "⬅️ BACK", callback_data: 'menu_2', style: 'Danger' }
      ]
    ];
  }

  return {
    reply_markup: {
      inline_keyboard: keyboard
    }
  };
}    
  
 // Tombol kembali dengan warna Danger
 function tombolKembali() {
   return {
     reply_markup: {
       inline_keyboard: [[{text: '🔙 KEMBALI KE MENU', callback_data: 'kembali', style: "Danger"}]]
     }
   };
 }
    

 // Perintah /start
 bot.onText(/^\/start$/, async (msg) => {
     const uptime = getUptime();
   const idChat = msg.chat.id;
   const username = msg.from.username ? `@${msg.from.username}` : "Tidak ada username";
   try {
     await bot.sendVideo(
       idChat,
       "https://h.uguu.se/sqNNchTO.mp4",
       {
         caption: `<blockquote>[ㄼ] Hello 𝗚𝗲𝗻𝘁𝗹𝗲𝗺𝗮𝗻 👋 My Name is 𝐆𝐡𝐨𝐬𝐭 𝐒𝐩𝐢𝐫𝐢𝐭</blockquote>\n
<blockquote>🎭 ༄ 𝕲 𝖍 𝖔 𝖘 𝖙 𝕾 𝖕 𝖎 𝖗 𝖎 𝖙 ༄ </blockquote>\n
╭━〔 𝗜𝗡𝗙𝗢𝗥𝗠𝗔𝗧𝗜𝗢𝗡 〕
┃» 𝐂𝐫𝐞𝐚𝐭𝐨𝐫 : @GanzzzAlwayss
┃» 𝐕𝐞𝐫𝐬𝐢𝐨𝐧 : 3.0 pro
┃» 𝐑𝐮𝐧𝐓𝐢𝐦𝐞 : ${uptime}
┃» 𝐔𝐬𝐞𝐫 : ${username}
┃» 𝐓𝐲𝐩𝐞 : node-telegram-bot-api
┃» 𝐁𝐨𝐭𝐍𝐚𝐦𝐞 : 𝕲 𝖍 𝖔 𝖘 𝖙 𝕾 𝖕 𝖎 𝖗 𝖎 𝖙
╰━━━━━❍
`,
         parse_mode: "HTML",
         disable_web_page_preview: true,
         ...Tombolawal()
       }
     );
   } catch (err) {
     console.error("ERROR KIRIM MENU:", err.message);
     await bot.sendMessage(idChat, "⚠️ Gagal muat menu! Coba lagi nanti.");
   }
 });

 // Tangani klik tombol
bot.on('callback_query', async (cq) => {
   const getUptime = () => {
  const uptimeSeconds = process.uptime();
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = Math.floor(uptimeSeconds % 60);

  return `${hours}h ${minutes}m ${seconds}s`;
};
const uptime = getUptime();
   const idChat = cq.message.chat.id;   const username = cq.from.username ? `@${cq.from.username}` : "Tidak ada username";
   const idPesan = cq.message.message_id;
   const data = cq.data;
   try {
     if (kategoriFitur[data]) {
       await bot.editMessageCaption(
         kategoriFitur[data].fitur,
         {
           chat_id: idChat,
           message_id: idPesan,
           parse_mode: "HTML",
           disable_web_page_preview: true,
           ...tombolKembali()
         }
       );
     } 
     else if (data === 'kembali') {
       await bot.editMessageCaption(
         `<blockquote><b>📌 Daftar Menu</b></blockquote>
Pilih Kategori Di bawah Untuk Melihat Command`,
         {
           chat_id: idChat,
           message_id: idPesan,
           parse_mode: "HTML",
           disable_web_page_preview: true,
           ...tombolUtama()
         }
       );
     }
       else if (data === "menu_1") {
    bot.editMessageReplyMarkup(tombolUtama(1).reply_markup, {
      chat_id: idChat,
      message_id: idPesan,
       parse_mode: "HTML"
    });
  }

  else if (data === "menu_2") {
    bot.editMessageReplyMarkup(tombolUtama(2).reply_markup, {
      chat_id: idChat,
      message_id: idPesan,
      parse_mode: "HTML"
    });
  }
       else if (data === "menu_3") {
    bot.editMessageReplyMarkup(tombolUtama(3).reply_markup, {
      chat_id: idChat,
      message_id: idPesan,
      parse_mode: "HTML"
    });
  }
       
     else if (data === 'menu') {
       await bot.editMessageCaption(
         `
<blockquote><b>📌 Daftar Menu</b></blockquote>
Pilih Kategori Di bawah Untuk Melihat Command`,
         {
           chat_id: idChat,
           message_id: idPesan,
           parse_mode: "HTML",
           disable_web_page_preview: true,
           ...tombolUtama()
         }
       );
     }
     await bot.answerCallbackQuery(cq.id);
   } catch (err) {
     console.error("ERROR EDIT CAPTION:", err.message);
     await bot.answerCallbackQuery(cq.id, {text: "⚠️ Gagal muat info!"});
   }
 }); 
    
// Kirim audio jika ada
 const pathAudio = path.join(__dirname, "sound.mp3");
 if (fs.existsSync(pathAudio)) {
   bot.onText(/^\/start$/, async (msg) => {
     try {
       await bot.sendAudio(msg.chat.id, pathAudio, {thumbnail: "https://files.catbox.moe/xhrbzw.jpg", caption: "🎵 Audio Pembuka Ganz"});
     } catch (err) {
       console.error("ERROR KIRIM AUDIO:", err.message);
     }
   });
 }

bot.onText(/\/tiktok(?:\s+(.+))?/i, async (msg, match) => {
  const chatId = msg.chat.id
  const link = match[1]

  if (!link) {
    return bot.sendMessage(
      chatId,
      "⚠️ Kirim link TikTok!\nContoh:\n/tiktok https://vt.tiktok.com/xxxx"
    )
  }

  await bot.sendMessage(chatId, "⏳ Tunggu sebentar...")

  try {
    const api = `https://api-ikyyofficiall-latest.vercel.app/download/tiktok?apikey=kyzz&query=${encodeURIComponent(link)}`
    const { data } = await axios.get(api)

    if (!data.status || !data.result?.video) {
      return bot.sendMessage(chatId, "❌ Video tidak ditemukan.")
    }

    // KIRIM VIDEO SAJA (NO WM)
    await bot.sendVideo(
      chatId,
      data.result.video,
      {
        caption: "🎬 TikTok No Watermark"
      }
    )

  } catch (e) {
    console.error(e)
    bot.sendMessage(chatId, "❌ Error saat download.")
  }
})
};

const rl= require('readline').createInterface({

  input: process.stdin,

  output: process.stdout

});

console.log("🎵 Bot running...")
console.log(chalk.blue.bold('\n===== VERIFIKASI SCRIPT ====='));
 rl.question(chalk.blue('Masukkan Password Yang Diberikan Bang Ganz:\n> '), (inputPassword) => {
     // Trim spasi kosong di awal/akhir input
     const cleanedInput = inputPassword.trim();
     // Cek password
     if (cleanedInput !== manualPassword) {
         console.log(chalk.red('\n❌ Password Salah!\nSystem Akan Menghapus File Dan Mematikan Running!'));
         rl.close();
         process.exit(1); // Keluar dengan kode error
     }
     // Jika benar
     console.log(chalk.green.bold('\n✅ Password Benar! Terima kasih telah membeli script ini.'));
     rl.close();
     initBot(); // Hanya jalankan bot setelah ini
 });
 // Tangani jika readline ditutup secara tidak sengaja
 rl.on('close', () => {
     console.log(chalk.gray('\n🔒 Sesi verifikasi ditutup.'));
 });
   