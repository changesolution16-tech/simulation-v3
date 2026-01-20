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

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const platform = searchParams.get('platform');
    const videoType = searchParams.get('videoType');
    const difficulty = searchParams.get('difficulty');
    const searchTerm = searchParams.get('searchTerm');
    const isPublic = searchParams.get('isPublic');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    const rows = await sql`
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
        usage_count,
        difficulty,
        is_public,
        avg_engagement_score,
        avg_completion_rate,
        is_active,
        created_at,
        updated_at
      FROM video_library
      WHERE is_active = true
        ${platform ? sql`AND video_platform = ${platform}` : sql``}
        ${videoType ? sql`AND video_type = ${videoType}` : sql``}
        ${difficulty ? sql`AND (difficulty = ${difficulty} OR difficulty = 'all')` : sql``}
        ${isPublic ? sql`AND is_public = ${isPublic === 'true'}` : sql``}
        ${searchTerm ? sql`AND (title ILIKE ${`%${searchTerm}%`} OR description ILIKE ${`%${searchTerm}%`})` : sql``}
      ORDER BY updated_at DESC
      ${limit ? sql`LIMIT ${Number(limit)}` : sql``}
      ${offset ? sql`OFFSET ${Number(offset)}` : sql``}
    `;

    return NextResponse.json(rows || []);
  } catch (error: any) {
    console.error('Error fetching video library:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video library', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin' && session.user.role !== 'instructor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      description,
      video_url,
      video_platform,
      video_source,
      video_type,
      video_file_id,
      tags = [],
      is_public = false,
      difficulty,
      thumbnail_url
    } = body;

    if (!title || !video_url || !video_type) {
      return NextResponse.json(
        { error: 'title, video_url, and video_type are required' },
        { status: 400 }
      );
    }

    const platform = video_platform || detectPlatform(video_url);

    const [video] = await sql`
      INSERT INTO video_library (
        title,
        description,
        video_url,
        video_platform,
        video_source,
        video_type,
        video_file_id,
        tags,
        is_public,
        difficulty,
        thumbnail_url,
        is_active,
        created_at,
        updated_at,
        created_by
      ) VALUES (
        ${title},
        ${description || null},
        ${video_url},
        ${platform},
        ${video_source || 'url'},
        ${video_type},
        ${video_file_id || null},
        ${JSON.stringify(tags)},
        ${is_public},
        ${difficulty || 'all'},
        ${thumbnail_url || null},
        true,
        NOW(),
        NOW(),
        ${session.user.id}
      )
      RETURNING *
    `;

    return NextResponse.json(video, { status: 201 });
  } catch (error: any) {
    console.error('Error creating video library item:', error);
    return NextResponse.json(
      { error: 'Failed to create video', details: error.message },
      { status: 500 }
    );
  }
}
