-- ============================================================
-- JDC — Páginas de software + Tira-dúvidas + Leads
-- Rode no SQL Editor do Supabase
-- ============================================================

-- 1. Campos extras no software (página de detalhe)
alter table softwares add column if not exists imagem_url text;
alter table softwares add column if not exists como_funciona text;  -- HTML ou texto longo passo a passo
alter table softwares add column if not exists resumo text;         -- texto curto do card
alter table softwares add column if not exists badge text;          -- ex: "Mais Completo", "Mais Simples"
alter table softwares add column if not exists ordem int default 0;

-- 2. Tira-dúvida ligada a um software
alter table tira_duvida add column if not exists software_id uuid references softwares(id) on delete set null;
create index if not exists idx_tira_duvida_software on tira_duvida(software_id);

-- 3. Leads / Tenho interesse (pré-cadastro)
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  software_id uuid references softwares(id) on delete set null,
  nome text not null,
  telefone text not null,
  mensagem text,
  origem text default 'tenho_interesse', -- tenho_interesse | tira_duvida
  status text default 'novo' check (status in ('novo','contatado','convertido','arquivado')),
  criado_em timestamptz default now()
);

create index if not exists idx_leads_status on leads(status);
create index if not exists idx_leads_software on leads(software_id);

alter table leads enable row level security;
drop policy if exists "leads_all" on leads;
create policy "leads_all" on leads for all using (true) with check (true);

-- 4. Garantir leitura pública de softwares ativos e tira-dúvidas respondidas
-- (policies já costumam ser abertas com a chave anon neste projeto)

-- Exemplo de conteúdo inicial para BordadoPreço Pro (ajuste o id se precisar)
-- UPDATE softwares SET
--   resumo = 'Cálculo automático de pontos + orçamentos em PDF/HTML personalizados.',
--   badge = 'Mais Completo',
--   como_funciona = E'1. Clique em Selecionar Matriz e escolha o arquivo de bordado.\n2. O preço é calculado na hora (pontos, cores, tempo e valor sugerido).\n3. Use Itens Adicionais para materiais, serviços e cores reais do fio.\n4. Clique em Gerar Orçamento e salve em HTML ou PDF.\n5. Gerencie pedidos, pagamentos e crediário na Gestão de Pedidos.'
-- WHERE nome ILIKE '%BordadoPreço%' OR nome ILIKE '%BordadoPreco%';
