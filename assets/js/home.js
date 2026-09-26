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

  /* ---------- Drive scene ---------- */
  const driveCar = document.getElementById("driveCar");
  gsap.timeline({ scrollTrigger: { trigger: ".drive", start: "top top", end: "bottom bottom", scrub: .6, invalidateOnRefresh: true } })
    .fromTo(driveCar, { x: () => innerWidth + 40 }, { x: () => -driveCar.offsetWidth - 40, ease: "none" }, 0)
    .fromTo(".road", { backgroundPositionX: 0 }, { backgroundPositionX: -900, ease: "none" }, 0)
    .to("#driveCar .wheel", { rotation: -1440, transformOrigin: "50% 50%", ease: "none" }, 0);

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
