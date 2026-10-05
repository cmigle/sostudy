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
        const res = await fetch((window.SOS && SOS.formEndpoint) || form.action, {
          method: "POST", body: fd, headers: { Accept: "application/json" }
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.ok !== true) throw new Error(data.error || res.status);
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
