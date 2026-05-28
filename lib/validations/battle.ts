import { z } from 'zod';

const memberIdField = z.string().uuid().nullable();
const oppNameField = z.string().max(50);

export const battleCreateSchema = z.object({
  party_id: z.string().uuid().nullable(),
  my_sel1_id: memberIdField,
  my_sel2_id: memberIdField,
  my_sel3_id: memberIdField,
  my_sel1_mega: z.boolean(),
  my_sel2_mega: z.boolean(),
  my_sel3_mega: z.boolean(),
  opp_party_json: z.array(z.string()).nullable(),
  opp_sel1_name: oppNameField,
  opp_sel2_name: oppNameField,
  opp_sel3_name: oppNameField,
  opp_sel1_mega: z.boolean(),
  opp_sel2_mega: z.boolean(),
  opp_sel3_mega: z.boolean(),
  selection_intent: z.string().max(500).nullable(),
  result: z.enum(['win', 'lose', 'draw']),
  reflection: z.string().max(1000).nullable(),
  rating_after: z.number().int().min(0).max(9999).nullable(),
});

export type BattleCreateInput = z.infer<typeof battleCreateSchema>;
