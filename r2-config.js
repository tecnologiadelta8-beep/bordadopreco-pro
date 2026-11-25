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

/**
 * Envia um arquivo para o R2 e devolve a URL pública.
 * @param {File|Blob} file
 * @param {string} key  caminho no bucket (ex: capas/123.png)
 * @param {string} [contentType]
 * @returns {Promise<string>} URL pública
 */
async function uploadToR2(file, key, contentType) {
  if (!R2_CONFIG || !R2_CONFIG.accessKeyId || !R2_CONFIG.secretAccessKey) {
    throw new Error('R2 não configurado (r2-config.js)');
  }
  if (typeof AWS === 'undefined') {
    throw new Error('AWS SDK não carregado. Verifique o script no HTML.');
  }

  AWS.config.update({
    accessKeyId: R2_CONFIG.accessKeyId,
    secretAccessKey: R2_CONFIG.secretAccessKey,
    region: R2_CONFIG.region || 'auto',
    s3ForcePathStyle: true
  });

  var s3 = new AWS.S3({
    endpoint: R2_CONFIG.endpoint,
    signatureVersion: 'v4',
    s3ForcePathStyle: true
  });

  var type = contentType || (file && file.type) || 'application/octet-stream';
  var body = file;

  return new Promise(function (resolve, reject) {
    s3.upload(
      {
        Bucket: R2_CONFIG.bucket,
        Key: key,
        Body: body,
        ContentType: type,
        // R2 ignora ACL na maioria dos casos; acesso público vem da URL r2.dev
      },
      function (err, data) {
        if (err) {
          console.error('R2 upload error:', err);
          reject(err);
          return;
        }
        // URL pública
        var base = (R2_CONFIG.publicBase || '').replace(/\/$/, '');
        var publicUrl = base + '/' + key.split('/').map(encodeURIComponent).join('/');
        // encodeURIComponent em cada segmento, mas mantém /
        publicUrl = base + '/' + key.split('/').map(function (p) {
          return encodeURIComponent(p);
        }).join('/');
        resolve(publicUrl);
      }
    );
  });
}

function r2PublicUrl(key) {
  var base = (R2_CONFIG.publicBase || '').replace(/\/$/, '');
  return base + '/' + String(key || '').split('/').map(function (p) {
    return encodeURIComponent(p);
  }).join('/');
}
