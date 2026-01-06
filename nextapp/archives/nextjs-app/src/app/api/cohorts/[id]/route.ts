import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

/**
 * GET /api/cohorts/[id]
 * Get a specific cohort with members
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cohortId = params.id;

    const result = await sql`
      SELECT
        c.*,
        i.full_name as instructor_name,
        i.email as instructor_email
      FROM cohorts c
      LEFT JOIN profiles i ON i.id = c.instructor_id
      WHERE c.id = ${cohortId}
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    }

    const cohort = result[0];

    // Check access permissions
    if (session.user.role === 'learner') {
      const memberCheck = await sql`
        SELECT 1 FROM cohort_members
        WHERE cohort_id = ${cohortId} AND learner_id = ${session.user.id}
      `;

      if (memberCheck.length === 0) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (session.user.role === 'instructor') {
      if (cohort.instructor_id !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Get members
    const membersResult = await sql`
      SELECT
        cm.learner_id,
        cm.joined_at,
        p.full_name,
        p.email,
        p.role,
        p.organization,
        p.department
      FROM cohort_members cm
      JOIN profiles p ON p.id = cm.learner_id
      WHERE cm.cohort_id = ${cohortId}
      ORDER BY p.full_name
    `;

    return NextResponse.json({
      ...cohort,
      members: membersResult
    });
  } catch (error: any) {
    console.error('Error fetching cohort:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cohort', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/cohorts/[id]
 * Update a cohort (admin/instructor only)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
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

    const cohortId = params.id;
    const body = await req.json();

    // Check ownership if instructor
    if (session.user.role === 'instructor') {
      const ownerCheck = await sql`
        SELECT instructor_id FROM cohorts WHERE id = ${cohortId}
      `;

      if (ownerCheck.length === 0) {
        return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
      }

      if (ownerCheck[0].instructor_id !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const updates: Record<string, any> = { updated_at: new Date() };

    const allowedFields = ['name', 'description', 'start_date', 'end_date', 'is_active'];

    Object.entries(body).forEach(([key, value]) => {
      if (allowedFields.includes(key)) {
        updates[key] = value;
      }
    });

    if (Object.keys(updates).length === 1) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const result = await sql`
      UPDATE cohorts
      SET ${sql(updates)}
      WHERE id = ${cohortId}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error: any) {
    console.error('Error updating cohort:', error);
    return NextResponse.json(
      { error: 'Failed to update cohort', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cohorts/[id]
 * Delete a cohort (admin/instructor only)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
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

    const cohortId = params.id;

    // Check ownership if instructor
    if (session.user.role === 'instructor') {
      const ownerCheck = await sql`
        SELECT instructor_id FROM cohorts WHERE id = ${cohortId}
      `;

      if (ownerCheck.length === 0) {
        return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
      }

      if (ownerCheck[0].instructor_id !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Delete members first
    await sql`DELETE FROM cohort_members WHERE cohort_id = ${cohortId}`;

    // Delete cohort
    const result = await sql`DELETE FROM cohorts WHERE id = ${cohortId} RETURNING id`;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Cohort deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting cohort:', error);
    return NextResponse.json(
      { error: 'Failed to delete cohort', details: error.message },
      { status: 500 }
    );
  }
}
