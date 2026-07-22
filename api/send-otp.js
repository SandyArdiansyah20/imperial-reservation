// File ini berjalan di server (Vercel Serverless Function), TIDAK di browser.
// Jadi aman menyimpan API key rahasia di sini.

import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function normalizeWhatsapp(input) {
  // Ubah '0812xxxx' jadi format internasional '62812xxxx' yang dibutuhkan Fonnte
  let n = input.replace(/\D/g, "");
  if (n.startsWith("0")) n = "62" + n.slice(1);
  return n;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { whatsapp } = req.body || {};
  if (!whatsapp || whatsapp.replace(/\D/g, "").length < 8) {
    return res.status(400).json({ error: "Nomor WhatsApp tidak valid" });
  }

  const target = normalizeWhatsapp(whatsapp);
  const code = String(Math.floor(1000 + Math.random() * 9000));
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // berlaku 5 menit

  try {
    // 1. Simpan kode OTP ke database
    const { error: dbError } = await supabaseAdmin.from("otp_codes").insert({
      whatsapp: target,
      code,
      expires_at: expiresAt,
    });
    if (dbError) throw dbError;

    // 2. Kirim pesan lewat Fonnte
    const fonnteRes = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: process.env.FONNTE_TOKEN,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        target,
        message: `Kode verifikasi Imperial Reservation Anda: ${code}\n\nBerlaku 5 menit. Jangan berikan kode ini ke siapa pun.`,
      }),
    });

    const fonnteData = await fonnteRes.json();
    if (fonnteData.status === false) {
      throw new Error(fonnteData.reason || "Gagal mengirim pesan WhatsApp");
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Gagal mengirim OTP. Coba lagi." });
  }
}
