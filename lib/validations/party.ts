import { z } from 'zod';
import { NATURES } from '../const';

const evField = z.number().int().min(0).max(252);

export const memberUpdateSchema = z
  .object({
    pokemon_name: z.string().min(1),
    move1: z.string().nullable(),
    move2: z.string().nullable(),
    move3: z.string().nullable(),
    move4: z.string().nullable(),
    nature: z.enum(NATURES).nullable(),
    held_item: z.string().nullable(),
    ev_h: evField,
    ev_a: evField,
    ev_b: evField,
    ev_c: evField,
    ev_d: evField,
    ev_s: evField,
    has_mega_item: z.boolean(),
  })
  .refine(
    (d) => d.ev_h + d.ev_a + d.ev_b + d.ev_c + d.ev_d + d.ev_s <= 510,
    { message: '努力値の合計は510以下にしてください' }
  );

export type MemberUpdateInput = z.infer<typeof memberUpdateSchema>;

export const partyCreateSchema = z.object({
  name: z.string().min(1).max(50),
});

export type PartyCreateInput = z.infer<typeof partyCreateSchema>;
