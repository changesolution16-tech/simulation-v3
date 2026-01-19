import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/instances/[id]/responses
 * Save a learner's response to a scenario
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

    const { id: instanceId } = await params;

    // Verify instance ownership
    const [instance] = await sql`
      SELECT user_id, simulation_id, difficulty
      FROM simulation_instances
      WHERE id = ${instanceId}
    `;

    if (!instance) {
      return NextResponse.json(
        { error: 'Instance not found' },
        { status: 404 }
      );
    }

    if (instance.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - not your instance' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      scenario_id,
      selected_option_id,
      response_time_seconds = null,
    } = body;

    if (!scenario_id || !selected_option_id) {
      return NextResponse.json(
        { error: 'scenario_id and selected_option_id are required' },
        { status: 400 }
      );
    }

    // Get the option details for skill/competency impacts
    const [option] = await sql`
      SELECT
        skill_impacts,
        competency_impacts,
        next_scenario_id
      FROM scenario_options
      WHERE id = ${selected_option_id}
        AND scenario_id = ${scenario_id}
    `;

    if (!option) {
      return NextResponse.json(
        { error: 'Invalid option for this scenario' },
        { status: 400 }
      );
    }

    // Save the response
    const [response] = await sql`
      INSERT INTO learner_responses (
        instance_id,
        scenario_id,
        selected_option_id,
        response_time_seconds,
        responded_at
      ) VALUES (
        ${instanceId},
        ${scenario_id},
        ${selected_option_id},
        ${response_time_seconds},
        NOW()
      )
      RETURNING *
    `;

    // If there are competency impacts, record them
    if (option.competency_impacts && typeof option.competency_impacts === 'object') {
      const competencyImpacts = option.competency_impacts;

      for (const [competencyId, impact] of Object.entries(competencyImpacts)) {
        if (typeof impact === 'number' && impact !== 0) {
          try {
            await sql`
              INSERT INTO learner_competency_scores (
                user_id,
                competency_id,
                simulation_id,
                instance_id,
                response_id,
                score_change,
                recorded_at
              ) VALUES (
                ${session.user.id},
                ${competencyId},
                ${instance.simulation_id},
                ${instanceId},
                ${response.id},
                ${impact},
                NOW()
              )
            `;
          } catch (err) {
            console.error('Error recording competency impact:', err);
          }
        }
      }
    }

    // Return response with next scenario info
    return NextResponse.json({
      ...response,
      next_scenario_id: option.next_scenario_id,
      competency_impacts: option.competency_impacts || {},
      skill_impacts: option.skill_impacts || {},
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error saving response:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save response' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/instances/[id]/responses
 * Get all responses for an instance
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

    const { id: instanceId } = await params;
    const searchParams = req.nextUrl.searchParams;
    const scenarioId = searchParams.get('scenario_id');

    // Verify instance ownership
    const [instance] = await sql`
      SELECT user_id
      FROM simulation_instances
      WHERE id = ${instanceId}
    `;

    if (!instance) {
      return NextResponse.json(
        { error: 'Instance not found' },
        { status: 404 }
      );
    }

    if (instance.user_id !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - not your instance' },
        { status: 403 }
      );
    }

    let responses;

    if (scenarioId) {
      // Filter by specific scenario
      responses = await sql`
        SELECT
          lr.*,
          s.title as scenario_title,
          s.hierarchy_level,
          so.option_text,
          so.skill_impacts,
          so.competency_impacts,
          so.next_scenario_id,
          lr.selected_option_id as option_id,
          lr.response_time_seconds as time_to_decision_seconds
        FROM learner_responses lr
        INNER JOIN scenarios s ON s.id = lr.scenario_id
        LEFT JOIN scenario_options so ON so.id = lr.selected_option_id
        WHERE lr.instance_id = ${instanceId}
          AND lr.scenario_id = ${scenarioId}
        ORDER BY lr.responded_at DESC
      `;
    } else {
      // Get all responses for instance
      responses = await sql`
        SELECT
          lr.*,
          s.title as scenario_title,
          s.hierarchy_level,
          so.option_text,
          so.skill_impacts,
          so.competency_impacts,
          so.next_scenario_id,
          lr.selected_option_id as option_id,
          lr.response_time_seconds as time_to_decision_seconds
        FROM learner_responses lr
        INNER JOIN scenarios s ON s.id = lr.scenario_id
        LEFT JOIN scenario_options so ON so.id = lr.selected_option_id
        WHERE lr.instance_id = ${instanceId}
        ORDER BY lr.responded_at
      `;
    }

    return NextResponse.json(responses);
  } catch (error: any) {
    console.error('Error fetching responses:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch responses' },
      { status: 500 }
    );
  }
}
