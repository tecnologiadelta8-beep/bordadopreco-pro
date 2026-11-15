// ===== JDC Tecnologia em Bordados - App JS =====

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

// ===== PWA só para usuários logados =====
// Visitante não recebe manifest nem service worker → não aparece "Instalar app"
function enablePwaForLoggedUser() {
  // Só roda se auth.js estiver disponível e houver sessão
  if (typeof getSession !== "function") return;
  const session = getSession();
  if (!session) return;

  // Adiciona / garante o manifest
  let link = document.querySelector('link[rel="manifest"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "manifest";
    document.head.appendChild(link);
  }
  // Gestor usa o manifest do gestor; cliente usa o público
  link.href = session.role === "gestor" ? "manifest-gestor.json" : "manifest.json";

  // Registra o service worker correspondente
  if ("serviceWorker" in navigator) {
    const swFile = session.role === "gestor" ? "sw-gestor.js" : "sw.js";
    navigator.serviceWorker.register(swFile).catch(() => {});
  }
}

// Chamado depois do auth inicializar
window.addEventListener("load", () => {
  // Pequeno delay para auth.js ter rodado
  setTimeout(enablePwaForLoggedUser, 100);
});
