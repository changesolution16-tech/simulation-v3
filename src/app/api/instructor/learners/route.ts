import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';
import { normalizeRole } from '@/lib/roles';

export const dynamic = 'force-dynamic';

/**
 * GET /api/instructor/learners
 * List learners for instructor/admin assignment & cohort management
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = normalizeRole(session.user.role);
    if (role !== 'admin' && role !== 'instructor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const limit = Number(searchParams.get('limit') || 50);
    const offset = Number(searchParams.get('offset') || 0);

    const learners = await sql`
      SELECT
        id,
        full_name,
        email,
        institution
      FROM profiles
      WHERE role = 'learner'
        AND is_active = true
        ${search ? sql`AND (full_name ILIKE ${`%${search}%`} OR email ILIKE ${`%${search}%`})` : sql``}
      ORDER BY full_name ASC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    return NextResponse.json(learners);
  } catch (error: any) {
    console.error('Error fetching instructor learners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch learners', details: error.message },
      { status: 500 }
    );
  }
}
