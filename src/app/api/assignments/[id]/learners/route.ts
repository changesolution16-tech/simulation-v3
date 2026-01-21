import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';
import { normalizeRole } from '@/lib/roles';

export const dynamic = 'force-dynamic';

/**
 * GET /api/assignments/[id]/learners
 * List learners assigned to an assignment
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: assignmentId } = await params;
    const role = normalizeRole(session.user.role);

    const [assignment] = await sql`
      SELECT id, created_by, instructor_id
      FROM training_assignments
      WHERE id = ${assignmentId}
    `;

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    if (role === 'instructor' && assignment.instructor_id !== session.user.id && assignment.created_by !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const learners = await sql`
      SELECT
        al.*,
        p.full_name,
        p.email,
        p.institution
      FROM assignment_learners al
      JOIN profiles p ON p.id = al.learner_id
      WHERE al.assignment_id = ${assignmentId}
      ORDER BY p.full_name
    `;

    return NextResponse.json(learners);
  } catch (error: any) {
    console.error('Error fetching assignment learners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignment learners', details: error.message },
      { status: 500 }
    );
  }
}
