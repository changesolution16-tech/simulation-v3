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

    // Get all completed attempts for this simulation
    const attemptsResult = await query(
      `SELECT
        id as instance_id,
        attempt_number,
        final_score,
        bravin_overall_score,
        metrics_average_score,
        decision_count,
        stages_completed,
        total_decision_time_seconds,
        started_at,
        completed_at,
        is_best_attempt,
        status
      FROM simulation_instances
      WHERE learner_id = $1
        AND simulation_id = $2
        AND status = 'completed'
      ORDER BY attempt_number DESC`,
      [learnerId, simulationId]
    );

    // Get aggregated statistics
    const statsResult = await query(
      `SELECT
        COUNT(*) as total_attempts,
        MAX(final_score) as best_score,
        AVG(final_score) as average_score,
        MIN(total_decision_time_seconds) as fastest_time,
        AVG(total_decision_time_seconds) as average_time
      FROM simulation_instances
      WHERE learner_id = $1
        AND simulation_id = $2
        AND status = 'completed'`,
      [learnerId, simulationId]
    );

    const attempts = attemptsResult.rows.map(row => ({
      instance_id: row.instance_id,
      attempt_number: row.attempt_number || 1,
      final_score: parseFloat(row.final_score || 0),
      bravin_score: parseFloat(row.bravin_overall_score || 0),
      metrics_score: parseFloat(row.metrics_average_score || 0),
      decision_count: row.decision_count || 0,
      scenarios_completed: row.stages_completed || 0,
      completion_time: row.total_decision_time_seconds || 0,
      started_at: row.started_at,
      completed_at: row.completed_at,
      is_best_attempt: row.is_best_attempt || false,
      status: row.status
    }));

    const stats = statsResult.rows[0] || {};

    const response = {
      attempts,
      statistics: {
        total_attempts: parseInt(stats.total_attempts || 0),
        best_score: parseFloat(stats.best_score || 0),
        average_score: parseFloat(stats.average_score || 0),
        fastest_time: parseInt(stats.fastest_time || 0),
        average_time: parseInt(stats.average_time || 0)
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Attempts API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load attempt history' },
      { status: 500 }
    );
  }
}
