import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { BravinMetricsIntegration } from '@/lib/bravinMetricsIntegration';

export const dynamic = 'force-dynamic';

const dimensionMeta = [
  { key: 'avg_boldness', code: 'BOLDNESS', name: 'Boldness', color_hex: '#EF4444' },
  { key: 'avg_responsibility', code: 'RESPONSIBILITY', name: 'Responsibility', color_hex: '#F59E0B' },
  { key: 'avg_accountability', code: 'ACCOUNTABILITY', name: 'Accountability', color_hex: '#3B82F6' },
  { key: 'avg_vision', code: 'VISION', name: 'Vision', color_hex: '#8B5CF6' },
  { key: 'avg_integrity', code: 'INTEGRITY', name: 'Integrity', color_hex: '#10B981' },
  { key: 'avg_nurturance', code: 'NURTURANCE', name: 'Nurturance', color_hex: '#EC4899' }
];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ learnerId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { learnerId } = await params;

    if (
      learnerId !== session.user.id &&
      session.user.role !== 'admin' &&
      session.user.role !== 'instructor'
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rows = await BravinMetricsIntegration.getLearnerBravinScores(learnerId);
    const summary = rows?.[0];

    if (!summary || Number(summary.total_assessments || 0) === 0) {
      return NextResponse.json([]);
    }

    const rawValues = dimensionMeta.map((dimension) => Number(summary[dimension.key] || 0));
    const useOffset = rawValues.some((value) => value < 0);

    const normalizeScore = (value: number) => {
      const numeric = Number.isFinite(value) ? value : 0;
      const adjusted = useOffset ? 50 + numeric : numeric;
      return Math.max(0, Math.min(100, adjusted));
    };

    const payload = dimensionMeta.map((dimension) => ({
      id: `${learnerId}-${dimension.code}`,
      dimension: {
        code: dimension.code,
        name: dimension.name,
        color_hex: dimension.color_hex
      },
      current_score: normalizeScore(Number(summary[dimension.key] || 0)),
      trend: 'stable' as const
    }));

    return NextResponse.json(payload);
  } catch (error: any) {
    console.error('Error fetching BRAVIN learner scores:', error);
    return NextResponse.json(
      { error: 'Failed to fetch BRAVIN learner scores', details: error.message },
      { status: 500 }
    );
  }
}
