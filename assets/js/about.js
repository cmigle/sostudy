(() => {
  /* ---------- Mission sentence lights up word by word as you scroll ---------- */
  const m = document.getElementById("manifesto");
  if (m) {
    const words = [];
    [...m.childNodes].forEach(n => {
      const red = n.nodeType === 1 && n.classList.contains("red");
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(t => {
        if (!t) return;
        if (/^\s+$/.test(t)) return frag.append(" ");
        const s = document.createElement("span");
        s.className = "w" + (red ? " red" : "");
        s.textContent = t;
        words.push(s);
        frag.append(s);
      });
      n.replaceWith(frag);
    });
    const update = () => {
      const r = m.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight * .85 - r.top) / (r.height + innerHeight * .3)));
      const lit = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle("lit", i < lit));
    };
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) words.forEach(w => w.classList.add("lit"));
    else {
      let active = false, ticking = false;
      const onScroll = () => {
        if (!active || ticking) return;
        ticking = true;
        requestAnimationFrame(() => { update(); ticking = false; });
      };
      new IntersectionObserver(([e]) => { active = e.isIntersecting; if (active) update(); }).observe(m);
      addEventListener("scroll", onScroll, { passive: true });
    }
  }

  /* ---------- Team cards flip to show experience ---------- */
  document.querySelectorAll("[data-flip]").forEach(card => {
    const front = card.querySelector(".front"), back = card.querySelector(".back");
    const toggle = card.querySelector(".front .flip-btn");
    const set = on => {
      card.classList.toggle("flipped", on);
      front.inert = on; back.inert = !on;
      toggle.setAttribute("aria-expanded", on);
      (on ? back.querySelector("a") : toggle).focus({ preventScroll: true });
    };
    back.inert = true;
    card.addEventListener("click", e => {
      if (e.target.closest("a")) return;
      set(!card.classList.contains("flipped"));
    });
  });

  /* ---------- Articles ---------- */
  document.querySelectorAll("[data-open]").forEach(b => b.addEventListener("click", () => {
    const d = document.getElementById(b.dataset.open);
    d.showModal();
    history.replaceState(null, "", "#" + d.id);
  }));
  document.querySelectorAll("dialog.article").forEach(d => {
    d.querySelector(".article-close").addEventListener("click", () => d.close());
    d.addEventListener("click", e => { if (e.target === d) d.close(); });
    d.addEventListener("close", () => history.replaceState(null, "", location.pathname + "#kelione"));
  });
  const deep = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (deep && deep.tagName === "DIALOG") deep.showModal();

  /* ---------- LinkedIn posts: load only after a click (LinkedIn sets cookies) ---------- */
  const grid = document.getElementById("liGrid");
  const loadBtn = document.getElementById("liLoad");
  const posts = (window.SOS && SOS.linkedinPosts) || [];
  if (grid && loadBtn && posts.length) {
    loadBtn.hidden = false;
    loadBtn.addEventListener("click", () => {
      grid.innerHTML = posts.map(urn =>
        `<iframe src="https://www.linkedin.com/embed/feed/update/${urn}?collapsed=1" height="560" loading="lazy" title="SOStudy įrašas „LinkedIn“" allowfullscreen></iframe>`
      ).join("");
      loadBtn.remove();
    });
  }
})();
