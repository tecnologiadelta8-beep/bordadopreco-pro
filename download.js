// ===== Área de Download - Parte 1 (Estrutura) =====
// Na Parte 3 vamos conectar com validação real de chave + R2

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('license-form');
  const formCard = document.getElementById('license-form-card');
  const resultCard = document.getElementById('download-result');
  const errorCard = document.getElementById('download-error');
  const btnNewLicense = document.getElementById('btn-new-license');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const keyInput = document.getElementById('license-key');
    const key = keyInput.value.trim().toUpperCase();
    
    if (!key) {
      alert('Digite a chave de licença');
      return;
    }

    // ===== PLACEHOLDER (Parte 1) =====
    // Aqui na Parte 3 vamos validar de verdade a chave
    // e liberar o link do R2
    
    // Por enquanto mostra mensagem de que a validação real virá na próxima etapa
    formCard.style.display = 'none';
    errorCard.style.display = 'none';
    resultCard.style.display = 'block';
    
    document.getElementById('result-message').textContent = 
      'Esta é a estrutura da Área de Download (Parte 1). Na próxima etapa conectaremos a validação real das chaves e os arquivos no Cloudflare R2.';
    
    document.getElementById('software-name').textContent = 'Exemplo de Software';
    document.getElementById('software-version').textContent = 'Aguardando integração';
    
    // Desabilita o botão de download por enquanto
    const btnDownload = document.getElementById('btn-download');
    if (btnDownload) {
      btnDownload.href = '#';
      btnDownload.onclick = (ev) => {
        ev.preventDefault();
        alert('Download real será liberado na Parte 3 (integração com R2 + validação de chave)');
      };
    }
  });

  if (btnNewLicense) {
    btnNewLicense.addEventListener('click', () => {
      resultCard.style.display = 'none';
      errorCard.style.display = 'none';
      formCard.style.display = 'block';
      document.getElementById('license-key').value = '';
      document.getElementById('license-key').focus();
    });
  }
});
