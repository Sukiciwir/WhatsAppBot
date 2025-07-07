console.log('Masuk ke Metic.js');

// Load module
require('./mecha.js');
const fs = require('fs');

// Fungsi validasi nomor WA
function isValidNumber(number) {
    const regex = /^[0-9]+$/;
    return regex.test(number);
}

// Load daftar kontak dari kontak.json
let daftarKontak = [];
try {
    const data = fs.readFileSync('./kontak.json');
    daftarKontak = JSON.parse(data);
} catch (err) {
    console.error("Gagal baca kontak.json", err);
}

// Load group map dari groups.json
let groupMap = {};
try {
    const data = fs.readFileSync('./group.json');
    groupMap = JSON.parse(data); 
} catch (err) {
    console.error("Gagal baca groups.json", err);
}

// Load admin dari admins.json
if (!fs.existsSync('./admins.json')) {
    fs.writeFileSync('./admins.json', JSON.stringify(global.admin, null, 2));
}

let adminList = [];
try {
    const data = fs.readFileSync('./admins.json');
    adminList = JSON.parse(data);
} catch (err) {
    adminList = [...global.admin];
}

global.admin = adminList;

// Fungsi utama dari index.js
module.exports = async (Metic, m) => {
    const msg = m.messages[0];
    if (!msg || !msg.message) return;

    const body = msg.message.conversation 
        || msg.message.extendedTextMessage?.text 
        || "";

    const sender = msg.key.remoteJid;
    const pushname = msg.pushName || "Metic";

    // Inisialisasi reply function
    const Meticreply = (teks) => Metic.sendMessage(sender, { text: teks }, { quoted: msg });

    // Cek prefix
    let isPublicCmd = body.startsWith(global.prefix);
    let isOwnerCmd = body.startsWith(global.adminPrefix);
    let isGroupCmd = body.startsWith(global.groupPrefix);

    if (!isPublicCmd && !isOwnerCmd && !isGroupCmd) return;

    // Parsing command & args berdasarkan prefix
    let cmd, args;
    if (isOwnerCmd) {
        cmd = body.slice(global.adminPrefix.length).trim().split(" ")[0].toLowerCase();
        args = body.slice(global.adminPrefix.length).trim().split(" ");
    } else if (isGroupCmd) {
        cmd = body.slice(global.groupPrefix.length).trim().split(" ")[0].toLowerCase();
        args = body.slice(global.groupPrefix.length).trim().split(" ");
    } else if (isPublicCmd) {
        cmd = body.slice(global.prefix.length).trim().split(" ")[0].toLowerCase();
        args = body.slice(global.prefix.length).trim().split(" ");
    }

    // Hilangkan command dari args
    args.shift();
    const q = args.join(" ");

    // Log pesan masuk
    console.log(`Pesan Diterima dari ${pushname} (${sender}): ${body}`);


    // Switch command
    switch (cmd) {
        case 'help':
        case 'menu':
            let helpText = `📘 *DAFTAR COMMAND METIC BOT*\n\n`;
            helpText += `🔹 *Command Publik* (prefix: "${global.prefix}")\n`;
            helpText += `1. ${global.prefix}halo → 100% bot ramah\n`;
            helpText += `2. ${global.prefix}ping → Cek bot\n\n`;

            helpText += `🔹 *Command Admin* (prefix: "${global.adminPrefix}")\n`;
            helpText += `1. ${global.adminPrefix}addkontak 6281234567890 Nama → Tambah kontak ke database\n`;
            helpText += `2. ${global.adminPrefix}delkontak Nama/6281234567890 → Hapus kontak\n`;
            helpText += `3. ${global.adminPrefix}listkontak → Lihat semua kontak\n`;
            helpText += `4. ${global.adminPrefix}broadcast Hai {Nama}, ini pesan penting → Kirim pesan ke semua kontak\n`;
            helpText += `5. ${global.adminPrefix}addadmin 6281234567890 → Tambah admin baru\n`;
            helpText += `6. ${global.adminPrefix}deladmin 6281234567890 → Hapus admin\n`;
            helpText += `7. ${global.adminPrefix}listadmin → Lihat daftar admin\n`;

            helpText += `🔹 *Intergroup Messaging* (hanya bisa dipakai di grup)\n`;
            helpText += `Contoh: ${global.groupPrefix}Mokdev webnya error nih\n`;
            helpText += `1. ${global.groupPrefix}medcom → Kirim ke grup MedCom\n`;
            helpText += `2. ${global.groupPrefix}mokdev → Kirim ke grup MokletDev\n`;
            helpText += `3. ${global.groupPrefix}merch → Kirim ke grup MeticMerch\n\n`;

            helpText += `📌 Format intergroup messaging:\n${global.groupPrefix}[divisi] Pesan...\n`;
            helpText += `Contoh: ${global.groupPrefix}Mokdev webnya error nih\n\n`;

            helpText += `📝 Catatan:\n`;
            helpText += `- Prefix publik: ${global.prefix}\n`;
            helpText += `- Prefix group: ${global.groupPrefix}\n`;
            helpText += `- Prefix admin: ${global.adminPrefix}\n`;
            helpText += `- Placeholder {Nama} akan otomatis terganti saat broadcast\n`;
            helpText += `- Bot harus join ke semua grup untuk intergroup messaging\n\n`;

            Meticreply(helpText);
            break;

        case 'ping':
            await Metic.sendMessage(sender, { text: 'Pong!' }, { quoted: msg });
            break;

        case 'halo':
            await Metic.sendMessage(sender, { text: `halo metizen, ${pushname}!` }, { quoted: msg });
            break;

        case 'addkontak':
            if (!global.admin.includes(sender)) return Meticreply(global.mess.admin);

            const [nomor, ...namaArr] = args;
            const nama = namaArr[0];
            const ketertarikan = namaArr[1];
            const pengalaman = namaArr.slice(2).join(" ");

            if (!nomor || !nama || !ketertarikan || !pengalaman) {
                return Meticreply("Penggunaan: !addkontak 6281234567890 Nama Ketertarikan Pengalaman");
            }

            if (!isValidNumber(nomor)) {
                return Meticreply("⚠ Masukkan nomor WhatsApp yang valid (hanya angka)");
            }

            const nomorWA = `${nomor}@s.whatsapp.net`;
            const existsByNumber = daftarKontak.some(k => k.nomor === nomorWA);
            const existsByName = daftarKontak.some(k => k.nama.toLowerCase() === nama.toLowerCase());

            if (existsByNumber || existsByName) {
                return Meticreply("⚠ Kontak sudah ada dalam daftar.");
            }

            daftarKontak.push({ 
                nomor: nomorWA, 
                nama, 
                Ketertarikan: ketertarikan,
                pengalaman: pengalaman
            });

            fs.writeFileSync('./kontak.json', JSON.stringify(daftarKontak, null, 2));
            Meticreply(`✅ Kontak *${nama}* berhasil ditambahkan.`);
            break;

        case 'delkontak':
            if (!global.admin.includes(sender)) return Meticreply(global.mess.admin);

            const target = q.trim();

            if (!target) {
                return Meticreply("Penggunaan: !delkontak [nama/nomor]");
            }

            const originalTarget = target;

            if (isValidNumber(target)) {
                const targetWA = `${target}@s.whatsapp.net`;
                const index = daftarKontak.findIndex(k => k.nomor === targetWA);

                if (index > -1) {
                    const removed = daftarKontak.splice(index, 1)[0];
                    fs.writeFileSync('./kontak.json', JSON.stringify(daftarKontak, null, 2));
                    Meticreply(`✅ Kontak *${removed.nama}* berhasil dihapus.`);
                } else {
                    Meticreply("❌ Nomor tidak ditemukan dalam daftar.");
                }
            } else {
                const index = daftarKontak.findIndex(k => k.nama.toLowerCase() === target.toLowerCase());

                if (index > -1) {
                    const removed = daftarKontak.splice(index, 1)[0];
                    fs.writeFileSync('./kontak.json', JSON.stringify(daftarKontak, null, 2));
                    Meticreply(`✅ Kontak *${removed.nama}* berhasil dihapus.`);
                } else {
                    Meticreply("❌ Nama tidak ditemukan dalam daftar.");
                }
            }

            break;

        case 'listkontak':
            if (!global.admin.includes(sender)) return Meticreply(global.mess.admin);

            if (daftarKontak.length === 0) {
                Meticreply('ℹ Belum ada kontak dalam daftar.');
                break;
            }

            let list = '📋 *Daftar Kontak:*\n\n';
            daftarKontak.forEach((data, i) => {
                list += `${i + 1}. ${data.nama}\n`;
                list += `   Nomor: ${data.nomor}\n`;
                list += `   Ketertarikan: ${data.Ketertarikan || "-"}\n`;
                list += `   Pengalaman: ${data.pengalaman || "-"}\n\n`;
            });

            Meticreply(list);
            break;

        case 'broadcast':
            if (!global.admin.includes(sender)) return Meticreply(global.mess.admin);

            if (!q) {
                Meticreply('⚠ Masukkan pesan yang ingin dikirim.');
                break;
            }

            if (daftarKontak.length === 0) {
                Meticreply('ℹ Belum ada kontak dalam daftar.');
                break;
            }

            // Kirim ke semua kontak
            for (const data of daftarKontak) {
                const { nomor, nama, Ketertarikan, pengalaman } = data;

                let pesanPersonal = q.replace(/{Nama}/g, nama)
                                    .replace(/{Ketertarikan}/g, Ketertarikan || '-')
                                    .replace(/{pengalaman}/g, pengalaman || '-');

                try {
                    await Metic.sendMessage(nomor, { text: pesanPersonal });
                    console.log(`✅ Pesan terkirim ke ${nama} - ${nomor}`);
                } catch (err) {
                    console.error(`❌ Gagal kirim ke ${nomor}:`, err);
                }
            }

            Meticreply('📢 Pesan berhasil dikirim ke semua kontak!');
            break;

        case 'addadmin':
            if (sender !== global.admin[0]) return Meticreply(global.mess.admin);

            if (!isValidNumber(q)) {
                return Meticreply("⚠ Masukkan nomor yang valid!");
            }

            const newAdmin = `${q}@s.whatsapp.net`;

            if (adminList.includes(newAdmin)) {
                return Meticreply("⚠ Nomor sudah menjadi admin");
            }

            adminList.push(newAdmin);
            fs.writeFileSync('./admins.json', JSON.stringify(adminList, null, 2));

            Meticreply(`✅ Nomor *${newAdmin}* ditambahkan sebagai admin`);

            break;

        case 'deladmin':
            if (sender !== global.admin[0]) return Meticreply(global.mess.admin);

            const removeAdmin = `${q}@s.whatsapp.net`;

            if (!adminList.includes(removeAdmin)) {
                return Meticreply("⚠ Nomor tersebut bukan admin");
            }

            if (removeAdmin === sender) {
                return Meticreply("⚠ Tidak bisa menghapus diri sendiri dari admin list");
            }

            const index = adminList.indexOf(removeAdmin);
            adminList.splice(index, 1);
            fs.writeFileSync('./admins.json', JSON.stringify(adminList, null, 2));

            Meticreply(`✅ Admin *${removeAdmin}* berhasil dihapus`);

            break;

        case 'listadmin':
            if (!global.admin.includes(sender)) return Meticreply(global.mess.admin);

            let adminListText = "👮 *Daftar Admin*:\n\n";
            adminList.forEach((nomor, i) => {
                adminListText += `${i + 1}. ${nomor}\n`;
            });

            Meticreply(adminListText);
            break;

        case 'merch':
        case 'mokdev':
        case 'medcom':

            // Hanya jalan di grup
            if (!msg.key.remoteJid.endsWith('@g.us')) {
                return Meticreply("⚠ Command ini hanya bisa dipakai di grup");
            }

            const targetKey = cmd.toLowerCase();
            const targetGroupJid = groupMap[targetKey];

            if (!targetGroupJid) {
                return Meticreply("❌ Grup tujuan tidak ditemukan");
            }

            // Pastikan grup tersebut terdaftar di groupMap
            const currentGroupJid = msg.key.remoteJid;
            const validGroups = Object.values(groupMap); // ambil semua JID grup yang diizinkan
            if (!validGroups.includes(currentGroupJid)) {
                return Meticreply("⚠ Kamu tidak berada di grup yang diizinkan.");
            }

            // Ambil nama grup asal
            let sourceGroupName = "Grup Tidak Dikenali";
            for (const [groupName, groupJid] of Object.entries(groupMap)) {
                if (msg.key.remoteJid === groupJid) {
                    sourceGroupName = groupName.charAt(0).toUpperCase() + groupName.slice(1);
                    break;
                }
            }

            const senderName = pushname || "Unknown";
            const pesan = q;

            await Metic.sendMessage(targetGroupJid, {
                text: `[${sourceGroupName}] ${senderName}: ${pesan}`
            });

            Meticreply("✅ Pesan telah dikirim ke grup tujuan");

            break;

        case 'getjid':
            if (!global.admin.includes(sender)) return Meticreply(global.mess.admin);

            if (!msg.key.remoteJid.endsWith('@g.us')) {
                return Meticreply("⚠ Command ini hanya bisa dipakai di grup");
            }

            const groupMetadata = await Metic.groupMetadata(msg.key.remoteJid);
            Meticreply(`📌 JID Grup:\n*${groupMetadata.id}*\n\nNama Grup: ${groupMetadata.subject}`);
            break;

        case 'ShutDown':
            if (!global.admin.includes(sender)) return Meticreply(global.mess.admin);

            Meticreply('🔄 Bot akan di hentikan...');
            setTimeout(() => {
                process.exit(1);
            }, 1000);
            break;

        default:
            Meticreply(global.mess.default);
            break;
    }

    // Simpan log pesan ke file
    fs.appendFileSync('botlog.txt', `[${new Date()}] ${pushname}: ${body}\n`);
};
