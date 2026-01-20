import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin' && session.user.role !== 'instructor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rows = await sql`
      SELECT
        c.code as competency_code,
        w.metric_type,
        w.weight
      FROM competency_metric_weights_global w
      JOIN competencies c ON c.id = w.competency_id
      WHERE w.is_active = true
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
    console.error('Error fetching global competency weights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch global weights', details: error.message },
      { status: 500 }
    );
  }
}
