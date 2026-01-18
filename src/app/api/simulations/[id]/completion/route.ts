import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const simulationId = params.id;
    const learnerId = session.user.id;

    // Get the most recent completed instance
    const instanceResult = await query(
      `SELECT
        id,
        final_score,
        bravin_overall_score,
        metrics_average_score,
        decision_count as decisions_made,
        stages_completed as scenarios_completed,
        total_decision_time_seconds as completion_time,
        completed_at,
        is_best_attempt
      FROM simulation_instances
      WHERE learner_id = $1
        AND simulation_id = $2
        AND status = 'completed'
      ORDER BY completed_at DESC
      LIMIT 1`,
      [learnerId, simulationId]
    );

    if (instanceResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'No completed simulation found' },
        { status: 404 }
      );
    }

    const instance = instanceResult.rows[0];

    // Get top 3 competencies for this learner
    const competenciesResult = await query(
      `SELECT
        c.name,
        lc.score,
        lc.previous_score,
        CASE
          WHEN lc.previous_score IS NOT NULL AND lc.previous_score > 0
          THEN lc.score - lc.previous_score
          ELSE 0
        END as improvement
      FROM learner_competencies lc
      JOIN competencies c ON c.id = lc.competency_id
      WHERE lc.learner_id = $1
      ORDER BY lc.score DESC, improvement DESC
      LIMIT 3`,
      [learnerId]
    );

    // Format response
    const response = {
      stats: {
        final_score: instance.final_score || 0,
        completion_time: instance.completion_time || 0,
        decisions_made: instance.decisions_made || 0,
        scenarios_completed: instance.scenarios_completed || 0
      },
      top_competencies: competenciesResult.rows.map(row => ({
        name: row.name,
        score: parseFloat(row.score || 0),
        improvement: parseFloat(row.improvement || 0)
      })),
      is_best_attempt: instance.is_best_attempt || false,
      completed_at: instance.completed_at
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Completion API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load completion data' },
      { status: 500 }
    );
  }
}
