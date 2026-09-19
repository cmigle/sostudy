// Shared submit for every .form on the site. Posts to SOS.formEndpoint (send.php or Formspree).
(() => {
  document.querySelectorAll("form.form").forEach(form => {
    const msg = form.querySelector(".form-msg");
    const btn = form.querySelector("[type=submit]");
    const sent = document.getElementById(form.dataset.sent || "sent");

    form.addEventListener("submit", async e => {
      e.preventDefault();
      msg.className = "form-msg";
      if (!form.checkValidity()) {
        form.querySelectorAll(":invalid").forEach(el => el.classList.add("touched"));
        form.querySelector(":invalid").focus();
        msg.textContent = "Užpildyk pažymėtus laukus.";
        msg.classList.add("err");
        return;
      }
      const fd = new FormData(form);
      if (form._photo) fd.set("nuotrauka", form._photo, form._photo.name);
      else if (fd.get("nuotrauka") && !fd.get("nuotrauka").size) fd.delete("nuotrauka");

      btn.disabled = true;
      msg.textContent = "Siunčiama…";
      try {
        const res = await fetch((window.SOS && SOS.formEndpoint) || form.action, {
          method: "POST", body: fd, headers: { Accept: "application/json" }
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.ok === false) throw new Error(data.error || (data.errors && data.errors.map(x => x.message).join(", ")) || res.status);
        if (sent) {
          const em = sent.querySelector("#sentEmail");
          if (em) em.textContent = fd.get("email");
          form.hidden = true;
          sent.classList.add("on");
          sent.focus({ preventScroll: true });
          sent.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          form.reset();
          msg.textContent = "Išsiųsta! Atsakysime kuo greičiau.";
        }
      } catch (err) {
        msg.textContent = "Nepavyko išsiųsti. Pabandyk dar kartą arba rašyk info@sostudy.lt.";
        msg.classList.add("err");
        console.error(err);
      } finally {
        btn.disabled = false;
      }
    });
  });
})();
