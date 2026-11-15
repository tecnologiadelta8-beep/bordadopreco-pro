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
async function loginCliente(emailOuTelefone, senha) {
  if (!window.supabase && typeof initSupabase === 'function') {
    initSupabase();
  }
  if (!supabase) {
    return { ok: false, msg: 'Não foi possível conectar ao banco. Tente novamente.' };
  }

  const termo = (emailOuTelefone || '').trim();
  if (!termo || !senha) {
    return { ok: false, msg: 'Preencha e-mail/telefone e senha' };
  }

  // Busca por e-mail ou telefone/whatsapp
  let query = supabase.from('clientes').select('*');

  if (termo.includes('@')) {
    query = query.eq('email', termo);
  } else {
    // tenta telefone ou whatsapp (só números)
    const digits = termo.replace(/\D/g, '');
    query = query.or(`telefone.ilike.%${digits}%,whatsapp.ilike.%${digits}%`);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error(error);
    return { ok: false, msg: 'Erro ao validar. Tente novamente.' };
  }

  if (!data) {
    return { ok: false, msg: 'Cliente não encontrado. Verifique os dados.' };
  }

  // Senha: se a tabela tiver coluna "senha", usa ela.
  // Caso contrário, usa os últimos 4 dígitos do telefone/whatsapp como senha padrão
  // (você pode cadastrar uma senha real depois adicionando a coluna)
  let senhaOk = false;

  if (data.senha) {
    senhaOk = String(data.senha) === String(senha);
  } else {
    // fallback: últimos 4 dígitos do telefone ou whatsapp
    const tel = (data.telefone || data.whatsapp || '').replace(/\D/g, '');
    const ultimos4 = tel.slice(-4);
    senhaOk = ultimos4 && ultimos4 === String(senha).replace(/\D/g, '');
  }

  if (!senhaOk) {
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
  renderAuthBanner();
  // PWA só para quem está logado
  if (typeof enablePwaForLoggedUser === 'function') {
    enablePwaForLoggedUser();
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    // Pequeno delay para garantir que supabase-config.js já rodou
    setTimeout(initAuthUI, 50);
  });

  // Bloqueia o prompt nativo de instalar PWA para visitantes
  window.addEventListener('beforeinstallprompt', (e) => {
    if (typeof getSession === 'function' && getSession()) {
      // logado → deixa o navegador decidir
      return;
    }
    // visitante → impede o mini-infobar / prompt
    e.preventDefault();
  });
}
