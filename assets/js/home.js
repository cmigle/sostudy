(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Hero car follows the mouse ---------- */
  const car = document.getElementById("car3d");
  if (car && !reduce && matchMedia("(pointer: fine)").matches) {
    addEventListener("pointermove", e => {
      const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
      car.style.transform = `rotateY(${x * 16}deg) rotateX(${-y * 10}deg)`;
    }, { passive: true });
  }

  /* ---------- Steps: card stack, click or arrows ---------- */
  const stack = document.getElementById("stack");
  if (stack) {
    const cards = [...stack.querySelectorAll(".step")];
    const count = document.getElementById("stackCount");
    let front = 0, busy = false;
    stack.tabIndex = 0;
    stack.setAttribute("role", "region");
    stack.setAttribute("aria-roledescription", "kortelių rinkinys");
    stack.setAttribute("aria-label", "Konsultacijos žingsniai");
    const layout = () => {
      cards.forEach((c, i) => {
        const k = (i - front + cards.length) % cards.length;
        c.style.setProperty("--k", k);
        c.inert = k !== 0;
      });
      count.textContent = `${front + 1} / ${cards.length}`;
    };
    const wait = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));
    async function go(dir) {
      if (busy) return;
      busy = true;
      if (dir > 0) {
        // front card flies out, then tucks in at the back
        const c = cards[front];
        c.classList.add("out");
        await wait(320);
        front = (front + 1) % cards.length;
        layout();
        c.classList.remove("out");
      } else {
        // back card flies in from the left onto the front
        front = (front - 1 + cards.length) % cards.length;
        const c = cards[front];
        c.classList.add("instant", "out");
        c.offsetWidth;
        c.classList.remove("instant");
        layout();
        c.classList.remove("out");
      }
      await wait(350);
      busy = false;
    }
    layout();
    stack.addEventListener("click", () => go(1));
    document.getElementById("stackNext").addEventListener("click", () => go(1));
    document.getElementById("stackPrev").addEventListener("click", () => go(-1));
    stack.addEventListener("keydown", e => {
      if (e.key === "ArrowRight" || e.key === "Enter" || e.key === " ") { e.preventDefault(); go(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
    });
    // swipe on touch screens
    let sx = null;
    stack.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse") sx = e.clientX; });
    stack.addEventListener("pointerup", e => {
      if (sx === null) return;
      const dx = e.clientX - sx; sx = null;
      if (Math.abs(dx) > 40) { e.preventDefault(); go(dx < 0 ? 1 : -1); stack.dataset.swiped = 1; }
    });
    stack.addEventListener("click", e => { if (stack.dataset.swiped) { e.stopImmediatePropagation(); delete stack.dataset.swiped; } }, true);
  }

  if (reduce || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Car leaves the hero as you scroll ---------- */
  gsap.to(".car-stage", { xPercent: -18, yPercent: 10, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

  /* ---------- Notebook: the solution writes itself as you scroll ---------- */
  const steps = [];
  document.querySelectorAll(".nb-line, .nb-check").forEach(el => {
    steps.push([el.querySelector(".m") || el, "write"]);
    const note = el.querySelector(".note");
    if (note) steps.push([note, "fade"]);
    if (el.classList.contains("nb-ans")) steps.push([el.querySelector(".ring path"), "ring"]);
  });
  const anim = (tl, [el, kind], at) => {
    if (kind === "write") tl.fromTo(el, { clipPath: "inset(-10% 100% -10% 0)" }, { clipPath: "inset(-10% 0% -10% 0)", ease: "none", duration: 1 }, at);
    else if (kind === "fade") tl.fromTo(el, { opacity: 0, y: 8 }, { opacity: 1, y: 0, ease: "power1.out", duration: .6 }, at);
    else tl.fromTo(el, { strokeDasharray: "1 1", strokeDashoffset: 1, opacity: 0 }, { strokeDashoffset: 0, opacity: 1, ease: "power1.inOut", duration: 1 }, at);
  };
  ScrollTrigger.matchMedia({
    // pinned: the page stays put while the steps appear
    "(min-width: 861px) and (min-height: 601px)": () => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: ".solve", start: "top top", end: "bottom bottom", scrub: .5 } });
      tl.to({}, { duration: .4 });
      steps.forEach(s => anim(tl, s));
      tl.to({}, { duration: .6 });
    },
    // small or short screens: each step appears as it scrolls into view
    "(max-width: 860px), (max-height: 600px)": () => {
      steps.forEach(s => anim(gsap.timeline({ scrollTrigger: { trigger: s[0].closest(".nb-line, .nb-check"), start: "top 88%", end: "top 62%", scrub: .5 } }), s, 0));
    }
  });

  addEventListener("load", () => ScrollTrigger.refresh());
})();
