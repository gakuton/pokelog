import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { seasonSchema } from '@/lib/validations/season';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = seasonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const sb = createClient();
  const { data, error } = await sb
    .from('seasons')
    .update({
      name: parsed.data.name,
      start_date: parsed.data.start_date ?? null,
      end_date: parsed.data.end_date ?? null,
    })
    .eq('id', id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sb = createClient();

  // 紐付きパーティが存在する場合は削除不可
  const { count } = await sb
    .from('parties')
    .select('id', { count: 'exact', head: true })
    .eq('season_id', id);
  if (count && count > 0) {
    return NextResponse.json(
      { error: 'このシーズンにはパーティが紐付いているため削除できません' },
      { status: 409 }
    );
  }

  const { error } = await sb.from('seasons').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
