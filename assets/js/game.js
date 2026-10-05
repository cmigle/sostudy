// "Greitoji": a tap-to-fly mini game shown while the calendars load.
(() => {
  const box = document.getElementById("game");
  const cv = document.getElementById("gameCanvas");
  if (!box || !cv) return;
  const ctx = cv.getContext("2d");
  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  let W = 600, H = 260, GROUND = H - 18;
  const GAP = 135, PW = 50, SPACING = 260, SPEED = 115, GRAV = 900, FLAP = -300;
  const KEY = "sos-best";

  let best = 0;
  try { best = +localStorage.getItem(KEY) || 0; } catch (e) {}
  bestEl.textContent = best;

  let state = "ready", car, pipes, score, last = 0, raf = 0, t = 0, loaded = false, shown = false;

  function reset() {
    car = { x: 120, y: H / 2, v: 0 };
    pipes = [];
    score = 0;
    scoreEl.textContent = 0;
    for (let i = 0; i < 4; i++) addPipe(W + 160 + i * SPACING);
  }
  function addPipe(x) {
    // gaps stay near the middle and never jump too far from the previous one
    const prev = pipes.length ? pipes[pipes.length - 1].top : (GROUND - GAP) / 2;
    const lo = Math.max(30, prev - 70), hi = Math.min(GROUND - GAP - 30, prev + 70);
    const top = lo + Math.random() * (hi - lo);
    pipes.push({ x, top, passed: false });
  }

  function flap() {
    if (state === "ready") state = "play";
    else if (state === "over") { if (t < 0.6) return; reset(); state = "play"; }
    if (state === "play") car.v = FLAP;
  }

  function size() {
    // narrow screens get a taller, zoomed-in playfield
    const narrow = cv.clientWidth < 480;
    W = narrow ? 360 : 600; H = narrow ? 300 : 260; GROUND = H - 18;
    cv.style.aspectRatio = W + " / " + H;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function update(dt) {
    t += dt;
    if (state !== "play") {
      if (state === "ready") car.y = H / 2 + Math.sin(t * 3) * 6;
      return;
    }
    car.v += GRAV * dt;
    car.y += car.v * dt;
    if (car.y < 16) { car.y = 16; car.v = Math.max(car.v, 0); } // the top edge doesn't end the game
    for (const p of pipes) {
      p.x -= SPEED * dt;
      if (!p.passed && p.x + PW < car.x - 22) {
        p.passed = true;
        scoreEl.textContent = ++score;
      }
    }
    if (pipes[0].x < -PW) { pipes.shift(); addPipe(pipes[pipes.length - 1].x + SPACING); }
    // collisions, with a forgiving hitbox (smaller than the drawing)
    const hit = car.y + 12 > GROUND || pipes.some(p =>
      car.x + 17 > p.x && car.x - 17 < p.x + PW && (car.y - 8 < p.top || car.y + 8 > p.top + GAP));
    if (hit) {
      state = "over"; t = 0;
      if (score > best) {
        best = score; bestEl.textContent = best;
        try { localStorage.setItem(KEY, best); } catch (e) {}
      }
    }
  }

  function drawCar() {
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(Math.max(-0.45, Math.min(0.6, car.v / 900)));
    // body
    ctx.fillStyle = "#efede7";
    ctx.beginPath(); ctx.roundRect(-24, -12, 48, 22, 5); ctx.fill();
    ctx.beginPath(); ctx.moveTo(14, -12); ctx.lineTo(24, -2); ctx.lineTo(24, 10); ctx.lineTo(14, 10); ctx.fill();
    // stripe, window
    ctx.fillStyle = "#ff4a4b"; ctx.fillRect(-24, 0, 48, 4);
    ctx.fillStyle = "#bfe3ee";
    ctx.beginPath(); ctx.moveTo(14, -9); ctx.lineTo(21, -2); ctx.lineTo(14, -2); ctx.fill();
    ctx.fillRect(-2, -9, 12, 7);
    // siren (blinks red / blue)
    ctx.fillStyle = Math.floor(performance.now() / 200) % 2 ? "#ff4a4b" : "#7fb6d6";
    ctx.fillRect(-8, -17, 9, 5);
    // graduation cap
    ctx.fillStyle = "#8da978";
    ctx.beginPath(); ctx.moveTo(-22, -15); ctx.lineTo(-14, -19); ctx.lineTo(-6, -15); ctx.lineTo(-14, -12); ctx.fill();
    // wheels
    ctx.fillStyle = "#0e0c0b";
    ctx.beginPath(); ctx.arc(-13, 11, 5.5, 0, 6.3); ctx.arc(13, 11, 5.5, 0, 6.3); ctx.fill();
    ctx.fillStyle = "#cfcac0";
    ctx.beginPath(); ctx.arc(-13, 11, 2.2, 0, 6.3); ctx.arc(13, 11, 2.2, 0, 6.3); ctx.fill();
    ctx.restore();
  }

  function drawPipe(x, y, h, capAtBottom) {
    ctx.fillStyle = "#efede7";
    ctx.fillRect(x, y, PW, h);
    // squared notebook lines
    ctx.strokeStyle = "rgba(30,26,23,.12)"; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let gx = x + 9; gx < x + PW; gx += 9) { ctx.moveTo(gx + .5, y); ctx.lineTo(gx + .5, y + h); }
    for (let gy = y + 9; gy < y + h; gy += 9) { ctx.moveTo(x, gy + .5); ctx.lineTo(x + PW, gy + .5); }
    ctx.stroke();
    ctx.fillStyle = "#ff4a4b";
    ctx.fillRect(x - 3, capAtBottom ? y + h - 8 : y, PW + 6, 8);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const p of pipes) {
      drawPipe(p.x, 0, p.top, true);
      drawPipe(p.x, p.top + GAP, GROUND - p.top - GAP, false);
    }
    // road
    ctx.strokeStyle = "rgba(239,237,231,.4)"; ctx.lineWidth = 2;
    ctx.setLineDash([16, 16]);
    ctx.lineDashOffset = state === "play" ? (performance.now() / 1000 * SPEED) % 32 : 0;
    ctx.beginPath(); ctx.moveTo(0, GROUND + 1); ctx.lineTo(W, GROUND + 1); ctx.stroke();
    ctx.setLineDash([]);
    drawCar();
    if (state === "play") {
      ctx.fillStyle = "#efede7"; ctx.font = "900 34px Doto, monospace"; ctx.textAlign = "center";
      ctx.fillText(score, W / 2, 46);
    } else {
      ctx.fillStyle = "rgba(30,26,23,.72)"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#efede7"; ctx.textAlign = "center";
      ctx.font = `600 ${W < 500 ? 19 : 22}px 'Bricolage Grotesque', sans-serif`;
      ctx.fillText(state === "ready" ? "Spausk, kad greitoji pakiltų" : `Atsitrenkei. Taškai: ${score}`, W / 2, H / 2 - 64);
      ctx.font = "500 15px Manrope, sans-serif"; ctx.fillStyle = "rgba(239,237,231,.7)";
      ctx.fillText(state === "ready" ? "Pelė, ekranas arba tarpo klavišas" : "Spausk ir bandyk dar kartą", W / 2, H / 2 - 38);
    }
  }

  function loop(now) {
    const dt = Math.min(0.033, (now - (last || now)) / 1000);
    last = now;
    update(dt);
    draw();
    raf = requestAnimationFrame(loop);
  }

  function show() {
    if (shown) return;
    shown = true;
    box.hidden = false;
    size(); reset();
    addEventListener("resize", () => { if (!box.hidden && state !== "play") { size(); reset(); } });
    last = 0; raf = requestAnimationFrame(loop);
  }
  function hide() {
    box.hidden = true;
    cancelAnimationFrame(raf);
  }

  cv.addEventListener("pointerdown", e => { e.preventDefault(); cv.focus({ preventScroll: true }); flap(); });
  cv.addEventListener("keydown", e => {
    if (e.key === " " || e.key === "ArrowUp" || e.key === "Enter") { e.preventDefault(); flap(); }
  });
  document.getElementById("gameClose").addEventListener("click", hide);
  document.addEventListener("visibilitychange", () => { if (document.hidden && state === "play") { state = "over"; t = 1; } });

  // Show only if the calendars take longer than a moment
  const timer = setTimeout(() => { if (!loaded) show(); }, 600);
  document.addEventListener("sos:availability", () => {
    if (loaded) return;
    loaded = true;
    clearTimeout(timer);
    if (shown && state !== "play") hide();
    document.getElementById("gameMsg").textContent = "Kalendoriai patikrinti. Gali žaisti toliau arba uždaryti žaidimą.";
  });
})();
