(() => {
  const form = document.getElementById("helpForm");

  /* ---------- Photo: drag and drop, paste, preview, shrink before sending ---------- */
  const drop = document.getElementById("drop");
  const input = document.getElementById("photo");
  const img = document.getElementById("previewImg");
  const meta = document.getElementById("previewMeta");
  const note = document.getElementById("photoNote");
  const MAX = 10 * 1024 * 1024, EDGE = 2000;

  const kb = n => n > 1048576 ? (n / 1048576).toFixed(1).replace(".", ",") + " MB" : Math.round(n / 1024) + " KB";

  async function shrink(file) {
    try {
      const bmp = await createImageBitmap(file);
      const scale = Math.min(1, EDGE / Math.max(bmp.width, bmp.height));
      if (scale === 1 && file.size < 1.5e6) return file;
      const c = document.createElement("canvas");
      c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
      c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
      const blob = await new Promise(r => c.toBlob(r, "image/jpeg", .85));
      return blob ? new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }) : file;
    } catch (e) {
      return file; // e.g. HEIC outside Safari: send as is
    }
  }

  function say(text) { note.textContent = text; note.hidden = !text; }

  async function take(file) {
    say("");
    if (!file) return;
    if (!file.type.startsWith("image/") && !/\.hei[cf]$/i.test(file.name)) return say("Šis failas nėra nuotrauka. Pasirink JPG, PNG arba HEIC failą.");
    const f = await shrink(file);
    if (f.size > MAX) return say(`Nuotrauka per didelė (${kb(f.size)}). Didžiausias leistinas dydis yra 10 MB.`);
    form._photo = f;
    img.src = URL.createObjectURL(f);
    meta.textContent = `${f.name}, ${kb(f.size)}`;
    drop.classList.add("has-file");
    input.value = "";
  }
  function clear() {
    form._photo = null;
    input.value = "";
    drop.classList.remove("has-file");
    say("");
  }

  input.addEventListener("change", () => take(input.files[0]));
  document.getElementById("photoClear").addEventListener("click", e => { e.preventDefault(); clear(); input.focus(); });
  ["dragenter", "dragover"].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add("is-over"); }));
  ["dragleave", "drop"].forEach(t => drop.addEventListener(t, () => drop.classList.remove("is-over")));
  drop.addEventListener("drop", e => { e.preventDefault(); take(e.dataTransfer.files[0]); });
  addEventListener("paste", e => {
    const f = [...(e.clipboardData && e.clipboardData.files || [])].find(f => f.type.startsWith("image/"));
    if (f) take(f);
  });

  /* ---------- Preferred time ---------- */
  const laikas = document.getElementById("laikas");
  const chosen = document.getElementById("chosen");
  const chosenText = document.getElementById("chosenText");
  function pick(btn) {
    document.querySelectorAll(".slot").forEach(b => b.setAttribute("aria-pressed", b === btn));
    if (btn) {
      laikas.value = btn.dataset.label;
      chosenText.textContent = btn.dataset.label;
      chosen.classList.add("on");
    } else {
      laikas.value = "Kuo greičiau";
      chosen.classList.remove("on");
    }
  }
  document.getElementById("chosenClear").addEventListener("click", () => pick(null));

  /* ---------- Availability panel ---------- */
  const av = document.getElementById("av");
  const state = document.getElementById("avState");
  const sub = document.getElementById("avSub");
  const people = document.querySelectorAll("#avPeople span");
  const week = document.getElementById("week");
  const slotsWrap = document.getElementById("slotsWrap");
  const slots = document.getElementById("slots");
  const DAY = ["Sk", "Pr", "An", "Tr", "Kt", "Pn", "Št"];
  const TZ = "Europe/Vilnius";

  // Midnight of a Vilnius calendar day, as a timestamp
  function vilniusMidnight(offsetDays) {
    const d = new Date(Date.now() + offsetDays * 864e5);
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: TZ, year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(d).map(x => [x.type, x.value]));
    const asUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute);
    const offset = asUTC - Math.floor(d.getTime() / 6e4) * 6e4;
    return Date.UTC(p.year, p.month - 1, p.day) - offset;
  }

  function drawWeek(windows) {
    week.querySelectorAll(".week-row").forEach(r => r.remove());
    const now = Date.now();
    const axis = week.querySelector(".week-axis");
    for (let d = 0; d < 7; d++) {
      const mid = vilniusMidnight(d);
      const row = document.createElement("div");
      row.className = "week-row" + (d === 0 ? " today" : "");
      let cells = "";
      for (let i = 0; i < 28; i++) {
        const s = mid + (8 + i / 2) * 36e5, e = s + 18e5;
        const on = windows.some(([a, b]) => a < e && b > s);
        cells += `<i class="${on ? "on" : ""}${now >= s && now < e ? " now" : ""}"></i>`;
      }
      row.innerHTML = `<span>${DAY[new Date(mid + 12 * 36e5).getUTCDay()]}</span><div class="week-cells">${cells}</div>`;
      week.insertBefore(row, axis);
    }
    week.hidden = false;
  }

  document.addEventListener("sos:availability", ({ detail: a }) => {
    av.dataset.state = a.state;
    people.forEach((p, i) => p.classList.toggle("on", i < a.freeCount));
    if (a.state === "free") {
      state.textContent = "Laisva";
      sub.innerHTML = `${a.freeCount > 1 ? "Šiuo metu laisvi abu korepetitoriai" : "Šiuo metu laisvas vienas korepetitorius"}${a.until ? `, bent iki <strong>${a.hm(a.until)}</strong>` : ""}. Užpildyk formą ir atsakysime per kelias minutes.`;
    } else if (a.state === "busy") {
      state.textContent = "Užimta";
      sub.innerHTML = a.next
        ? `Šiuo metu negalime atsakyti. Artimiausias laisvas laikas: <strong>${a.label(a.next)}</strong>. Gali pasirinkti laiką žemiau.`
        : "Šią savaitę laisvo laiko neliko. Užpildyk formą ir susitarsime dėl laiko el. paštu.";
    } else {
      state.textContent = "SOS";
      sub.textContent = a.error
        ? "Nepavyko patikrinti, ar kas nors laisvas. Užpildyk formą ir atsakysime kuo greičiau."
        : "Užpildyk formą ir atsakysime kuo greičiau.";
    }

    if (a.windows.length) drawWeek(a.windows);
    slots.innerHTML = "";
    a.slots.forEach(s => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "slot";
      b.dataset.label = a.cap(s.label);
      b.textContent = a.cap(s.label);
      b.setAttribute("aria-pressed", laikas.value === b.dataset.label);
      b.addEventListener("click", () => pick(b.getAttribute("aria-pressed") === "true" ? null : b));
      slots.append(b);
    });
    slotsWrap.hidden = !a.slots.length;
  });
})();
