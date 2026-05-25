import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { battleCreateSchema } from '@/lib/validations/battle';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 20), 100);
  const offset = Number(url.searchParams.get('offset') ?? 0);
  const myPokemon = url.searchParams.get('my');
  const oppPokemon = url.searchParams.get('opp');

  const sb = createClient();
  let query = sb
    .from('battles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (myPokemon) {
    query = query.or(
      `opp_sel1_name.eq.${myPokemon},opp_sel2_name.eq.${myPokemon},opp_sel3_name.eq.${myPokemon}`
    );
  }
  if (oppPokemon) {
    query = query.or(
      `opp_sel1_name.eq.${oppPokemon},opp_sel2_name.eq.${oppPokemon},opp_sel3_name.eq.${oppPokemon}`
    );
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, count });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = battleCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const sb = createClient();
  const { data, error } = await sb.from('battles').insert(parsed.data).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
