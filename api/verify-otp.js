import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function normalizeWhatsapp(input) {
  let n = input.replace(/\D/g, "");
  if (n.startsWith("0")) n = "62" + n.slice(1);
  return n;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { whatsapp, code } = req.body || {};
  if (!whatsapp || !code) {
    return res.status(400).json({ error: "Nomor WhatsApp dan kode wajib diisi" });
  }

  const target = normalizeWhatsapp(whatsapp);

  try {
    const { data, error } = await supabaseAdmin
      .from("otp_codes")
      .select("*")
      .eq("whatsapp", target)
      .eq("verified", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return res.status(400).json({ verified: false, error: "Kode tidak ditemukan, minta kode baru." });
    }

    if (new Date(data.expires_at) < new Date()) {
      return res.status(400).json({ verified: false, error: "Kode sudah kedaluwarsa, minta kode baru." });
    }

    if (data.code !== String(code)) {
      return res.status(400).json({ verified: false, error: "Kode salah." });
    }

    await supabaseAdmin.from("otp_codes").update({ verified: true }).eq("id", data.id);

    return res.status(200).json({ verified: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Terjadi kesalahan, coba lagi." });
  }
}
