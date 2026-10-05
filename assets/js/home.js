(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Dot-matrix glyphs (9x9) ---------- */
  const GLYPHS = {
    bolt: [
      "....###..",
      "...###...",
      "..###....",
      ".#######.",
      "....###..",
      "...###...",
      "..###....",
      ".##......",
      ".#......."
    ],
    clock: [
      "..#####..",
      ".#.....#.",
      "#...#...#",
      "#...#...#",
      "#...###.#",
      "#.......#",
      "#.......#",
      ".#.....#.",
      "..#####.."
    ],
    cap: [
      "....#....",
      "..#####..",
      "#########",
      "..#####.#",
      "...###..#",
      "..#####.#",
      "..#####.#",
      "...###..#",
      "........."
    ]
  };
  document.querySelectorAll("[data-glyph]").forEach(svg => {
    const g = GLYPHS[svg.dataset.glyph];
    let html = "", k = 0;
    g.forEach((row, y) => [...row].forEach((c, x) => {
      const on = c === "#";
      html += `<circle cx="${x + .5}" cy="${y + .5}" r="${on ? .4 : .12}" fill="${on ? (k++ % 7 === 0 ? "#ff4a4b" : "#1f1f1f") : "rgba(31,31,31,.25)"}"${on ? ` style="animation-delay:${(x + y) * 40}ms"` : ""}/>`;
    }));
    svg.innerHTML = html;
  });

  /* ---------- Hero car follows the mouse ---------- */
  const car = document.getElementById("car3d");
  if (car && !reduce && matchMedia("(pointer: fine)").matches) {
    addEventListener("pointermove", e => {
      const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
      car.style.transform = `rotateY(${x * 18}deg) rotateX(${-y * 12}deg) translateZ(0)`;
    }, { passive: true });
  }

  if (reduce || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Hero parallax on scroll ---------- */
  gsap.to(".car-stage", { yPercent: 25, scale: .9, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".hero h1", { yPercent: -20, opacity: .2, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

  /* ---------- Drive scene ---------- */
  const eta = document.getElementById("eta");
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: ".drive", start: "top top", end: "bottom bottom", scrub: .6,
      onUpdate: self => {
        const s = Math.round(self.progress * 180);
        eta.textContent = `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
      }
    }
  });
  tl.fromTo("#driveCar", { x: () => innerWidth + 50 }, { x: () => -document.getElementById("driveCar").offsetWidth - 50, ease: "none" }, 0)
    .fromTo(".drive-text h2", { scale: .85, opacity: .25 }, { scale: 1, opacity: 1, ease: "power2.out", duration: .4 }, 0)
    .fromTo(".road", { backgroundPositionX: 0 }, { backgroundPositionX: -800, ease: "none" }, 0);

  /* ---------- Horizontal steps ---------- */
  ScrollTrigger.matchMedia({
    "(min-width: 761px)": () => {
      const track = document.getElementById("stepsTrack");
      const move = gsap.to(track, {
        x: () => -(track.scrollWidth - innerWidth),
        ease: "none",
        scrollTrigger: { trigger: ".steps", start: "top top", end: () => "+=" + (track.scrollWidth - innerWidth), pin: true, scrub: .5, invalidateOnRefresh: true }
      });
      gsap.utils.toArray(".step").forEach((s, i) => gsap.from(s, {
        rotate: i % 2 ? 6 : -6, y: 60, ease: "power2.out",
        scrollTrigger: { trigger: s, containerAnimation: move, start: "left 95%", end: "left 50%", scrub: true }
      }));
    }
  });

  /* ---------- Big stats count-up ---------- */
  document.querySelectorAll(".stat .dot").forEach(el => {
    const m = el.textContent.match(/^(\d+)$/);
    if (!m) return;
    const o = { v: 0 };
    gsap.to(o, { v: +m[1], duration: 1.4, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 85%" }, onUpdate: () => { el.textContent = Math.round(o.v); } });
  });
})();
