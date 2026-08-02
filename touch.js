const siteHeader = document.getElementById("site-header");
const hamburger = document.getElementById("hamburger");
const mobileNav = document.getElementById("mobile-nav");

function setMenu(open) {
  if (!hamburger || !mobileNav) return;
  hamburger.setAttribute("aria-expanded", String(open));
  hamburger.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  hamburger.classList.toggle("is-open", open);
  mobileNav.classList.toggle("hidden", !open);
  document.body.classList.toggle("menu-open", open);
}

hamburger?.addEventListener("click", () => {
  setMenu(hamburger.getAttribute("aria-expanded") !== "true");
});

mobileNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setMenu(false));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setMenu(false);
});

window.addEventListener("resize", () => {
  if (window.innerWidth >= 1024) setMenu(false);
});

function updateHeader() {
  siteHeader?.classList.toggle("is-scrolled", window.scrollY > 16);
}

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

const revealItems = document.querySelectorAll("[data-reveal]");
if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  document.body.classList.add("reveal-ready");
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

  revealItems.forEach((item) => revealObserver.observe(item));
}

document.querySelectorAll(".faq-list details").forEach((item) => {
  item.addEventListener("toggle", () => {
    if (!item.open) return;
    document.querySelectorAll(".faq-list details").forEach((other) => {
      if (other !== item) other.open = false;
    });
  });
});

const form = document.getElementById("quote-form");
if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    if (data.get("_gotcha")) return;

    const button = form.querySelector('button[type="submit"]');
    const originalButtonContent = button?.innerHTML;
    if (button) {
      button.disabled = true;
      button.textContent = "Sending request…";
    }

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" }
      });

      if (!response.ok) throw new Error("Submission failed");
      form.reset();
      showToast("Request received", "Thank you. Our team will follow up with you shortly.");
    } catch {
      showToast("We couldn’t send that", "Please call or text us at (276) 690-8331 and we’ll help right away.");
    } finally {
      if (button) {
        button.disabled = false;
        button.innerHTML = originalButtonContent;
      }
    }
  });
}

function showToast(title, message) {
  const overlay = document.createElement("div");
  overlay.className = "toast-overlay";
  overlay.setAttribute("role", "alert");
  overlay.setAttribute("aria-live", "assertive");

  const card = document.createElement("div");
  card.className = "toast-card";

  const heading = document.createElement("strong");
  heading.textContent = title;

  const copy = document.createElement("p");
  copy.textContent = message;

  card.append(heading, copy);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.addEventListener("click", close);
  window.setTimeout(close, 4200);
}
