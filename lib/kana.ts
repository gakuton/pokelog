import { toHiragana, toKatakana } from 'wanakana';

/**
 * ひらがな/カタカナ/ローマ字の表記ゆれ(長音「ー」の位置による違いなど)を
 * 吸収するため、一度カタカナ化してからひらがな化して正規化する。
 * カタカナ経由にすることで、toHiraganaの長音展開ロジック(例: ー→「う」)が
 * ローマ字由来の「ー」「oo」「aa」等の入力にも一貫して適用される。
 */
function normalize(text: string): string {
  return toHiragana(toKatakana(text, { passRomaji: false }));
}

/**
 * ポケモン名(カタカナ)検索用のマッチ判定。
 * クエリがカタカナ/ひらがな/ローマ字(変換未確定含む)のいずれでも部分一致させる。
 */
export function matchesPokemonQuery(name: string, query: string): boolean {
  if (!query) return false;
  if (name.includes(query)) return true;

  return normalize(name).includes(normalize(query));
}
