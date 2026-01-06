import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

/**
 * GET /api/scenarios/[id]/options
 * Get all options for a scenario
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const scenarioId = params.id;

    const options = await sql`
      SELECT *
      FROM scenario_options
      WHERE scenario_id = ${scenarioId}
      ORDER BY option_order
    `;

    return NextResponse.json(options);
  } catch (error: any) {
    console.error('Error fetching options:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch options' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/scenarios/[id]/options
 * Create a new option for a scenario (admin/instructor only)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and instructors can create options
    if (session.user.role !== 'admin' && session.user.role !== 'instructor') {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      );
    }

    const scenarioId = params.id;
    const body = await req.json();

    const {
      option_text,
      option_order,
      next_scenario_id = null,
      feedback_beginner,
      feedback_intermediate,
      feedback_advanced,
      feedback_video_url_beginner = null,
      feedback_video_url_intermediate = null,
      feedback_video_url_advanced = null,
      transition_video_url = null,
      skill_impacts = {},
      competency_impacts = {},
    } = body;

    // Validation
    if (!option_text) {
      return NextResponse.json(
        { error: 'Option text is required' },
        { status: 400 }
      );
    }

    const [option] = await sql`
      INSERT INTO scenario_options (
        scenario_id,
        option_text,
        option_order,
        next_scenario_id,
        feedback_beginner,
        feedback_intermediate,
        feedback_advanced,
        feedback_video_url_beginner,
        feedback_video_url_intermediate,
        feedback_video_url_advanced,
        transition_video_url,
        skill_impacts,
        competency_impacts
      ) VALUES (
        ${scenarioId},
        ${option_text},
        ${option_order || 0},
        ${next_scenario_id},
        ${feedback_beginner || ''},
        ${feedback_intermediate || feedback_beginner || ''},
        ${feedback_advanced || feedback_beginner || ''},
        ${feedback_video_url_beginner},
        ${feedback_video_url_intermediate},
        ${feedback_video_url_advanced},
        ${transition_video_url},
        ${JSON.stringify(skill_impacts)},
        ${JSON.stringify(competency_impacts)}
      )
      RETURNING *
    `;

    return NextResponse.json(option, { status: 201 });
  } catch (error: any) {
    console.error('Error creating option:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create option' },
      { status: 500 }
    );
  }
}
