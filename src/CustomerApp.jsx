import { useState, useMemo, useEffect } from "react";
import { supabase, supabaseConfigError } from "./supabaseClient.js";
import {
  Store,
  MessageCircle,
  ShieldCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MapPin,
  AlertTriangle,
  UtensilsCrossed,
  CreditCard,
  Ticket,
  QrCode,
  Check,
  X,
  ArrowRight,
  ArrowLeft,
  Moon,
  Star,
  Sparkles,
  Banknote,
  Search,
  Download,
} from "lucide-react";

const FONT_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');";

const display = { fontFamily: "'Fraunces', serif" };
const body = { fontFamily: "'Plus Jakarta Sans', sans-serif" };

const DEFAULT_OUTLETS = [
  { id: "kemang", name: "Imperial Kemang", city: "Jakarta Selatan", daily_capacity: 30 },
  { id: "bsd", name: "Imperial BSD", city: "Tangerang Selatan", daily_capacity: 30 },
  { id: "pik", name: "Imperial PIK", city: "Jakarta Utara", daily_capacity: 30 },
];

const MENUS = [
  { id: "m1", name: "Paket Buka Puasa Bersama", desc: "Untuk 1 orang · kurma, takjil, main course", price: 150000 },
  { id: "m2", name: "Paket Keluarga", desc: "Untuk 4 orang · nasi, 3 lauk, sup, dessert", price: 550000 },
  { id: "m3", name: "Paket Lebaran Spesial", desc: "Untuk 6 orang · ketupat, opor, rendang, kue kering", price: 890000 },
  { id: "m4", name: "Minuman Takjil Tambahan", desc: "Es kelapa, kolak, atau es campur", price: 25000 },
];

const STEPS = [
  { label: "Outlet", icon: Store },
  { label: "Registrasi", icon: MessageCircle },
  { label: "Slot", icon: CalendarDays },
  { label: "Menu", icon: UtensilsCrossed },
  { label: "Bayar", icon: CreditCard },
  { label: "Kode", icon: Ticket },
];

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

// Jam operasional untuk pemilihan waktu bebas oleh pelanggan.
// Ganti dua nilai ini kalau jam buka/tutup outlet berubah.
const OPENING_TIME = "16:30";
const CLOSING_TIME = "21:00";
// Pilihan jam cepat yang ditampilkan sebagai tombol (opsional, pelanggan tetap
// bisa isi jam lain sendiri lewat input di bawahnya).
const QUICK_TIMES = ["17:30", "18:00", "18:30", "19:00", "19:30", "20:00"];
// Kapasitas total reservasi per HARI (bukan per sesi lagi, karena jam sekarang bebas).
// Kapasitas cadangan kalau outlet tidak punya nilai daily_capacity di database
// (kapasitas sebenarnya sekarang diambil per outlet, lihat outlets.daily_capacity)
const FALLBACK_DAILY_CAPACITY = 30;

function rupiah(n) {
  return "Rp" + n.toLocaleString("id-ID");
}

function ProgressRail({ step }) {
  return (
    <div className="flex items-center justify-between mb-10 overflow-x-auto pb-2">
      {STEPS.map((s, i) => {
        const idx = i + 1;
        const isDone = idx < step;
        const isActive = idx === step;
        const Icon = s.icon;
        return (
          <div key={s.label} className="flex items-center flex-1 min-w-[64px]">
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <div
                className={
                  "w-9 h-9 rounded-full flex items-center justify-center border transition-colors " +
                  (isDone
                    ? "bg-emerald-800 border-emerald-800 text-amber-300"
                    : isActive
                    ? "bg-amber-400 border-amber-400 text-emerald-950"
                    : "bg-white border-stone-300 text-stone-400")
                }
              >
                {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <span
                className={
                  "text-[11px] tracking-wide " +
                  (isActive ? "text-emerald-900 font-semibold" : "text-stone-400")
                }
                style={body}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={
                  "h-px flex-1 mx-1 mb-5 " + (isDone ? "bg-emerald-800" : "bg-stone-200")
                }
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Card({ children, className = "" }) {
  return (
    <div className={"bg-white rounded-2xl border border-stone-200 shadow-sm " + className}>
      {children}
    </div>
  );
}

function PrimaryButton({ children, onClick, disabled, className = "" }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={
        "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all " +
        (disabled
          ? "bg-stone-200 text-stone-400 cursor-not-allowed"
          : "bg-emerald-900 text-amber-300 hover:bg-emerald-800 active:scale-[0.98]") +
        " " +
        className
      }
      style={body}
    >
      {children}
    </button>
  );
}

export default function CustomerApp() {
  if (supabaseConfigError) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center px-6" style={{ ...body, background: "#FAF8F3" }}>
        <div className="max-w-md text-center">
          <p className="text-2xl mb-2" style={display}>Konfigurasi belum lengkap</p>
          <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">{supabaseConfigError}</p>
        </div>
      </div>
    );
  }

  return <CustomerAppInner />;
}

function CustomerAppInner() {
  const [step, setStep] = useState(1);
  const [outlet, setOutlet] = useState(null);
  const [outlets, setOutlets] = useState(DEFAULT_OUTLETS);
  const [loadingOutlets, setLoadingOutlets] = useState(true);
  const [outletsError, setOutletsError] = useState("");
  const [outletQuery, setOutletQuery] = useState("");
  const [expandedCities, setExpandedCities] = useState(() => new Set());
  const [form, setForm] = useState({ name: "", pax: "", wa: "" });
  const [existingBookings, setExistingBookings] = useState([]);
  const [checkingExisting, setCheckingExisting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [monthIndex, setMonthIndex] = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [session, setSession] = useState(null);
  const [menuQty, setMenuQty] = useState({});
  const [paymentMethod, setPaymentMethod] = useState(null); // 'qris' | 'cash'
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [bookingCode, setBookingCode] = useState(null);
  const [saveError, setSaveError] = useState("");

  const [availability, setAvailability] = useState({}); // { "YYYY-MM-DD": { [session]: count } }
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  const year = 2026;

  // Ambil daftar outlet dari database (bukan lagi hardcode), supaya menu ini
  // otomatis ikut bertambah kalau outlet baru ditambahkan lewat Supabase.
  useEffect(() => {
    let cancelled = false;
    async function loadOutlets() {
      const { data, error } = await supabase
        .from("outlets")
        .select("id, name, city, daily_capacity")
        .order("city", { ascending: true });
      if (cancelled) return;
      if (error) {
        console.error("Gagal memuat outlet dari Supabase:", error);
        setOutletsError(error.message || "Gagal memuat outlet dari database.");
      } else if (data && data.length > 0) {
        setOutlets(data);
        setOutletsError("");
      } else {
        // Query berhasil tapi tabel kosong / tidak ada baris yang ke-return (kemungkinan diblokir RLS)
        setOutletsError("Tabel outlets kosong atau tidak ada baris yang terbaca (cek RLS policy SELECT-nya).");
      }
      setLoadingOutlets(false);
    }
    loadOutlets();
    return () => { cancelled = true; };
  }, []);

  const filteredOutlets = useMemo(() => {
    const q = outletQuery.trim().toLowerCase();
    if (!q) return outlets;
    return outlets.filter(
      (o) => o.name.toLowerCase().includes(q) || o.city.toLowerCase().includes(q)
    );
  }, [outlets, outletQuery]);

  // Kelompokkan outlet per kota supaya bisa ditampilkan sebagai accordion.
  const outletsByCity = useMemo(() => {
    const groups = {};
    filteredOutlets.forEach((o) => {
      if (!groups[o.city]) groups[o.city] = [];
      groups[o.city].push(o);
    });
    return groups;
  }, [filteredOutlets]);

  const cityList = useMemo(() => Object.keys(outletsByCity).sort(), [outletsByCity]);

  function toggleCity(city) {
    setExpandedCities((prev) => {
      const next = new Set(prev);
      if (next.has(city)) next.delete(city);
      else next.add(city);
      return next;
    });
  }

  const isSearching = outletQuery.trim().length > 0;

  function outletName(id) {
    return outlets.find((o) => o.id === id)?.name;
  }

  // Kapasitas reservasi harian untuk outlet yang sedang dipilih pelanggan.
  // Kalau outlet belum punya nilai daily_capacity di database, pakai fallback.
  const dailyCapacity = outlets.find((o) => o.id === outlet)?.daily_capacity || FALLBACK_DAILY_CAPACITY;

  // Ambil jumlah reservasi yang sudah ada untuk outlet & bulan yang sedang dilihat,
  // supaya kalender bisa menandai tanggal/sesi yang sudah penuh berdasarkan data asli.
  useEffect(() => {
    if (!outlet || step !== 3) return;
    let cancelled = false;
    async function loadAvailability() {
      setLoadingAvailability(true);
      const start = `${year}-${String(monthIndex + 1).padStart(2, "0")}-01`;
      const lastDay = new Date(year, monthIndex + 1, 0).getDate();
      const end = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

      const { data, error } = await supabase
        .from("reservations")
        .select("reservation_date, session")
        .eq("outlet_id", outlet)
        .gte("reservation_date", start)
        .lte("reservation_date", end)
        .neq("status", "cancelled");

      if (cancelled) return;
      if (error) {
        console.error(error);
        setLoadingAvailability(false);
        return;
      }
      const map = {};
      (data || []).forEach((row) => {
        const dateKey = row.reservation_date;
        if (!map[dateKey]) map[dateKey] = {};
        map[dateKey][row.session] = (map[dateKey][row.session] || 0) + 1;
      });
      setAvailability(map);
      setLoadingAvailability(false);
    }
    loadAvailability();
    return () => { cancelled = true; };
  }, [outlet, monthIndex, step]);

  // Cek ke database: apakah sudah ada reservasi lain dengan nama & nomor WhatsApp
  // yang sama persis? Kalau ada, tampilkan sebagai notif informasi (tidak memblokir
  // pelanggan booking lagi, misalnya untuk tanggal/sesi yang berbeda).
  useEffect(() => {
    const name = form.name.trim();
    const wa = form.wa.trim();
    if (step !== 2 || !name || wa.length < 8) {
      setExistingBookings([]);
      return;
    }
    let cancelled = false;
    setCheckingExisting(true);
    const timer = setTimeout(async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("booking_code, reservation_date, session, outlet_id, status")
        .ilike("customer_name", name)
        .eq("customer_whatsapp", wa)
        .order("reservation_date", { ascending: false })
        .limit(5);
      if (cancelled) return;
      if (!error && data) {
        setExistingBookings(data);
      }
      setCheckingExisting(false);
    }, 600); // debounce supaya tidak query tiap ketikan huruf
    return () => { cancelled = true; clearTimeout(timer); setCheckingExisting(false); };
  }, [form.name, form.wa, step]);

  function dateKeyOf(monthIdx, day) {
    return `${year}-${String(monthIdx + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function dayStatus(monthIdx, day) {
    const counts = availability[dateKeyOf(monthIdx, day)] || {};
    const total = Object.values(counts).reduce((sum, c) => sum + c, 0);
    if (total >= dailyCapacity) return "penuh";
    if (total >= dailyCapacity * 0.7) return "terbatas";
    return "tersedia";
  }

  const total = useMemo(
    () => MENUS.reduce((sum, m) => sum + (menuQty[m.id] || 0) * m.price, 0),
    [menuQty]
  );

  const [voucherInput, setVoucherInput] = useState("");
  const [voucherApplied, setVoucherApplied] = useState(null); // { code, discount_amount, voucher_type }
  const [voucherChecking, setVoucherChecking] = useState(false);
  const [voucherError, setVoucherError] = useState("");

  const voucherDiscount = voucherApplied?.discount_amount || 0;
  const discountedTotal = Math.max(0, total - voucherDiscount);
  const baseMinPayment = Math.round(total * 0.5);
  // Voucher dipotong PENUH langsung dari uang muka (bukan dibagi rata 50/50),
  // supaya potongannya langsung terasa saat reservasi, bukan nanti di sisa bayar.
  const minPayment = Math.max(0, baseMinPayment - voucherDiscount);

  async function applyVoucher() {
    if (!voucherInput.trim()) return;
    setVoucherChecking(true);
    setVoucherError("");
    const { data, error } = await supabase.rpc("check_voucher", {
      p_code: voucherInput.trim(),
      p_subtotal: total,
    });
    setVoucherChecking(false);
    const result = Array.isArray(data) ? data[0] : data;
    if (error || !result?.success) {
      setVoucherError(result?.message || "Gagal memeriksa voucher");
      setVoucherApplied(null);
      return;
    }
    setVoucherApplied({
      code: voucherInput.trim(),
      discount_amount: result.discount_amount,
      voucher_type: result.voucher_type,
    });
  }

  function removeVoucher() {
    setVoucherApplied(null);
    setVoucherInput("");
    setVoucherError("");
  }

  const daysInMonth = new Date(2026, monthIndex + 1, 0).getDate();
  const firstDow = new Date(2026, monthIndex, 1).getDay();

  const selectedStatus = selectedDate ? dayStatus(monthIndex, selectedDate) : null;

  function goNext() {
    setStep((s) => Math.min(s + 1, 6));
  }
  function goBack() {
    setStep((s) => Math.max(s - 1, 1));
  }

  // Reset semua state form/booking dan kembali ke Langkah 1 (pilih outlet).
  // Dipakai tombol "Booking lagi" / "Kembali ke tampilan awal" di halaman konfirmasi.
  function resetBooking() {
    setStep(1);
    setOutlet(null);
    setOutletQuery("");
    setForm({ name: "", pax: "", wa: "" });
    setOtpSent(false);
    setOtpVerified(false);
    setMonthIndex(new Date().getMonth());
    setSelectedDate(null);
    setSession(null);
    setMenuQty({});
    setPaymentMethod(null);
    setPaying(false);
    setPaid(false);
    setBookingCode(null);
    setSaveError("");
    setAvailability({});
    setVoucherInput("");
    setVoucherApplied(null);
    setVoucherError("");
  }

  // Generate gambar (PNG) berisi kode booking + detail reservasi, lalu unduh.
  // Dipakai tombol "Download kode booking" di halaman konfirmasi (Langkah 6),
  // supaya pelanggan bisa simpan/tunjukkan tanpa perlu buka aplikasi/internet lagi.
  function downloadBookingCard() {
    if (!bookingCode) return;

    const canvas = document.createElement("canvas");
    const W = 640;
    const H = 380;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    // background kartu
    ctx.fillStyle = "#FAF8F3";
    ctx.fillRect(0, 0, W, H);

    // header hijau
    ctx.fillStyle = "#052e1f";
    ctx.fillRect(0, 0, W, 72);
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.arc(36, 36, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#052e1f";
    ctx.font = "bold 16px 'Plus Jakarta Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("☾", 36, 42);
    ctx.textAlign = "left";
    ctx.fillStyle = "#fef3c7";
    ctx.font = "bold 22px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("Imperial Reservation", 64, 44);

    // label "KODE BOOKING"
    ctx.textAlign = "center";
    ctx.fillStyle = "#a8a29e";
    ctx.font = "12px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("KODE BOOKING", W / 2, 130);

    // kode booking besar
    ctx.fillStyle = "#065f46";
    ctx.font = "bold 46px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(bookingCode, W / 2, 180);

    // garis pemisah
    ctx.strokeStyle = "#e7e5e4";
    ctx.beginPath();
    ctx.moveTo(80, 210);
    ctx.lineTo(W - 80, 210);
    ctx.stroke();

    // detail reservasi
    ctx.fillStyle = "#1c1917";
    ctx.font = "600 16px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(outletName(outlet) || "-", W / 2, 246);

    ctx.fillStyle = "#57534e";
    ctx.font = "14px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(`${selectedDate} ${MONTHS[monthIndex]} 2026 · ${session || "-"}`, W / 2, 270);
    ctx.fillText(`Atas nama: ${form.name || "-"} · ${form.pax || "-"} orang`, W / 2, 292);

    // footer note
    ctx.fillStyle = "#a8a29e";
    ctx.font = "12px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("Tunjukkan kode ini ke staff saat tiba di outlet", W / 2, 340);

    const link = document.createElement("a");
    link.download = `booking-${bookingCode}.png`;
    link.href = canvas.toDataURL("image/png");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handlePickDate(d) {
    const status = dayStatus(monthIndex, d);
    setSelectedDate(d);
    setSession(null);
    if (status === "penuh") return;
  }

  function handlePay() {
    setPaying(true);
    setSaveError("");
    (async () => {
      try {
        const code = "IMR-" + Math.floor(1000 + Math.random() * 9000);
        const dateKey = dateKeyOf(monthIndex, selectedDate);

        const { data: reservation, error: resError } = await supabase
          .from("reservations")
          .insert({
            booking_code: code,
            outlet_id: outlet,
            customer_name: form.name,
            customer_whatsapp: form.wa,
            pax: Number(form.pax),
            reservation_date: dateKey,
            session: session,
            status: "pending",
            payment_method: paymentMethod,
            payment_status: paymentMethod === "qris" ? "paid" : "unpaid",
            total_amount: discountedTotal,
            paid_amount: paymentMethod === "qris" ? minPayment : 0,
          })
          .select()
          .single();

        if (resError) throw resError;

        // Kunci voucher secara resmi sekarang (baru terhitung "terpakai" setelah
        // reservasi benar-benar tersimpan, bukan cuma saat preview/cek voucher)
        if (voucherApplied) {
          const { data: redeemData } = await supabase.rpc("redeem_voucher", {
            p_code: voucherApplied.code,
            p_reservation_id: reservation.id,
            p_subtotal: total,
          });
          const redeemResult = Array.isArray(redeemData) ? redeemData[0] : redeemData;
          if (!redeemResult?.success) {
            console.warn("Voucher gagal dikunci saat pembayaran:", redeemResult?.message);
          }
        }

        const items = MENUS.filter((m) => menuQty[m.id] > 0).map((m) => ({
          reservation_id: reservation.id,
          menu_id: m.id,
          quantity: menuQty[m.id],
          price_at_order: m.price,
        }));
        if (items.length > 0) {
          const { error: itemsError } = await supabase.from("reservation_items").insert(items);
          if (itemsError) throw itemsError;
        }

        const { error: paymentError } = await supabase.from("payments").insert({
          reservation_id: reservation.id,
          amount: minPayment,
          method: paymentMethod,
          status: paymentMethod === "qris" ? "success" : "pending",
        });
        if (paymentError) throw paymentError;

        setBookingCode(code);
        setPaying(false);
        setPaid(true);
        setTimeout(goNext, 700);
      } catch (err) {
        console.error(err);
        setSaveError("Gagal menyimpan reservasi. Coba lagi ya — " + (err.message || ""));
        setPaying(false);
      }
    })();
  }

  return (
    <div className="min-h-screen w-full" style={{ ...body, background: "#FAF8F3" }}>
      <style>{FONT_IMPORT}</style>

      <header className="bg-emerald-950 text-stone-50">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center">
              <Moon className="w-4 h-4 text-emerald-950" fill="currentColor" />
              <Star className="w-2.5 h-2.5 text-emerald-950 absolute -top-0.5 -right-0.5" fill="currentColor" />
            </div>
            <div>
              <p className="text-lg leading-none" style={display}>Imperial</p>
              <p className="text-[11px] text-emerald-300 tracking-wide">imreservation.com</p>
            </div>
          </div>
          <p className="text-[11px] text-emerald-300 hidden sm:block">
            Reservasi Ramadan &amp; Lebaran 2026
          </p>
        </div>
        <div
          className="h-1.5 w-full"
          style={{
            backgroundImage: "radial-gradient(circle, #EAB308 1.5px, transparent 1.5px)",
            backgroundSize: "10px 10px",
            backgroundColor: "#065f46",
          }}
        />
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <ProgressRail step={step} />

        {step === 1 && (
          <div>
            <p className="text-xs tracking-[0.15em] text-amber-600 font-semibold mb-2" style={body}>LANGKAH 1</p>
            <h1 className="text-3xl text-emerald-950 mb-2" style={display}>Pilih outlet Anda</h1>
            <p className="text-stone-500 text-sm mb-5">Tersedia untuk buka puasa bersama dan momen Idul Fitri.</p>

            <div className="relative mb-2">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                value={outletQuery}
                onChange={(e) => setOutletQuery(e.target.value)}
                placeholder="Cari nama outlet atau kota..."
                className="w-full rounded-full border border-stone-300 bg-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <p className="text-xs text-stone-400 mb-4">
              {loadingOutlets ? "Memuat daftar outlet..." : `${filteredOutlets.length} outlet di ${cityList.length} kota`}
            </p>

            {outletsError && (
              <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3">
                <p className="text-sm text-rose-700 font-medium mb-0.5">Gagal memuat outlet dari database</p>
                <p className="text-xs text-rose-600">{outletsError}</p>
                <p className="text-xs text-rose-400 mt-1">Menampilkan outlet bawaan sementara. Cek tabel "outlets" dan RLS policy SELECT di Supabase.</p>
              </div>
            )}

            <div className="max-h-[560px] overflow-y-auto pr-1 -mr-1">
              {cityList.map((city) => {
                const list = outletsByCity[city];
                const isOpen = isSearching || expandedCities.has(city);
                return (
                  <div key={city} className="border border-stone-200 rounded-xl bg-white mb-3 overflow-hidden">
                    <button
                      onClick={() => toggleCity(city)}
                      className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-stone-50 transition-colors"
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold text-emerald-950">
                        <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                        {city}
                        <span className="text-xs font-normal text-stone-400">({list.length})</span>
                      </span>
                      <ChevronDown
                        className={
                          "w-4 h-4 text-stone-400 transition-transform shrink-0 " +
                          (isOpen ? "rotate-180" : "")
                        }
                      />
                    </button>
                    {isOpen && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 px-4 pb-4 pt-1 border-t border-stone-100">
                        {list.map((o) => (
                          <button key={o.id} onClick={() => { setOutlet(o.id); goNext(); }} className="text-left">
                            <Card className="p-3.5 h-full hover:border-emerald-800 hover:shadow-md transition-all">
                              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center mb-2">
                                <Store className="w-3.5 h-3.5 text-emerald-800" />
                              </div>
                              <p className="font-semibold text-emerald-950 text-sm leading-snug">{o.name}</p>
                            </Card>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {!loadingOutlets && cityList.length === 0 && (
                <p className="text-sm text-stone-400 text-center py-12">
                  Tidak ada outlet yang cocok dengan "{outletQuery}".
                </p>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <p className="text-xs tracking-[0.15em] text-amber-600 font-semibold mb-2" style={body}>LANGKAH 2</p>
            <h1 className="text-3xl text-emerald-950 mb-2" style={display}>Isi data reservasi</h1>
            <p className="text-stone-500 text-sm mb-8">
              Outlet dipilih: <span className="font-semibold text-emerald-900">{outletName(outlet)}</span>
            </p>
            <Card className="p-6 max-w-md">
              <label className="block text-xs font-semibold text-stone-600 mb-1.5">Nama lengkap</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nama Anda"
                className={
                  "w-full rounded-lg border px-3 py-2.5 text-sm mb-1 focus:outline-none focus:ring-2 " +
                  (form.name.trim() ? "border-stone-300 focus:ring-amber-400" : "border-amber-300 focus:ring-amber-400")
                }
              />
              {!form.name.trim() && (
                <p className="text-[11px] text-amber-600 mb-3">Isi nama lengkap terlebih dahulu sebelum melanjutkan.</p>
              )}
              <label className={"block text-xs font-semibold mb-1.5 mt-3 " + (form.name.trim() ? "text-stone-600" : "text-stone-300")}>Jumlah tamu</label>
              <input
                value={form.pax}
                onChange={(e) => setForm({ ...form, pax: e.target.value.replace(/\D/g, "") })}
                placeholder="1"
                inputMode="numeric"
                disabled={!form.name.trim()}
                className={
                  "w-full rounded-lg border px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-amber-400 " +
                  (form.name.trim() ? "border-stone-300 bg-white" : "border-stone-200 bg-stone-50 text-stone-300 cursor-not-allowed")
                }
              />
              <label className={"block text-xs font-semibold mb-1.5 " + (form.name.trim() ? "text-stone-600" : "text-stone-300")}>Nomor WhatsApp</label>
              <div className="flex gap-2 mb-2">
                <input
                  value={form.wa}
                  onChange={(e) => setForm({ ...form, wa: e.target.value.replace(/\D/g, "") })}
                  placeholder="0812xxxxxxxx"
                  inputMode="numeric"
                  disabled={!form.name.trim()}
                  className={
                    "flex-1 rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 " +
                    (form.name.trim() ? "border-stone-300 bg-white" : "border-stone-200 bg-stone-50 text-stone-300 cursor-not-allowed")
                  }
                />
                <button
                  onClick={() => setOtpSent(true)}
                  disabled={!form.name.trim() || form.wa.length < 8}
                  title={!form.name.trim() ? "Isi nama lengkap terlebih dahulu" : undefined}
                  className={"px-3 rounded-lg text-xs font-semibold whitespace-nowrap " + (!form.name.trim() || form.wa.length < 8 ? "bg-stone-100 text-stone-400 cursor-not-allowed" : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100")}
                >
                  Kirim OTP
                </button>
              </div>
              {otpSent && !otpVerified && (
                <div className="mt-3 flex items-center gap-2">
                  <input maxLength={4} placeholder="Kode OTP" className="w-28 rounded-lg border border-stone-300 px-3 py-2 text-sm tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-400" onChange={(e) => e.target.value.length === 4 && setOtpVerified(true)} />
                  <span className="text-[11px] text-stone-400 flex items-center gap-1"><MessageCircle className="w-3 h-3" /> dikirim ke WhatsApp Anda</span>
                </div>
              )}
              {otpVerified && (
                <p className="mt-3 text-xs text-emerald-700 flex items-center gap-1.5 font-medium"><ShieldCheck className="w-4 h-4" /> Nomor WhatsApp terverifikasi</p>
              )}

              {checkingExisting && (
                <p className="mt-3 text-[11px] text-stone-400">Memeriksa riwayat reservasi...</p>
              )}
              {!checkingExisting && existingBookings.length > 0 && (
                <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
                  <p className="text-sm text-amber-800 font-medium mb-1.5 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> Nama & nomor ini sudah pernah reservasi
                  </p>
                  <ul className="text-xs text-amber-700 space-y-1 mb-1.5">
                    {existingBookings.map((b) => (
                      <li key={b.booking_code}>
                        <span className="font-mono">{b.booking_code}</span> · {b.reservation_date} · {b.session} · {outletName(b.outlet_id) || b.outlet_id}
                      </li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-amber-600">Kalau ini memang reservasi baru (tanggal/outlet berbeda), silakan lanjutkan seperti biasa.</p>
                </div>
              )}
            </Card>
            <div className="flex gap-3 mt-8">
              <button onClick={goBack} className="text-sm text-stone-500 flex items-center gap-1 px-2"><ArrowLeft className="w-4 h-4" /> Kembali</button>
              <PrimaryButton onClick={goNext} disabled={!form.name || !form.pax || !otpVerified}>Lanjutkan <ArrowRight className="w-4 h-4" /></PrimaryButton>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <p className="text-xs tracking-[0.15em] text-amber-600 font-semibold mb-2" style={body}>LANGKAH 3</p>
            <h1 className="text-3xl text-emerald-950 mb-2" style={display}>Cek ketersediaan slot</h1>
            <p className="text-stone-500 text-sm mb-1">
              Pilih tanggal dan sesi. Tanggal penuh akan otomatis ditandai.
              {loadingAvailability && <span className="text-amber-600"> · Memuat ketersediaan...</span>}
            </p>
            <p className="text-[11px] text-stone-400 mb-6">Kuota reservasi {outletName(outlet) || "outlet ini"}: maksimal {dailyCapacity} reservasi/hari.</p>
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => { setMonthIndex((m) => Math.max(0, m - 1)); setSelectedDate(null); }} className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center"><ChevronLeft className="w-4 h-4 text-stone-500" /></button>
                <p className="font-semibold text-emerald-950 text-sm">{MONTHS[monthIndex]} 2026</p>
                <button onClick={() => { setMonthIndex((m) => Math.min(11, m + 1)); setSelectedDate(null); }} className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center"><ChevronRight className="w-4 h-4 text-stone-500" /></button>
              </div>
              <div className="grid grid-cols-7 gap-1.5 text-center mb-1">
                {["M", "S", "S", "R", "K", "J", "S"].map((d, i) => (<span key={i} className="text-[10px] text-stone-400 font-medium">{d}</span>))}
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: firstDow }).map((_, i) => (<div key={"empty" + i} />))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const d = i + 1;
                  const status = dayStatus(monthIndex, d);
                  const isSelected = selectedDate === d;
                  const colors = {
                    tersedia: isSelected ? "bg-emerald-800 text-white" : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
                    terbatas: isSelected ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-700 hover:bg-amber-100",
                    penuh: "bg-rose-50 text-rose-300 cursor-not-allowed line-through",
                  };
                  return (
                    <button key={d} onClick={() => status !== "penuh" && handlePickDate(d)} disabled={status === "penuh"} className={"aspect-square rounded-lg text-xs font-medium transition-colors " + colors[status]}>{d}</button>
                  );
                })}
              </div>
              <div className="flex gap-4 mt-4 pt-4 border-t border-stone-100">
                <span className="text-[11px] text-stone-500 flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-100" /> Tersedia</span>
                <span className="text-[11px] text-stone-500 flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-100" /> Terbatas</span>
                <span className="text-[11px] text-stone-500 flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-rose-100" /> Penuh</span>
              </div>
            </Card>

            {selectedStatus === "penuh" && (
              <div className="mt-4 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 flex items-start gap-2.5">
                <X className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                <p className="text-sm text-rose-700">Tanggal ini sudah <strong>penuh</strong>. Silakan pilih tanggal lain yang masih tersedia pada kalender di atas.</p>
              </div>
            )}
            {selectedDate && selectedStatus !== "penuh" && (
              <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
                <p className="text-sm text-emerald-800 flex items-center gap-2 mb-3 font-medium"><Check className="w-4 h-4" /> {selectedDate} {MONTHS[monthIndex]} 2026 masih tersedia</p>

                <p className="text-[11px] text-emerald-700 font-medium mb-2">Pilih jam cepat</p>
                <div className="flex gap-2 flex-wrap mb-3">
                  {QUICK_TIMES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setSession(t)}
                      className={
                        "text-xs px-3 py-2 rounded-full border font-medium transition-colors " +
                        (session === t
                          ? "bg-emerald-800 text-white border-emerald-800"
                          : "bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50")
                      }
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <p className="text-[11px] text-emerald-700 font-medium mb-1.5">Atau isi jam sendiri ({OPENING_TIME} — {CLOSING_TIME})</p>
                <input
                  type="time"
                  value={QUICK_TIMES.includes(session) ? "" : session || ""}
                  min={OPENING_TIME}
                  max={CLOSING_TIME}
                  onChange={(e) => setSession(e.target.value)}
                  className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <p className="text-[11px] text-emerald-600 mt-2">
                  {session ? <>Jam dipilih: <strong>{session}</strong></> : "Belum ada jam yang dipilih."}
                </p>
              </div>
            )}
            <div className="flex gap-3 mt-8">
              <button onClick={goBack} className="text-sm text-stone-500 flex items-center gap-1 px-2"><ArrowLeft className="w-4 h-4" /> Kembali</button>
              <PrimaryButton onClick={goNext} disabled={!selectedDate || !session}>Lanjutkan <ArrowRight className="w-4 h-4" /></PrimaryButton>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <p className="text-xs tracking-[0.15em] text-amber-600 font-semibold mb-2" style={body}>LANGKAH 4</p>
            <h1 className="text-3xl text-emerald-950 mb-2" style={display}>Pilih menu</h1>
            <p className="text-stone-500 text-sm mb-6">{selectedDate} {MONTHS[monthIndex]} 2026 · {session}</p>
            <div className="space-y-3">
              {MENUS.map((m) => {
                const qty = menuQty[m.id] || 0;
                return (
                  <Card key={m.id} className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-emerald-950 text-sm">{m.name}</p>
                      <p className="text-xs text-stone-500 mb-1">{m.desc}</p>
                      <p className="text-sm text-amber-700 font-semibold">{rupiah(m.price)}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <button onClick={() => setMenuQty({ ...menuQty, [m.id]: Math.max(0, qty - 1) })} className="w-7 h-7 rounded-full bg-stone-100 text-stone-600 font-semibold">−</button>
                      <span className="w-4 text-center text-sm font-medium">{qty}</span>
                      <button onClick={() => setMenuQty({ ...menuQty, [m.id]: qty + 1 })} className="w-7 h-7 rounded-full bg-emerald-900 text-amber-300 font-semibold">+</button>
                    </div>
                  </Card>
                );
              })}
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={goBack} className="text-sm text-stone-500 flex items-center gap-1 px-2"><ArrowLeft className="w-4 h-4" /> Kembali</button>
              <PrimaryButton onClick={goNext} disabled={total === 0}>Lanjutkan · {rupiah(total)} <ArrowRight className="w-4 h-4" /></PrimaryButton>
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <p className="text-xs tracking-[0.15em] text-amber-600 font-semibold mb-2" style={body}>LANGKAH 5</p>
            <h1 className="text-3xl text-emerald-950 mb-2" style={display}>Pembayaran</h1>
            <p className="text-stone-500 text-sm mb-6">Deposit minimal 50% untuk mengunci reservasi Anda.</p>

            <div className="grid grid-cols-2 gap-3 max-w-md mb-4">
              <button onClick={() => setPaymentMethod("qris")} className={"flex items-center gap-2.5 rounded-xl border px-4 py-3 text-left transition-colors " + (paymentMethod === "qris" ? "border-emerald-800 bg-emerald-50" : "border-stone-200 bg-white hover:border-stone-300")}>
                <QrCode className={"w-5 h-5 " + (paymentMethod === "qris" ? "text-emerald-800" : "text-stone-400")} />
                <div><p className="text-sm font-semibold text-emerald-950">QRIS</p><p className="text-[11px] text-stone-500">Bayar sekarang</p></div>
              </button>
            </div>

            <Card className="p-4 max-w-md mb-4">
              <p className="text-xs font-semibold text-stone-600 mb-2">Punya kode voucher?</p>
              {voucherApplied ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5">
                  <div>
                    <p className="text-sm font-semibold text-emerald-800 flex items-center gap-1.5">
                      <Ticket className="w-3.5 h-3.5" /> {voucherApplied.code}
                      <span className="text-[10px] font-normal bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                        {voucherApplied.voucher_type === "physical" ? "Voucher fisik" : "Voucher elektronik"}
                      </span>
                    </p>
                    <p className="text-xs text-emerald-700">Potongan {rupiah(voucherApplied.discount_amount)}</p>
                  </div>
                  <button onClick={removeVoucher} className="text-xs text-stone-400 hover:text-rose-500 underline">Hapus</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={voucherInput}
                    onChange={(e) => { setVoucherInput(e.target.value.toUpperCase()); setVoucherError(""); }}
                    placeholder="Masukkan kode voucher"
                    className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm tracking-wide focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <button
                    onClick={applyVoucher}
                    disabled={!voucherInput.trim() || voucherChecking}
                    className={"px-4 rounded-lg text-xs font-semibold whitespace-nowrap " + (!voucherInput.trim() || voucherChecking ? "bg-stone-100 text-stone-400" : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100")}
                  >
                    {voucherChecking ? "Mengecek..." : "Terapkan"}
                  </button>
                </div>
              )}
              {voucherError && <p className="text-xs text-rose-500 mt-2">{voucherError}</p>}
            </Card>

            <Card className="p-6 max-w-md">
              <div className="flex justify-between text-sm text-stone-500 mb-2"><span>Total pesanan</span><span>{rupiah(total)}</span></div>
              {voucherApplied && (
                <div className="flex justify-between text-sm text-emerald-700 mb-2">
                  <span>Potongan voucher</span><span>− {rupiah(voucherApplied.discount_amount)}</span>
                </div>
              )}
              <div className="h-px bg-stone-100 my-3" />
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-medium text-stone-700">
                  Dibayar sekarang{voucherApplied ? " (sudah dipotong voucher)" : " (50%)"}
                </span>
                <span className="text-2xl font-semibold text-emerald-950" style={display}>{rupiah(minPayment)}</span>
              </div>
              <p className="text-[11px] text-stone-400 mb-1">
                Sisa {rupiah(discountedTotal - minPayment)} dibayar di outlet saat hari-H.
              </p>

              {!paymentMethod && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">Pilih metode pembayaran di atas terlebih dahulu.</p>
              )}
              {saveError && (
                <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 mt-3">{saveError}</p>
              )}
              {paymentMethod === "qris" && (
                <>
                  <p className="text-[11px] text-stone-400 mb-4">Scan kode QRIS berikut menggunakan e-wallet atau mobile banking Anda.</p>
                  <div className="mx-auto w-40 h-40 rounded-xl bg-white border border-stone-200 flex items-center justify-center mb-4">
                    <div className="w-32 h-32" style={{ backgroundImage: "repeating-linear-gradient(0deg, #052e1f 0 3px, transparent 3px 6px), repeating-linear-gradient(90deg, #052e1f 0 3px, transparent 3px 6px)", backgroundBlendMode: "multiply", opacity: 0.85 }} />
                  </div>
                  <PrimaryButton onClick={handlePay} disabled={paying || paid} className="w-full">
                    {paid ? (<><Check className="w-4 h-4" /> Pembayaran berhasil</>) : paying ? "Memeriksa pembayaran..." : (<><QrCode className="w-4 h-4" /> Saya sudah membayar</>)}
                  </PrimaryButton>
                </>
              )}
            </Card>
            <div className="flex gap-3 mt-8">
              <button onClick={goBack} className="text-sm text-stone-500 flex items-center gap-1 px-2"><ArrowLeft className="w-4 h-4" /> Kembali</button>
            </div>
          </div>
        )}

        {step === 6 && (
          <div>
            <p className="text-xs tracking-[0.15em] text-amber-600 font-semibold mb-2" style={body}>LANGKAH 6</p>
            <h1 className="text-3xl text-emerald-950 mb-2" style={display}>Reservasi Anda siap</h1>
            <p className="text-stone-500 text-sm mb-6">Kode booking dikirim ke WhatsApp yang Anda daftarkan. Tunjukkan kode ini ke staff saat tiba di outlet.</p>

            <div className="max-w-sm">
              <div className="bg-[#DCF3E3] rounded-2xl rounded-tl-sm p-4 mb-4">
                <p className="text-xs text-emerald-700 font-semibold mb-1 flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5" /> Imperial Reservation</p>
                <p className="text-sm text-stone-800">
                  Halo {form.name || "Tamu"}, reservasi Anda di {outletName(outlet)} pada {selectedDate} {MONTHS[monthIndex]} 2026 ({session}) berhasil dikonfirmasi.
                </p>
              </div>
              <Card className="p-6 text-center">
                <QrCode className="w-16 h-16 mx-auto text-emerald-900 mb-3" />
                <p className="text-[11px] text-stone-400 mb-1">Kode booking</p>
                <p className="text-2xl font-semibold tracking-[0.15em] text-emerald-900" style={display}>{bookingCode}</p>
              </Card>

              <button
                onClick={downloadBookingCard}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold bg-emerald-900 text-amber-300 hover:bg-emerald-800 active:scale-[0.98] transition-all"
                style={body}
              >
                <Download className="w-4 h-4" /> Download kode booking
              </button>

              <button
                onClick={resetBooking}
                className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold border border-emerald-800 text-emerald-800 hover:bg-emerald-50 transition-colors"
                style={body}
              >
                <Store className="w-4 h-4" /> Kembali ke tampilan awal
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-3xl mx-auto px-6 pb-10 pt-4 flex items-center justify-between text-[11px] text-stone-400">
        <span className="flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> Imperial Reservation — Aplikasi Pelanggan</span>
        <a href="/staff" className="hover:text-stone-600 underline underline-offset-2">Masuk sebagai staff</a>
      </footer>
    </div>
  );
}