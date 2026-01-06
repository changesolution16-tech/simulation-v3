import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/assignments/[id]
 * Get a specific assignment
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

    const result = await sql`
      SELECT
        ta.*,
        s.display_name as simulation_name,
        s.difficulty as simulation_difficulty,
        s.description as simulation_description,
        i.full_name as instructor_name,
        c.name as cohort_name
      FROM training_assignments ta
      LEFT JOIN simulations s ON s.id = ta.simulation_id
      LEFT JOIN profiles i ON i.id = ta.instructor_id
      LEFT JOIN cohorts c ON c.id = ta.cohort_id
      WHERE ta.id = ${assignmentId}
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const assignment = result[0];

    // Check access permissions
    if (session.user.role === 'learner') {
      // Check if learner is in the cohort
      const memberCheck = await sql`
        SELECT 1 FROM cohort_members
        WHERE cohort_id = ${assignment.cohort_id} AND learner_id = ${session.user.id}
      `;

      if (memberCheck.length === 0) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (session.user.role === 'instructor') {
      // Check if instructor owns the assignment
      if (assignment.instructor_id !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json(assignment);
  } catch (error: any) {
    console.error('Error fetching assignment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignment', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/assignments/[id]
 * Update an assignment (admin/instructor only)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: assignmentId } = await params;
    const body = await req.json();

    // Check ownership if instructor
    if (session.user.role === 'instructor') {
      const ownerCheck = await sql`
        SELECT instructor_id FROM training_assignments WHERE id = ${assignmentId}
      `;

      if (ownerCheck.length === 0) {
        return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
      }

      if (ownerCheck[0].instructor_id !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const updates: Record<string, any> = { updated_at: new Date() };

    const allowedFields = [
      'due_date',
      'instructions',
      'max_attempts',
      'passing_score',
      'is_required',
      'status'
    ];

    Object.entries(body).forEach(([key, value]) => {
      if (allowedFields.includes(key)) {
        updates[key] = value;
      }
    });

    if (Object.keys(updates).length === 1) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const result = await sql`
      UPDATE training_assignments
      SET ${sql(updates)}
      WHERE id = ${assignmentId}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error: any) {
    console.error('Error updating assignment:', error);
    return NextResponse.json(
      { error: 'Failed to update assignment', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/assignments/[id]
 * Delete an assignment (admin/instructor only)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: assignmentId } = await params;

    // Check ownership if instructor
    if (session.user.role === 'instructor') {
      const ownerCheck = await sql`
        SELECT instructor_id FROM training_assignments WHERE id = ${assignmentId}
      `;

      if (ownerCheck.length === 0) {
        return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
      }

      if (ownerCheck[0].instructor_id !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const result = await sql`
      DELETE FROM training_assignments WHERE id = ${assignmentId} RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Assignment deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting assignment:', error);
    return NextResponse.json(
      { error: 'Failed to delete assignment', details: error.message },
      { status: 500 }
    );
  }
}
