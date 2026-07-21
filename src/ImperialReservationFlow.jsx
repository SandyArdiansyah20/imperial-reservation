import { useState, useMemo } from "react";
import {
  Store,
  MessageCircle,
  ShieldCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
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
} from "lucide-react";

const FONT_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');";

const display = { fontFamily: "'Fraunces', serif" };
const body = { fontFamily: "'Plus Jakarta Sans', sans-serif" };

const OUTLETS = [
  { id: "kemang", name: "Imperial Kemang", city: "Jakarta Selatan" },
  { id: "bsd", name: "Imperial BSD", city: "Tangerang Selatan" },
  { id: "pik", name: "Imperial PIK", city: "Jakarta Utara" },
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
  { label: "Check-in", icon: QrCode },
];

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function dayStatus(monthIndex, day) {
  const dow = new Date(2026, monthIndex, day).getDay();
  if (monthIndex === 2 && day >= 20) return "penuh";
  if (monthIndex === 3 && day <= 10) return "penuh";
  if (dow === 0 || dow === 6) return "terbatas";
  return "tersedia";
}

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

export default function ImperialReservationFlow() {
  const [step, setStep] = useState(1);
  const [outlet, setOutlet] = useState(null);
  const [form, setForm] = useState({ name: "", pax: "", wa: "" });
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [monthIndex, setMonthIndex] = useState(2); // start at Maret (Ramadan)
  const [selectedDate, setSelectedDate] = useState(null);
  const [session, setSession] = useState(null);
  const [menuQty, setMenuQty] = useState({});
  const [paymentMethod, setPaymentMethod] = useState(null); // 'qris' | 'cash'
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [bookingCode] = useState("IMR-" + Math.floor(1000 + Math.random() * 9000));
  const [staffView, setStaffView] = useState(false);
  const [staffCodeInput, setStaffCodeInput] = useState("");
  const [checkedIn, setCheckedIn] = useState(false);

  const total = useMemo(
    () =>
      MENUS.reduce((sum, m) => sum + (menuQty[m.id] || 0) * m.price, 0),
    [menuQty]
  );
  const minPayment = Math.round(total * 0.5);

  const daysInMonth = new Date(2026, monthIndex + 1, 0).getDate();
  const firstDow = new Date(2026, monthIndex, 1).getDay();

  const selectedStatus = selectedDate ? dayStatus(monthIndex, selectedDate) : null;

  function goNext() {
    setStep((s) => Math.min(s + 1, 7));
  }
  function goBack() {
    setStep((s) => Math.max(s - 1, 1));
  }

  function handlePickDate(d) {
    const status = dayStatus(monthIndex, d);
    setSelectedDate(d);
    setSession(null);
    if (status === "penuh") return;
  }

  function handlePay() {
    setPaying(true);
    setTimeout(() => {
      setPaying(false);
      setPaid(true);
      setTimeout(goNext, 700);
    }, 1100);
  }

  return (
    <div className="min-h-screen w-full" style={{ ...body, background: "#FAF8F3" }}>
      <style>{FONT_IMPORT}</style>

      {/* Header */}
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
            backgroundImage:
              "radial-gradient(circle, #EAB308 1.5px, transparent 1.5px)",
            backgroundSize: "10px 10px",
            backgroundColor: "#065f46",
          }}
        />
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <ProgressRail step={step} />

        {/* STEP 1: Outlet */}
        {step === 1 && (
          <div>
            <p className="text-xs tracking-[0.15em] text-amber-600 font-semibold mb-2" style={body}>
              LANGKAH 1
            </p>
            <h1 className="text-3xl text-emerald-950 mb-2" style={display}>
              Pilih outlet Anda
            </h1>
            <p className="text-stone-500 text-sm mb-8">
              Tersedia untuk buka puasa bersama dan momen Idul Fitri.
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              {OUTLETS.map((o) => (
                <button
                  key={o.id}
                  onClick={() => {
                    setOutlet(o.id);
                    goNext();
                  }}
                  className="text-left"
                >
                  <Card className="p-5 h-full hover:border-emerald-800 hover:shadow-md transition-all">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                      <Store className="w-5 h-5 text-emerald-800" />
                    </div>
                    <p className="font-semibold text-emerald-950 text-sm mb-0.5">{o.name}</p>
                    <p className="text-xs text-stone-500">{o.city}</p>
                  </Card>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Registration */}
        {step === 2 && (
          <div>
            <p className="text-xs tracking-[0.15em] text-amber-600 font-semibold mb-2" style={body}>
              LANGKAH 2
            </p>
            <h1 className="text-3xl text-emerald-950 mb-2" style={display}>
              Isi data reservasi
            </h1>
            <p className="text-stone-500 text-sm mb-8">
              Outlet dipilih: <span className="font-semibold text-emerald-900">{OUTLETS.find((o) => o.id === outlet)?.name}</span>
            </p>
            <Card className="p-6 max-w-md">
              <label className="block text-xs font-semibold text-stone-600 mb-1.5">Nama lengkap</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nama Anda"
                className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <label className="block text-xs font-semibold text-stone-600 mb-1.5">Jumlah tamu</label>
              <input
                value={form.pax}
                onChange={(e) => setForm({ ...form, pax: e.target.value.replace(/\D/g, "") })}
                placeholder="4"
                inputMode="numeric"
                className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <label className="block text-xs font-semibold text-stone-600 mb-1.5">Nomor WhatsApp</label>
              <div className="flex gap-2 mb-2">
                <input
                  value={form.wa}
                  onChange={(e) => setForm({ ...form, wa: e.target.value.replace(/\D/g, "") })}
                  placeholder="0812xxxxxxxx"
                  inputMode="numeric"
                  className="flex-1 rounded-lg border border-stone-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <button
                  onClick={() => setOtpSent(true)}
                  disabled={form.wa.length < 8}
                  className={
                    "px-3 rounded-lg text-xs font-semibold whitespace-nowrap " +
                    (form.wa.length < 8
                      ? "bg-stone-100 text-stone-400"
                      : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100")
                  }
                >
                  Kirim OTP
                </button>
              </div>

              {otpSent && !otpVerified && (
                <div className="mt-3 flex items-center gap-2">
                  <input
                    maxLength={4}
                    placeholder="Kode OTP"
                    className="w-28 rounded-lg border border-stone-300 px-3 py-2 text-sm tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-400"
                    onChange={(e) => e.target.value.length === 4 && setOtpVerified(true)}
                  />
                  <span className="text-[11px] text-stone-400 flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" /> dikirim ke WhatsApp Anda
                  </span>
                </div>
              )}
              {otpVerified && (
                <p className="mt-3 text-xs text-emerald-700 flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-4 h-4" /> Nomor WhatsApp terverifikasi
                </p>
              )}
            </Card>

            <div className="flex gap-3 mt-8">
              <button onClick={goBack} className="text-sm text-stone-500 flex items-center gap-1 px-2">
                <ArrowLeft className="w-4 h-4" /> Kembali
              </button>
              <PrimaryButton
                onClick={goNext}
                disabled={!form.name || !form.pax || !otpVerified}
              >
                Lanjutkan <ArrowRight className="w-4 h-4" />
              </PrimaryButton>
            </div>
          </div>
        )}

        {/* STEP 3: Slot availability */}
        {step === 3 && (
          <div>
            <p className="text-xs tracking-[0.15em] text-amber-600 font-semibold mb-2" style={body}>
              LANGKAH 3
            </p>
            <h1 className="text-3xl text-emerald-950 mb-2" style={display}>
              Cek ketersediaan slot
            </h1>
            <p className="text-stone-500 text-sm mb-6">
              Pilih tanggal dan sesi. Tanggal penuh akan otomatis ditandai.
            </p>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => {
                    setMonthIndex((m) => Math.max(0, m - 1));
                    setSelectedDate(null);
                  }}
                  className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center"
                >
                  <ChevronLeft className="w-4 h-4 text-stone-500" />
                </button>
                <p className="font-semibold text-emerald-950 text-sm">{MONTHS[monthIndex]} 2026</p>
                <button
                  onClick={() => {
                    setMonthIndex((m) => Math.min(11, m + 1));
                    setSelectedDate(null);
                  }}
                  className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center"
                >
                  <ChevronRight className="w-4 h-4 text-stone-500" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1.5 text-center mb-1">
                {["M", "S", "S", "R", "K", "J", "S"].map((d, i) => (
                  <span key={i} className="text-[10px] text-stone-400 font-medium">{d}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: firstDow }).map((_, i) => (
                  <div key={"empty" + i} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const d = i + 1;
                  const status = dayStatus(monthIndex, d);
                  const isSelected = selectedDate === d;
                  const colors = {
                    tersedia: isSelected
                      ? "bg-emerald-800 text-white"
                      : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
                    terbatas: isSelected
                      ? "bg-amber-500 text-white"
                      : "bg-amber-50 text-amber-700 hover:bg-amber-100",
                    penuh: "bg-rose-50 text-rose-300 cursor-not-allowed line-through",
                  };
                  return (
                    <button
                      key={d}
                      onClick={() => status !== "penuh" && handlePickDate(d)}
                      disabled={status === "penuh"}
                      className={"aspect-square rounded-lg text-xs font-medium transition-colors " + colors[status]}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-4 mt-4 pt-4 border-t border-stone-100">
                <span className="text-[11px] text-stone-500 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-100" /> Tersedia
                </span>
                <span className="text-[11px] text-stone-500 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-100" /> Terbatas
                </span>
                <span className="text-[11px] text-stone-500 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-100" /> Penuh
                </span>
              </div>
            </Card>

            {selectedStatus === "penuh" && (
              <div className="mt-4 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 flex items-start gap-2.5">
                <X className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                <p className="text-sm text-rose-700">
                  Tanggal ini sudah <strong>penuh</strong>. Silakan pilih tanggal lain yang masih tersedia pada kalender di atas.
                </p>
              </div>
            )}

            {selectedDate && selectedStatus !== "penuh" && (
              <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
                <p className="text-sm text-emerald-800 flex items-center gap-2 mb-3 font-medium">
                  <Check className="w-4 h-4" /> {selectedDate} {MONTHS[monthIndex]} 2026 masih tersedia
                </p>
                <div className="flex gap-2 flex-wrap">
                  {["17:30 — Buka Puasa", "19:00 — Malam"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSession(s)}
                      className={
                        "text-xs px-3 py-2 rounded-full border font-medium transition-colors " +
                        (session === s
                          ? "bg-emerald-800 text-white border-emerald-800"
                          : "bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50")
                      }
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-8">
              <button onClick={goBack} className="text-sm text-stone-500 flex items-center gap-1 px-2">
                <ArrowLeft className="w-4 h-4" /> Kembali
              </button>
              <PrimaryButton onClick={goNext} disabled={!selectedDate || !session}>
                Lanjutkan <ArrowRight className="w-4 h-4" />
              </PrimaryButton>
            </div>
          </div>
        )}

        {/* STEP 4: Menu */}
        {step === 4 && (
          <div>
            <p className="text-xs tracking-[0.15em] text-amber-600 font-semibold mb-2" style={body}>
              LANGKAH 4
            </p>
            <h1 className="text-3xl text-emerald-950 mb-2" style={display}>
              Pilih menu
            </h1>
            <p className="text-stone-500 text-sm mb-6">
              {selectedDate} {MONTHS[monthIndex]} 2026 · {session}
            </p>

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
                      <button
                        onClick={() => setMenuQty({ ...menuQty, [m.id]: Math.max(0, qty - 1) })}
                        className="w-7 h-7 rounded-full bg-stone-100 text-stone-600 font-semibold"
                      >
                        −
                      </button>
                      <span className="w-4 text-center text-sm font-medium">{qty}</span>
                      <button
                        onClick={() => setMenuQty({ ...menuQty, [m.id]: qty + 1 })}
                        className="w-7 h-7 rounded-full bg-emerald-900 text-amber-300 font-semibold"
                      >
                        +
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={goBack} className="text-sm text-stone-500 flex items-center gap-1 px-2">
                <ArrowLeft className="w-4 h-4" /> Kembali
              </button>
              <PrimaryButton onClick={goNext} disabled={total === 0}>
                Lanjutkan · {rupiah(total)} <ArrowRight className="w-4 h-4" />
              </PrimaryButton>
            </div>
          </div>
        )}

        {/* STEP 5: Payment */}
        {step === 5 && (
          <div>
            <p className="text-xs tracking-[0.15em] text-amber-600 font-semibold mb-2" style={body}>
              LANGKAH 5
            </p>
            <h1 className="text-3xl text-emerald-950 mb-2" style={display}>
              Pembayaran
            </h1>
            <p className="text-stone-500 text-sm mb-6">
              Deposit minimal 50% untuk mengunci reservasi Anda.
            </p>

            <div className="grid grid-cols-2 gap-3 max-w-md mb-4">
              <button
                onClick={() => setPaymentMethod("qris")}
                className={
                  "flex items-center gap-2.5 rounded-xl border px-4 py-3 text-left transition-colors " +
                  (paymentMethod === "qris"
                    ? "border-emerald-800 bg-emerald-50"
                    : "border-stone-200 bg-white hover:border-stone-300")
                }
              >
                <QrCode className={"w-5 h-5 " + (paymentMethod === "qris" ? "text-emerald-800" : "text-stone-400")} />
                <div>
                  <p className="text-sm font-semibold text-emerald-950">QRIS</p>
                  <p className="text-[11px] text-stone-500">Bayar sekarang</p>
                </div>
              </button>
              <button
                onClick={() => setPaymentMethod("cash")}
                className={
                  "flex items-center gap-2.5 rounded-xl border px-4 py-3 text-left transition-colors " +
                  (paymentMethod === "cash"
                    ? "border-emerald-800 bg-emerald-50"
                    : "border-stone-200 bg-white hover:border-stone-300")
                }
              >
                <Banknote className={"w-5 h-5 " + (paymentMethod === "cash" ? "text-emerald-800" : "text-stone-400")} />
                <div>
                  <p className="text-sm font-semibold text-emerald-950">Bayar di Tempat</p>
                  <p className="text-[11px] text-stone-500">Tunai / EDC di outlet</p>
                </div>
              </button>
            </div>

            <Card className="p-6 max-w-md">
              <div className="flex justify-between text-sm text-stone-500 mb-2">
                <span>Total pesanan</span>
                <span>{rupiah(total)}</span>
              </div>
              <div className="h-px bg-stone-100 my-3" />
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-medium text-stone-700">Minimal dibayar (50%)</span>
                <span className="text-2xl font-semibold text-emerald-950" style={display}>
                  {rupiah(minPayment)}
                </span>
              </div>

              {!paymentMethod && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
                  Pilih metode pembayaran di atas terlebih dahulu.
                </p>
              )}

              {paymentMethod === "qris" && (
                <>
                  <p className="text-[11px] text-stone-400 mb-4">
                    Scan kode QRIS berikut menggunakan e-wallet atau mobile banking Anda.
                  </p>
                  <div className="mx-auto w-40 h-40 rounded-xl bg-white border border-stone-200 flex items-center justify-center mb-4">
                    <div
                      className="w-32 h-32"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(0deg, #052e1f 0 3px, transparent 3px 6px), repeating-linear-gradient(90deg, #052e1f 0 3px, transparent 3px 6px)",
                        backgroundBlendMode: "multiply",
                        opacity: 0.85,
                      }}
                    />
                  </div>
                  <PrimaryButton onClick={handlePay} disabled={paying || paid} className="w-full">
                    {paid ? (
                      <>
                        <Check className="w-4 h-4" /> Pembayaran berhasil
                      </>
                    ) : paying ? (
                      "Memeriksa pembayaran..."
                    ) : (
                      <>
                        <QrCode className="w-4 h-4" /> Saya sudah membayar
                      </>
                    )}
                  </PrimaryButton>
                </>
              )}

              {paymentMethod === "cash" && (
                <>
                  <p className="text-[11px] text-stone-400 mb-5">
                    Deposit dibayarkan tunai atau EDC langsung di outlet, maksimal 1 jam sebelum sesi dimulai. Slot tetap kami tahan sampai batas waktu tersebut.
                  </p>
                  <PrimaryButton onClick={handlePay} disabled={paying || paid} className="w-full">
                    {paid ? (
                      <>
                        <Check className="w-4 h-4" /> Reservasi dikonfirmasi
                      </>
                    ) : paying ? (
                      "Memproses..."
                    ) : (
                      <>
                        <Banknote className="w-4 h-4" /> Konfirmasi reservasi
                      </>
                    )}
                  </PrimaryButton>
                </>
              )}
            </Card>

            <div className="flex gap-3 mt-8">
              <button onClick={goBack} className="text-sm text-stone-500 flex items-center gap-1 px-2">
                <ArrowLeft className="w-4 h-4" /> Kembali
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: Booking code */}
        {step === 6 && (
          <div>
            <p className="text-xs tracking-[0.15em] text-amber-600 font-semibold mb-2" style={body}>
              LANGKAH 6
            </p>
            <h1 className="text-3xl text-emerald-950 mb-2" style={display}>
              Kode booking Anda
            </h1>
            <p className="text-stone-500 text-sm mb-6">
              Kode ini otomatis dikirim ke WhatsApp yang Anda daftarkan.
            </p>

            <div className="max-w-sm">
              <div className="bg-[#DCF3E3] rounded-2xl rounded-tl-sm p-4 mb-2">
                <p className="text-xs text-emerald-700 font-semibold mb-1 flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5" /> Imperial Reservation
                </p>
                <p className="text-sm text-stone-800 mb-3">
                  Halo {form.name || "Tamu"}, reservasi Anda di{" "}
                  {OUTLETS.find((o) => o.id === outlet)?.name} pada {selectedDate} {MONTHS[monthIndex]} 2026 ({session}) berhasil dikonfirmasi.
                </p>
                <div className="bg-white rounded-xl p-4 text-center border border-emerald-100">
                  <p className="text-[11px] text-stone-400 mb-1">Kode booking</p>
                  <p className="text-2xl font-semibold tracking-[0.15em] text-emerald-900" style={display}>
                    {bookingCode}
                  </p>
                </div>
                <p className="text-[11px] text-stone-500 mt-3">
                  Tunjukkan kode ini ke staff kami saat tiba di lokasi.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <PrimaryButton onClick={goNext}>
                Simulasikan hari-H <ArrowRight className="w-4 h-4" />
              </PrimaryButton>
            </div>
          </div>
        )}

        {/* STEP 7: Check-in */}
        {step === 7 && (
          <div>
            <p className="text-xs tracking-[0.15em] text-amber-600 font-semibold mb-2" style={body}>
              LANGKAH 7
            </p>
            <h1 className="text-3xl text-emerald-950 mb-2" style={display}>
              Check-in hari-H
            </h1>
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setStaffView(false)}
                className={"text-xs px-3 py-1.5 rounded-full font-medium " + (!staffView ? "bg-emerald-900 text-amber-300" : "bg-stone-100 text-stone-500")}
              >
                Tampilan tamu
              </button>
              <button
                onClick={() => setStaffView(true)}
                className={"text-xs px-3 py-1.5 rounded-full font-medium " + (staffView ? "bg-emerald-900 text-amber-300" : "bg-stone-100 text-stone-500")}
              >
                Tampilan staff
              </button>
            </div>

            {!staffView && (
              <Card className="p-6 max-w-sm text-center">
                <QrCode className="w-16 h-16 mx-auto text-emerald-900 mb-3" />
                <p className="text-xs text-stone-400 mb-1">Tunjukkan kode ini ke staff</p>
                <p className="text-2xl font-semibold tracking-[0.15em] text-emerald-900" style={display}>
                  {bookingCode}
                </p>
              </Card>
            )}

            {staffView && (
              <Card className="p-6 max-w-sm">
                {!checkedIn ? (
                  <>
                    <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                      Masukkan / scan kode booking
                    </label>
                    <input
                      value={staffCodeInput}
                      onChange={(e) => setStaffCodeInput(e.target.value.toUpperCase())}
                      placeholder={bookingCode}
                      className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm mb-4 tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <PrimaryButton
                      onClick={() => staffCodeInput === bookingCode && setCheckedIn(true)}
                      disabled={!staffCodeInput}
                      className="w-full"
                    >
                      Check-in tamu
                    </PrimaryButton>
                    {staffCodeInput && staffCodeInput !== bookingCode && (
                      <p className="text-xs text-rose-500 mt-2">Kode tidak cocok, coba lagi.</p>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-800 text-amber-300 flex items-center justify-center mx-auto mb-3">
                      <Check className="w-6 h-6" />
                    </div>
                    <p className="font-semibold text-emerald-950">Tamu berhasil check-in</p>
                    <p className="text-xs text-stone-500 mt-1">
                      {form.name || "Tamu"} · {form.pax || "-"} orang · {OUTLETS.find((o) => o.id === outlet)?.name}
                    </p>
                  </div>
                )}
              </Card>
            )}

            <div className="flex gap-3 mt-8">
              <button onClick={goBack} className="text-sm text-stone-500 flex items-center gap-1 px-2">
                <ArrowLeft className="w-4 h-4" /> Kembali
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-3xl mx-auto px-6 pb-10 pt-4 flex items-center gap-1.5 text-[11px] text-stone-400">
        <Sparkles className="w-3 h-3" /> Imperial Reservation
      </footer>
    </div>
  );
}