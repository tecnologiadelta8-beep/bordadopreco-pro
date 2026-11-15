# JDC Tecnologia em Bordados

Site oficial + Área do Gestor e Cliente (PWA).

## Arquivos principais

**Público**
- `index.html` — Página inicial (serviços, softwares, vídeo aulas)
- `softwares.html` — Listagem de softwares
- `download.html` — Área de download com validação de licença

**Login unificado**
- `login.html` — Entrar (Cliente ou Gestor)
- `auth.js` — Autenticação (sessão local + Supabase para clientes)

**Gestor (PWA)**
- `admin.html` — Painel de gestão
- `admin-gestao.html` — CRUD de softwares, licenças, downloads e clientes
- `manifest-gestor.json` + `sw-gestor.js` — PWA só do gestor

## Login

### Gestor
- **Usuário:** `admin`
- **Senha:** `jdc2026`
- Acesso: Painel + Gestão completa

### Cliente
- Use o **e-mail** ou **telefone** cadastrado na tabela `clientes`
- **Senha padrão:** últimos 4 dígitos do telefone/WhatsApp
- (Se a coluna `senha` existir na tabela, usa ela em vez dos 4 dígitos)
- Acesso: área de downloads e nome no topo do site

## O que aparece quando logado

- **Faixa verde no topo** (estilo Compre Diamantino / IBN)
- Botão **Entrar** some e mostra: `Olá, [Nome]!`
- Cliente → link "Meus Downloads"
- Gestor → links "Painel" e "Gestão" + botão Sair

## Próximos passos

1. Subir arquivos dos softwares no Cloudflare R2 e cadastrar a URL em **Downloads**
2. (Opcional) Adicionar coluna `senha` na tabela `clientes` para senha personalizada:
   ```sql
   ALTER TABLE clientes ADD COLUMN IF NOT EXISTS senha text;
   ```
3. Sistema de licenças / validação de chave (já funcional em download.html)

WhatsApp: 65 99946-0391 (Juarez Cunha)
