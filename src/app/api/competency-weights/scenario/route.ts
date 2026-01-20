import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin' && session.user.role !== 'instructor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const scenarioId = searchParams.get('scenario_id');

    if (!scenarioId) {
      return NextResponse.json({ error: 'scenario_id is required' }, { status: 400 });
    }

    const rows = await sql`
      SELECT
        c.code as competency_code,
        w.metric_type,
        w.weight
      FROM scenario_competency_weights w
      JOIN competencies c ON c.id = w.competency_id
      WHERE w.scenario_id = ${scenarioId}
        AND w.is_active = true
    `;

    const weights: Record<string, Record<string, number>> = {};

    rows.forEach((row: any) => {
      if (!weights[row.competency_code]) {
        weights[row.competency_code] = {};
      }
      weights[row.competency_code][row.metric_type] = Number(row.weight);
    });

    return NextResponse.json(weights);
  } catch (error: any) {
    console.error('Error fetching scenario competency weights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scenario weights', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin' && session.user.role !== 'instructor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { scenario_id, competency_code, weights } = body;

    if (!scenario_id || !competency_code || !weights) {
      return NextResponse.json(
        { error: 'scenario_id, competency_code, and weights are required' },
        { status: 400 }
      );
    }

    const [competency] = await sql`
      SELECT id FROM competencies WHERE code = ${competency_code}
    `;

    if (!competency) {
      return NextResponse.json({ error: 'Competency not found' }, { status: 404 });
    }

    const entries = Object.entries(weights) as Array<[string, number]>;

    for (const [metricType, weight] of entries) {
      await sql`
        INSERT INTO scenario_competency_weights (
          scenario_id,
          competency_id,
          metric_type,
          weight,
          configured_by,
          overrides_simulation,
          is_active,
          created_at,
          updated_at
        ) VALUES (
          ${scenario_id},
          ${competency.id},
          ${metricType},
          ${weight},
          ${session.user.id},
          true,
          true,
          NOW(),
          NOW()
        )
        ON CONFLICT (scenario_id, competency_id, metric_type)
        DO UPDATE SET
          weight = EXCLUDED.weight,
          configured_by = EXCLUDED.configured_by,
          overrides_simulation = true,
          is_active = true,
          updated_at = NOW()
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving scenario competency weights:', error);
    return NextResponse.json(
      { error: 'Failed to save scenario weights', details: error.message },
      { status: 500 }
    );
  }
}
