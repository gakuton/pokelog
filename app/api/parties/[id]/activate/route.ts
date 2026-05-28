import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { active } = await req.json() as { active: boolean };
  const sb = createClient();

  if (active) {
    const { error: clearErr } = await sb
      .from('parties')
      .update({ is_active: false })
      .eq('is_active', true);
    if (clearErr) return NextResponse.json({ error: clearErr.message }, { status: 500 });

    const { data, error } = await sb
      .from('parties')
      .update({ is_active: true })
      .eq('id', id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } else {
    const { data, error } = await sb
      .from('parties')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }
}
