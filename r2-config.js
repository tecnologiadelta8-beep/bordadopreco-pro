// ===== Cloudflare R2 - JDC Bordados =====
// Upload de fotos e instaladores (arquivos grandes)
// ATENÇÃO: este arquivo fica no painel do gestor. Não publique em página pública.

var R2_CONFIG = {
  accountId: '782879b57096b1705d35c079eb5046e2',
  accessKeyId: '07ec360d24b23b05fc48008dd8a02ea0',
  secretAccessKey: '5f3de799022f7318ce471961ee47aca212ab022a694582ae853dd7cc9502af71',
  bucket: 'jdc-bordados',
  // Endpoint S3 compatível
  endpoint: 'https://782879b57096b1705d35c079eb5046e2.r2.cloudflarestorage.com',
  // URL pública de leitura (r2.dev)
  publicBase: 'https://pub-c6593c528a764924b437cfbcf3641f57.r2.dev',
  region: 'auto'
};

function r2PublicUrl(key) {
  var base = (R2_CONFIG.publicBase || '').replace(/\/$/, '');
  return base + '/' + String(key || '').split('/').map(function (p) {
    return encodeURIComponent(p);
  }).join('/');
}

function _r2Client() {
  if (typeof AWS === 'undefined') {
    throw new Error('AWS SDK não carregado. Verifique o script no HTML.');
  }
  if (!R2_CONFIG || !R2_CONFIG.accessKeyId || !R2_CONFIG.secretAccessKey) {
    throw new Error('R2 não configurado (r2-config.js)');
  }
  AWS.config.update({
    accessKeyId: R2_CONFIG.accessKeyId,
    secretAccessKey: R2_CONFIG.secretAccessKey,
    region: R2_CONFIG.region || 'auto',
    s3ForcePathStyle: true
  });
  return new AWS.S3({
    endpoint: R2_CONFIG.endpoint,
    signatureVersion: 'v4',
    s3ForcePathStyle: true,
    // evita problemas de preflight em alguns navegadores
    httpOptions: { timeout: 300000 }
  });
}

function _mensagemErroR2(err) {
  var msg = (err && (err.message || err.code)) ? String(err.message || err.code) : String(err || 'erro');
  var low = msg.toLowerCase();
  if (low.indexOf('network') >= 0 || low.indexOf('cors') >= 0 || low.indexOf('failed to fetch') >= 0) {
    return msg + ' — quase sempre é CORS do bucket R2. No Cloudflare: R2 → jdc-bordados → Settings → CORS policy, cole a política do arquivo r2-cors.json e salve.';
  }
  if (low.indexOf('access') >= 0 || low.indexOf('denied') >= 0 || low.indexOf('403') >= 0) {
    return msg + ' — verifique Access Key / Secret com permissão de escrita no bucket jdc-bordados.';
  }
  return msg;
}

/**
 * Envia um arquivo para o R2 e devolve a URL pública.
 * @param {File|Blob} file
 * @param {string} key  caminho no bucket (ex: capas/123.png)
 * @param {string} [contentType]
 * @returns {Promise<string>} URL pública
 */
async function uploadToR2(file, key, contentType) {
  var s3 = _r2Client();
  var type = contentType || (file && file.type) || 'application/octet-stream';

  // Lê como ArrayBuffer — mais estável no browser que stream do File
  var body = file;
  try {
    if (file && typeof file.arrayBuffer === 'function') {
      body = await file.arrayBuffer();
    }
  } catch (eRead) {
    body = file;
  }

  return new Promise(function (resolve, reject) {
    // putObject costuma falhar menos que managed upload em CORS mal configurado
    s3.putObject(
      {
        Bucket: R2_CONFIG.bucket,
        Key: key,
        Body: body,
        ContentType: type
      },
      function (err) {
        if (err) {
          console.error('R2 putObject error:', err);
          // fallback: tenta upload multipart gerenciado
          s3.upload(
            {
              Bucket: R2_CONFIG.bucket,
              Key: key,
              Body: file,
              ContentType: type
            },
            function (err2) {
              if (err2) {
                console.error('R2 upload error:', err2);
                reject(new Error(_mensagemErroR2(err2)));
                return;
              }
              resolve(r2PublicUrl(key));
            }
          );
          return;
        }
        resolve(r2PublicUrl(key));
      }
    );
  });
}
