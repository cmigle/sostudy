// Shared submit for every .form on the site. Posts to SOS.formEndpoint (send.php or Formspree).
(() => {
  function message(el) {
    if (el.type === "checkbox") return "Pažymėk, kad sutinki. Kitaip negalėsime atsakyti.";
    if (el.validity.valueMissing) return "Šį lauką reikia užpildyti.";
    if (el.validity.typeMismatch) return "Patikrink el. pašto adresą, pvz., vardas@gmail.com.";
    return el.validationMessage;
  }
  function mark(el) {
    const box = el.closest(".field, .check");
    if (!box) return;
    let err = box.querySelector(".err");
    if (el.validity.valid) { box.classList.remove("invalid"); err && err.remove(); el.removeAttribute("aria-invalid"); return; }
    box.classList.add("invalid");
    el.setAttribute("aria-invalid", "true");
    if (!err) {
      err = Object.assign(document.createElement("span"), { className: "err", id: el.name + "-err" });
      (box.classList.contains("check") ? box.querySelector("span") : box).append(err);
      el.setAttribute("aria-describedby", err.id);
    }
    err.textContent = message(el);
  }

  const post = (url, body) => fetch(url, { method: "POST", body, headers: { Accept: "application/json" } })
    .then(r => r.json().then(d => ({ ok: r.ok, d }), () => ({ ok: false, d: {} })));

  // send.php first; if it is missing or fails, FormSubmit (and without the photo if that is refused)
  async function deliver(fd, action) {
    const S = window.SOS || {};
    try {
      const r = await post(S.formEndpoint || action, fd);
      if (r.ok && r.d.ok === true) return;
      if (r.d.error) console.warn(r.d.error);
    } catch (e) {}
    if (!S.formFallback) throw new Error("no fallback");
    const photo = fd.get("nuotrauka");
    if (photo && photo.size) return nativeFallback(fd, S.formFallback.replace("/ajax/", "/"));
    const alt = new FormData();
    for (const [k, v] of fd) {
      if (k === "_gotcha") { if (v) return; continue; }        // bot: drop quietly
      if (k === "nuotrauka") alt.append("attachment", v, v.name);
      else alt.append(k, v);
    }
    alt.set("_replyto", fd.get("email") || "");
    alt.set("_template", "table");
    alt.set("_captcha", "false");
    let r = await post(S.formFallback, alt);
    if (!(r.ok && String(r.d.success) === "true") && alt.has("attachment")) {
      alt.delete("attachment");
      alt.set("nuotrauka", "Mokinys pridėjo nuotrauką, bet jos išsiųsti nepavyko. Paprašyk atsiųsti ją atsakant į šį laišką.");
      r = await post(S.formFallback, alt);
    }
    if (!(r.ok && String(r.d.success) === "true")) throw new Error(r.d.message || "fallback failed");
  }

  // FormSubmit only accepts files in a normal (page-changing) form post. The page comes back with ?issiusta=1.
  function nativeFallback(fd, url) {
    const f = Object.assign(document.createElement("form"), { method: "post", action: url, enctype: "multipart/form-data", hidden: true });
    const add = (name, value) => f.append(Object.assign(document.createElement("input"), { type: "hidden", name, value }));
    for (const [k, v] of fd) {
      if (k === "_gotcha") { if (v) return new Promise(() => {}); continue; }
      if (v instanceof File) {
        const input = Object.assign(document.createElement("input"), { type: "file", name: "attachment" });
        const dt = new DataTransfer(); dt.items.add(v); input.files = dt.files;
        f.append(input);
      } else add(k, v);
    }
    add("_replyto", fd.get("email") || "");
    add("_template", "table");
    add("_captcha", "false");
    add("_next", location.origin + location.pathname + "?issiusta=1");
    try { sessionStorage.setItem("sos-sent-email", fd.get("email") || ""); } catch (e) {}
    document.body.append(f);
    f.submit();
    return new Promise(() => {}); // the page is leaving
  }

  // Coming back from FormSubmit: show the success screen
  if (/[?&]issiusta=1/.test(location.search)) {
    const form = document.querySelector("form.form[data-sent]");
    const sent = form && document.getElementById(form.dataset.sent);
    if (sent) {
      let email = "";
      try { email = sessionStorage.getItem("sos-sent-email") || ""; sessionStorage.removeItem("sos-sent-email"); } catch (e) {}
      const em = sent.querySelector("[data-sent-email]");
      if (em) { if (email) em.textContent = email; else em.replaceWith(", kurį nurodei"); }
      form.hidden = true;
      sent.classList.add("on");
      history.replaceState(null, "", location.pathname);
      requestAnimationFrame(() => sent.scrollIntoView({ block: "center" }));
    }
  }

  document.querySelectorAll("form.form").forEach(form => {
    const msg = form.querySelector(".form-foot .form-msg");
    const btn = form.querySelector("[type=submit]");
    const btnText = btn.innerHTML;
    const sent = form.dataset.sent ? document.getElementById(form.dataset.sent) : null;

    form.addEventListener("input", e => { if (e.target.closest(".invalid")) mark(e.target); });
    form.addEventListener("change", e => { if (e.target.closest(".invalid")) mark(e.target); });

    form.addEventListener("submit", async e => {
      e.preventDefault();
      msg.className = "form-msg";
      msg.textContent = "";
      const fields = [...form.querySelectorAll("input, textarea, select")].filter(el => el.willValidate);
      fields.forEach(mark);
      const bad = fields.find(el => !el.validity.valid);
      if (bad) { bad.focus(); return; }

      const fd = new FormData(form);
      if (form._photo) fd.set("nuotrauka", form._photo, form._photo.name);
      else if (fd.get("nuotrauka") && !fd.get("nuotrauka").size) fd.delete("nuotrauka");

      btn.disabled = true;
      btn.textContent = "Siunčiama…";
      try {
        await deliver(fd, form.action);
        if (sent) {
          const em = sent.querySelector("[data-sent-email]");
          if (em) em.textContent = fd.get("email");
          form.hidden = true;
          sent.classList.add("on");
          sent.focus({ preventScroll: true });
          sent.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          form.reset();
          msg.textContent = "Žinutę gavome. Atsakysime el. paštu.";
        }
      } catch (err) {
        msg.textContent = "Nepavyko išsiųsti. Patikrink interneto ryšį ir bandyk dar kartą arba rašyk sostudy.klausk@gmail.com.";
        msg.classList.add("err");
        console.error(err);
      } finally {
        btn.disabled = false;
        btn.innerHTML = btnText;
      }
    });
  });
})();
