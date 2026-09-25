const nav = document.querySelector(".nav");
const menuBtn = document.querySelector(".menu-btn");

menuBtn?.addEventListener("click", () => {
  const open = nav.classList.toggle("menu-open");
  menuBtn.setAttribute("aria-expanded", String(open));
  menuBtn.textContent = open ? "×" : "☰";
});

document.querySelectorAll(".nav nav a").forEach(link => {
  link.addEventListener("click", () => {
    nav.classList.remove("menu-open");
    menuBtn?.setAttribute("aria-expanded", "false");
    if (menuBtn) menuBtn.textContent = "☰";
  });
});

const observer = new IntersectionObserver(
  entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  }),
  { threshold: 0.12 }
);

document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

document.getElementById("year").textContent = new Date().getFullYear();
