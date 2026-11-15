// ===== Configuração Supabase - JDC Bordados =====
// Projeto: jdc-bordados

const SUPABASE_URL = 'https://yctlrwezvjbuvropktuw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljdGxyd2V6dmpidXZyb3BrdHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ3MDE0OTQsImV4cCI6MjExMDI3NzQ5NH0.J_2IOb8kcHcViJK4ie3X3O2Mutk9WD_0nZYH_mMunxU';

// Cliente Supabase (usando a biblioteca via CDN)
let supabase = null;

function initSupabase() {
  if (typeof window !== 'undefined' && window.supabase) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return supabase;
  }
  console.error('Biblioteca Supabase não carregada. Verifique se o script CDN está no HTML.');
  return null;
}

// Inicializa quando o DOM estiver pronto
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initSupabase();
  });
}
