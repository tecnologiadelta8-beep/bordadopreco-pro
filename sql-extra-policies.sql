-- Permitir que a chave anon leia licenças (necessário para validar no download)
CREATE POLICY "Licenças públicas para validação"
ON licencas
FOR SELECT
USING (true);

-- Permitir leitura de clientes (opcional)
CREATE POLICY "Clientes leitura"
ON clientes
FOR SELECT
USING (true);

-- Políticas de escrita para o painel (usando anon por enquanto - projeto pessoal)
-- Depois podemos restringir melhor

CREATE POLICY "Inserir softwares"
ON softwares FOR INSERT WITH CHECK (true);

CREATE POLICY "Atualizar softwares"
ON softwares FOR UPDATE USING (true);

CREATE POLICY "Inserir downloads"
ON downloads FOR INSERT WITH CHECK (true);

CREATE POLICY "Atualizar downloads"
ON downloads FOR UPDATE USING (true);

CREATE POLICY "Inserir licenças"
ON licencas FOR INSERT WITH CHECK (true);

CREATE POLICY "Atualizar licenças"
ON licencas FOR UPDATE USING (true);

CREATE POLICY "Inserir clientes"
ON clientes FOR INSERT WITH CHECK (true);

CREATE POLICY "Atualizar clientes"
ON clientes FOR UPDATE USING (true);

CREATE POLICY "Inserir FAQ"
ON tira_duvida FOR INSERT WITH CHECK (true);

CREATE POLICY "Atualizar FAQ"
ON tira_duvida FOR UPDATE USING (true);
