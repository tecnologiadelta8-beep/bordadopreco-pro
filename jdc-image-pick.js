/**
 * JDC — escolher / colar / cortar imagem antes do envio
 * Uso: JdcImagePick.bind({ input, previewBox, previewImg, dropZone })
 * Deixa o File final em input (DataTransfer) e mostra preview.
 */
(function (global) {
  'use strict';

  var state = {
    img: null,
    naturalW: 0,
    naturalH: 0,
    scale: 1,
    offX: 0,
    offY: 0,
    cropSize: 280,
    dragging: false,
    lastX: 0,
    lastY: 0,
    resolve: null,
    reject: null,
    overlay: null
  };

  function ensureOverlay() {
    if (state.overlay) return state.overlay;
    var el = document.createElement('div');
    el.id = 'jdc-crop-overlay';
    el.innerHTML =
      '<div class="jdc-crop-backdrop">' +
        '<div class="jdc-crop-modal" role="dialog" aria-label="Cortar imagem">' +
          '<h3 class="jdc-crop-title">Ajustar e cortar</h3>' +
          '<p class="jdc-crop-hint">Arraste a imagem. No celular use o dedo. Depois toque em Usar foto.</p>' +
          '<div class="jdc-crop-stage" id="jdc-crop-stage">' +
            '<img id="jdc-crop-img" alt="Prévia" draggable="false">' +
            '<div class="jdc-crop-frame" id="jdc-crop-frame"></div>' +
          '</div>' +
          '<div class="jdc-crop-tools">' +
            '<label>Zoom <input type="range" id="jdc-crop-zoom" min="100" max="300" value="100"></label>' +
          '</div>' +
          '<div class="jdc-crop-actions">' +
            '<button type="button" class="jdc-crop-btn secondary" id="jdc-crop-cancel">Cancelar</button>' +
            '<button type="button" class="jdc-crop-btn primary" id="jdc-crop-ok">Usar foto</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    var style = document.createElement('style');
    style.textContent =
      '#jdc-crop-overlay{position:fixed;inset:0;z-index:100000;display:none;}' +
      '#jdc-crop-overlay.open{display:block;}' +
      '.jdc-crop-backdrop{position:absolute;inset:0;background:rgba(10,31,77,.72);display:flex;align-items:center;justify-content:center;padding:12px;}' +
      '.jdc-crop-modal{background:#fff;border-radius:16px;max-width:440px;width:100%;padding:16px 16px 14px;box-shadow:0 16px 48px rgba(0,0,0,.25);}' +
      '.jdc-crop-title{margin:0 0 4px;color:#0a1f4d;font-size:1.1rem;}' +
      '.jdc-crop-hint{margin:0 0 12px;color:#64748b;font-size:.85rem;line-height:1.4;}' +
      '.jdc-crop-stage{position:relative;width:100%;height:300px;background:#0f172a;border-radius:12px;overflow:hidden;touch-action:none;cursor:grab;}' +
      '.jdc-crop-stage:active{cursor:grabbing;}' +
      '#jdc-crop-img{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);max-width:none;user-select:none;pointer-events:none;}' +
      '.jdc-crop-frame{position:absolute;left:50%;top:50%;width:240px;height:240px;transform:translate(-50%,-50%);border:2px solid #f5c518;box-shadow:0 0 0 9999px rgba(0,0,0,.45);border-radius:8px;pointer-events:none;}' +
      '.jdc-crop-tools{margin:12px 0 8px;font-size:.85rem;color:#0a1f4d;}' +
      '.jdc-crop-tools input{width:100%;margin-top:6px;}' +
      '.jdc-crop-actions{display:flex;gap:8px;margin-top:8px;}' +
      '.jdc-crop-btn{flex:1;padding:12px;border-radius:10px;font-weight:700;border:none;cursor:pointer;font-size:.95rem;}' +
      '.jdc-crop-btn.primary{background:#f5c518;color:#0a1f4d;}' +
      '.jdc-crop-btn.secondary{background:#e2e8f0;color:#0a1f4d;}';
    document.head.appendChild(style);
    document.body.appendChild(el);
    state.overlay = el;

    el.querySelector('#jdc-crop-cancel').onclick = function () {
      closeOverlay();
      if (state.reject) state.reject(new Error('cancelado'));
      state.resolve = state.reject = null;
    };
    el.querySelector('#jdc-crop-ok').onclick = function () {
      try {
        var file = exportCroppedFile();
        closeOverlay();
        if (state.resolve) state.resolve(file);
      } catch (e) {
        if (state.reject) state.reject(e);
      }
      state.resolve = state.reject = null;
    };
    el.querySelector('#jdc-crop-zoom').oninput = function (e) {
      state.scale = (parseInt(e.target.value, 10) || 100) / 100;
      applyTransform();
    };

    var stage = el.querySelector('#jdc-crop-stage');
    function onStart(x, y) {
      state.dragging = true;
      state.lastX = x;
      state.lastY = y;
    }
    function onMove(x, y) {
      if (!state.dragging) return;
      state.offX += (x - state.lastX);
      state.offY += (y - state.lastY);
      state.lastX = x;
      state.lastY = y;
      applyTransform();
    }
    function onEnd() { state.dragging = false; }

    stage.addEventListener('mousedown', function (e) { e.preventDefault(); onStart(e.clientX, e.clientY); });
    window.addEventListener('mousemove', function (e) { if (state.dragging) onMove(e.clientX, e.clientY); });
    window.addEventListener('mouseup', onEnd);
    stage.addEventListener('touchstart', function (e) {
      if (!e.touches[0]) return;
      onStart(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    stage.addEventListener('touchmove', function (e) {
      if (!e.touches[0] || !state.dragging) return;
      e.preventDefault();
      onMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
    stage.addEventListener('touchend', onEnd);

    return el;
  }

  function applyTransform() {
    var img = document.getElementById('jdc-crop-img');
    if (!img || !state.img) return;
    var base = Math.min(300 / state.naturalH, 400 / state.naturalW);
    var s = base * state.scale;
    var w = state.naturalW * s;
    var h = state.naturalH * s;
    img.style.width = w + 'px';
    img.style.height = h + 'px';
    img.style.transform = 'translate(calc(-50% + ' + state.offX + 'px), calc(-50% + ' + state.offY + 'px))';
  }

  function closeOverlay() {
    if (state.overlay) state.overlay.classList.remove('open');
  }

  function openCropper(source) {
    return new Promise(function (resolve, reject) {
      var overlay = ensureOverlay();
      state.resolve = resolve;
      state.reject = reject;
      state.scale = 1;
      state.offX = 0;
      state.offY = 0;
      var zoom = document.getElementById('jdc-crop-zoom');
      if (zoom) zoom.value = '100';
      var imgEl = document.getElementById('jdc-crop-img');
      var url = typeof source === 'string' ? source : URL.createObjectURL(source);
      imgEl.onload = function () {
        state.img = imgEl;
        state.naturalW = imgEl.naturalWidth;
        state.naturalH = imgEl.naturalHeight;
        applyTransform();
        overlay.classList.add('open');
      };
      imgEl.onerror = function () {
        reject(new Error('Não foi possível carregar a imagem'));
      };
      imgEl.src = url;
    });
  }

  function exportCroppedFile() {
    var stage = document.getElementById('jdc-crop-stage');
    var frame = document.getElementById('jdc-crop-frame');
    var imgEl = document.getElementById('jdc-crop-img');
    if (!stage || !frame || !imgEl) throw new Error('Crop UI indisponível');

    var stageRect = stage.getBoundingClientRect();
    var frameRect = frame.getBoundingClientRect();
    var imgRect = imgEl.getBoundingClientRect();

    // Coordenadas do frame relativas à imagem exibida
    var fx = frameRect.left - imgRect.left;
    var fy = frameRect.top - imgRect.top;
    var fw = frameRect.width;
    var fh = frameRect.height;

    var scaleX = state.naturalW / imgRect.width;
    var scaleY = state.naturalH / imgRect.height;

    var sx = Math.max(0, fx * scaleX);
    var sy = Math.max(0, fy * scaleY);
    var sw = Math.min(state.naturalW - sx, fw * scaleX);
    var sh = Math.min(state.naturalH - sy, fh * scaleY);

    var out = 640;
    var canvas = document.createElement('canvas');
    canvas.width = out;
    canvas.height = out;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, out, out);
    ctx.drawImage(imgEl, sx, sy, sw, sh, 0, 0, out, out);

    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (!blob) {
          reject(new Error('Falha ao gerar imagem'));
          return;
        }
        var file = new File([blob], 'foto-jdc-' + Date.now() + '.jpg', { type: 'image/jpeg' });
        resolve(file);
      }, 'image/jpeg', 0.88);
    });
  }

  // exportCroppedFile is async via toBlob — fix ok handler
  function exportCroppedFileSyncStyle() {
    // replaced by async path in ok click — redefine ok in ensureOverlay after load
    return null;
  }

  // Patch: ok button uses async export
  function rebindOk() {
    var overlay = ensureOverlay();
    var ok = overlay.querySelector('#jdc-crop-ok');
    ok.onclick = function () {
      var stage = document.getElementById('jdc-crop-stage');
      var frame = document.getElementById('jdc-crop-frame');
      var imgEl = document.getElementById('jdc-crop-img');
      if (!stage || !frame || !imgEl) return;

      var stageRect = stage.getBoundingClientRect();
      var frameRect = frame.getBoundingClientRect();
      var imgRect = imgEl.getBoundingClientRect();
      var fx = frameRect.left - imgRect.left;
      var fy = frameRect.top - imgRect.top;
      var fw = frameRect.width;
      var fh = frameRect.height;
      var scaleX = state.naturalW / imgRect.width;
      var scaleY = state.naturalH / imgRect.height;
      var sx = Math.max(0, fx * scaleX);
      var sy = Math.max(0, fy * scaleY);
      var sw = Math.min(state.naturalW - sx, fw * scaleX);
      var sh = Math.min(state.naturalH - sy, fh * scaleY);

      var out = 640;
      var canvas = document.createElement('canvas');
      canvas.width = out;
      canvas.height = out;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, out, out);
      ctx.drawImage(imgEl, sx, sy, sw, sh, 0, 0, out, out);

      ok.disabled = true;
      ok.textContent = 'Processando…';
      canvas.toBlob(function (blob) {
        ok.disabled = false;
        ok.textContent = 'Usar foto';
        closeOverlay();
        if (!blob) {
          if (state.reject) state.reject(new Error('Falha ao gerar imagem'));
          state.resolve = state.reject = null;
          return;
        }
        var file = new File([blob], 'foto-jdc-' + Date.now() + '.jpg', { type: 'image/jpeg' });
        if (state.resolve) state.resolve(file);
        state.resolve = state.reject = null;
      }, 'image/jpeg', 0.88);
    };
  }

  function setInputFile(input, file) {
    try {
      var dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
    } catch (e) {
      // Safari antigo: mantém referência
      input._jdcFile = file;
    }
  }

  function getFileFromInput(input) {
    if (input.files && input.files[0]) return input.files[0];
    return input._jdcFile || null;
  }

  function bind(opts) {
    opts = opts || {};
    var input = typeof opts.input === 'string' ? document.querySelector(opts.input) : opts.input;
    var previewBox = typeof opts.previewBox === 'string' ? document.querySelector(opts.previewBox) : opts.previewBox;
    var previewImg = typeof opts.previewImg === 'string' ? document.querySelector(opts.previewImg) : opts.previewImg;
    var dropZone = typeof opts.dropZone === 'string' ? document.querySelector(opts.dropZone) : (opts.dropZone || input && input.parentElement);
    if (!input) return;

    rebindOk();

    function showPreview(file) {
      if (!previewBox || !previewImg || !file) return;
      previewImg.src = URL.createObjectURL(file);
      previewBox.style.display = 'block';
    }

    async function handleSource(fileOrBlob) {
      if (!fileOrBlob) return;
      try {
        var file = await openCropper(fileOrBlob);
        setInputFile(input, file);
        showPreview(file);
      } catch (e) {
        if (e && e.message === 'cancelado') return;
        console.warn(e);
      }
    }

    input.addEventListener('change', function () {
      var f = input.files && input.files[0];
      if (f) handleSource(f);
    });

    // Colar (Ctrl+V / long-press paste no mobile em alguns browsers)
    function onPaste(e) {
      var items = e.clipboardData && e.clipboardData.items;
      if (!items) return;
      for (var i = 0; i < items.length; i++) {
        if (items[i].type && items[i].type.indexOf('image') === 0) {
          e.preventDefault();
          var blob = items[i].getAsFile();
          if (blob) handleSource(blob);
          break;
        }
      }
    }
    if (dropZone) {
      dropZone.addEventListener('paste', onPaste);
      dropZone.setAttribute('tabindex', '0');
      // clique na zona foca para poder colar
      dropZone.addEventListener('click', function (ev) {
        if (ev.target === input) return;
        dropZone.focus();
      });
      dropZone.addEventListener('dragover', function (e) {
        e.preventDefault();
        dropZone.style.outline = '2px dashed #f5c518';
      });
      dropZone.addEventListener('dragleave', function () {
        dropZone.style.outline = '';
      });
      dropZone.addEventListener('drop', function (e) {
        e.preventDefault();
        dropZone.style.outline = '';
        var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (f && f.type.indexOf('image') === 0) handleSource(f);
      });
    }
    // também escuta paste no documento se o foco estiver no formulário
    document.addEventListener('paste', function (e) {
      var form = input.closest('form');
      if (!form) return;
      if (form.contains(document.activeElement) || (dropZone && dropZone === document.activeElement)) {
        onPaste(e);
      }
    });

    return { getFile: function () { return getFileFromInput(input); }, openCropper: openCropper };
  }

  global.JdcImagePick = {
    bind: bind,
    openCropper: openCropper,
    getFileFromInput: getFileFromInput
  };
})(window);
