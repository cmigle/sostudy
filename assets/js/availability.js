// Combines the founders' free windows into one status:
// { state: "free" | "busy" | "unknown", error, freeCount, until, next, slots, windows }
(() => {
  const TZ = "Europe/Vilnius";
  const KEY = "sos-av";
  const TTL = 60e3;
  const DAYS_ACC = ["sekmadienį", "pirmadienį", "antradienį", "trečiadienį", "ketvirtadienį", "penktadienį", "šeštadienį"];

  const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
  const hm = new Intl.DateTimeFormat("lt-LT", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });
  const wd = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short" });
  const WD = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  function dayDiff(t) {
    return Math.round((Date.parse(dayKey.format(t)) - Date.parse(dayKey.format(Date.now()))) / 864e5);
  }

  // "šiandien 15:00", "rytoj 15:00", "ketvirtadienį 15:00" (lower case, for use mid-sentence)
  function label(t) {
    const d = dayDiff(t);
    const day = d === 0 ? "šiandien" : d === 1 ? "rytoj" : d === 2 ? "poryt" : DAYS_ACC[WD[wd.format(t)]];
    return `${day} ${hm.format(t)}`;
  }
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

  function merge(list) {
    const s = list.slice().sort((a, b) => a[0] - b[0]);
    const out = [];
    for (const [a, b] of s) {
      const last = out[out.length - 1];
      if (last && a <= last[1]) last[1] = Math.max(last[1], b);
      else out.push([a, b]);
    }
    return out;
  }

  function demo() {
    // Sample data for previewing the widget: ?demo or ?demo=busy
    const now = Date.now(), h = 36e5;
    const busy = /demo=busy/.test(location.search);
    const a = [], b = [];
    for (let d = 0; d < 7; d++) {
      const base = new Date(); base.setHours(15, 0, 0, 0);
      const t = base.getTime() + d * 864e5;
      a.push([t, t + 2 * h]);
      b.push([t + 3 * h, t + 5.5 * h]);
    }
    if (!busy) return [[[now - h, now + 1.5 * h], ...a], b];
    const notNow = l => l.filter(([s, e]) => !(s <= now && e > now));
    return [notNow(a), notNow(b)];
  }

  async function fetchAll() {
    if (/[?&]demo/.test(location.search)) return { people: demo() };
    const urls = (window.SOS && SOS.calendarEndpoints) || [];
    if (!urls.length) return { people: [] };
    try {
      const c = JSON.parse(sessionStorage.getItem(KEY) || "null");
      if (c && Date.now() - c.t < TTL) return { people: c.d };
    } catch (e) {}
    const res = await Promise.allSettled(urls.map(u => fetch(u).then(r => r.json())));
    const d = res.filter(r => r.status === "fulfilled" && Array.isArray(r.value.free)).map(r => r.value.free);
    if (d.length) try { sessionStorage.setItem(KEY, JSON.stringify({ t: Date.now(), d })); } catch (e) {}
    return { people: d, error: !d.length };
  }

  async function get() {
    let r;
    try { r = await fetchAll(); } catch (e) { r = { people: [], error: true }; }
    const people = r.people;
    if (!people.length) return { state: "unknown", error: !!r.error, freeCount: 0, slots: [], windows: [], label, cap };

    const now = Date.now();
    const min = ((window.SOS && SOS.minSlot) || 15) * 6e4;
    const live = people.map(p => p.find(([s, e]) => s <= now && e - now >= min)).filter(Boolean);
    const windows = merge(people.flat().map(([s, e]) => [Math.max(s, now), e]).filter(([s, e]) => e - s >= min));

    // Up to 6 suggested start times: hourly today, one per window on later days.
    const q = 9e5, slots = [];
    for (const [s, e] of windows) {
      if (s <= now) continue;
      for (let t = Math.ceil(s / q) * q; t + min <= e && slots.length < 6; t += 36e5) {
        slots.push({ t, label: label(t) });
        if (dayDiff(t) > 0) break;
      }
      if (slots.length >= 6) break;
    }

    const next = windows.find(([s]) => s > now);
    return {
      state: live.length ? "free" : "busy",
      freeCount: live.length,
      until: live.length ? Math.max(...live.map(w => w[1])) : null,
      next: next ? next[0] : null,
      slots, windows, label, cap, hm: t => hm.format(t), dayDiff
    };
  }

  window.SOSAvailability = { get, label };
})();
