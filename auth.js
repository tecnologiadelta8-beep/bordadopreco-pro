// ===== Autenticação unificada - JDC Bordados =====
// Suporta: Gestor e Cliente

const STORAGE_KEY = 'jdc_session';

// Credenciais do Gestor (pode alterar depois)
const GESTOR_CREDS = {
  usuario: 'admin',
  email: 'admin@jdc.com',
  senha: 'jdc2026',
  nome: 'Gestor Master'
};

// ===== Sessão =====
function saveSession(session) {
  const data = {
    ...session,
    loggedAt: new Date().toISOString(),
    expires: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 dias
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (Date.now() > session.expires) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return session;
  } catch (e) {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

function isLoggedIn() {
  return !!getSession();
}

function getUserRole() {
  const s = getSession();
  return s ? s.role : null;
}

function getUserName() {
  const s = getSession();
  return s ? s.nome : null;
}

function isGestor() {
  return getUserRole() === 'gestor';
}

function isCliente() {
  return getUserRole() === 'cliente';
}

// ===== Login Gestor =====
function loginGestor(usuarioOuEmail, senha) {
  const u = (usuarioOuEmail || '').trim().toLowerCase();
  const p = senha || '';

  const matchUser =
    u === GESTOR_CREDS.usuario.toLowerCase() ||
    u === GESTOR_CREDS.email.toLowerCase();

  if (matchUser && p === GESTOR_CREDS.senha) {
    saveSession({
      role: 'gestor',
      nome: GESTOR_CREDS.nome,
      usuario: GESTOR_CREDS.usuario,
      email: GESTOR_CREDS.email
    });
    return { ok: true, role: 'gestor' };
  }
  return { ok: false, msg: 'Usuário ou senha incorretos' };
}

// ===== Login Cliente (busca no Supabase) =====
// Cliente entra com e-mail OU telefone + senha definida no cadastro
async function loginCliente(emailOuTelefone, senha) {
  if (!window.supabase && typeof initSupabase === 'function') {
    initSupabase();
  }
  if (!supabase) {
    return { ok: false, msg: 'Não foi possível conectar ao banco. Tente novamente.' };
  }

  const termo = (emailOuTelefone || '').trim();
  if (!termo || !senha) {
    return { ok: false, msg: 'Preencha e-mail ou telefone e a senha' };
  }

  // Busca por e-mail ou telefone/whatsapp
  let query = supabase.from('clientes').select('*');

  if (termo.includes('@')) {
    query = query.ilike('email', termo);
  } else {
    const digits = termo.replace(/\D/g, '');
    if (!digits) {
      return { ok: false, msg: 'Informe um e-mail ou telefone válido' };
    }
    query = query.or(`telefone.ilike.%${digits}%,whatsapp.ilike.%${digits}%`);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error(error);
    return { ok: false, msg: 'Erro ao validar. Tente novamente.' };
  }

  if (!data) {
    return { ok: false, msg: 'Cliente não encontrado. Verifique e-mail ou telefone.' };
  }

  // Senha definida pelo cliente no cadastro (coluna senha)
  if (!data.senha) {
    return {
      ok: false,
      msg: 'Este cadastro ainda não tem senha. Peça ao gestor para definir uma senha.'
    };
  }

  if (String(data.senha) !== String(senha)) {
    return { ok: false, msg: 'Senha incorreta' };
  }

  saveSession({
    role: 'cliente',
    nome: data.nome || 'Cliente',
    email: data.email,
    cliente_id: data.id,
    telefone: data.telefone || data.whatsapp
  });

  return { ok: true, role: 'cliente', nome: data.nome };
}

// ===== Login unificado (tenta gestor primeiro, depois cliente) =====
async function loginUnificado(usuario, senha) {
  // 1. Tenta gestor
  const g = loginGestor(usuario, senha);
  if (g.ok) return g;

  // 2. Tenta cliente
  return await loginCliente(usuario, senha);
}

// ===== Logout =====
function logout() {
  clearSession();
  window.location.href = 'index.html';
}

// ===== Proteção de páginas =====
function requireGestorAuth() {
  if (!isGestor()) {
    window.location.href = 'login.html';
  }
}

function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = 'login.html';
  }
}

// Compatibilidade com código antigo
function isGestorLoggedIn() {
  return isGestor();
}

function getGestorUser() {
  return isGestor() ? getUserName() : null;
}

function logoutGestor() {
  logout();
}

// ===== UI do Header (botão Entrar / logado) =====
function renderAuthHeader(containerId) {
  const el = document.getElementById(containerId || 'auth-area');
  if (!el) return;

  const session = getSession();

  if (!session) {
    el.innerHTML = `
      <a href="login.html" class="btn-entrar">
        <i class="fas fa-sign-in-alt"></i> Entrar
      </a>
    `;
    return;
  }

  if (session.role === 'gestor') {
    el.innerHTML = `
      <div class="auth-logged">
        <span class="auth-greeting">
          <i class="fas fa-user-shield"></i>
          Olá, <strong>${session.nome}</strong>
        </span>
        <a href="admin.html" class="btn-area-gestor">
          <i class="fas fa-tachometer-alt"></i> Painel
        </a>
        <button type="button" class="btn-sair" onclick="logout()">
          Sair
        </button>
      </div>
    `;
  } else {
    // Cliente
    el.innerHTML = `
      <div class="auth-logged">
        <span class="auth-greeting">
          <i class="fas fa-user"></i>
          Olá, <strong>${session.nome}</strong>
        </span>
        <a href="download.html" class="btn-area-cliente">
          <i class="fas fa-download"></i> Meus Downloads
        </a>
        <button type="button" class="btn-sair" onclick="logout()">
          Sair
        </button>
      </div>
    `;
  }
}

// Banner superior opcional (estilo Compre Diamantino)
function renderAuthBanner() {
  const session = getSession();
  let banner = document.getElementById('auth-banner');

  if (!session) {
    if (banner) banner.remove();
    document.body.classList.remove('has-auth-banner');
    return;
  }

  document.body.classList.add('has-auth-banner');

  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'auth-banner';
    banner.className = 'auth-banner';
    document.body.insertBefore(banner, document.body.firstChild);
  }

  if (session.role === 'gestor') {
    banner.innerHTML = `
      <span>✓ Olá, <strong>${session.nome}</strong>! Você está logado como <strong>Gestor</strong>.</span>
      <div class="auth-banner-actions">
        <a href="admin.html">Painel do Gestor</a>
        <a href="admin-gestao.html">Gestão</a>
        <button type="button" onclick="logout()">Sair / Trocar conta</button>
      </div>
    `;
  } else {
    banner.innerHTML = `
      <span>✓ Olá, <strong>${session.nome}</strong>! Você está logado(a).</span>
      <div class="auth-banner-actions">
        <a href="download.html">Meus Downloads</a>
        <button type="button" onclick="logout()">Sair / Trocar conta</button>
      </div>
    `;
  }
}

// Inicializa UI de auth quando a página carregar
function initAuthUI() {
  renderAuthHeader('auth-area');
  // Faixa verde desativada — o cabeçalho já mostra o login
  const oldBanner = document.getElementById('auth-banner');
  if (oldBanner) oldBanner.remove();
  document.body.classList.remove('has-auth-banner');

  // PWA só para quem está logado
  if (typeof enablePwaForLoggedUser === 'function') {
    enablePwaForLoggedUser();
  }
}

// ===== PWA Install (aparece logo após o login) =====
let deferredInstallPrompt = null;
const PWA_INSTALL_DISMISSED_KEY = 'jdc_pwa_install_dismissed';

function isRunningAsPwa() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
}

function canShowInstallBanner() {
  if (isRunningAsPwa()) return false;
  if (!getSession()) return false;
  if (sessionStorage.getItem(PWA_INSTALL_DISMISSED_KEY) === '1') return false;
  // Só mostra se o navegador ofereceu o prompt OU se for iOS (instruções manuais)
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  return !!deferredInstallPrompt || isIOS;
}

function showPwaInstallBanner() {
  if (!canShowInstallBanner()) return;
  if (document.getElementById('jdc-pwa-install-banner')) return;

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const session = getSession();
  const appName = session && session.role === 'gestor' ? 'JDC Gestor' : 'JDC Bordados';

  const banner = document.createElement('div');
  banner.id = 'jdc-pwa-install-banner';
  banner.innerHTML = `
    <div class="jdc-pwa-card">
      <button type="button" class="jdc-pwa-close" aria-label="Fechar">&times;</button>
      <div class="jdc-pwa-icon"><i class="fas fa-mobile-alt"></i></div>
      <div class="jdc-pwa-text">
        <strong>Instalar ${appName}</strong>
        <span>${isIOS
          ? 'Toque em Compartilhar e depois em “Adicionar à Tela de Início”'
          : 'Acesse mais rápido, como um aplicativo no celular ou computador'}</span>
      </div>
      <div class="jdc-pwa-actions">
        ${isIOS
          ? '<button type="button" class="jdc-pwa-btn-secondary jdc-pwa-ok">Entendi</button>'
          : '<button type="button" class="jdc-pwa-btn-primary jdc-pwa-install">Instalar agora</button>'}
      </div>
    </div>
  `;

  // estilos inline para funcionar em admin.html (que não usa styles.css completo)
  if (!document.getElementById('jdc-pwa-install-style')) {
    const style = document.createElement('style');
    style.id = 'jdc-pwa-install-style';
    style.textContent = `
      #jdc-pwa-install-banner {
        position: fixed; left: 12px; right: 12px; bottom: 16px; z-index: 9999;
        display: flex; justify-content: center; pointer-events: none;
      }
      #jdc-pwa-install-banner .jdc-pwa-card {
        pointer-events: auto; max-width: 440px; width: 100%;
        background: linear-gradient(135deg, #fff9e6 0%, #fff 60%);
        border: 2px solid #f5c518; border-radius: 16px;
        box-shadow: 0 10px 40px rgba(10,31,77,0.25);
        padding: 16px 18px 14px; position: relative;
        display: grid; grid-template-columns: auto 1fr; gap: 10px 14px;
        align-items: center;
      }
      #jdc-pwa-install-banner .jdc-pwa-close {
        position: absolute; top: 6px; right: 10px; border: none; background: none;
        font-size: 1.5rem; line-height: 1; color: #94a3b8; cursor: pointer;
      }
      #jdc-pwa-install-banner .jdc-pwa-icon {
        width: 44px; height: 44px; border-radius: 12px; background: #0a1f4d;
        color: #f5c518; display: flex; align-items: center; justify-content: center;
        font-size: 1.25rem; grid-row: 1 / span 2;
      }
      #jdc-pwa-install-banner .jdc-pwa-text { grid-column: 2; padding-right: 18px; }
      #jdc-pwa-install-banner .jdc-pwa-text strong {
        display: block; color: #0a1f4d; font-size: 1rem; margin-bottom: 2px;
      }
      #jdc-pwa-install-banner .jdc-pwa-text span {
        display: block; color: #64748b; font-size: 0.85rem; line-height: 1.35;
      }
      #jdc-pwa-install-banner .jdc-pwa-actions { grid-column: 2; }
      #jdc-pwa-install-banner .jdc-pwa-btn-primary {
        background: #f5c518; color: #0a1f4d; border: none; border-radius: 10px;
        font-weight: 700; padding: 10px 16px; cursor: pointer; width: 100%;
        font-size: 0.95rem;
      }
      #jdc-pwa-install-banner .jdc-pwa-btn-primary:hover { filter: brightness(1.05); }
      #jdc-pwa-install-banner .jdc-pwa-btn-secondary {
        background: #0a1f4d; color: #fff; border: none; border-radius: 10px;
        font-weight: 700; padding: 10px 16px; cursor: pointer; width: 100%;
        font-size: 0.95rem;
      }
      @media (min-width: 640px) {
        #jdc-pwa-install-banner { left: auto; right: 20px; bottom: 24px; width: 400px; }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(banner);

  banner.querySelector('.jdc-pwa-close').addEventListener('click', () => {
    sessionStorage.setItem(PWA_INSTALL_DISMISSED_KEY, '1');
    banner.remove();
  });

  const okBtn = banner.querySelector('.jdc-pwa-ok');
  if (okBtn) {
    okBtn.addEventListener('click', () => {
      sessionStorage.setItem(PWA_INSTALL_DISMISSED_KEY, '1');
      banner.remove();
    });
  }

  const installBtn = banner.querySelector('.jdc-pwa-install');
  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!deferredInstallPrompt) {
        banner.remove();
        return;
      }
      deferredInstallPrompt.prompt();
      try {
        const choice = await deferredInstallPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          sessionStorage.setItem(PWA_INSTALL_DISMISSED_KEY, '1');
        }
      } catch (_) {}
      deferredInstallPrompt = null;
      banner.remove();
    });
  }
}

function schedulePwaInstallBanner() {
  // Espera um pouco após o login/redirect para o SW e o prompt estarem prontos
  setTimeout(() => showPwaInstallBanner(), 600);
  setTimeout(() => showPwaInstallBanner(), 2000);
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    // Pequeno delay para garantir que supabase-config.js já rodou
    setTimeout(initAuthUI, 50);
    // Se já estiver logado nesta página, tenta mostrar o banner
    setTimeout(() => {
      if (getSession()) schedulePwaInstallBanner();
    }, 200);
  });

  // Captura o evento nativo (Chrome/Edge/Android)
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    // Só mostra o banner se estiver logado
    if (typeof getSession === 'function' && getSession()) {
      schedulePwaInstallBanner();
    }
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    sessionStorage.setItem(PWA_INSTALL_DISMISSED_KEY, '1');
    const el = document.getElementById('jdc-pwa-install-banner');
    if (el) el.remove();
  });
}
