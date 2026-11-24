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

  // Mostra banner de instalação logo após o login (definido em auth.js)
  if (typeof schedulePwaInstallBanner === "function") {
    schedulePwaInstallBanner();
  }
}

// Chamado depois do auth inicializar
window.addEventListener("load", () => {
  // Pequeno delay para auth.js ter rodado
  setTimeout(enablePwaForLoggedUser, 100);
});

// ===== Hero slideshow (leve) =====
// - Fotos base do site (vídeo aulas / marca)
// - + automaticamente qualquer software com imagem_url no Supabase
// - Sem pesar: 1 timer, fade CSS, lazy nas demais
(function initHeroSlider() {
  const root = document.getElementById("hero-slider");
  if (!root) return;

  const INTERVAL_MS = 8000;
  const dotsBox = document.getElementById("hero-slider-dots");

  // Fotos já hospedadas no site (sempre entram no slide)
  const SLIDES_BASE = [
    { src: "wilcom-e4.jpg", caption: "Wilcom e4" },
    { src: "wilcom-e2.jpg", caption: "Wilcom e2" },
    { src: "embird.jpg", caption: "Embird" },
    { src: "pedesign.jpg", caption: "PE-DESIGN" },
    { src: "icon-192.png", caption: "Softwares JDC", logo: true }
  ];

  let slidesData = SLIDES_BASE.slice();
  let index = 0;
  let timer = null;

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderSlides() {
    root.querySelectorAll(".hero-slide").forEach((el) => el.remove());

    slidesData.forEach((item, i) => {
      const div = document.createElement("div");
      div.className = "hero-slide" + (i === 0 ? " active" : "");
      const logoClass = item.logo ? ' class="hero-slide-logo"' : "";
      const lazy = i === 0 ? "" : ' loading="lazy"';
      div.innerHTML =
        '<img src="' + escapeHtml(item.src) + '" alt="' + escapeHtml(item.caption || "Software") +
        '" width="360" height="220" decoding="async"' + lazy + logoClass + ">" +
        '<span class="hero-slide-caption">' + escapeHtml(item.caption || "") + "</span>";
      root.insertBefore(div, dotsBox || null);
    });

    if (dotsBox) {
      dotsBox.innerHTML = "";
      slidesData.forEach((_, i) => {
        const d = document.createElement("span");
        if (i === 0) d.classList.add("active");
        dotsBox.appendChild(d);
      });
    }
    index = 0;
  }

  function goTo(n) {
    const slides = root.querySelectorAll(".hero-slide");
    if (!slides.length) return;
    if (slides[index]) slides[index].classList.remove("active");
    index = ((n % slides.length) + slides.length) % slides.length;
    slides[index].classList.add("active");
    if (dotsBox) {
      dotsBox.querySelectorAll("span").forEach((d, i) => {
        d.classList.toggle("active", i === index);
      });
    }
  }

  function start() {
    stop();
    if (slidesData.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    timer = setInterval(() => goTo(index + 1), INTERVAL_MS);
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  async function carregarFotosSoftwares() {
    try {
      if (typeof initSupabase === "function") initSupabase();
      const client =
        (typeof getSupabase === "function" && getSupabase()) ||
        window.jdcSb ||
        window.supabaseClient ||
        null;
      if (!client || !client.from) return;

      const { data, error } = await client
        .from("softwares")
        .select("nome, imagem_url, foto_url, ativo")
        .order("nome");

      if (error || !data) return;

      const extras = [];
      const seen = new Set(SLIDES_BASE.map((s) => s.src));

      data.forEach((s) => {
        if (s.ativo === false) return;
        const url = (s.imagem_url || s.foto_url || "").trim();
        if (!url || seen.has(url)) return;
        seen.add(url);
        extras.push({ src: url, caption: s.nome || "Software" });
      });

      if (!extras.length) return;

      slidesData = extras.concat(SLIDES_BASE);
      renderSlides();
      start();
    } catch (e) {
      console.log("Hero slides softwares:", e);
    }
  }

  renderSlides();
  start();
  setTimeout(carregarFotosSoftwares, 400);
  setTimeout(carregarFotosSoftwares, 2000);
})();
