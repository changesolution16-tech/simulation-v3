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

    const { searchParams } = new URL(req.url);
    const simulationId = searchParams.get('simulationId');
    const scenarioId = searchParams.get('scenarioId');
    const optionId = searchParams.get('optionId');

    if (!simulationId || !scenarioId || !optionId) {
      return NextResponse.json({ error: 'simulationId, scenarioId, and optionId are required' }, { status: 400 });
    }

    try {
      const result = await sql`
        SELECT * FROM get_automatic_competency_impacts(
          ${simulationId},
          ${scenarioId},
          ${optionId}
        )
      `;
      return NextResponse.json(result || []);
    } catch (error) {
      return NextResponse.json([]);
    }
  } catch (error: any) {
    console.error('Error fetching automatic competency impacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch automatic impacts', details: error.message },
      { status: 500 }
    );
  }
}
