-- Execute uma vez no SQL Editor de um projeto Supabase.
-- Coleção pública compartilhada, como no escopo acadêmico da apostila.
begin;
create table public.favoritos (
  id bigint generated always as identity primary key,
  criado_em timestamptz not null default now(),
  piloto_id text not null check (piloto_id ~ '^[a-zA-Z0-9_-]{1,80}$'),
  temporada integer not null check (temporada between 1950 and 2100),
  nome text not null check (char_length(nome) between 1 and 160),
  equipe text not null check (char_length(equipe) between 1 and 160),
  nacionalidade text not null check (char_length(nacionalidade) between 1 and 100),
  unique (piloto_id, temporada)
);
create table public.historico (
  id bigint generated always as identity primary key,
  criado_em timestamptz not null default now(),
  termo text not null check (char_length(termo) between 1 and 100),
  temporada integer not null check (temporada between 1950 and 2100),
  encontrado boolean not null
);
create index on public.historico (criado_em desc, id desc);
alter table public.favoritos enable row level security;
alter table public.historico enable row level security;
revoke all on public.favoritos, public.historico from anon, authenticated;
grant usage on schema public to anon;
grant select, insert, delete on public.favoritos to anon;
grant select, insert on public.historico to anon;
grant usage, select on sequence public.favoritos_id_seq, public.historico_id_seq to anon;
create policy favoritos_leitura on public.favoritos for select to anon using (true);
create policy favoritos_insercao on public.favoritos for insert to anon with check (true);
create policy favoritos_remocao on public.favoritos for delete to anon using (true);
create policy historico_leitura on public.historico for select to anon using (true);
create policy historico_insercao on public.historico for insert to anon with check (true);
-- Agregação no banco, sem depender do limite de linhas da API REST.
create function public.estatisticas_favoritos() returns jsonb
language sql stable security invoker set search_path = public as $$
  select jsonb_build_object(
    'total', (select count(*) from public.favoritos),
    'recente', (select nome from public.favoritos order by criado_em desc, id desc limit 1),
    'equipe', (select equipe from public.favoritos group by equipe order by count(*) desc, equipe limit 1),
    'equipes', (select count(distinct equipe) from public.favoritos)
  );
$$;
revoke all on function public.estatisticas_favoritos() from public, authenticated;
grant execute on function public.estatisticas_favoritos() to anon;
commit;
