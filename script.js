
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

// Testimonial Slider
document.addEventListener("DOMContentLoaded", () => {
  const slider = document.querySelector('.slider');
  const slides = document.querySelectorAll('.slide');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  let index = 0;
  const total = slides.length;
  let interval;

  function updateSlider() {
    slider.style.transform = `translateX(${-index * 100}%)`;
  }

  function startAutoSlide() {
    interval = setInterval(() => {
      index = (index + 1) % total;
      updateSlider();
    }, 7000);
  }

  function resetAutoSlide() {
    clearInterval(interval);
    startAutoSlide();
  }

  prevBtn.addEventListener('click', () => {
    index = (index - 1 + total) % total;
    updateSlider();
    resetAutoSlide();
  });

  nextBtn.addEventListener('click', () => {
    index = (index + 1) % total;
    updateSlider();
    resetAutoSlide();
  });

  updateSlider();
  startAutoSlide();
});

