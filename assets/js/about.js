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

  /* ---------- LinkedIn posts: sideways scroller, each card opens the post ---------- */
  const track = document.getElementById("liTrack");
  if (track) {
    const nav = document.getElementById("liNav");
    const fmt = new Intl.DateTimeFormat("lt-LT", { year: "numeric", month: "long", day: "numeric", timeZone: "Europe/Vilnius" });
    const esc = s => String(s).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[ch]));
    const load = url => fetch(url).then(r => r.ok ? r.json() : Promise.reject(r.status));
    const feed = window.SOS && SOS.linkedinFeed;
    (feed ? load(feed).catch(() => load("/assets/data/linkedin.json")) : load("/assets/data/linkedin.json"))
      .then(data => {
        const posts = (data.posts || []).filter(p => p.url && p.text);
        if (!posts.length) return;
        track.innerHTML = posts.map(p => `
          <a class="li-card" href="${esc(p.url)}" target="_blank" rel="noopener" data-cursor="Atidaryti">
            ${p.image ? `<div class="li-img"><img src="${esc(p.image)}" alt="" loading="lazy" referrerpolicy="no-referrer"></div>` : ""}
            <div class="li-body">
              <p class="li-meta">${esc([p.author, fmt.format(p.date)].filter(Boolean).join(" · "))}</p>
              <p class="li-text">${esc(p.text)}</p>
              <span class="li-more">Skaityti „LinkedIn“ ↗</span>
            </div>
          </a>`).join("");
        track.querySelectorAll("img").forEach(img => img.addEventListener("error", () => img.parentNode.remove()));
        track.hidden = false;
        const update = () => {
          const max = track.scrollWidth - track.clientWidth - 2;
          nav.hidden = max <= 0;
          nav.querySelector("[data-dir=\"-1\"]").disabled = track.scrollLeft <= 2;
          nav.querySelector("[data-dir=\"1\"]").disabled = track.scrollLeft >= max;
        };
        nav.querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
          const card = track.querySelector(".li-card");
          track.scrollBy({ left: +b.dataset.dir * (card.offsetWidth + 16), behavior: "smooth" });
        }));
        track.addEventListener("scroll", update, { passive: true });
        addEventListener("resize", update);
        update();
      })
      .catch(() => {});
  }
})();
