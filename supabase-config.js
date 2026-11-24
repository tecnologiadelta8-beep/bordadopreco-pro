// ===== Configuração Supabase - JDC Bordados =====
// Projeto: jdc-bordados

const SUPABASE_URL = 'https://yctlrwezvjbuvropktuw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljdGxyd2V6dmpidXZyb3BrdHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ3MDE0OTQsImV4cCI6MjExMDI3NzQ5NH0.J_2IOb8kcHcViJK4ie3X3O2Mutk9WD_0nZYH_mMunxU';

// Cliente (não sobrescreve a lib window.supabase do CDN)
var supabase = null;

function initSupabase() {
  try {
    var lib = (typeof window !== 'undefined') ? window.supabase : null;
    // CDN UMD: window.supabase.createClient
    if (!lib || typeof lib.createClient !== 'function') {
      console.error('Biblioteca Supabase não carregada. Verifique o script CDN no HTML.');
      return null;
    }
    supabase = lib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    if (typeof window !== 'undefined') {
      window.jdcSb = supabase;
      window.supabaseClient = supabase;
    }
    return supabase;
  } catch (e) {
    console.error('Falha ao iniciar Supabase:', e);
    return null;
  }
}

function getSupabase() {
  if (supabase) return supabase;
  return initSupabase();
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function () {
    initSupabase();
  });
}
