// ===== Autenticação do Gestor - JDC =====
// Credenciais padrão (altere depois se quiser)
// Usuário: admin
// Senha: jdc2026

const GESTOR_USER = 'admin';
const GESTOR_PASS = 'jdc2026';
const STORAGE_KEY = 'jdc_gestor_session';

function loginGestor(username, password) {
  if (username === GESTOR_USER && password === GESTOR_PASS) {
    const session = {
      user: username,
      loggedAt: new Date().toISOString(),
      // sessão válida por 7 dias
      expires: Date.now() + (7 * 24 * 60 * 60 * 1000)
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return true;
  }
  return false;
}

function logoutGestor() {
  localStorage.removeItem(STORAGE_KEY);
  window.location.href = 'login.html';
}

function isGestorLoggedIn() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const session = JSON.parse(raw);
    if (Date.now() > session.expires) {
      localStorage.removeItem(STORAGE_KEY);
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

function requireGestorAuth() {
  if (!isGestorLoggedIn()) {
    window.location.href = 'login.html';
  }
}

function getGestorUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw).user;
  } catch (e) {
    return null;
  }
}
