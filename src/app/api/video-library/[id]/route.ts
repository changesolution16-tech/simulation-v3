import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

const detectPlatform = (url: string) => {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('synthesia.io')) return 'synthesia';
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube';
  if (lowerUrl.includes('vimeo.com')) return 'vimeo';
  if (lowerUrl.includes('loom.com')) return 'loom';
  if (lowerUrl.includes('blob:') || lowerUrl.includes('supabase.co/storage')) return 'file';
  return 'custom';
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin' && session.user.role !== 'instructor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const allowedFields = [
      'title',
      'description',
      'video_url',
      'video_platform',
      'video_source',
      'video_type',
      'video_file_id',
      'tags',
      'is_public',
      'difficulty',
      'thumbnail_url',
      'is_active'
    ];

    const updates: Record<string, any> = { updated_at: new Date() };

    Object.entries(body).forEach(([key, value]) => {
      if (allowedFields.includes(key)) {
        updates[key] = key === 'tags' ? JSON.stringify(value || []) : value;
      }
    });

    if (body.video_url && !body.video_platform) {
      updates.video_platform = detectPlatform(body.video_url);
    }

    if (Object.keys(updates).length === 1) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const result = await sql`
      UPDATE video_library
      SET ${sql(updates)}
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error: any) {
    console.error('Error updating video library item:', error);
    return NextResponse.json(
      { error: 'Failed to update video', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin' && session.user.role !== 'instructor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const result = await sql`
      UPDATE video_library
      SET is_active = false, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting video library item:', error);
    return NextResponse.json(
      { error: 'Failed to delete video', details: error.message },
      { status: 500 }
    );
  }
}
