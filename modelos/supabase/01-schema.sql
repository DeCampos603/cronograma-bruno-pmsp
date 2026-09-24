-- ============================================================================
-- Cronograma do Bruno — esquema do banco
-- Rode isto no Supabase em: SQL Editor → New query → Run
--
-- Modelagem deliberadamente mínima: UMA linha por usuário, com todo o progresso
-- em jsonb. É o progresso de estudo de uma pessoa, não um sistema multiusuário
-- com relatórios cruzados — modelar dez tabelas aqui só criaria manutenção sem
-- entregar nada. O site já trata o estado como um documento único.
-- ============================================================================

create table if not exists public.progresso (
  usuario_id     uuid primary key references auth.users(id) on delete cascade,
  dados          jsonb not null default '{}'::jsonb,
  atualizado_em  timestamptz not null default now(),
  criado_em      timestamptz not null default now()
);

comment on table  public.progresso is 'Um documento de progresso por usuário (tópicos, semanas, simulados, redações, TAF).';
comment on column public.progresso.dados is 'Estado completo do app, no mesmo formato do backup JSON.';

-- Mantém atualizado_em confiável mesmo se o cliente mandar valor errado.
create or replace function public.toca_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

drop trigger if exists trg_progresso_atualizado on public.progresso;
create trigger trg_progresso_atualizado
  before insert or update on public.progresso
  for each row execute function public.toca_atualizado_em();
