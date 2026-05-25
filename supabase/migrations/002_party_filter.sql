-- Update get_pokemon_win_rates to support optional party_id filter
create or replace function get_pokemon_win_rates(p_party_id uuid default null)
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
    where (p_party_id is null or b.party_id = p_party_id)
    union all
    select b.result, pm.pokemon_name
    from battles b
    join pokemon_members pm on pm.id = b.my_sel2_id
    where (p_party_id is null or b.party_id = p_party_id)
    union all
    select b.result, pm.pokemon_name
    from battles b
    join pokemon_members pm on pm.id = b.my_sel3_id
    where (p_party_id is null or b.party_id = p_party_id)
  ) t
  group by pokemon_name
  order by count desc;
$$;

-- Update get_opp_pokemon_win_rates to support optional party_id filter
create or replace function get_opp_pokemon_win_rates(p_party_id uuid default null)
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
    where (p_party_id is null or party_id = p_party_id)
    union all
    select result, opp_sel2_name from battles
    where (p_party_id is null or party_id = p_party_id)
    union all
    select result, opp_sel3_name from battles
    where (p_party_id is null or party_id = p_party_id)
  ) t
  group by pokemon_name
  order by count desc;
$$;
