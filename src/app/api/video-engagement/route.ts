import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      videoLibraryId,
      videoUrl,
      simulationInstanceId,
      scenarioId,
      optionId,
      videoType = 'supplementary',
      eventType = 'play',
      watchPercentage = 0,
      durationSeconds
    } = body;

    if (!videoUrl) {
      return NextResponse.json({ error: 'videoUrl is required' }, { status: 400 });
    }

    try {
      await sql`
        SELECT track_video_engagement(
          ${session.user.id},
          ${videoLibraryId || null},
          ${videoUrl},
          ${simulationInstanceId || null},
          ${scenarioId || null},
          ${optionId || null},
          ${videoType},
          ${eventType},
          ${watchPercentage || 0}
        )
      `;
    } catch (error) {
      console.warn('[VideoEngagement] track_video_engagement not available:', error);
    }

    if (videoLibraryId && typeof durationSeconds === 'number' && durationSeconds > 0) {
      try {
        await sql`
          UPDATE video_library
          SET duration_seconds = ${durationSeconds}, updated_at = NOW()
          WHERE id = ${videoLibraryId} AND (duration_seconds IS NULL OR duration_seconds = 0)
        `;
      } catch (error) {
        console.warn('[VideoEngagement] Unable to update duration_seconds:', error);
      }
    }

    if (videoLibraryId) {
      try {
        await sql`SELECT update_video_library_stats(${videoLibraryId})`;
      } catch (error) {
        // Optional database function.
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error tracking video engagement:', error);
    return NextResponse.json(
      { error: 'Failed to track engagement', details: error.message },
      { status: 500 }
    );
  }
}
