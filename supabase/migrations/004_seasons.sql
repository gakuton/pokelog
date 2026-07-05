-- seasons テーブル
create table if not exists seasons (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  start_date date,
  end_date   date,
  created_at timestamptz not null default now()
);

-- parties に season_id を追加
alter table parties
  add column if not exists season_id uuid references seasons(id) on delete set null;
