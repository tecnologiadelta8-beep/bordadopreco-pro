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

### Cliente
- Use o **e-mail** ou **telefone** cadastrado + senha definida no cadastro
- Acesso: área de downloads e nome no topo do site

### Gestor
- Acesso restrito (credenciais não públicas)

## O que aparece quando logado

- Botão **Entrar** some e mostra: `Olá, [Nome]!`
- Cliente → link "Meus Downloads"
- Gestor → links "Painel" e "Gestão" + botão Sair

## Próximos passos

1. Subir arquivos dos softwares no Cloudflare R2 e cadastrar a URL em **Downloads**
2. Sistema de licenças / validação de chave (já funcional em download.html)
