import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigError =
  !supabaseUrl || !supabaseAnonKey
    ? "VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY belum terisi di file .env"
    : !supabaseUrl.startsWith("http")
    ? "VITE_SUPABASE_URL formatnya tidak valid (harus diawali https://)"
    : null;

// Kalau config tidak valid, buat client "kosong" supaya import tidak crash.
// Setiap pemanggilan .from(...) akan gagal dengan pesan jelas, bukan blank page.
export const supabase = supabaseConfigError
  ? createClient("https://placeholder.supabase.co", "placeholder-key")
  : createClient(supabaseUrl, supabaseAnonKey);

if (supabaseConfigError) {
  console.error("[Supabase Config Error]", supabaseConfigError);
}