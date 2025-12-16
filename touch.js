// year in footer
document.getElementById("year").textContent = new Date().getFullYear();

// mobile nav
const hamburger = document.getElementById("hamburger");
const mobileNav = document.getElementById("mobile-nav");
hamburger?.addEventListener("click", () => {
  mobileNav.classList.toggle("hidden");
});

// smooth scroll for in-page links
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener("click", e => {
    const target = document.querySelector(a.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    mobileNav?.classList.add("hidden");
  });
});

// form toast (works with Formspree redirect disabled)
const form = document.getElementById("quote-form");
if (form) {
  form.addEventListener("submit", async (e) => {
    // If you want to let Formspree redirect, comment this out entirely.
    e.preventDefault();

    const data = new FormData(form);
    // honeypot quick check
    if (data.get("_gotcha")) return;

    try {
      const res = await fetch(form.action, { method: "POST", body: data, headers: { Accept: "application/json" } });
      showToast(res.ok ? "Message sent! We’ll get back to you soon." : "Something went wrong. Please call (276) 690-8331.");
      if (res.ok) form.reset();
    } catch {
      showToast("Network error. Please call (276) 690-8331.");
    }
  });
}

function showToast(msg) {
  const el = document.createElement("div");
  el.className = "fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm";
  el.innerHTML = `
    <div class="bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-lg text-center animate-[fade_.25s_ease]">
      ${msg}
    </div>`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

// Add sticky mobile CTA
const stickyBtn = document.createElement("a");
stickyBtn.href = "tel:2766908331";
stickyBtn.className = "md:hidden fixed bottom-4 right-4 z-50 bg-emerald-700 text-white px-6 py-4 rounded-full shadow-2xl font-bold text-sm hover:bg-emerald-800 transition-all animate-fadeIn flex items-center gap-2";
stickyBtn.innerHTML = "📞 Call Now";
document.body.appendChild(stickyBtn);

