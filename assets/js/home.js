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

  /* ---------- Steps: pinned sideways scroll, only when there is room ---------- */
  ScrollTrigger.matchMedia({
    "(min-width: 761px) and (min-height: 601px)": () => {
      const track = document.getElementById("stepsTrack");
      const distance = () => Math.max(0, track.scrollWidth - document.documentElement.clientWidth);
      const move = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: ".steps-pin", start: "top top",
          end: () => "+=" + distance(),
          pin: true, scrub: .4, invalidateOnRefresh: true, anticipatePin: 1
        }
      });
      gsap.utils.toArray(".step").forEach((s, i) => gsap.from(s, {
        rotate: i % 2 ? 4 : -4, y: 40, ease: "power2.out",
        scrollTrigger: { trigger: s, containerAnimation: move, start: "left 100%", end: "left 60%", scrub: true }
      }));
    }
  });

  addEventListener("load", () => ScrollTrigger.refresh());
})();
