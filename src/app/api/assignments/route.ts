import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/assignments
 * Get assignments (filtered by role)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const cohortId = searchParams.get('cohort_id');
    const learnerId = searchParams.get('learner_id');
    const status = searchParams.get('status');

    const isLearner = session.user.role === 'learner';
    const isInstructor = session.user.role === 'instructor';

    const result = await sql`
      SELECT
        ta.id,
        ta.simulation_id,
        ta.cohort_id,
        ta.instructor_id,
        ta.due_date,
        ta.instructions,
        ta.max_attempts,
        ta.passing_score,
        ta.is_required,
        ta.status,
        ta.created_at,
        ta.updated_at,
        s.display_name as simulation_name,
        s.difficulty as simulation_difficulty,
        i.full_name as instructor_name,
        c.name as cohort_name
      FROM training_assignments ta
      LEFT JOIN simulations s ON s.id = ta.simulation_id
      LEFT JOIN profiles i ON i.id = ta.instructor_id
      LEFT JOIN cohorts c ON c.id = ta.cohort_id
      WHERE 1=1
        ${isLearner ? sql`AND EXISTS (
          SELECT 1 FROM cohort_members cm
          WHERE cm.cohort_id = ta.cohort_id
          AND cm.learner_id = ${session.user.id}
        )` : sql``}
        ${isInstructor ? sql`AND ta.instructor_id = ${session.user.id}` : sql``}
        ${cohortId ? sql`AND ta.cohort_id = ${cohortId}` : sql``}
        ${status ? sql`AND ta.status = ${status}` : sql``}
      ORDER BY ta.due_date DESC, ta.created_at DESC
    `;

    // If learner requested, get their completion status
    if (learnerId || session.user.role === 'learner') {
      const targetLearnerId = learnerId || session.user.id;

      const assignmentsWithStatus = await Promise.all(
        result.map(async (assignment) => {
          const completionResult = await sql`
            SELECT
              COUNT(*) as attempt_count,
              MAX(final_score) as best_score,
              BOOL_OR(status = 'completed') as has_completed
            FROM simulation_instances
            WHERE simulation_id = ${assignment.simulation_id}
            AND learner_id = ${targetLearnerId}
          `;

          const completion = completionResult[0];

          return {
            ...assignment,
            learner_stats: {
              attempt_count: parseInt(completion.attempt_count || '0'),
              best_score: completion.best_score || 0,
              has_completed: completion.has_completed || false,
              is_passing: (completion.best_score || 0) >= (assignment.passing_score || 0)
            }
          };
        })
      );

      return NextResponse.json(assignmentsWithStatus);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/assignments
 * Create a new assignment (admin/instructor only)
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
      simulation_id,
      cohort_id,
      due_date,
      instructions,
      max_attempts = null,
      passing_score = 70,
      is_required = true
    } = body;

    if (!simulation_id || !cohort_id) {
      return NextResponse.json(
        { error: 'Simulation ID and Cohort ID are required' },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO training_assignments (
        simulation_id,
        cohort_id,
        instructor_id,
        due_date,
        instructions,
        max_attempts,
        passing_score,
        is_required,
        status,
        created_at,
        updated_at
      )
      VALUES (
        ${simulation_id},
        ${cohort_id},
        ${session.user.id},
        ${due_date},
        ${instructions},
        ${max_attempts},
        ${passing_score},
        ${is_required},
        'active',
        NOW(),
        NOW()
      )
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error: any) {
    console.error('Error creating assignment:', error);
    return NextResponse.json(
      { error: 'Failed to create assignment', details: error.message },
      { status: 500 }
    );
  }
}
