import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/simulations/[id]/instances
 * Get all instances of a simulation for the current user
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

    const { id: simulationId } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id') || session.user.id;

    // Non-admins can only see their own instances
    if (session.user.role !== 'admin' && userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - can only view your own instances' },
        { status: 403 }
      );
    }

    const instances = await sql`
      SELECT
        si.*,
        s.name as simulation_name,
        s.display_name as simulation_display_name,
        ta.title as assignment_title,
        COUNT(lr.id) as responses_count
      FROM simulation_instances si
      INNER JOIN simulations s ON s.id = si.simulation_id
      LEFT JOIN training_assignments ta ON ta.id = si.assignment_id
      LEFT JOIN learner_responses lr ON lr.instance_id = si.id
      WHERE si.simulation_id = ${simulationId}
        AND si.user_id = ${userId}
      GROUP BY si.id, s.name, s.display_name, ta.title
      ORDER BY si.started_at DESC
    `;

    return NextResponse.json(instances);
  } catch (error: any) {
    console.error('Error fetching simulation instances:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch instances' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/simulations/[id]/instances
 * Create a new simulation instance (start a simulation)
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

    const { id: simulationId } = await params;
    const body = await req.json();

    const {
      difficulty = 'beginner',
      assignment_id = null,
    } = body;

    // Verify simulation exists and is published (for learners)
    const [simulation] = await sql`
      SELECT id, status
      FROM simulations
      WHERE id = ${simulationId}
    `;

    if (!simulation) {
      return NextResponse.json(
        { error: 'Simulation not found' },
        { status: 404 }
      );
    }

    if (simulation.status !== 'published' && session.user.role === 'learner') {
      return NextResponse.json(
        { error: 'Simulation not available' },
        { status: 403 }
      );
    }

    // Create the instance
    const [instance] = await sql`
      INSERT INTO simulation_instances (
        simulation_id,
        user_id,
        difficulty,
        assignment_id,
        started_at,
        status
      ) VALUES (
        ${simulationId},
        ${session.user.id},
        ${difficulty},
        ${assignment_id},
        NOW(),
        'in_progress'
      )
      RETURNING *
    `;

    return NextResponse.json(instance, { status: 201 });
  } catch (error: any) {
    console.error('Error creating simulation instance:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create instance' },
      { status: 500 }
    );
  }
}
