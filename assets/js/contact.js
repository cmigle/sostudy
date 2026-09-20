(() => {
  const email = (window.SOS && SOS.email) || "info@sostudy.lt";
  document.querySelectorAll("[data-email]").forEach(a => { a.href = "mailto:" + email; a.textContent = email; });
  document.getElementById("gmail").href = "https://mail.google.com/mail/?view=cm&to=" + encodeURIComponent(email);

  const toast = Object.assign(document.createElement("div"), { className: "toast", role: "status" });
  document.body.append(toast);
  document.getElementById("copyMail").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(email); toast.textContent = "Nukopijuota ✓"; }
    catch (e) { toast.textContent = email; }
    toast.classList.add("on");
    setTimeout(() => toast.classList.remove("on"), 1800);
  });
})();
