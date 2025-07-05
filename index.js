//index.js
// Credit: Lewny
// Recode by: Rizqi Ramadhan ( suki )

// Import module
const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('baileys');
const pino = require('pino');
const chalk = require('chalk');
const readline = require('readline');
const qrcode = require('qrcode-terminal');


// Konfigurasi koneksi WA
const usePairingCode = true;

// Fungsi prompt untuk input di terminal
async function question(prompt) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

// Koneksi ke WhatsApp
async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('./MeticSesi');

    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`Metic bot WA v${version.join('.')}, isLatest: ${isLatest}`);

    // Membuat koneksi ke WhatsApp
    const Metic = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: !usePairingCode,
        auth: state,
        browser: ['Ubuntu', 'Chrome', '20.0.04'],
        version: version,
        syncFullHistory: true,
        generateHighQualityLinkPreview: true
    });

    // Jika menggunakan pairing code
    if (usePairingCode && !Metic.authState.creds.registered) {
        try {
            const phoneNumber = await question("Masukkan Nomor pake 62 :\n ");
            const code = await Metic.requestPairingCode(phoneNumber.trim());
            console.log(`Pairing code : ${code}`);
        } catch (error) {
            console.error('Gagal mendapatkan kode pairing:', error);
        }
    }

    // Simpan sesi login
    Metic.ev.on('creds.update', saveCreds);

    // Handle update koneksi
    Metic.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'open') {
            console.log(chalk.green('✅ Koneksi berhasil!'));
        } else if (connection === 'close') {
            console.log(chalk.red('❌ Koneksi terputus!'));
            connectToWhatsApp(); // Reconnect
        }
    });

    // Menangani pesan masuk
    Metic.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];

        if (!msg || !msg.message) return;

        const body = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        const sender = msg.key.remoteJid;
        const pushname = msg.pushName || "Metic";
        

        // Log pesan masuk dengan warna acak
        const listColor = ["red", "green", "yellow", "magenta", "cyan", "white", "blue"];
        const randomColor = listColor[Math.floor(Math.random() * listColor.length)];

        console.log(
            chalk.yellow.bold("Metic"),
            chalk.green.bold("[ WhatsApp ]"),
            chalk[randomColor](pushname),
            chalk[randomColor](" : "),
            chalk.white(body)
        );

        // Panggil command handler
        require('./metic')(Metic, m);
    });
}

// Jalankan koneksi
connectToWhatsApp();