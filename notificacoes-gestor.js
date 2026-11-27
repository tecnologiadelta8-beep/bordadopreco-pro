/**
 * JDC Gestor — Central de notificações (estilo IBN / Compre Diamantino)
 * - Sino + badge + lista
 * - Badge no ícone do PWA
 * - Sincroniza com Supabase: tira-dúvidas, leads, interesses
 * - Notificação do navegador (quando permitido)
 * Só ativo com gestor logado.
 */
(function (global) {
  'use strict';

  var KEY = 'jdc_notificacoes_gestor';
  var KEY_SEEN = 'jdc_notif_seen_ids';
  var POLL_MS = 45000;
  var pollTimer = null;

  var TIPOS = {
    novo_cliente: { cor: '#f97316', label: 'Novo cliente',     icone: 'fa-user-plus' },
    licenca:      { cor: '#0a1f4d', label: 'Licença',          icone: 'fa-key' },
    download:     { cor: '#2563eb', label: 'Download',         icone: 'fa-download' },
    tira_duvida:  { cor: '#7c3aed', label: 'Tira-dúvida',      icone: 'fa-comments' },
    interesse:    { cor: '#ea580c', label: 'Interesse / Lead', icone: 'fa-handshake' },
    software:     { cor: '#059669', label: 'Software',         icone: 'fa-box' },
    fotos:        { cor: '#0284c7', label: 'Foto recebida',    icone: 'fa-images' },
    sistema:      { cor: '#64748b', label: 'Sistema',          icone: 'fa-info-circle' }
  };

  function ler() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch (_) { return []; }
  }

  function salvar(lista) {
    localStorage.setItem(KEY, JSON.stringify(lista.slice(0, 200)));
    atualizarBadge();
  }

  function lerSeen() {
    try { return JSON.parse(localStorage.getItem(KEY_SEEN) || '{}'); }
    catch (_) { return {}; }
  }

  function marcarSeen(tipo, id) {
    var s = lerSeen();
    if (!s[tipo]) s[tipo] = {};
    s[tipo][String(id)] = 1;
    // limita memória
    var keys = Object.keys(s[tipo]);
    if (keys.length > 300) {
      keys.slice(0, keys.length - 200).forEach(function (k) { delete s[tipo][k]; });
    }
    localStorage.setItem(KEY_SEEN, JSON.stringify(s));
  }

  function jaViu(tipo, id) {
    var s = lerSeen();
    return !!(s[tipo] && s[tipo][String(id)]);
  }

  function add(tipo, titulo, detalhe, meta) {
    if (!TIPOS[tipo]) tipo = 'sistema';
    var lista = ler();
    // evita duplicar o mesmo título+detalhe nos últimos 2 min
    var agora = Date.now();
    var dup = lista.some(function (n) {
      return n.tipo === tipo && n.titulo === titulo && n.detalhe === (detalhe || '') &&
        (agora - Date.parse(n.em)) < 120000;
    });
    if (dup) return null;

    var item = {
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
    try { notificarNavegador(item); } catch (_) {}
    return item;
  }

  function notificarNavegador(item) {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    if (document.visibilityState === 'visible') return; // só quando aba em segundo plano
    try {
      var n = new Notification(item.titulo, {
        body: item.detalhe || (TIPOS[item.tipo] && TIPOS[item.tipo].label) || '',
        icon: 'icon-192.png',
        badge: 'icon-192.png',
        tag: item.id
      });
      n.onclick = function () {
        window.focus();
        n.close();
      };
    } catch (_) {}
  }

  function pedirPermissaoNotificacao() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      try { Notification.requestPermission(); } catch (_) {}
    }
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
    var n = naoLidas();
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

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderLista(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;
    var lista = ler();
    if (!lista.length) {
      el.innerHTML = '<p class="jdc-notif-empty">Nenhum aviso ainda.<br><small>Quando um cliente enviar dúvida ou interesse, aparece aqui.</small></p>';
      return;
    }
    el.innerHTML = lista.map(function (n) {
      var t = TIPOS[n.tipo] || TIPOS.sistema;
      var data = new Date(n.em);
      var quando = isNaN(data) ? '' : data.toLocaleString('pt-BR', {
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

  function injetarEstilos() {
    if (document.getElementById('jdc-notif-style')) return;
    var style = document.createElement('style');
    style.id = 'jdc-notif-style';
    style.textContent = [
      '.jdc-notif-bell{position:relative;background:none;border:none;color:#0a1f4d;font-size:1.25rem;cursor:pointer;padding:8px;line-height:1;}',
      '.jdc-notif-bell:hover{color:#f5c518;}',
      '[data-notif-badge]{position:absolute;top:0;right:0;min-width:18px;height:18px;padding:0 5px;border-radius:50px;background:#ef4444;color:#fff;font-size:10px;font-weight:800;display:none;align-items:center;justify-content:center;}',
      '[data-notif-badge].show{display:inline-flex;animation:jdc-notif-pulse 1.4s ease-in-out infinite;}',
      '@keyframes jdc-notif-pulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.55)}50%{box-shadow:0 0 0 6px rgba(239,68,68,0)}}',
      '.jdc-notif-panel{display:none;position:absolute;right:0;top:calc(100% + 8px);width:360px;max-width:92vw;max-height:440px;overflow:auto;background:#fff;border:1px solid #e2e8f0;border-radius:14px;box-shadow:0 12px 40px rgba(10,31,77,.18);z-index:2000;}',
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
      '.jdc-notif-empty{text-align:center;color:#94a3b8;font-size:.85rem;padding:28px 12px;line-height:1.5;}'
    ].join('');
    document.head.appendChild(style);
  }

  function montarSino(container) {
    if (!container || container.querySelector('.jdc-notif-bell')) return;
    injetarEstilos();
    container.style.position = container.style.position || 'relative';
    var wrap = document.createElement('div');
    wrap.style.position = 'relative';
    wrap.innerHTML =
      '<button type="button" class="jdc-notif-bell" id="jdc-notif-bell-btn" title="Notificações" aria-label="Notificações">' +
        '<i class="fas fa-bell"></i>' +
        '<span data-notif-badge class="hidden">0</span>' +
      '</button>' +
      '<div class="jdc-notif-panel" id="jdc-notif-panel">' +
        '<div class="jdc-notif-panel-head">' +
          '<span><i class="fas fa-bell"></i> Avisos</span>' +
          '<button type="button" id="jdc-notif-clear">Limpar todas</button>' +
        '</div>' +
        '<div id="jdc-notif-lista"></div>' +
      '</div>';
    container.appendChild(wrap);

    var btn = wrap.querySelector('#jdc-notif-bell-btn');
    var panel = wrap.querySelector('#jdc-notif-panel');
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      panel.classList.toggle('open');
      if (panel.classList.contains('open')) {
        renderLista('jdc-notif-lista');
        pedirPermissaoNotificacao();
      }
    });
    document.addEventListener('click', function () {
      panel.classList.remove('open');
    });
    panel.addEventListener('click', function (e) { e.stopPropagation(); });
    var clearBtn = wrap.querySelector('#jdc-notif-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        marcarTodasLidas();
        renderLista('jdc-notif-lista');
      });
    }
    atualizarBadge();
  }

  function getClient() {
    try {
      if (typeof initSupabase === 'function') initSupabase();
    } catch (_) {}
    if (typeof getSupabase === 'function') {
      var c = getSupabase();
      if (c) return c;
    }
    return global.jdcSb || global.supabaseClient || global.supabase || null;
  }

  /**
   * Busca no Supabase novidades (estilo IBN/Compre):
   * - tira_duvida pendentes
   * - leads novos
   * - fotos anexadas nas dúvidas
   */
  async function sincronizarDoBanco() {
    try {
      var sb = getClient();
      if (!sb || !sb.from) return;

      // --- Tira-dúvidas ---
      try {
        var rD = await sb.from('tira_duvida')
          .select('id, nome, pergunta, status, foto_url, criado_em')
          .eq('status', 'pendente')
          .order('criado_em', { ascending: false })
          .limit(20);
        if (rD && rD.data) {
          rD.data.forEach(function (d) {
            if (jaViu('tira_duvida', d.id)) return;
            marcarSeen('tira_duvida', d.id);
            var temFoto = d.foto_url ? ' · com foto' : '';
            add(
              d.foto_url ? 'fotos' : 'tira_duvida',
              'Dúvida de ' + (d.nome || 'cliente'),
              ((d.pergunta || '').slice(0, 90)) + temFoto,
              { id: d.id, tab: 'tiraduvida' }
            );
          });
        }
      } catch (_) {}

      // --- Leads / interesse ---
      try {
        var rL = await sb.from('leads')
          .select('id, nome, telefone, mensagem, origem, status, criado_em')
          .order('criado_em', { ascending: false })
          .limit(20);
        if (rL && rL.data) {
          rL.data.forEach(function (l) {
            if (jaViu('lead', l.id)) return;
            // só avisa leads recentes (últimas 48h) para não encher na 1ª sync
            var t = Date.parse(l.criado_em || '') || 0;
            if (t && (Date.now() - t) > 48 * 3600 * 1000) {
              marcarSeen('lead', l.id);
              return;
            }
            marcarSeen('lead', l.id);
            add(
              'interesse',
              'Interesse: ' + (l.nome || 'cliente'),
              (l.telefone || '') + (l.mensagem ? ' · ' + String(l.mensagem).slice(0, 70) : ''),
              { id: l.id, origem: l.origem || '' }
            );
          });
        }
      } catch (_) {}

      // --- Contagem rápida de pendências (se nada novo por ID) ---
      try {
        var rC = await sb.from('tira_duvida')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pendente');
        if (rC && rC.count > 0) {
          var ja = ler().some(function (n) {
            return n.tipo === 'tira_duvida' && n.meta && n.meta.sync === 'pendente_count';
          });
          if (!ja) {
            add('tira_duvida', rC.count + ' tira-dúvida(s) pendente(s)', 'Abra a aba Tira-dúvidas para responder.', { sync: 'pendente_count' });
          }
        }
      } catch (_) {}

      atualizarBadge();
      var listaEl = document.getElementById('jdc-notif-lista');
      if (listaEl && document.getElementById('jdc-notif-panel') &&
          document.getElementById('jdc-notif-panel').classList.contains('open')) {
        renderLista('jdc-notif-lista');
      }
    } catch (e) {
      console.log('Notif sync:', e);
    }
  }

  function iniciarPoll() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(function () {
      if (document.hidden) return;
      sincronizarDoBanco();
    }, POLL_MS);
    // também ao voltar para a aba
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) sincronizarDoBanco();
    });
  }

  function init(opts) {
    opts = opts || {};
    // Só gestor
    if (typeof isGestor === 'function' && !isGestor()) return;
    if (typeof getSession === 'function') {
      var s = getSession();
      if (!s || s.role !== 'gestor') return;
    }

    var host = opts.bellContainer
      || document.getElementById('notif-bell-host')
      || document.querySelector('.topbar-user')
      || document.querySelector('.topbar');

    if (host) montarSino(host);
    else {
      var h = document.getElementById('jdc-notif-float');
      if (!h) {
        h = document.createElement('div');
        h.id = 'jdc-notif-float';
        h.style.cssText = 'position:fixed;top:16px;right:16px;z-index:3000;';
        document.body.appendChild(h);
      }
      montarSino(h);
    }

    atualizarBadge();
    setTimeout(sincronizarDoBanco, 600);
    setTimeout(sincronizarDoBanco, 3000);
    iniciarPoll();
    setTimeout(pedirPermissaoNotificacao, 2500);
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
