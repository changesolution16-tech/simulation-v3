import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  ScenarioCompetencyService,
  type CompetencySelectionData
} from '@/lib/scenarioCompetencies';

export const dynamic = 'force-dynamic';

/**
 * GET /api/scenarios/[id]/competencies
 * Fetch targeted competencies for a scenario
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: scenarioId } = await params;
    const competencies = await ScenarioCompetencyService.getTargetedCompetencies(scenarioId);

    return NextResponse.json(competencies);
  } catch (error: any) {
    console.error('Error fetching scenario competencies:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch scenario competencies' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/scenarios/[id]/competencies
 * Replace targeted competencies for a scenario (admin/instructor only)
 */
export async function PUT(
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
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      );
    }

    const { id: scenarioId } = await params;
    const body = await req.json();
    const competencies = Array.isArray(body) ? (body as CompetencySelectionData[]) : [];

    const success = await ScenarioCompetencyService.setTargetedCompetencies(
      scenarioId,
      competencies
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update scenario competencies' },
        { status: 500 }
      );
    }

    const updated = await ScenarioCompetencyService.getTargetedCompetencies(scenarioId);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating scenario competencies:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update scenario competencies' },
      { status: 500 }
    );
  }
}
