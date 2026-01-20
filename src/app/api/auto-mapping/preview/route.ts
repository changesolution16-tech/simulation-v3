import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';
import { ScenarioCompetencyService } from '@/lib/scenarioCompetencies';
import { generateMappingMatches } from '@/lib/autoMappingLogic';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { scenarioId, metricIds } = body;

    if (!scenarioId || !Array.isArray(metricIds) || metricIds.length === 0) {
      return NextResponse.json([]);
    }

    const targetedCompetencies = await ScenarioCompetencyService.getTargetedCompetencies(scenarioId);
    if (targetedCompetencies.length === 0) {
      return NextResponse.json([]);
    }

    const metrics = await sql`
      SELECT id, name, metric_type
      FROM assessment_metrics
      WHERE id IN ${sql(metricIds)}
    `;

    if (metrics.length === 0) {
      return NextResponse.json([]);
    }

    const matches = generateMappingMatches(metrics as any[], targetedCompetencies as any[]);
    return NextResponse.json(matches);
  } catch (error: any) {
    console.error('Error previewing mappings:', error);
    return NextResponse.json(
      { error: 'Failed to preview mappings', details: error.message },
      { status: 500 }
    );
  }
}
