import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/simulations/[id]/scenarios
 * Fetch all scenarios for a specific simulation
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

    const scenarios = await sql`
      SELECT
        ss.id,
        ss.scenario_name,
        ss.question_text,
        ss.hierarchy_level,
        ss.video_url,
        ss.video_source,
        ss.order_index,
        ss.has_timer,
        ss.timer_seconds,
        ss.created_at,
        ss.updated_at,
        COUNT(DISTINCT so.id) as option_count
      FROM simulation_scenarios ss
      LEFT JOIN scenario_options so ON so.scenario_id = ss.id
      WHERE ss.simulation_id = ${simulationId}
      GROUP BY ss.id
      ORDER BY ss.order_index ASC, ss.created_at ASC
    `;

    return NextResponse.json(scenarios);
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scenarios' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/simulations/[id]/scenarios
 * Create a new scenario for a specific simulation
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

    // Only admins and instructors can create scenarios
    if (session.user.role !== 'admin' && session.user.role !== 'instructor') {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      );
    }

    const { id: simulationId } = await params;
    const body = await req.json();

    const {
      scenario_name,
      question_text,
      hierarchy_level = 1,
      video_url,
      video_source = 'url',
      order_index,
      has_timer = false,
      timer_seconds = 30,
      video_library_id,
      introduction_video_url,
      introduction_video_source,
      introduction_video_library_id,
      transition_video_url,
      transition_video_source,
      transition_video_library_id
    } = body;

    // Validation
    if (!scenario_name) {
      return NextResponse.json(
        { error: 'Scenario name is required' },
        { status: 400 }
      );
    }

    // Get the next order index if not provided
    let finalOrderIndex = order_index;
    if (finalOrderIndex === undefined || finalOrderIndex === null) {
      const [result] = await sql`
        SELECT COALESCE(MAX(order_index), 0) + 1 as next_index
        FROM simulation_scenarios
        WHERE simulation_id = ${simulationId}
      `;
      finalOrderIndex = result.next_index;
    }

    const [scenario] = await sql`
      INSERT INTO simulation_scenarios (
        simulation_id,
        scenario_name,
        question_text,
        hierarchy_level,
        video_url,
        video_source,
        order_index,
        has_timer,
        timer_seconds,
        video_library_id,
        introduction_video_url,
        introduction_video_source,
        introduction_video_library_id,
        transition_video_url,
        transition_video_source,
        transition_video_library_id
      ) VALUES (
        ${simulationId},
        ${scenario_name},
        ${question_text || null},
        ${hierarchy_level},
        ${video_url || null},
        ${video_source},
        ${finalOrderIndex},
        ${has_timer},
        ${timer_seconds},
        ${video_library_id || null},
        ${introduction_video_url || null},
        ${introduction_video_source || 'url'},
        ${introduction_video_library_id || null},
        ${transition_video_url || null},
        ${transition_video_source || 'url'},
        ${transition_video_library_id || null}
      )
      RETURNING *
    `;

    return NextResponse.json(scenario, { status: 201 });
  } catch (error: any) {
    console.error('Error creating scenario:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create scenario' },
      { status: 500 }
    );
  }
}
