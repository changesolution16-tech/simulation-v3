import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

/**
 * GET /api/cohorts
 * Get all cohorts (filtered by role)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const includeMembers = searchParams.get('include_members') === 'true';

    const isLearner = session.user.role === 'learner';
    const isInstructor = session.user.role === 'instructor';

    const result = await sql`
      SELECT
        c.id,
        c.name,
        c.description,
        c.instructor_id,
        c.start_date,
        c.end_date,
        c.is_active,
        c.created_at,
        c.updated_at,
        i.full_name as instructor_name,
        COUNT(DISTINCT cm.learner_id) as member_count
      FROM cohorts c
      LEFT JOIN profiles i ON i.id = c.instructor_id
      LEFT JOIN cohort_members cm ON cm.cohort_id = c.id
      WHERE 1=1
        ${isLearner ? sql`AND EXISTS (
          SELECT 1 FROM cohort_members cm2
          WHERE cm2.cohort_id = c.id
          AND cm2.learner_id = ${session.user.id}
        )` : sql``}
        ${isInstructor ? sql`AND c.instructor_id = ${session.user.id}` : sql``}
      GROUP BY c.id, i.full_name
      ORDER BY c.created_at DESC
    `;

    // Include member details if requested
    if (includeMembers) {
      const cohortsWithMembers = await Promise.all(
        result.map(async (cohort) => {
          const membersResult = await sql`
            SELECT
              cm.learner_id,
              cm.joined_at,
              p.full_name,
              p.email,
              p.role
            FROM cohort_members cm
            JOIN profiles p ON p.id = cm.learner_id
            WHERE cm.cohort_id = ${cohort.id}
            ORDER BY cm.joined_at DESC
          `;

          return {
            ...cohort,
            members: membersResult
          };
        })
      );

      return NextResponse.json(cohortsWithMembers);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching cohorts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cohorts', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cohorts
 * Create a new cohort (admin/instructor only)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin' && session.user.role !== 'instructor') {
      return NextResponse.json(
        { error: 'Forbidden - admin or instructor access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      name,
      description,
      start_date,
      end_date,
      is_active = true,
      member_ids = []
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Create cohort
    const result = await sql`
      INSERT INTO cohorts (
        name,
        description,
        instructor_id,
        start_date,
        end_date,
        is_active,
        created_at,
        updated_at
      )
      VALUES (
        ${name},
        ${description},
        ${session.user.id},
        ${start_date},
        ${end_date},
        ${is_active},
        NOW(),
        NOW()
      )
      RETURNING *
    `;

    const cohort = result[0];

    // Add members if provided
    if (member_ids.length > 0) {
      const memberInserts = member_ids.map((learnerId: string) =>
        sql`
          INSERT INTO cohort_members (cohort_id, learner_id, joined_at)
          VALUES (${cohort.id}, ${learnerId}, NOW())
          ON CONFLICT (cohort_id, learner_id) DO NOTHING
        `
      );

      await Promise.all(memberInserts);
    }

    return NextResponse.json(cohort, { status: 201 });
  } catch (error: any) {
    console.error('Error creating cohort:', error);
    return NextResponse.json(
      { error: 'Failed to create cohort', details: error.message },
      { status: 500 }
    );
  }
}
