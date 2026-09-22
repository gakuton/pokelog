// pokemon_master.json の日本語名から、PokeAPI (GraphQL beta) を使って
// アイコン表示用の pokemon id を解決し、public/data/pokemon_icons.json に書き出す。
// 一度きりの生成スクリプト。レギュレーション更新でポケモンが追加された際に再実行する。
import { readFileSync, writeFileSync } from "fs";

const GRAPHQL_URL = "https://beta.pokeapi.co/graphql/v1beta";
const MASTER_PATH = new URL("../public/data/pokemon_master.json", import.meta.url);
const OUTPUT_PATH = new URL("../public/data/pokemon_icons.json", import.meta.url);

// PokeAPI の地方の姿/フォルムは日本語名の表記ゆれ(括弧書きなど)がGraphQL検索に
// 引っかからないため、手動で pokemon id を対応付ける。
const MANUAL_OVERRIDES = {
  "イダイトウ(オス)": 902,
  "イダイトウ(メス)": 10248,
  "フラエッテ(えいえん)": 10061,
  "ダイケンキ(ヒスイ)": 10236,
  "キュウコン(アローラ)": 10104,
  "ヌメルゴン(ヒスイ)": 10242,
  "ヤドキング(ガラル)": 10172,
  "ゾロアーク(ヒスイ)": 10239,
  "ウインディ(ヒスイ)": 10230,
  "ヤドラン(ガラル)": 10165,
  "バクフーン(ヒスイ)": 10233,
  "ルガルガン(たそがれ)": 10152,
  "ジュナイパー(ヒスイ)": 10244,
  "ケンタロス(炎)": 10251,
  "ポリゴンZ": 474,
  "ライチュウ(アローラ)": 10100,
  "アローラペルシアン": 10108,
  "ストリンダー(ハイ)": 849,
  "ストリンダー(ロー)": 10184,
  "イエッサン(オス)": 876,
  "イエッサン(メス)": 10186,
};

async function graphql(query) {
  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`GraphQL error: ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

function esc(name) {
  return JSON.stringify(name);
}

async function assertHomeArtworkExists(ids) {
  const missing = [];
  for (const id of ids) {
    const res = await fetch(
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${id}.png`,
      { method: "HEAD" }
    );
    if (!res.ok) missing.push(id);
  }
  return missing;
}

async function resolveSpeciesNames(names) {
  const inList = names.map(esc).join(",");
  const data = await graphql(`query{
    pokemon_v2_pokemonspecies(where:{pokemon_v2_pokemonspeciesnames:{name:{_in:[${inList}]}}}){
      pokemon_v2_pokemonspeciesnames(where:{name:{_in:[${inList}]}}){ name }
      pokemon_v2_pokemons(where:{is_default:{_eq:true}}){ id }
    }
  }`);
  const map = {};
  for (const species of data.pokemon_v2_pokemonspecies) {
    const pokemonId = species.pokemon_v2_pokemons[0]?.id;
    if (!pokemonId) continue;
    for (const n of species.pokemon_v2_pokemonspeciesnames) {
      map[n.name] = pokemonId;
    }
  }
  return map;
}

async function resolveFormNames(names) {
  const inList = names.map(esc).join(",");
  const data = await graphql(`query{
    pokemon_v2_pokemonformname(where:{name:{_in:[${inList}]}}){
      name
      pokemon_v2_pokemonform{ pokemon_id }
    }
  }`);
  const map = {};
  for (const row of data.pokemon_v2_pokemonformname) {
    const pokemonId = row.pokemon_v2_pokemonform?.pokemon_id;
    if (pokemonId) map[row.name] = pokemonId;
  }
  return map;
}

async function main() {
  const master = JSON.parse(readFileSync(MASTER_PATH));
  const names = master.map((p) => p.name);

  const speciesMap = await resolveSpeciesNames(names);
  const missing = names.filter((n) => !(n in speciesMap));
  const formMap = missing.length ? await resolveFormNames(missing) : {};

  const result = {};
  const unresolved = [];
  for (const name of names) {
    const id = MANUAL_OVERRIDES[name] ?? speciesMap[name] ?? formMap[name];
    if (id) {
      result[name] = id;
    } else {
      unresolved.push(name);
    }
  }

  const missingArtwork = await assertHomeArtworkExists(Object.values(result));

  writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2) + "\n");
  console.log(`resolved: ${Object.keys(result).length}/${names.length}`);
  if (unresolved.length) {
    console.log("unresolved:", unresolved.join(", "));
  }
  if (missingArtwork.length) {
    console.log("missing home artwork for ids:", missingArtwork.join(", "));
  }
}

main();
