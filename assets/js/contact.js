(() => {
  const email = (window.SOS && SOS.email) || "sostudy.klausk@gmail.com";
  document.querySelectorAll("[data-email]").forEach(a => {
    a.href = "mailto:" + email;
    const [user, domain] = email.split("@");
    a.textContent = user + "@";
    a.append(document.createElement("wbr"), domain);
  });
  document.getElementById("gmail").href = "https://mail.google.com/mail/?view=cm&to=" + encodeURIComponent(email);

  const toast = Object.assign(document.createElement("div"), { className: "toast" });
  toast.setAttribute("role", "status");
  document.body.append(toast);
  document.getElementById("copyMail").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(email); toast.textContent = "Adresas nukopijuotas"; }
    catch (e) { toast.textContent = "Nepavyko nukopijuoti. Adresas: " + email; }
    toast.classList.add("on");
    setTimeout(() => toast.classList.remove("on"), 2200);
  });
})();
