/**
 * JDC Gestor — Central de notificações (estilo Compre Diamantino)
 * Badge no menu + sino + lista + badge no ícone do PWA
 * Só para gestor logado.
 */
(function (global) {
  'use strict';

  const KEY = 'jdc_notificacoes_gestor';

  const TIPOS = {
    novo_cliente:  { cor: '#f97316', label: 'Novo cliente',     icone: 'fa-user-plus' },
    licenca:       { cor: '#0a1f4d', label: 'Licença',          icone: 'fa-key' },
    download:      { cor: '#2563eb', label: 'Download',         icone: 'fa-download' },
    tira_duvida:   { cor: '#7c3aed', label: 'Tira-dúvida',      icone: 'fa-comments' },
    software:      { cor: '#059669', label: 'Software',         icone: 'fa-box' },
    sistema:       { cor: '#64748b', label: 'Sistema',          icone: 'fa-info-circle' }
  };

  function ler() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch (_) { return []; }
  }

  function salvar(lista) {
    localStorage.setItem(KEY, JSON.stringify(lista.slice(0, 200)));
    atualizarBadge();
  }

  function add(tipo, titulo, detalhe, meta) {
    if (!TIPOS[tipo]) tipo = 'sistema';
    const lista = ler();
    const item = {
      id: 'n' + Date.now() + Math.random().toString(36).slice(2, 6),
      tipo: tipo,
      titulo: titulo || TIPOS[tipo].label,
      detalhe: detalhe || '',
      meta: meta || {},
      lida: false,
      em: new Date().toISOString()
    };
    lista.unshift(item);
    salvar(lista);
    return item;
  }

  function marcarLida(id) {
    salvar(ler().filter(function (n) { return n.id !== id; }));
  }

  function marcarTodasLidas() {
    salvar([]);
    setIconBadge(0);
  }

  function naoLidas() {
    return ler().filter(function (n) { return !n.lida; }).length;
  }

  function setIconBadge(n) {
    n = Math.max(0, Number(n) || 0);
    try {
      if (navigator.setAppBadge) {
        if (n > 0) navigator.setAppBadge(n);
        else if (navigator.clearAppBadge) navigator.clearAppBadge();
      }
    } catch (_) {}
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      try {
        navigator.serviceWorker.controller.postMessage({ type: 'SET_BADGE', count: n });
      } catch (_) {}
    }
  }

  function atualizarBadge() {
    const n = naoLidas();
    document.querySelectorAll('[data-notif-badge]').forEach(function (el) {
      if (n > 0) {
        el.textContent = n > 99 ? '99+' : String(n);
        el.classList.remove('hidden');
        el.classList.add('show');
      } else {
        el.classList.add('hidden');
        el.classList.remove('show');
      }
    });
    setIconBadge(n);
  }

  function renderLista(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const lista = ler();
    if (!lista.length) {
      el.innerHTML = '<p class="jdc-notif-empty">Nenhum aviso ainda.</p>';
      return;
    }
    el.innerHTML = lista.map(function (n) {
      const t = TIPOS[n.tipo] || TIPOS.sistema;
      const data = new Date(n.em);
      const quando = isNaN(data) ? '' : data.toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
      });
      return (
        '<div class="jdc-notif-item" data-id="' + n.id + '">' +
          '<div class="jdc-notif-icon" style="background:' + t.cor + '"><i class="fas ' + t.icone + '"></i></div>' +
          '<div class="jdc-notif-body">' +
            '<strong>' + escapeHtml(n.titulo) + '</strong>' +
            (n.detalhe ? '<span>' + escapeHtml(n.detalhe) + '</span>' : '') +
            '<small>' + quando + ' · ' + t.label + '</small>' +
          '</div>' +
          '<button type="button" class="jdc-notif-dismiss" title="Marcar como lida" data-dismiss="' + n.id + '">&times;</button>' +
        '</div>'
      );
    }).join('');

    el.querySelectorAll('[data-dismiss]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        marcarLida(btn.getAttribute('data-dismiss'));
        renderLista(containerId);
      });
    });
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function injetarEstilos() {
    if (document.getElementById('jdc-notif-style')) return;
    const style = document.createElement('style');
    style.id = 'jdc-notif-style';
    style.textContent = [
      '.jdc-notif-bell{position:relative;background:none;border:none;color:#0a1f4d;font-size:1.25rem;cursor:pointer;padding:8px;line-height:1;}',
      '.jdc-notif-bell:hover{color:#f5c518;}',
      '[data-notif-badge]{position:absolute;top:0;right:0;min-width:18px;height:18px;padding:0 5px;border-radius:50px;background:#ef4444;color:#fff;font-size:10px;font-weight:800;display:none;align-items:center;justify-content:center;}',
      '[data-notif-badge].show{display:inline-flex;animation:jdc-notif-pulse 1.4s ease-in-out infinite;}',
      '@keyframes jdc-notif-pulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.55)}50%{box-shadow:0 0 0 6px rgba(239,68,68,0)}}',
      '.jdc-notif-panel{display:none;position:absolute;right:0;top:calc(100% + 8px);width:340px;max-width:92vw;max-height:420px;overflow:auto;background:#fff;border:1px solid #e2e8f0;border-radius:14px;box-shadow:0 12px 40px rgba(10,31,77,.18);z-index:2000;}',
      '.jdc-notif-panel.open{display:block;}',
      '.jdc-notif-panel-head{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid #e2e8f0;font-weight:700;color:#0a1f4d;font-size:.95rem;}',
      '.jdc-notif-panel-head button{border:none;background:#f1f5f9;color:#0a1f4d;font-size:.75rem;font-weight:700;padding:6px 10px;border-radius:8px;cursor:pointer;}',
      '.jdc-notif-item{display:flex;gap:10px;align-items:flex-start;padding:12px 14px;border-bottom:1px solid #f1f5f9;position:relative;}',
      '.jdc-notif-item:hover{background:#f8fafc;}',
      '.jdc-notif-icon{width:36px;height:36px;border-radius:10px;color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;}',
      '.jdc-notif-body{flex:1;min-width:0;}',
      '.jdc-notif-body strong{display:block;font-size:.9rem;color:#0a1f4d;margin-bottom:2px;}',
      '.jdc-notif-body span{display:block;font-size:.8rem;color:#64748b;line-height:1.35;}',
      '.jdc-notif-body small{display:block;margin-top:4px;font-size:.72rem;color:#94a3b8;}',
      '.jdc-notif-dismiss{border:none;background:none;color:#94a3b8;font-size:1.2rem;cursor:pointer;line-height:1;padding:0 4px;}',
      '.jdc-notif-empty{text-align:center;color:#94a3b8;font-size:.85rem;padding:28px 12px;}'
    ].join('');
    document.head.appendChild(style);
  }

  function montarSino(container) {
    if (!container || container.querySelector('.jdc-notif-bell')) return;
    injetarEstilos();
    container.style.position = container.style.position || 'relative';
    const wrap = document.createElement('div');
    wrap.style.position = 'relative';
    wrap.innerHTML =
      '<button type="button" class="jdc-notif-bell" id="jdc-notif-bell-btn" title="Notificações" aria-label="Notificações">' +
        '<i class="fas fa-bell"></i>' +
        '<span data-notif-badge class="hidden">0</span>' +
      '</button>' +
      '<div class="jdc-notif-panel" id="jdc-notif-panel">' +
        '<div class="jdc-notif-panel-head">' +
          '<span><i class="fas fa-bell" style="color:#f5c518;margin-right:6px;"></i>Avisos</span>' +
          '<button type="button" id="jdc-notif-clear">Limpar tudo</button>' +
        '</div>' +
        '<div id="jdc-notif-lista"></div>' +
      '</div>';
    container.appendChild(wrap);

    const btn = wrap.querySelector('#jdc-notif-bell-btn');
    const panel = wrap.querySelector('#jdc-notif-panel');
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      panel.classList.toggle('open');
      if (panel.classList.contains('open')) renderLista('jdc-notif-lista');
    });
    document.addEventListener('click', function () {
      panel.classList.remove('open');
    });
    panel.addEventListener('click', function (e) { e.stopPropagation(); });
    wrap.querySelector('#jdc-notif-clear').addEventListener('click', function () {
      marcarTodasLidas();
      renderLista('jdc-notif-lista');
    });
    atualizarBadge();
  }

  /** Consulta Supabase e gera avisos de pendências (tira-dúvida, etc.) */
  async function sincronizarDoBanco() {
    try {
      if (typeof initSupabase === 'function') initSupabase();
      const sb = global.supabase;
      if (!sb || !sb.from) return;

      // Tira-dúvida pendente
      try {
        const { count } = await sb.from('tira_duvida')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pendente');
        if (count > 0) {
          const ja = ler().some(function (n) {
            return n.tipo === 'tira_duvida' && n.meta && n.meta.sync === 'pendente_count';
          });
          if (!ja) {
            add('tira_duvida', count + ' tira-dúvida(s) pendente(s)', 'Abra a gestão para responder.', { sync: 'pendente_count' });
          }
        }
      } catch (_) {}

      // Licenças pendentes
      try {
        const { count } = await sb.from('licencas')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pendente');
        if (count > 0) {
          const ja = ler().some(function (n) {
            return n.tipo === 'licenca' && n.meta && n.meta.sync === 'pendente_count';
          });
          if (!ja) {
            add('licenca', count + ' licença(s) pendente(s)', 'Revise na aba Licenças.', { sync: 'pendente_count' });
          }
        }
      } catch (_) {}

      atualizarBadge();
    } catch (e) {
      console.log('Notif sync:', e);
    }
  }

  function init(opts) {
    opts = opts || {};
    // Só gestor
    if (typeof isGestor === 'function' && !isGestor()) return;
    if (typeof getSession === 'function') {
      const s = getSession();
      if (!s || s.role !== 'gestor') return;
    }

    const host = opts.bellContainer
      || document.getElementById('notif-bell-host')
      || document.querySelector('.topbar-user')
      || document.querySelector('.topbar');

    if (host) montarSino(host);
    else {
      // cria host flutuante no canto
      let h = document.getElementById('jdc-notif-float');
      if (!h) {
        h = document.createElement('div');
        h.id = 'jdc-notif-float';
        h.style.cssText = 'position:fixed;top:16px;right:16px;z-index:3000;';
        document.body.appendChild(h);
      }
      montarSino(h);
    }

    atualizarBadge();
    setTimeout(sincronizarDoBanco, 800);
  }

  global.JdcNotif = {
    add: add,
    marcarLida: marcarLida,
    marcarTodasLidas: marcarTodasLidas,
    naoLidas: naoLidas,
    atualizarBadge: atualizarBadge,
    renderLista: renderLista,
    sincronizarDoBanco: sincronizarDoBanco,
    init: init,
    TIPOS: TIPOS
  };

  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(function () { init(); }, 200);
    });
  }
})(typeof window !== 'undefined' ? window : this);
