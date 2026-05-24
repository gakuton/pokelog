export interface Party {
  id: string;
  name: string;
  created_at: string;
  updated_at?: string;
  pokemon_members?: PokemonMember[];
}

export interface PokemonMember {
  id: string;
  party_id: string;
  slot: number;
  pokemon_name: string;
  move1: string | null;
  move2: string | null;
  move3: string | null;
  move4: string | null;
  nature: string | null;
  held_item: string | null;
  ev_h: number;
  ev_a: number;
  ev_b: number;
  ev_c: number;
  ev_d: number;
  ev_s: number;
  has_mega_item: boolean;
  stat_h: number | null;
  stat_a: number | null;
  stat_b: number | null;
  stat_c: number | null;
  stat_d: number | null;
  stat_s: number | null;
  updated_at?: string;
}

export type BattleResult = 'win' | 'lose' | 'draw';

export interface Battle {
  id: string;
  party_id: string | null;
  my_sel1_id: string | null;
  my_sel2_id: string | null;
  my_sel3_id: string | null;
  my_sel1_mega: boolean;
  my_sel2_mega: boolean;
  my_sel3_mega: boolean;
  opp_party_json: string[] | null;
  opp_sel1_name: string;
  opp_sel2_name: string;
  opp_sel3_name: string;
  opp_sel1_mega: boolean;
  opp_sel2_mega: boolean;
  opp_sel3_mega: boolean;
  selection_intent: string | null;
  result: BattleResult;
  reflection: string | null;
  rating_after: number | null;
  created_at: string;
}

export interface WinRateSummary {
  total_battles: number;
  total_wins: number;
  total_losses: number;
  total_draws: number;
  total_win_rate: number;
  recent10_wins: number;
  recent10_draws: number;
  recent10_win_rate: number;
  latest_rating: number | null;
}

export interface PokemonWinRate {
  pokemon_name: string;
  count: number;
  wins: number;
  win_rate: number;
}

export type NatureEffect = 'up' | 'down' | 'neutral';

export interface PokemonMasterEntry {
  name: string;
  types: string[];
  base: {
    hp: number;
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
  };
  has_mega: boolean;
}
