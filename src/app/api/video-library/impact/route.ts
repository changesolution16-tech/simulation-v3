import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json({ impact: null });
    }

    try {
      const result = await sql`
        SELECT * FROM preview_video_library_update_impact(${videoId})
      `;

      return NextResponse.json({ impact: result[0] || null });
    } catch (error) {
      return NextResponse.json({ impact: null });
    }
  } catch (error: any) {
    console.error('Error fetching video update impact:', error);
    return NextResponse.json(
      { error: 'Failed to fetch impact', details: error.message },
      { status: 500 }
    );
  }
}
