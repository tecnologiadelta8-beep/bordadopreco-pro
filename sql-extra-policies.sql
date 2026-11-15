-- Políticas e colunas extras - JDC Bordados
-- Rode no SQL Editor do Supabase

-- Colunas para login e recuperação de senha do cliente
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS senha text;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS data_nascimento date;

-- Permitir que a chave anon leia licenças (necessário para validar no download)
CREATE POLICY IF NOT EXISTS "Licenças públicas para validação"
ON licencas
FOR SELECT
USING (true);

-- Permitir leitura de clientes (login e recuperação)
CREATE POLICY IF NOT EXISTS "Clientes leitura"
ON clientes
FOR SELECT
USING (true);

-- Políticas de escrita para o painel (usando anon por enquanto - projeto pessoal)
CREATE POLICY IF NOT EXISTS "Inserir softwares"
ON softwares FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Atualizar softwares"
ON softwares FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "Inserir downloads"
ON downloads FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Atualizar downloads"
ON downloads FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "Inserir licenças"
ON licencas FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Atualizar licenças"
ON licencas FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "Inserir clientes"
ON clientes FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Atualizar clientes"
ON clientes FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "Inserir FAQ"
ON tira_duvida FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Atualizar FAQ"
ON tira_duvida FOR UPDATE USING (true);
