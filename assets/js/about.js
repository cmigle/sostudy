(() => {
  /* ---------- Manifesto: words light up as you scroll ---------- */
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
      const p = Math.min(1, Math.max(0, (innerHeight * .85 - r.top) / (r.height + innerHeight * .35)));
      const lit = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle("lit", i < lit));
    };
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) words.forEach(w => w.classList.add("lit"));
    else { addEventListener("scroll", update, { passive: true }); update(); }
  }

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
  const deep = location.hash && document.querySelector(`dialog${location.hash}`);
  if (deep) deep.showModal();

  /* ---------- LinkedIn posts ---------- */
  const grid = document.getElementById("liGrid");
  const posts = (window.SOS && SOS.linkedinPosts) || [];
  if (grid && posts.length) {
    grid.innerHTML = posts.map(urn =>
      `<iframe src="https://www.linkedin.com/embed/feed/update/${encodeURIComponent(urn).replace(/%3A/g, ":")}?collapsed=1" height="560" loading="lazy" title="SOStudy LinkedIn įrašas" allowfullscreen></iframe>`
    ).join("");
    document.getElementById("liEmpty").style.marginTop = "18px";
  }
})();
