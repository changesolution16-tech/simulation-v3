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

const normalizeTags = (input: unknown): string[] => {
  if (Array.isArray(input)) {
    return input.map(tag => String(tag).trim()).filter(Boolean);
  }
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed)
          ? parsed.map(tag => String(tag).trim()).filter(Boolean)
          : [];
      } catch {
        return [];
      }
    }
    return trimmed.split(',').map(tag => tag.trim()).filter(Boolean);
  }
  return [];
};

const normalizeIdArray = (input: unknown): string[] => {
  if (Array.isArray(input)) {
    return input.map(id => String(id).trim()).filter(Boolean);
  }
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed)
          ? parsed.map(id => String(id).trim()).filter(Boolean)
          : [];
      } catch {
        return [];
      }
    }
    return trimmed.split(',').map(id => id.trim()).filter(Boolean);
  }
  return [];
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
      'topic_ids',
      'competency_ids',
      'is_public',
      'difficulty',
      'thumbnail_url',
      'is_active'
    ];

    const updates: Record<string, any> = { updated_at: new Date() };

    const normalizedTags = normalizeTags(body.tags);
    const normalizedTopicIds = normalizeIdArray(body.topic_ids);
    const normalizedCompetencyIds = normalizeIdArray(body.competency_ids);

    Object.entries(body).forEach(([key, value]) => {
      if (allowedFields.includes(key)) {
        if (key === 'tags') {
          updates[key] = normalizedTags;
        } else if (key === 'topic_ids') {
          updates[key] = normalizedTopicIds;
        } else if (key === 'competency_ids') {
          updates[key] = normalizedCompetencyIds;
        } else {
          updates[key] = value;
        }
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const result = await sql`
      SELECT
        id,
        title,
        description,
        video_url,
        video_platform,
        video_source,
        video_type,
        video_file_id,
        thumbnail_url,
        duration_seconds,
        tags,
        topic_ids,
        competency_ids,
        usage_count,
        difficulty,
        is_public,
        avg_engagement_score,
        avg_completion_rate,
        is_active,
        created_at,
        updated_at
      FROM video_library
      WHERE id = ${id}
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error: any) {
    console.error('Error fetching video library item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video', details: error.message },
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
