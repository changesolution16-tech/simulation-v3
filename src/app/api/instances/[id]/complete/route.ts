import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/instances/[id]/complete
 * Mark a simulation instance as complete and calculate final scores
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

    const { id: instanceId } = await params;

    // Verify ownership
    const [instance] = await sql`
      SELECT si.*, s.name as simulation_name
      FROM simulation_instances si
      INNER JOIN simulations s ON s.id = si.simulation_id
      WHERE si.id = ${instanceId}
    `;

    if (!instance) {
      return NextResponse.json(
        { error: 'Instance not found' },
        { status: 404 }
      );
    }

    if (instance.user_id !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - not your instance' },
        { status: 403 }
      );
    }

    // Calculate completion time
    const startTime = new Date(instance.started_at).getTime();
    const now = Date.now();
    const completionTimeSeconds = Math.round((now - startTime) / 1000);

    // Get all responses for this instance to calculate scores
    const responses = await sql`
      SELECT
        lr.*,
        so.competency_impacts,
        so.skill_impacts
      FROM learner_responses lr
      LEFT JOIN scenario_options so ON so.id = lr.selected_option_id
      WHERE lr.instance_id = ${instanceId}
    `;

    // Calculate overall score based on competency impacts
    let totalImpact = 0;
    let impactCount = 0;

    responses.forEach((response: any) => {
      if (response.competency_impacts) {
        const impacts = typeof response.competency_impacts === 'string'
          ? JSON.parse(response.competency_impacts)
          : response.competency_impacts;

        Object.values(impacts).forEach((value: any) => {
          if (typeof value === 'number') {
            totalImpact += value;
            impactCount++;
          }
        });
      }
    });

    const overallScore = impactCount > 0
      ? Math.round((totalImpact / impactCount) * 100) / 100
      : 0;

    // Update instance to completed
    const [updated] = await sql`
      UPDATE simulation_instances
      SET
        status = 'completed',
        completed_at = NOW(),
        completion_time_seconds = ${completionTimeSeconds},
        overall_score = ${overallScore},
        updated_at = NOW()
      WHERE id = ${instanceId}
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      instance: updated,
      scores: {
        overall: overallScore,
        responseCount: responses.length,
        completionTimeSeconds,
      },
    });
  } catch (error: any) {
    console.error('Error completing simulation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to complete simulation' },
      { status: 500 }
    );
  }
}
