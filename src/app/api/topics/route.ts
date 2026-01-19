import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/topics
 * Fetch all topics (admin/instructor only)
 */
export async function GET(_: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin' && session.user.role !== 'instructor') {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      );
    }

    const topics = await sql`
      SELECT id, title, description
      FROM topics
      ORDER BY title ASC
    `;

    return NextResponse.json(topics);
  } catch (error: any) {
    console.error('Error fetching topics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch topics' },
      { status: 500 }
    );
  }
}
