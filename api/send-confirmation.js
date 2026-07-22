export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { whatsapp, name, outlet, date, session, bookingCode } = req.body || {};
  if (!whatsapp || !bookingCode) {
    return res.status(400).json({ error: "Data tidak lengkap" });
  }

  let target = whatsapp.replace(/\D/g, "");
  if (target.startsWith("0")) target = "62" + target.slice(1);

  const message =
    `Halo ${name || "Tamu"}, reservasi Anda di ${outlet} pada ${date} (${session}) berhasil dikonfirmasi.\n\n` +
    `Kode booking Anda: *${bookingCode}*\n\n` +
    `Tunjukkan kode ini ke staff kami saat tiba di lokasi. Sampai jumpa!`;

  try {
    const fonnteRes = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: process.env.FONNTE_TOKEN,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ target, message }),
    });
    const fonnteData = await fonnteRes.json();
    if (fonnteData.status === false) {
      throw new Error(fonnteData.reason || "Gagal mengirim pesan");
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    // Sengaja tidak menggagalkan seluruh proses reservasi kalau WA gagal terkirim —
    // reservasi tetap tersimpan di database, cuma notifikasinya yang gagal.
    return res.status(200).json({ success: false, warning: "Reservasi tersimpan, tapi notifikasi WhatsApp gagal terkirim." });
  }
}
