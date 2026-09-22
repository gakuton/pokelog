-- パーティの「版」テーブル
-- pokemon_members は一度作られた版の行を二度と UPDATE しない(常に新版として作成)。
-- battles.my_sel1_id〜3_id は pokemon_members(id) を参照し続けるため、
-- 過去の版の行が不変であれば対戦記録・レポートは版が変わっても改ざんされない。
create table if not exists party_versions (
  id         uuid primary key default gen_random_uuid(),
  party_id   uuid not null references parties(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_party_versions_party_id on party_versions(party_id);

-- pokemon_members に version を追加(party_id は既存の一覧取得・複製・履歴解決の
-- 簡便のため残す。一意制約のみ version 単位に切り替える)
alter table pokemon_members add column if not exists party_version_id uuid references party_versions(id) on delete cascade;

-- parties に「現在の版」を追加
alter table parties add column if not exists current_version_id uuid references party_versions(id);

-- バックフィル: 既存の各パーティに初期版を1つ作成し、既存メンバーを付け替える
insert into party_versions (party_id)
select id from parties
where not exists (select 1 from party_versions pv where pv.party_id = parties.id);

update pokemon_members pm
set party_version_id = pv.id
from party_versions pv
where pm.party_id = pv.party_id
  and pm.party_version_id is null;

update parties p
set current_version_id = pv.id
from party_versions pv
where pv.party_id = p.id
  and p.current_version_id is null;

alter table pokemon_members alter column party_version_id set not null;
alter table parties alter column current_version_id set not null;

-- 一意制約を party_id 単位から party_version_id 単位に切り替え
alter table pokemon_members drop constraint if exists pokemon_members_party_id_slot_key;
alter table pokemon_members add constraint pokemon_members_version_slot_key unique (party_version_id, slot);

create index if not exists idx_pokemon_members_party_version_id on pokemon_members(party_version_id);
