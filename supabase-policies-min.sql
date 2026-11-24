-- Policies mínimas para o painel JDC funcionar com a chave anon
-- Rode no SQL Editor do Supabase (projeto jdc-bordados)

alter table softwares enable row level security;
alter table clientes enable row level security;
alter table licencas enable row level security;
alter table downloads enable row level security;
alter table tira_duvida enable row level security;

drop policy if exists "softwares_all" on softwares;
create policy "softwares_all" on softwares for all using (true) with check (true);

drop policy if exists "clientes_all" on clientes;
create policy "clientes_all" on clientes for all using (true) with check (true);

drop policy if exists "licencas_all" on licencas;
create policy "licencas_all" on licencas for all using (true) with check (true);

drop policy if exists "downloads_all" on downloads;
create policy "downloads_all" on downloads for all using (true) with check (true);

drop policy if exists "tira_duvida_all" on tira_duvida;
create policy "tira_duvida_all" on tira_duvida for all using (true) with check (true);

-- Se a leitura ainda falhar, confira em Authentication > Policies se não há outra policy bloqueando.
