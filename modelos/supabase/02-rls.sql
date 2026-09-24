-- ============================================================================
-- Cronograma do Bruno — Row Level Security
--
-- A chave publishable fica exposta no JavaScript (é assim por design).
-- Quem protege o dado é ESTE arquivo. Tabela sem RLS = dado público.
--
-- Rode DEPOIS de 01-schema.sql e teste como atacante antes de confiar
-- (a seção "Testar" no fim mostra como).
-- ============================================================================

alter table public.progresso enable row level security;

-- Zera políticas antigas para o script poder rodar mais de uma vez.
drop policy if exists "progresso: ler o proprio"     on public.progresso;
drop policy if exists "progresso: criar o proprio"   on public.progresso;
drop policy if exists "progresso: alterar o proprio" on public.progresso;
drop policy if exists "progresso: apagar o proprio"  on public.progresso;

-- Cada usuário enxerga e altera SOMENTE a própria linha.
-- auth.uid() é null para quem não está autenticado, e null nunca casa em
-- comparação — então visitante anônimo não vê linha nenhuma.

create policy "progresso: ler o proprio" on public.progresso
  for select to authenticated
  using (usuario_id = auth.uid());

-- with check não é opcional: sem ele alguém insere linha no nome de outro.
create policy "progresso: criar o proprio" on public.progresso
  for insert to authenticated
  with check (usuario_id = auth.uid());

create policy "progresso: alterar o proprio" on public.progresso
  for update to authenticated
  using      (usuario_id = auth.uid())
  with check (usuario_id = auth.uid());

create policy "progresso: apagar o proprio" on public.progresso
  for delete to authenticated
  using (usuario_id = auth.uid());

-- ============================================================================
-- TESTAR — não presuma que funciona porque o SQL rodou sem erro.
--
-- 1) Sem token nenhum — precisa vir [] (nunca dados):
--    curl "$SUPABASE_URL/rest/v1/progresso?select=*" -H "apikey: $CHAVE"
--
-- 2) Com uma segunda conta de teste — precisa vir [] também, e não a linha
--    do Bruno:
--    curl "$SUPABASE_URL/rest/v1/progresso?select=*" \
--         -H "apikey: $CHAVE" -H "Authorization: Bearer $TOKEN_DA_OUTRA_CONTA"
--
-- 3) Tentar gravar apontando para o usuario_id alheio — precisa ser recusado.
--
-- No painel: Database → Advisors não pode acusar tabela sem RLS.
-- ============================================================================
