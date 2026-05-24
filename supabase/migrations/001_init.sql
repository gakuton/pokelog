-- パーティテーブル
create table if not exists parties (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

-- ポケモンメンバーテーブル
create table if not exists pokemon_members (
  id           uuid primary key default gen_random_uuid(),
  party_id     uuid not null references parties(id) on delete cascade,
  slot         smallint not null check (slot between 1 and 6),
  pokemon_name text not null,
  move1        text,
  move2        text,
  move3        text,
  move4        text,
  nature       text,
  held_item    text,
  ev_h         smallint not null default 0 check (ev_h between 0 and 252),
  ev_a         smallint not null default 0 check (ev_a between 0 and 252),
  ev_b         smallint not null default 0 check (ev_b between 0 and 252),
  ev_c         smallint not null default 0 check (ev_c between 0 and 252),
  ev_d         smallint not null default 0 check (ev_d between 0 and 252),
  ev_s         smallint not null default 0 check (ev_s between 0 and 252),
  has_mega_item boolean not null default false,
  stat_h       smallint,
  stat_a       smallint,
  stat_b       smallint,
  stat_c       smallint,
  stat_d       smallint,
  stat_s       smallint,
  updated_at   timestamptz,
  unique (party_id, slot)
);

-- 対戦テーブル
create table if not exists battles (
  id               uuid primary key default gen_random_uuid(),
  party_id         uuid references parties(id) on delete set null,
  my_sel1_id       uuid references pokemon_members(id) on delete set null,
  my_sel2_id       uuid references pokemon_members(id) on delete set null,
  my_sel3_id       uuid references pokemon_members(id) on delete set null,
  my_sel1_mega     boolean not null default false,
  my_sel2_mega     boolean not null default false,
  my_sel3_mega     boolean not null default false,
  opp_party_json   text[],
  opp_sel1_name    text not null,
  opp_sel2_name    text not null,
  opp_sel3_name    text not null,
  opp_sel1_mega    boolean not null default false,
  opp_sel2_mega    boolean not null default false,
  opp_sel3_mega    boolean not null default false,
  selection_intent text,
  result           text not null check (result in ('win','lose','draw')),
  reflection       text,
  rating_after     smallint,
  created_at       timestamptz not null default now()
);

-- 勝率サマリービュー
create or replace view win_rate_summary as
select
  count(*)                                                         as total_battles,
  count(*) filter (where result = 'win')                          as total_wins,
  count(*) filter (where result = 'lose')                         as total_losses,
  count(*) filter (where result = 'draw')                         as total_draws,
  round(
    count(*) filter (where result = 'win')::numeric / nullif(count(*), 0) * 100,
    1
  )                                                                as total_win_rate,
  count(*) filter (where rn <= 10 and result = 'win')             as recent10_wins,
  count(*) filter (where rn <= 10 and result = 'draw')            as recent10_draws,
  round(
    count(*) filter (where rn <= 10 and result = 'win')::numeric
      / nullif(count(*) filter (where rn <= 10), 0) * 100,
    1
  )                                                                as recent10_win_rate,
  (select rating_after from battles
   where rating_after is not null
   order by created_at desc limit 1)                              as latest_rating
from (
  select result, row_number() over (order by created_at desc) as rn
  from battles
) t;

-- ポケモン別勝率 RPC
create or replace function get_pokemon_win_rates()
returns table (
  pokemon_name text,
  count        bigint,
  wins         bigint,
  win_rate     numeric
)
language sql stable as $$
  select
    pokemon_name,
    count(*)                                            as count,
    count(*) filter (where result = 'win')              as wins,
    round(
      count(*) filter (where result = 'win')::numeric
        / count(*) * 100,
      1
    )                                                   as win_rate
  from (
    select b.result, pm.pokemon_name
    from battles b
    join pokemon_members pm on pm.id = b.my_sel1_id
    union all
    select b.result, pm.pokemon_name
    from battles b
    join pokemon_members pm on pm.id = b.my_sel2_id
    union all
    select b.result, pm.pokemon_name
    from battles b
    join pokemon_members pm on pm.id = b.my_sel3_id
  ) t
  group by pokemon_name
  order by count desc;
$$;

-- 相手ポケモン別勝率 RPC
create or replace function get_opp_pokemon_win_rates()
returns table (
  pokemon_name text,
  count        bigint,
  wins         bigint,
  win_rate     numeric
)
language sql stable as $$
  select
    pokemon_name,
    count(*)                                            as count,
    count(*) filter (where result = 'win')              as wins,
    round(
      count(*) filter (where result = 'win')::numeric
        / count(*) * 100,
      1
    )                                                   as win_rate
  from (
    select result, opp_sel1_name as pokemon_name from battles
    union all
    select result, opp_sel2_name from battles
    union all
    select result, opp_sel3_name from battles
  ) t
  group by pokemon_name
  order by count desc;
$$;

-- インデックス
create index if not exists idx_battles_created_at on battles(created_at desc);
create index if not exists idx_battles_party_id    on battles(party_id);
create index if not exists idx_pokemon_members_party_id on pokemon_members(party_id);
