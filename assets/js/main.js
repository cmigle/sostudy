(() => {
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(pointer: fine)").matches;

  /* ---------- Custom cursor (mouse only) ---------- */
  if (fine) {
    const dot = Object.assign(document.createElement("div"), { className: "cursor" });
    const ring = Object.assign(document.createElement("div"), { className: "cursor-ring", innerHTML: "<span></span>" });
    document.body.append(dot, ring);
    const txt = ring.firstChild;
    let x = -100, y = -100, rx = x, ry = y, running = false;
    const loop = () => {
      rx += (x - rx) * .2; ry += (y - ry) * .2;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      running = Math.abs(x - rx) + Math.abs(y - ry) > .3;
      if (running) requestAnimationFrame(loop);
    };
    addEventListener("pointermove", e => {
      if (e.pointerType !== "mouse") return;
      x = e.clientX; y = e.clientY;
      dot.style.transform = `translate(${x}px, ${y}px)`;
      root.classList.add("has-cursor");
      if (!running) { running = true; requestAnimationFrame(loop); }
    }, { passive: true });
    document.addEventListener("pointerleave", () => root.classList.remove("has-cursor"));
    addEventListener("pointerdown", () => ring.classList.add("is-down"));
    addEventListener("pointerup", () => ring.classList.remove("is-down"));
    document.addEventListener("pointerover", e => {
      const lab = e.target.closest("[data-cursor]");
      const link = e.target.closest("a, button, summary, label, input, select, textarea");
      ring.classList.toggle("is-label", !!lab);
      ring.classList.toggle("is-link", !lab && !!link);
      if (lab) txt.textContent = lab.dataset.cursor;
    });
  }

  /* ---------- Header: hide on scroll down, burger ---------- */
  const head = document.querySelector(".site-head");
  let lastY = scrollY, ticking = false;
  addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = scrollY;
      if (!root.classList.contains("nav-open")) head.classList.toggle("is-hidden", y > lastY && y > 240);
      lastY = y; ticking = false;
    });
  }, { passive: true });
  const burger = document.querySelector(".burger");
  const setNav = open => {
    root.classList.toggle("nav-open", open);
    burger.setAttribute("aria-expanded", open);
    burger.setAttribute("aria-label", open ? "Uždaryti meniu" : "Meniu");
    document.body.style.overflow = open ? "hidden" : "";
  };
  if (burger) {
    burger.addEventListener("click", () => setNav(!root.classList.contains("nav-open")));
    addEventListener("keydown", e => { if (e.key === "Escape" && root.classList.contains("nav-open")) setNav(false); });
    matchMedia("(min-width: 1001px)").addEventListener("change", e => { if (e.matches) setNav(false); });
  }

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }), { threshold: .12, rootMargin: "0px 0px -6% 0px" });
  document.querySelectorAll(".reveal").forEach(el => io.observe(el));

  /* ---------- 3D tilt (mouse only) ---------- */
  if (fine && !reduce) {
    document.querySelectorAll("[data-tilt]").forEach(el => {
      const max = +el.dataset.tilt || 6;
      el.addEventListener("pointermove", e => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.style.transform = `rotateY(${(px - .5) * max * 2}deg) rotateX(${(.5 - py) * max * 2}deg)`;
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
  }

  /* ---------- Page transition ---------- */
  const wipe = document.createElement("div");
  wipe.className = "wipe";
  wipe.setAttribute("aria-hidden", "true");
  wipe.innerHTML = '<span class="logo"><span class="sos">SOS</span>tudy</span>';
  document.body.append(wipe);
  let fromWipe = false;
  try { fromWipe = !!sessionStorage.getItem("sos-wipe"); sessionStorage.removeItem("sos-wipe"); } catch (err) {}
  if (!reduce && fromWipe) {
    wipe.style.transition = "none";
    wipe.style.transform = "none";
    requestAnimationFrame(() => requestAnimationFrame(() => { wipe.style.cssText = ""; wipe.classList.add("in"); }));
  }
  document.addEventListener("click", e => {
    const a = e.target.closest("a[href]");
    if (!a || reduce || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target || a.hasAttribute("download")) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.pathname === location.pathname || /\.\w+$/.test(url.pathname)) return;
    e.preventDefault();
    try { sessionStorage.setItem("sos-wipe", 1); } catch (err) {}
    wipe.classList.remove("in");
    wipe.classList.add("out");
    setTimeout(() => { location.href = url.href; }, 450);
  });
  addEventListener("pageshow", e => { if (e.persisted) wipe.classList.remove("out"); });

  /* ---------- Availability pill ---------- */
  const pills = document.querySelectorAll("[data-status]");
  const ready = new Promise(r => document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", r) : r());
  async function refresh() {
    if (!window.SOSAvailability) return;
    const a = await SOSAvailability.get();
    let text = "Parašyk mums";
    if (a.state === "free") text = "Galime padėti dabar";
    else if (a.state === "busy") text = a.next ? `Laisva ${a.label(a.next)}` : "Šiuo metu užimta";
    pills.forEach(p => { p.dataset.state = a.state; p.querySelector("[data-status-text]").textContent = text; });
    await ready;
    document.dispatchEvent(new CustomEvent("sos:availability", { detail: a }));
  }
  refresh();
  setInterval(() => { if (!document.hidden) refresh(); }, 60e3);

  /* ---------- Footer dot wordmark ---------- */
  const cv = document.getElementById("wordmark");
  if (cv) {
    const ctx = cv.getContext("2d");
    let dots = [], W, H, dpr, mx = -9999, my = -9999, raf, visible = false;
    function build() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      if (!W || !H) return;
      cv.width = W * dpr; cv.height = H * dpr;
      const off = document.createElement("canvas");
      off.width = W; off.height = H;
      const o = off.getContext("2d");
      let size = H * 1.05;
      const font = s => `700 ${s}px "Bricolage Grotesque", sans-serif`;
      o.font = font(size);
      const tw = o.measureText("SOStudy").width;
      if (tw > W) { size *= W / tw * .98; o.font = font(size); }
      o.textBaseline = "middle";
      const left = (W - o.measureText("SOStudy").width) / 2;
      o.fillText("SOStudy", left, H / 2);
      const sosW = left + o.measureText("SOS").width;
      const step = Math.max(4, Math.round(W / 190));
      const data = o.getImageData(0, 0, W, H).data;
      dots = [];
      for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) {
        if (data[(y * W + x) * 4 + 3] > 128) dots.push({ ox: x, oy: y, x, y, vx: 0, vy: 0, red: x < sosW });
      }
      dots.r = step * .36;
    }
    function draw() {
      if (!dots.length) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      for (const d of dots) {
        const dx = d.x - mx, dy = d.y - my, dist = Math.hypot(dx, dy) || 1;
        if (dist < 80) { const f = (80 - dist) / 80 * 2.2; d.vx += dx / dist * f; d.vy += dy / dist * f; }
        d.vx += (d.ox - d.x) * .06; d.vy += (d.oy - d.y) * .06;
        d.vx *= .82; d.vy *= .82;
        d.x += d.vx; d.y += d.vy;
        ctx.fillStyle = d.red ? "#ff4a4b" : "#efede7";
        ctx.beginPath(); ctx.arc(d.x, d.y, dots.r, 0, 6.283); ctx.fill();
      }
      if (visible) raf = requestAnimationFrame(draw);
    }
    const move = e => { const r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; };
    document.fonts.ready.then(() => { build(); draw(); });
    new ResizeObserver(() => { build(); if (!visible) draw(); }).observe(cv);
    cv.addEventListener("pointermove", move);
    cv.addEventListener("pointerdown", move);
    cv.addEventListener("pointerleave", () => { mx = my = -9999; });
    cv.addEventListener("pointerup", e => { if (e.pointerType !== "mouse") mx = my = -9999; });
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting && !reduce;
      cancelAnimationFrame(raf);
      if (visible) draw();
    }).observe(cv);
  }

  /* ---------- Links from config ---------- */
  if (window.SOS) {
    document.querySelectorAll("[data-linkedin]").forEach(a => { a.href = SOS.linkedin; });
    document.querySelectorAll("[data-instagram]").forEach(a => { a.href = SOS.instagram; });
  }
  document.querySelectorAll("[data-year]").forEach(el => { el.textContent = new Date().getFullYear(); });
})();
