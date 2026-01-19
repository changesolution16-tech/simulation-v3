import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';
import { MetricScoreService } from '@/lib/metricScores';

export const dynamic = 'force-dynamic';

interface MetricScorePayload {
  metricId: string;
  scoreValue: number;
  scoreDescription?: string;
  competencyImpacts?: Record<string, any>;
  weight?: number;
  isPrimaryMetric?: boolean;
}

/**
 * GET /api/scenarios/[id]/options/[optionId]/metrics
 * Fetch metric scores for a scenario option
 */
export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string; optionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: scenarioId, optionId } = await params;
    const metrics = await MetricScoreService.getOptionMetrics(scenarioId, optionId);
    return NextResponse.json(metrics);
  } catch (error: any) {
    console.error('Error fetching option metrics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch option metrics' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/scenarios/[id]/options/[optionId]/metrics
 * Replace metric scores for a scenario option (admin/instructor only)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; optionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin' && session.user.role !== 'instructor') {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      );
    }

    const { id: scenarioId, optionId } = await params;
    const body = await req.json();
    const metrics = Array.isArray(body) ? (body as MetricScorePayload[]) : [];

    const existing = await MetricScoreService.getOptionMetrics(scenarioId, optionId);
    const incomingIds = new Set(metrics.map((m) => m.metricId));
    const toRemove = existing.filter((m) => !incomingIds.has(m.metric_id));

    for (const metric of metrics) {
      await MetricScoreService.setOptionMetric({
        scenarioId,
        optionId,
        metricId: metric.metricId,
        scoreValue: metric.scoreValue,
        scoreDescription: metric.scoreDescription,
        competencyImpacts: metric.competencyImpacts,
        weight: metric.weight,
        isPrimaryMetric: metric.isPrimaryMetric
      });
    }

    if (toRemove.length > 0) {
      const removeIds = toRemove.map((m) => m.metric_id);
      await sql`
        DELETE FROM scenario_option_metrics
        WHERE scenario_id = ${scenarioId}
          AND option_id = ${optionId}
          AND metric_id IN ${sql(removeIds)}
      `;
    }

    const updated = await MetricScoreService.getOptionMetrics(scenarioId, optionId);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating option metrics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update option metrics' },
      { status: 500 }
    );
  }
}
