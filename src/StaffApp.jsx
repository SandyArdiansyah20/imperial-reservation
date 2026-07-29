import { useState, useMemo, useEffect } from "react";
import { supabase, supabaseConfigError } from "./supabaseClient.js";
import {
  Moon,
  Star,
  Search,
  Users,
  Clock,
  CheckCircle2,
  Circle,
  QrCode,
  Store,
  Filter,
  Lock,
  LogOut,
  CalendarDays,
  Trash2,
  Ticket,
  Plus,
  Power,
  Home,
} from "lucide-react";

const FONT_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');";

const display = { fontFamily: "'Fraunces', serif" };
const body = { fontFamily: "'Plus Jakarta Sans', sans-serif" };

// Kode akses staff. Untuk penggunaan nyata, sebaiknya diverifikasi lewat
// backend/API, bukan disimpan langsung di kode frontend seperti ini.
const STAFF_ACCESS_CODE = "IMP2026";

const OUTLETS = [
  { id: "kemang", name: "Imperial Kemang" },
  { id: "bsd", name: "Imperial BSD" },
  { id: "pik", name: "Imperial PIK" },
];

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function rupiah(n) {
  return "Rp" + Number(n || 0).toLocaleString("id-ID");
}

function Card({ children, className = "" }) {
  return (
    <div className={"bg-white rounded-2xl border border-stone-200 shadow-sm " + className}>
      {children}
    </div>
  );
}

const STATUS_META = {
  pending: { label: "Menunggu", dot: "bg-amber-400", text: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  "checked-in": { label: "Checked-in", dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  "no-show": { label: "No-show", dot: "bg-rose-400", text: "text-rose-700", bg: "bg-rose-50 border-rose-200" },
};

function StatCard({ label, value, sub, icon: Icon }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-4 flex items-start justify-between">
      <div>
        <p className="text-[11px] text-stone-500 mb-1">{label}</p>
        <p className="text-2xl font-semibold text-emerald-950" style={display}>{value}</p>
        {sub && <p className="text-[11px] text-stone-400 mt-0.5">{sub}</p>}
      </div>
      <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-emerald-800" />
      </div>
    </div>
  );
}

export default function StaffApp() {
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
  return <StaffAppInner />;
}

function StaffAppInner() {
  const [isAuthed, setIsAuthed] = useState(() => {
    try {
      return sessionStorage.getItem("imperial_staff_authed") === "true";
    } catch {
      return false;
    }
  });
  const [codeInput, setCodeInput] = useState("");
  const [authError, setAuthError] = useState("");

  const [reservations, setReservations] = useState([]);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [dateFilter, setDateFilter] = useState(todayISO());
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [outletFilter, setOutletFilter] = useState("all");

  const [activeTab, setActiveTab] = useState("reservasi"); // 'reservasi' | 'voucher'

  const [vouchers, setVouchers] = useState([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [voucherListError, setVoucherListError] = useState("");
  const [vForm, setVForm] = useState({
    code: "",
    type: "electronic",
    discount_type: "percentage",
    discount_value: "",
    min_purchase: "",
    max_uses: "1",
    expires_at: "",
  });
  const [creatingVoucher, setCreatingVoucher] = useState(false);
  const [createVoucherError, setCreateVoucherError] = useState("");
  const [createVoucherSuccess, setCreateVoucherSuccess] = useState("");

  useEffect(() => {
    if (!isAuthed || activeTab !== "voucher") return;
    let cancelled = false;
    async function loadVouchers() {
      setLoadingVouchers(true);
      setVoucherListError("");
      const { data, error } = await supabase
        .from("vouchers")
        .select("*")
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (error) {
        console.error(error);
        setVoucherListError("Gagal memuat daftar voucher.");
      } else {
        setVouchers(data || []);
      }
      setLoadingVouchers(false);
    }
    loadVouchers();
    return () => { cancelled = true; };
  }, [isAuthed, activeTab]);

  async function createVoucher(e) {
    e.preventDefault();
    setCreateVoucherError("");
    setCreateVoucherSuccess("");

    if (!vForm.code.trim() || !vForm.discount_value) {
      setCreateVoucherError("Kode voucher dan nilai potongan wajib diisi.");
      return;
    }

    setCreatingVoucher(true);
    const { data, error } = await supabase
      .from("vouchers")
      .insert({
        code: vForm.code.trim().toUpperCase(),
        type: vForm.type,
        discount_type: vForm.discount_type,
        discount_value: Number(vForm.discount_value),
        min_purchase: Number(vForm.min_purchase || 0),
        max_uses: Number(vForm.max_uses || 1),
        expires_at: vForm.expires_at || null,
      })
      .select()
      .single();
    setCreatingVoucher(false);

    if (error) {
      setCreateVoucherError(
        error.code === "23505" ? "Kode voucher ini sudah ada, pakai kode lain." : "Gagal membuat voucher: " + error.message
      );
      return;
    }

    setVouchers((prev) => [data, ...prev]);
    setCreateVoucherSuccess(`Voucher "${data.code}" berhasil dibuat.`);
    setVForm({ code: "", type: "electronic", discount_type: "percentage", discount_value: "", min_purchase: "", max_uses: "1", expires_at: "" });
  }

  async function toggleVoucherActive(v) {
    const { error } = await supabase
      .from("vouchers")
      .update({ is_active: !v.is_active })
      .eq("id", v.id);
    if (error) {
      console.error(error);
      return;
    }
    setVouchers((prev) => prev.map((x) => (x.id === v.id ? { ...x, is_active: !x.is_active } : x)));
  }

  useEffect(() => {
    if (!isAuthed) return;
    let cancelled = false;
    async function loadReservations() {
      setLoadingReservations(true);
      setFetchError("");
      const { data, error } = await supabase
        .from("reservations")
        .select("id, booking_code, customer_name, pax, outlet_id, reservation_date, session, status, reservation_items(quantity, menus(name))")
        .eq("reservation_date", dateFilter)
        .order("created_at", { ascending: true });

      if (cancelled) return;
      if (error) {
        console.error(error);
        setFetchError("Gagal memuat data reservasi.");
        setLoadingReservations(false);
        return;
      }
      setReservations(
        (data || []).map((r) => ({
          id: r.id,
          code: r.booking_code,
          name: r.customer_name,
          pax: r.pax,
          outlet: r.outlet_id,
          session: r.session,
          status: r.status,
          menu: (r.reservation_items || [])
            .map((it) => `${it.menus?.name || "Menu"} ×${it.quantity}`)
            .join(", "),
        }))
      );
      setLoadingReservations(false);
    }
    loadReservations();
    return () => { cancelled = true; };
  }, [isAuthed, dateFilter]);

  function handleLogin(e) {
    e.preventDefault();
    if (codeInput.trim().toUpperCase() === STAFF_ACCESS_CODE) {
      try {
        sessionStorage.setItem("imperial_staff_authed", "true");
      } catch {}
      setIsAuthed(true);
      setAuthError("");
    } else {
      setAuthError("Kode akses salah. Coba lagi.");
    }
  }

  function handleLogout() {
    try {
      sessionStorage.removeItem("imperial_staff_authed");
    } catch {}
    setIsAuthed(false);
    setCodeInput("");
  }

  const filtered = useMemo(() => {
    return reservations.filter((r) => {
      const matchQuery =
        query.trim() === "" ||
        r.name.toLowerCase().includes(query.toLowerCase()) ||
        r.code.toLowerCase().includes(query.toLowerCase());
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      const matchOutlet = outletFilter === "all" || r.outlet === outletFilter;
      return matchQuery && matchStatus && matchOutlet;
    });
  }, [reservations, query, statusFilter, outletFilter]);

  const totalToday = reservations.length;
  const checkedInCount = reservations.filter((r) => r.status === "checked-in").length;
  const pendingCount = reservations.filter((r) => r.status === "pending").length;
  const totalGuests = reservations.reduce((sum, r) => sum + r.pax, 0);

  async function checkIn(code) {
    const { error } = await supabase
      .from("reservations")
      .update({ status: "checked-in", checked_in_at: new Date().toISOString() })
      .eq("booking_code", code);

    if (error) {
      console.error(error);
      setFetchError("Gagal melakukan check-in. Coba lagi.");
      return;
    }
    setReservations((prev) =>
      prev.map((r) => (r.code === code ? { ...r, status: "checked-in" } : r))
    );
  }

  async function deleteReservation(code, name) {
    const confirmed = window.confirm(
      `Hapus reservasi ${name} (${code})? Tindakan ini tidak bisa dibatalkan.`
    );
    if (!confirmed) return;

    const { error } = await supabase.from("reservations").delete().eq("booking_code", code);
    if (error) {
      console.error(error);
      setFetchError("Gagal menghapus reservasi. Coba lagi.");
      return;
    }
    setReservations((prev) => prev.filter((r) => r.code !== code));
  }

  if (!isAuthed) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center px-6" style={{ ...body, background: "#FAF8F3" }}>
        <style>{FONT_IMPORT}</style>
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-12 h-12 rounded-full bg-amber-400 flex items-center justify-center mb-3">
              <Moon className="w-6 h-6 text-emerald-950" fill="currentColor" />
              <Star className="w-3.5 h-3.5 text-emerald-950 absolute -top-1 -right-1" fill="currentColor" />
            </div>
            <p className="text-2xl text-emerald-950" style={display}>Imperial Staff</p>
            <p className="text-xs text-stone-500 mt-1">Khusus untuk staff outlet</p>
          </div>

          <form onSubmit={handleLogin} className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 mb-2">
              <Lock className="w-3.5 h-3.5" /> Kode akses staff
            </label>
            <input
              autoFocus
              type="password"
              value={codeInput}
              onChange={(e) => { setCodeInput(e.target.value); setAuthError(""); }}
              placeholder="Masukkan kode akses"
              className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm mb-3 tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            {authError && <p className="text-xs text-rose-500 mb-3">{authError}</p>}
            <button
              type="submit"
              className="w-full rounded-full px-6 py-3 text-sm font-semibold bg-emerald-900 text-amber-300 hover:bg-emerald-800 active:scale-[0.98] transition-all"
            >
              Masuk
            </button>
          </form>
          <p className="text-[11px] text-stone-400 text-center mt-4">
            Lupa kode akses? Hubungi manajer outlet Anda.
          </p>
          <a
            href="/"
            className="mt-3 text-[11px] text-stone-500 hover:text-emerald-800 flex items-center justify-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5" /> Kembali ke halaman utama
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full" style={{ ...body, background: "#FAF8F3" }}>
      <style>{FONT_IMPORT}</style>

      <header className="bg-emerald-950 text-stone-50">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center">
              <Moon className="w-4 h-4 text-emerald-950" fill="currentColor" />
              <Star className="w-2.5 h-2.5 text-emerald-950 absolute -top-0.5 -right-0.5" fill="currentColor" />
            </div>
            <div>
              <p className="text-lg leading-none" style={display}>Imperial Staff</p>
              <p className="text-[11px] text-emerald-300 tracking-wide">Dashboard reservasi hari ini</p>
            </div>
          </div>
          <p className="text-[11px] text-emerald-300 hidden sm:block">Ramadan &amp; Lebaran 2026</p>
          <div className="flex items-center gap-2">
            <a
              href="/"
              className="text-[11px] text-emerald-300 hover:text-white flex items-center gap-1.5 border border-emerald-800 rounded-full px-3 py-1.5"
            >
              <Home className="w-3.5 h-3.5" /> Halaman utama
            </a>
            <button
              onClick={handleLogout}
              className="text-[11px] text-emerald-300 hover:text-white flex items-center gap-1.5 border border-emerald-800 rounded-full px-3 py-1.5"
            >
              <LogOut className="w-3.5 h-3.5" /> Keluar
            </button>
          </div>
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

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("reservasi")}
            className={"text-sm px-4 py-2 rounded-full font-medium transition-colors " + (activeTab === "reservasi" ? "bg-emerald-900 text-amber-300" : "bg-white border border-stone-200 text-stone-500 hover:border-stone-300")}
          >
            Reservasi
          </button>
          <button
            onClick={() => setActiveTab("voucher")}
            className={"text-sm px-4 py-2 rounded-full font-medium transition-colors flex items-center gap-1.5 " + (activeTab === "voucher" ? "bg-emerald-900 text-amber-300" : "bg-white border border-stone-200 text-stone-500 hover:border-stone-300")}
          >
            <Ticket className="w-3.5 h-3.5" /> Voucher
          </button>
        </div>

        {activeTab === "reservasi" && (
        <>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard label="Reservasi hari ini" value={totalToday} icon={Store} />
          <StatCard label="Sudah check-in" value={checkedInCount} sub={`dari ${totalToday} reservasi`} icon={CheckCircle2} />
          <StatCard label="Menunggu" value={pendingCount} icon={Clock} />
          <StatCard label="Total tamu" value={totalGuests} sub="orang" icon={Users} />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative">
            <CalendarDays className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-full border border-stone-300 bg-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama atau kode booking..."
              className="w-full rounded-full border border-stone-300 bg-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <select
            value={outletFilter}
            onChange={(e) => setOutletFilter(e.target.value)}
            className="rounded-full border border-stone-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="all">Semua outlet</option>
            {OUTLETS.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>

        {loadingReservations && (
          <p className="text-xs text-stone-400 mb-4">Memuat reservasi...</p>
        )}
        {fetchError && (
          <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 mb-4">{fetchError}</p>
        )}

        <div className="flex items-center gap-2 mb-5">
          <Filter className="w-3.5 h-3.5 text-stone-400" />
          {["all", "pending", "checked-in", "no-show"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={
                "text-xs px-3 py-1.5 rounded-full font-medium transition-colors " +
                (statusFilter === s
                  ? "bg-emerald-900 text-amber-300"
                  : "bg-white border border-stone-200 text-stone-500 hover:border-stone-300")
              }
            >
              {s === "all" ? "Semua" : STATUS_META[s].label}
            </button>
          ))}
        </div>

        <div className="space-y-2.5">
          {filtered.length === 0 && (
            <p className="text-sm text-stone-400 text-center py-10">Tidak ada reservasi yang cocok.</p>
          )}
          {filtered.map((r) => {
            const meta = STATUS_META[r.status];
            return (
              <div
                key={r.code}
                className="bg-white rounded-2xl border border-stone-200 p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <QrCode className="w-4 h-4 text-emerald-800" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-emerald-950 text-sm">{r.name}</p>
                      <span className="text-[11px] font-mono tracking-wide text-stone-400">{r.code}</span>
                    </div>
                    <p className="text-xs text-stone-500 truncate">
                      {r.pax} orang · {OUTLETS.find((o) => o.id === r.outlet)?.name} · {r.session}
                    </p>
                    <p className="text-[11px] text-stone-400">{r.menu}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 justify-between sm:justify-end">
                  <span className={"text-[11px] font-medium px-2.5 py-1 rounded-full border flex items-center gap-1.5 " + meta.bg + " " + meta.text}>
                    <span className={"w-1.5 h-1.5 rounded-full " + meta.dot} />
                    {meta.label}
                  </span>
                  {r.status === "pending" && (
                    <button
                      onClick={() => checkIn(r.code)}
                      className="text-xs font-semibold px-4 py-2 rounded-full bg-emerald-900 text-amber-300 hover:bg-emerald-800 active:scale-[0.98] transition-all"
                    >
                      Check-in
                    </button>
                  )}
                  {r.status === "checked-in" && (
                    <button
                      onClick={() => deleteReservation(r.code, r.name)}
                      title="Hapus reservasi (tamu sudah check-in)"
                      className="text-xs font-medium px-3 py-2 rounded-full border border-stone-200 text-stone-500 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-all flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hapus
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        </>
        )}

        {activeTab === "voucher" && (
          <div>
            <Card className="p-5 mb-6">
              <p className="text-sm font-semibold text-emerald-950 mb-4 flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Buat voucher baru
              </p>
              <form onSubmit={createVoucher} className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1.5">Kode voucher</label>
                  <input
                    value={vForm.code}
                    onChange={(e) => setVForm({ ...vForm, code: e.target.value.toUpperCase() })}
                    placeholder="LEBARAN25"
                    className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm tracking-wide focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1.5">Jenis voucher</label>
                  <select
                    value={vForm.type}
                    onChange={(e) => setVForm({ ...vForm, type: e.target.value })}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="electronic">Elektronik (kode promo)</option>
                    <option value="physical">Fisik (kupon kertas)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1.5">Tipe potongan</label>
                  <select
                    value={vForm.discount_type}
                    onChange={(e) => setVForm({ ...vForm, discount_type: e.target.value })}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="percentage">Persen (%)</option>
                    <option value="fixed">Nominal tetap (Rp)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                    Nilai potongan {vForm.discount_type === "percentage" ? "(0-100)" : "(Rp)"}
                  </label>
                  <input
                    type="number"
                    value={vForm.discount_value}
                    onChange={(e) => setVForm({ ...vForm, discount_value: e.target.value })}
                    placeholder={vForm.discount_type === "percentage" ? "10" : "50000"}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1.5">Minimal belanja (Rp)</label>
                  <input
                    type="number"
                    value={vForm.min_purchase}
                    onChange={(e) => setVForm({ ...vForm, min_purchase: e.target.value })}
                    placeholder="0"
                    className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1.5">Maksimal pemakaian</label>
                  <input
                    type="number"
                    value={vForm.max_uses}
                    onChange={(e) => setVForm({ ...vForm, max_uses: e.target.value })}
                    placeholder="1"
                    className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">Voucher fisik biasanya 1, elektronik bisa ratusan.</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1.5">Kedaluwarsa (opsional)</label>
                  <input
                    type="date"
                    value={vForm.expires_at}
                    onChange={(e) => setVForm({ ...vForm, expires_at: e.target.value })}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div className="sm:col-span-2 flex items-center gap-3 mt-1">
                  <button
                    type="submit"
                    disabled={creatingVoucher}
                    className="rounded-full px-6 py-2.5 text-sm font-semibold bg-emerald-900 text-amber-300 hover:bg-emerald-800 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {creatingVoucher ? "Membuat..." : "Buat voucher"}
                  </button>
                  {createVoucherError && <p className="text-xs text-rose-500">{createVoucherError}</p>}
                  {createVoucherSuccess && <p className="text-xs text-emerald-600">{createVoucherSuccess}</p>}
                </div>
              </form>
            </Card>

            <p className="text-sm font-semibold text-emerald-950 mb-3">Daftar voucher</p>
            {loadingVouchers && <p className="text-xs text-stone-400 mb-3">Memuat voucher...</p>}
            {voucherListError && <p className="text-xs text-rose-500 mb-3">{voucherListError}</p>}

            <div className="space-y-2.5">
              {!loadingVouchers && vouchers.length === 0 && (
                <p className="text-sm text-stone-400 text-center py-10">Belum ada voucher. Buat yang pertama di atas.</p>
              )}
              {vouchers.map((v) => (
                <div key={v.id} className="bg-white rounded-2xl border border-stone-200 p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-emerald-950 text-sm font-mono tracking-wide">{v.code}</p>
                      <span className="text-[10px] font-medium bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
                        {v.type === "physical" ? "Fisik" : "Elektronik"}
                      </span>
                      {!v.is_active && (
                        <span className="text-[10px] font-medium bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full">Nonaktif</span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Potongan {v.discount_type === "percentage" ? `${v.discount_value}%` : rupiah(v.discount_value)}
                      {v.min_purchase > 0 && ` · min. belanja ${rupiah(v.min_purchase)}`}
                      {v.expires_at && ` · berlaku s/d ${v.expires_at}`}
                    </p>
                    <p className="text-[11px] text-stone-400 mt-0.5">Terpakai {v.used_count} dari {v.max_uses}</p>
                  </div>
                  <button
                    onClick={() => toggleVoucherActive(v)}
                    className={
                      "text-xs font-medium px-3 py-2 rounded-full border flex items-center gap-1.5 shrink-0 transition-all " +
                      (v.is_active
                        ? "border-stone-200 text-stone-500 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600"
                        : "border-emerald-200 text-emerald-700 hover:bg-emerald-50")
                    }
                  >
                    <Power className="w-3.5 h-3.5" /> {v.is_active ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}