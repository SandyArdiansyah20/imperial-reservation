import { useState, useMemo } from "react";
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

const INITIAL_RESERVATIONS = [
  { code: "IMR-4821", name: "Sandy Wijaya", pax: 4, outlet: "kemang", session: "17:30 — Buka Puasa", menu: "Paket Keluarga", status: "checked-in" },
  { code: "IMR-7734", name: "Rina Anggraini", pax: 2, outlet: "kemang", session: "17:30 — Buka Puasa", menu: "Paket Buka Puasa Bersama ×2", status: "pending" },
  { code: "IMR-1092", name: "Budi Santoso", pax: 6, outlet: "kemang", session: "19:00 — Malam", menu: "Paket Lebaran Spesial", status: "pending" },
  { code: "IMR-5560", name: "Dewi Lestari", pax: 3, outlet: "bsd", session: "17:30 — Buka Puasa", menu: "Paket Keluarga", status: "pending" },
  { code: "IMR-3387", name: "Ahmad Fauzan", pax: 8, outlet: "bsd", session: "19:00 — Malam", menu: "Paket Lebaran Spesial ×2", status: "checked-in" },
  { code: "IMR-9021", name: "Sri Wahyuni", pax: 5, outlet: "pik", session: "17:30 — Buka Puasa", menu: "Paket Keluarga", status: "no-show" },
  { code: "IMR-2245", name: "Yusuf Hidayat", pax: 2, outlet: "kemang", session: "19:00 — Malam", menu: "Paket Buka Puasa Bersama ×2", status: "pending" },
  { code: "IMR-6678", name: "Maya Puspita", pax: 4, outlet: "bsd", session: "17:30 — Buka Puasa", menu: "Paket Keluarga", status: "pending" },
  { code: "IMR-8814", name: "Fajar Ramadhan", pax: 6, outlet: "pik", session: "19:00 — Malam", menu: "Paket Lebaran Spesial", status: "checked-in" },
  { code: "IMR-1156", name: "Nur Aisyah", pax: 3, outlet: "kemang", session: "17:30 — Buka Puasa", menu: "Paket Keluarga", status: "pending" },
];

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
  const [isAuthed, setIsAuthed] = useState(() => {
    try {
      return sessionStorage.getItem("imperial_staff_authed") === "true";
    } catch {
      return false;
    }
  });
  const [codeInput, setCodeInput] = useState("");
  const [authError, setAuthError] = useState("");

  const [reservations, setReservations] = useState(INITIAL_RESERVATIONS);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [outletFilter, setOutletFilter] = useState("all");

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

  function checkIn(code) {
    setReservations((prev) =>
      prev.map((r) => (r.code === code ? { ...r, status: "checked-in" } : r))
    );
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
          <button
            onClick={handleLogout}
            className="text-[11px] text-emerald-300 hover:text-white flex items-center gap-1.5 border border-emerald-800 rounded-full px-3 py-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> Keluar
          </button>
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard label="Reservasi hari ini" value={totalToday} icon={Store} />
          <StatCard label="Sudah check-in" value={checkedInCount} sub={`dari ${totalToday} reservasi`} icon={CheckCircle2} />
          <StatCard label="Menunggu" value={pendingCount} icon={Clock} />
          <StatCard label="Total tamu" value={totalGuests} sub="orang" icon={Users} />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-5">
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
                    <Circle className="w-4 h-4 text-emerald-300 sm:hidden" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}