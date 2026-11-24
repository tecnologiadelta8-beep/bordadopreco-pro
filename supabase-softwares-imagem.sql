-- Coluna de imagem dos softwares (para o slideshow da home)
-- Rode no SQL Editor do Supabase

alter table softwares add column if not exists imagem_url text;
alter table softwares add column if not exists foto_url text;
