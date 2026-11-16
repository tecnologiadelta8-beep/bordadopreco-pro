-- ============================================================
-- JDC Bordados — Schema completo (rode no SQL Editor do Supabase)
-- ============================================================

-- 1. SOFTWARES
create table if not exists softwares (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  preco numeric(10,2),
  ativo boolean default true,
  criado_em timestamptz default now()
);

-- 2. CLIENTES
create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text,
  telefone text,
  whatsapp text,
  senha text,
  data_nascimento date,
  observacoes text,
  criado_em timestamptz default now()
);

create index if not exists idx_clientes_email on clientes(email);
create index if not exists idx_clientes_telefone on clientes(telefone);

-- 3. LICENÇAS (códigos de ativação — só gestão cadastra)
create table if not exists licencas (
  id uuid primary key default gen_random_uuid(),
  chave_licenca text unique not null,
  software_id uuid references softwares(id) on delete restrict,
  cliente_id uuid references clientes(id) on delete set null,
  status text default 'ativa' check (status in ('ativa','pendente','expirada','cancelada')),
  data_expiracao date,
  observacoes text,
  criado_em timestamptz default now()
);

create index if not exists idx_licencas_chave on licencas(chave_licenca);
create index if not exists idx_licencas_status on licencas(status);

-- 4. DOWNLOADS (links dos arquivos no R2)
create table if not exists downloads (
  id uuid primary key default gen_random_uuid(),
  software_id uuid references softwares(id) on delete cascade,
  nome_arquivo text not null,
  url_arquivo text not null,
  versao text,
  ativo boolean default true,
  criado_em timestamptz default now()
);

-- 5. TIRA-DÚVIDA (perguntas dos clientes)
create table if not exists tira_duvida (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id) on delete set null,
  nome text,
  telefone text,
  pergunta text not null,
  foto_url text,
  status text default 'pendente' check (status in ('pendente','respondida','arquivada')),
  resposta text,
  respondido_em timestamptz,
  criado_em timestamptz default now()
);

create index if not exists idx_tira_duvida_status on tira_duvida(status);

-- 6. LOG DE DOWNLOADS (opcional)
create table if not exists download_logs (
  id uuid primary key default gen_random_uuid(),
  licenca_id uuid references licencas(id) on delete set null,
  download_id uuid references downloads(id) on delete set null,
  criado_em timestamptz default now()
);

-- ============================================================
-- RLS — acesso básico (projeto pessoal / anon key no painel)
-- ============================================================
alter table softwares enable row level security;
alter table clientes enable row level security;
alter table licencas enable row level security;
alter table downloads enable row level security;
alter table tira_duvida enable row level security;
alter table download_logs enable row level security;

-- Softwares
drop policy if exists "softwares_all" on softwares;
create policy "softwares_all" on softwares for all using (true) with check (true);

-- Clientes
drop policy if exists "clientes_all" on clientes;
create policy "clientes_all" on clientes for all using (true) with check (true);

-- Licenças
drop policy if exists "licencas_all" on licencas;
create policy "licencas_all" on licencas for all using (true) with check (true);

-- Downloads
drop policy if exists "downloads_all" on downloads;
create policy "downloads_all" on downloads for all using (true) with check (true);

-- Tira dúvida
drop policy if exists "tira_duvida_all" on tira_duvida;
create policy "tira_duvida_all" on tira_duvida for all using (true) with check (true);

-- Logs
drop policy if exists "download_logs_all" on download_logs;
create policy "download_logs_all" on download_logs for all using (true) with check (true);

-- ============================================================
-- Dados iniciais (os 4 softwares da JDC)
-- ============================================================
insert into softwares (nome, descricao, preco, ativo)
select * from (values
  ('BordadoPreço Pro v5.1', 'Precificador completo com variáveis e orçamento PDF/HTML', 75.00, true),
  ('Borda Fácil Pro v1.0', 'Cálculo simples por quantidade de pontos', 75.00, true),
  ('Extrator de Matrizes Pro', 'Organiza matrizes por tamanho de bastidor', 75.00, true),
  ('Organizador de Matrizes', 'Detecta duplicatas e organiza por formato', 75.00, true)
) as v(nome, descricao, preco, ativo)
where not exists (select 1 from softwares s where s.nome = v.nome);
