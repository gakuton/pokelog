import { NATURE_MODIFIERS, type Nature } from './const';

const LEVEL = 50;
const IV = 31;

export function calcHp(base: number, ev: number): number {
  return Math.floor(((base * 2 + IV + Math.floor(ev / 4)) * LEVEL) / 100) + LEVEL + 10;
}

export function calcStat(
  base: number,
  ev: number,
  natureMod: number
): number {
  return Math.floor(
    (Math.floor(((base * 2 + IV + Math.floor(ev / 4)) * LEVEL) / 100) + 5) * natureMod
  );
}

export interface AllStats {
  h: number;
  a: number;
  b: number;
  c: number;
  d: number;
  s: number;
}

export function calcAllStats(
  base: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number },
  evs: { h: number; a: number; b: number; c: number; d: number; s: number },
  nature: Nature | null
): AllStats {
  const mods = nature ? NATURE_MODIFIERS[nature] : [1, 1, 1, 1, 1];
  return {
    h: calcHp(base.hp, evs.h),
    a: calcStat(base.atk, evs.a, mods[0]),
    b: calcStat(base.def, evs.b, mods[1]),
    c: calcStat(base.spa, evs.c, mods[2]),
    d: calcStat(base.spd, evs.d, mods[3]),
    s: calcStat(base.spe, evs.s, mods[4]),
  };
}

export function hasMegaItem(heldItem: string | null): boolean {
  if (!heldItem) return false;
  return heldItem.endsWith('ナイト');
}
