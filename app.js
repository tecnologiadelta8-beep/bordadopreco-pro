// ===== JDC Tecnologia em Bordados - App JS =====

// Service Worker básico (sem prompt de instalação para cliente)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(err => {
      console.log("SW registration failed:", err);
    });
  });
}

// Mobile Menu
const menuToggle = document.getElementById("menu-toggle");
const nav = document.getElementById("nav");

if (menuToggle && nav) {
  menuToggle.addEventListener("click", () => {
    nav.classList.toggle("active");
    const icon = menuToggle.querySelector("i");
    if (nav.classList.contains("active")) {
      icon.classList.remove("fa-bars");
      icon.classList.add("fa-times");
    } else {
      icon.classList.remove("fa-times");
      icon.classList.add("fa-bars");
    }
  });

  nav.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
      nav.classList.remove("active");
      const icon = menuToggle.querySelector("i");
      icon.classList.remove("fa-times");
      icon.classList.add("fa-bars");
    });
  });
}

// Header scroll effect
const header = document.getElementById("header");
if (header) {
  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      header.style.background = "rgba(10, 31, 77, 0.98)";
      header.style.boxShadow = "0 4px 30px rgba(0,0,0,0.25)";
    } else {
      header.style.background = "rgba(10, 31, 77, 0.95)";
      header.style.boxShadow = "0 2px 20px rgba(0,0,0,0.15)";
    }
  });
}
