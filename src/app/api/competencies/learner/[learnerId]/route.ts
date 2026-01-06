import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/competencies/learner/[learnerId]
 * Get competencies for a specific learner
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ learnerId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { learnerId } = await params;

    // Users can view their own competencies, or admins/instructors can view any
    if (
      session.user.id !== learnerId &&
      session.user.role !== 'admin' &&
      session.user.role !== 'instructor'
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await sql`
      SELECT
        lc.id,
        lc.learner_id,
        lc.competency_id,
        lc.current_score,
        lc.current_level,
        lc.total_practice_count,
        lc.is_mastered,
        lc.growth_rate,
        lc.trend,
        lc.last_practiced_at,
        lc.created_at,
        lc.updated_at,
        c.name as competency_name,
        c.description as competency_description,
        c.competency_level,
        c.category,
        c.tags,
        c.proficiency_levels,
        row_to_json(c.*) as competency
      FROM learner_competencies lc
      JOIN competencies c ON c.id = lc.competency_id
      WHERE lc.learner_id = ${learnerId}
      ORDER BY lc.current_score DESC
    `;

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching learner competencies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch learner competencies', details: error.message },
      { status: 500 }
    );
  }
}
