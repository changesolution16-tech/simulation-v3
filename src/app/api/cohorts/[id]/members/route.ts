import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/cohorts/[id]/members
 * Add members to a cohort (admin/instructor only)
 */
export async function POST(
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

    const { id: cohortId } = await params;
    const body = await req.json();
    const { learner_ids } = body;

    if (!learner_ids || !Array.isArray(learner_ids) || learner_ids.length === 0) {
      return NextResponse.json(
        { error: 'learner_ids array is required' },
        { status: 400 }
      );
    }

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

    // Add members
    const insertPromises = learner_ids.map((learnerId: string) =>
      sql`
        INSERT INTO cohort_members (cohort_id, learner_id, joined_at)
        VALUES (${cohortId}, ${learnerId}, NOW())
        ON CONFLICT (cohort_id, learner_id) DO NOTHING
        RETURNING *
      `
    );

    const results = await Promise.all(insertPromises);
    const addedMembers = results.flat();

    return NextResponse.json({
      message: `Added ${addedMembers.length} member(s) to cohort`,
      members: addedMembers
    });
  } catch (error: any) {
    console.error('Error adding members to cohort:', error);
    return NextResponse.json(
      { error: 'Failed to add members to cohort', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cohorts/[id]/members
 * Remove members from a cohort (admin/instructor only)
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

    const { id: cohortId } = await params;
    const { searchParams } = new URL(req.url);
    const learnerIds = searchParams.get('learner_ids')?.split(',') || [];

    if (learnerIds.length === 0) {
      return NextResponse.json(
        { error: 'learner_ids query parameter is required' },
        { status: 400 }
      );
    }

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

    // Remove members
    const result = await sql`
      DELETE FROM cohort_members
      WHERE cohort_id = ${cohortId} AND learner_id IN ${sql(learnerIds)}
      RETURNING learner_id
    `;

    return NextResponse.json({
      message: `Removed ${result.length} member(s) from cohort`,
      removed_ids: result.map((r) => r.learner_id)
    });
  } catch (error: any) {
    console.error('Error removing members from cohort:', error);
    return NextResponse.json(
      { error: 'Failed to remove members from cohort', details: error.message },
      { status: 500 }
    );
  }
}
