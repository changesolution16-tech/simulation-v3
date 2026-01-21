import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';
import { normalizeRole } from '@/lib/roles';

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

    const role = normalizeRole(session.user.role);
    const isLearner = role === 'learner';
    const isInstructor = role === 'instructor';

    const result = await sql`
      SELECT
        ta.*,
        s.display_name as simulation_name,
        s.difficulty as simulation_difficulty,
        i.full_name as instructor_name,
        c.name as cohort_name
      FROM training_assignments ta
      LEFT JOIN simulations s ON s.id = ta.simulation_id
      LEFT JOIN profiles i ON i.id = ta.instructor_id
      LEFT JOIN cohorts c ON c.id = ta.cohort_id
      WHERE 1=1
        ${isLearner ? sql`AND (
          EXISTS (
            SELECT 1 FROM assignment_learners al
            WHERE al.assignment_id = ta.id
            AND al.learner_id = ${session.user.id}
          )
          OR EXISTS (
            SELECT 1 FROM cohort_members cm
            WHERE cm.cohort_id = ta.cohort_id
            AND cm.learner_id = ${session.user.id}
          )
        )` : sql``}
        ${isInstructor ? sql`AND (ta.instructor_id = ${session.user.id} OR ta.created_by = ${session.user.id})` : sql``}
        ${cohortId ? sql`AND ta.cohort_id = ${cohortId}` : sql``}
        ${status ? sql`AND ta.status = ${status}` : sql``}
      ORDER BY ta.due_date DESC, ta.created_at DESC
    `;

    // If learner requested, get their completion status
    if (learnerId || role === 'learner') {
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
      title,
      description,
      simulation_id,
      category_id = null,
      assignment_type = 'cohort',
      cohort_id = null,
      cohort_ids = [],
      individual_learner_ids = [],
      start_date = null,
      end_date = null,
      due_date = null,
      instructions = null,
      max_attempts = 1,
      passing_score = 70,
      is_required = true,
      is_published = true,
      status = 'active'
    } = body;

    if (!simulation_id) {
      return NextResponse.json(
        { error: 'Simulation ID is required' },
        { status: 400 }
      );
    }

    const normalizedCohortIds = Array.isArray(cohort_ids)
      ? cohort_ids.filter(Boolean)
      : [];
    const normalizedLearnerIds = Array.isArray(individual_learner_ids)
      ? individual_learner_ids.filter(Boolean)
      : [];

    const primaryCohortId = cohort_id || normalizedCohortIds[0] || null;

    const learnerIds = new Set<string>();
    normalizedLearnerIds.forEach((id: string) => learnerIds.add(id));

    if (assignment_type === 'cohort' || assignment_type === 'mixed') {
      const cohortList = primaryCohortId && normalizedCohortIds.length === 0
        ? [primaryCohortId]
        : normalizedCohortIds;

      if (cohortList.length > 0) {
        const members = await sql`
          SELECT learner_id
          FROM cohort_members
          WHERE cohort_id IN ${sql(cohortList)}
            AND (is_active = true OR is_active IS NULL)
        `;

        members.forEach((member) => {
          if (member.learner_id) {
            learnerIds.add(member.learner_id);
          }
        });
      }
    }

    if (assignment_type === 'individual' && normalizedLearnerIds.length === 0) {
      return NextResponse.json(
        { error: 'No learners selected for the assignment' },
        { status: 400 }
      );
    }

    if (learnerIds.size === 0) {
      return NextResponse.json(
        { error: 'No learners found for the selected cohorts' },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO training_assignments (
        title,
        description,
        created_by,
        instructor_id,
        simulation_id,
        category_id,
        assignment_type,
        cohort_id,
        cohort_ids,
        individual_learner_ids,
        start_date,
        end_date,
        due_date,
        instructions,
        max_attempts,
        passing_score,
        is_required,
        is_published,
        status,
        created_at,
        updated_at
      )
      VALUES (
        ${title || null},
        ${description || null},
        ${session.user.id},
        ${session.user.id},
        ${simulation_id},
        ${category_id},
        ${assignment_type},
        ${primaryCohortId},
        ${normalizedCohortIds},
        ${normalizedLearnerIds},
        ${start_date},
        ${end_date},
        ${due_date},
        ${instructions},
        ${max_attempts},
        ${passing_score},
        ${is_required},
        ${is_published},
        ${status},
        NOW(),
        NOW()
      )
      RETURNING *
    `;

    const assignment = result[0];

    const assignmentsToInsert = Array.from(learnerIds).map((learnerId) => sql`
      INSERT INTO assignment_learners (
        assignment_id,
        learner_id,
        status,
        created_at,
        updated_at
      )
      VALUES (
        ${assignment.id},
        ${learnerId},
        'assigned',
        NOW(),
        NOW()
      )
      ON CONFLICT (assignment_id, learner_id) DO NOTHING
    `);

    await Promise.all(assignmentsToInsert);

    return NextResponse.json(assignment, { status: 201 });
  } catch (error: any) {
    console.error('Error creating assignment:', error);
    return NextResponse.json(
      { error: 'Failed to create assignment', details: error.message },
      { status: 500 }
    );
  }
}
