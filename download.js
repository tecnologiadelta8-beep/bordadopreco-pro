// ===== Área de Download - Validação real com Supabase =====

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('license-form');
  const formCard = document.getElementById('license-form-card');
  const resultCard = document.getElementById('download-result');
  const errorCard = document.getElementById('download-error');
  const btnNewLicense = document.getElementById('btn-new-license');

  if (!form) return;

  // Garante que o Supabase está inicializado
  if (typeof initSupabase === 'function') {
    initSupabase();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const keyInput = document.getElementById('license-key');
    const key = keyInput.value.trim().toUpperCase();

    if (!key) {
      alert('Digite a chave de licença');
      return;
    }

    // Mostra loading simples
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Validando...';
    }

    try {
      if (!supabase) {
        initSupabase();
      }
      if (!supabase) {
        throw new Error('Não foi possível conectar ao banco de dados.');
      }

      // Busca a licença + software
      const { data: licenca, error } = await supabase
        .from('licencas')
        .select(`
          id,
          chave_licenca,
          status,
          data_expiracao,
          softwares (
            id,
            nome,
            descricao
          )
        `)
        .eq('chave_licenca', key)
        .maybeSingle();

      if (error) {
        console.error(error);
        throw new Error('Erro ao validar a chave. Tente novamente.');
      }

      if (!licenca) {
        formCard.style.display = 'none';
        resultCard.style.display = 'none';
        errorCard.style.display = 'block';
        document.getElementById('error-message').textContent =
          'Chave não encontrada. Verifique se digitou corretamente.';
        return;
      }

      // Verifica status
      if (licenca.status !== 'ativa') {
        formCard.style.display = 'none';
        resultCard.style.display = 'none';
        errorCard.style.display = 'block';
        document.getElementById('error-message').textContent =
          'Esta licença está ' + (licenca.status || 'inativa') + '. Entre em contato conosco.';
        return;
      }

      // Verifica expiração
      if (licenca.data_expiracao) {
        const exp = new Date(licenca.data_expiracao);
        if (exp < new Date()) {
          formCard.style.display = 'none';
          resultCard.style.display = 'none';
          errorCard.style.display = 'block';
          document.getElementById('error-message').textContent =
            'Esta licença expirou em ' + exp.toLocaleDateString('pt-BR') + '.';
          return;
        }
      }

      // Busca o arquivo de download desse software
      let downloadUrl = '#';
      let versao = '—';

      if (licenca.softwares && licenca.softwares.id) {
        const { data: arquivos } = await supabase
          .from('downloads')
          .select('*')
          .eq('software_id', licenca.softwares.id)
          .eq('ativo', true)
          .order('criado_em', { ascending: false })
          .limit(1);

        if (arquivos && arquivos.length > 0) {
          downloadUrl = arquivos[0].url_arquivo;
          versao = arquivos[0].versao || '—';
        }
      }

      // Sucesso
      formCard.style.display = 'none';
      errorCard.style.display = 'none';
      resultCard.style.display = 'block';

      document.getElementById('result-message').textContent =
        'Licença válida! Você pode baixar o software abaixo.';
      document.getElementById('software-name').textContent =
        (licenca.softwares && licenca.softwares.nome) || 'Software';
      document.getElementById('software-version').textContent = versao;

      const btnDownload = document.getElementById('btn-download');
      if (btnDownload) {
        if (downloadUrl && downloadUrl !== '#') {
          btnDownload.href = downloadUrl;
          btnDownload.target = '_blank';
          btnDownload.onclick = null;
        } else {
          btnDownload.href = '#';
          btnDownload.onclick = (ev) => {
            ev.preventDefault();
            alert('Arquivo de download ainda não foi cadastrado para este software. Fale conosco no WhatsApp.');
          };
        }
      }

    } catch (err) {
      console.error(err);
      formCard.style.display = 'none';
      resultCard.style.display = 'none';
      errorCard.style.display = 'block';
      document.getElementById('error-message').textContent =
        err.message || 'Erro inesperado. Tente novamente ou fale conosco.';
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
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
