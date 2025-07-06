
// Theme Toggle
const toggle = document.getElementById('theme-toggle');
toggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  document.body.classList.toggle('light-mode');
  toggle.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
});
// Start light mode
document.body.classList.add('light-mode');

// Scroll Progress Bar
window.addEventListener('scroll', () => {
  const scrolled = window.scrollY;
  const total = document.body.scrollHeight - window.innerHeight;
  const pct = (scrolled / total) * 100;
  document.getElementById('progress-bar').style.width = pct + '%';
});

// Fade-in sections on scroll
const faders = document.querySelectorAll('.fade-in');
const options = { threshold: 0.2, rootMargin: "0px 0px -50px 0px" };
const obs = new IntersectionObserver((entries, o) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      o.unobserve(entry.target);
    }
  });
}, options);
faders.forEach(f => obs.observe(f));