(() => {
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(pointer: fine)").matches;

  /* ---------- Custom cursor ---------- */
  if (fine) {
    const dot = Object.assign(document.createElement("div"), { className: "cursor" });
    const ring = Object.assign(document.createElement("div"), { className: "cursor-ring", innerHTML: "<span></span>" });
    document.body.append(dot, ring);
    const txt = ring.firstChild;
    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;
    addEventListener("pointermove", e => {
      x = e.clientX; y = e.clientY;
      dot.style.transform = `translate(${x}px, ${y}px)`;
      root.classList.add("has-cursor");
    }, { passive: true });
    document.addEventListener("pointerleave", () => root.classList.remove("has-cursor"));
    addEventListener("pointerdown", () => ring.classList.add("is-down"));
    addEventListener("pointerup", () => ring.classList.remove("is-down"));
    document.addEventListener("pointerover", e => {
      const lab = e.target.closest("[data-cursor]");
      const link = e.target.closest("a, button, summary, label, input, select, textarea, [data-hover]");
      ring.classList.toggle("is-label", !!lab);
      ring.classList.toggle("is-link", !lab && !!link);
      if (lab) txt.textContent = lab.dataset.cursor;
    });
    (function loop() {
      rx += (x - rx) * .18; ry += (y - ry) * .18;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- Header: hide on scroll down, burger ---------- */
  const head = document.querySelector(".site-head");
  let lastY = scrollY;
  addEventListener("scroll", () => {
    const y = scrollY;
    if (!root.classList.contains("nav-open")) head.classList.toggle("is-hidden", y > lastY && y > 200);
    lastY = y;
  }, { passive: true });
  const burger = document.querySelector(".burger");
  burger && burger.addEventListener("click", () => {
    const open = root.classList.toggle("nav-open");
    burger.setAttribute("aria-expanded", open);
    document.body.style.overflow = open ? "hidden" : "";
  });

  /* ---------- Split headings into words ---------- */
  document.querySelectorAll(".split").forEach(el => {
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) return frag.append(" ");
            const w = document.createElement("span");
            w.className = "w";
            w.innerHTML = `<span style="--i:${i++}"></span>`;
            w.firstChild.textContent = part;
            frag.append(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== "BR") walk(n);
      });
    };
    walk(el);
  });

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }), { threshold: .15, rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".reveal, .split").forEach(el => io.observe(el));

  /* ---------- 3D tilt ---------- */
  if (fine && !reduce) {
    document.querySelectorAll("[data-tilt]").forEach(el => {
      const max = +el.dataset.tilt || 8;
      el.addEventListener("pointermove", e => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.style.transform = `rotateY(${(px - .5) * max * 2}deg) rotateX(${(.5 - py) * max * 2}deg)`;
        el.style.setProperty("--mx", px * 100 + "%");
        el.style.setProperty("--my", py * 100 + "%");
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
  }

  /* ---------- Magnetic buttons ---------- */
  if (fine && !reduce) {
    document.querySelectorAll(".btn").forEach(b => {
      b.addEventListener("pointermove", e => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px, ${(e.clientY - r.top - r.height / 2) * .3}px)`;
      });
      b.addEventListener("pointerleave", () => { b.style.transform = ""; });
    });
  }

  /* ---------- Page transition ---------- */
  const wipe = document.createElement("div");
  wipe.className = "wipe";
  wipe.innerHTML = '<span class="dot">SOS</span>';
  document.body.append(wipe);
  if (!reduce && sessionStorage.getItem("sos-wipe")) {
    sessionStorage.removeItem("sos-wipe");
    wipe.style.transform = "translateY(0)";
    requestAnimationFrame(() => requestAnimationFrame(() => { wipe.style.transform = ""; wipe.classList.add("in"); }));
  }
  document.addEventListener("click", e => {
    const a = e.target.closest("a[href]");
    if (!a || reduce || e.metaKey || e.ctrlKey || e.shiftKey || a.target || a.hasAttribute("download")) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.pathname === location.pathname || /\.\w+$/.test(url.pathname)) return;
    e.preventDefault();
    sessionStorage.setItem("sos-wipe", 1);
    wipe.classList.remove("in");
    wipe.classList.add("out");
    setTimeout(() => { location.href = url.href; }, 560);
  });
  addEventListener("pageshow", e => { if (e.persisted) wipe.classList.remove("out"); });

  /* ---------- Vilnius clock ---------- */
  const clock = document.querySelector("[data-clock]");
  if (clock) {
    const f = new Intl.DateTimeFormat("lt-LT", { timeZone: "Europe/Vilnius", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    const tick = () => { clock.textContent = f.format(new Date()); };
    tick(); setInterval(tick, 1000);
  }

  /* ---------- Availability pill ---------- */
  const pills = document.querySelectorAll("[data-status]");
  const ready = new Promise(r => document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", r) : r());
  async function refresh() {
    if (!window.SOSAvailability) return;
    const a = await SOSAvailability.get();
    let text = "Parašyk mums";
    if (a.state === "free") text = a.freeCount > 1 ? `${a.freeCount} laisvi dabar` : "Laisva dabar";
    else if (a.state === "busy") text = a.next ? `Laisva ${a.label(a.next).toLowerCase()}` : "Šiuo metu užimta";
    pills.forEach(p => { p.dataset.state = a.state; p.querySelector("span:last-child").textContent = text; });
    await ready;
    document.dispatchEvent(new CustomEvent("sos:availability", { detail: a }));
  }
  refresh();
  setInterval(refresh, 60e3);

  /* ---------- Footer dot wordmark ---------- */
  const cv = document.getElementById("wordmark");
  if (cv) {
    const ctx = cv.getContext("2d");
    let dots = [], W, H, dpr, mx = -9999, my = -9999, raf, visible = false;
    function build() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      const off = document.createElement("canvas");
      off.width = W; off.height = H;
      const o = off.getContext("2d");
      let size = H * 1.05;
      o.font = `700 ${size}px "Space Grotesk", sans-serif`;
      const tw = o.measureText("SOStudy").width;
      if (tw > W) { size *= W / tw * .98; o.font = `700 ${size}px "Space Grotesk", sans-serif`; }
      o.textBaseline = "middle";
      o.fillStyle = "#000";
      o.fillText("SOStudy", (W - o.measureText("SOStudy").width) / 2, H / 2);
      const sosW = o.measureText("SOS").width + (W - o.measureText("SOStudy").width) / 2;
      const step = Math.max(5, Math.round(W / 190));
      const data = o.getImageData(0, 0, W, H).data;
      dots = [];
      for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) {
        if (data[(y * W + x) * 4 + 3] > 128) dots.push({ ox: x, oy: y, x, y, vx: 0, vy: 0, red: x < sosW });
      }
      dots.r = step * .36;
    }
    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      for (const d of dots) {
        const dx = d.x - mx, dy = d.y - my, dist = Math.hypot(dx, dy);
        if (dist < 90) { const f = (90 - dist) / 90 * 2.4; d.vx += dx / dist * f; d.vy += dy / dist * f; }
        d.vx += (d.ox - d.x) * .06; d.vy += (d.oy - d.y) * .06;
        d.vx *= .82; d.vy *= .82;
        d.x += d.vx; d.y += d.vy;
        ctx.fillStyle = d.red ? "#ff4a4b" : "#ecebe6";
        ctx.beginPath(); ctx.arc(d.x, d.y, dots.r, 0, 6.283); ctx.fill();
      }
      if (visible) raf = requestAnimationFrame(draw);
    }
    document.fonts.ready.then(() => { build(); draw(); });
    addEventListener("resize", () => { build(); if (!visible) draw(); });
    cv.addEventListener("pointermove", e => { const r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
    cv.addEventListener("pointerleave", () => { mx = my = -9999; });
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting && !reduce;
      cancelAnimationFrame(raf);
      if (visible) draw();
    }).observe(cv);
  }

  /* ---------- Links from config ---------- */
  if (window.SOS) document.querySelectorAll("[data-linkedin]").forEach(a => { a.href = SOS.linkedin; });

  /* ---------- Year ---------- */
  document.querySelectorAll("[data-year]").forEach(el => { el.textContent = new Date().getFullYear(); });
})();
