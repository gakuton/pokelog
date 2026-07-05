import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { seasonSchema } from '@/lib/validations/season';

export async function GET() {
  const sb = createClient();
  const { data, error } = await sb
    .from('seasons')
    .select('*')
    .order('end_date', { ascending: false, nullsFirst: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = seasonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const sb = createClient();
  const { data, error } = await sb
    .from('seasons')
    .insert({
      name: parsed.data.name,
      start_date: parsed.data.start_date ?? null,
      end_date: parsed.data.end_date ?? null,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
