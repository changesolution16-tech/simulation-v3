import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/scenarios/[id]
 * Fetch a single scenario with all its options
 * Uses the scenarios table (main scenario repository)
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

    // Fetch from scenarios table
    const [scenario] = await sql`
      SELECT
        s.*,
        t.title as topic_name,
        COUNT(DISTINCT ss.simulation_id) as used_in_simulations
      FROM scenarios s
      LEFT JOIN topics t ON t.id = s.topic_id
      LEFT JOIN simulation_scenarios ss ON ss.scenario_id = s.id
      WHERE s.id = ${scenarioId}
      GROUP BY s.id, t.title
    `;

    if (!scenario) {
      return NextResponse.json(
        { error: 'Scenario not found' },
        { status: 404 }
      );
    }

    // Fetch options for this scenario
    const options = await sql`
      SELECT
        so.*
      FROM scenario_options so
      WHERE so.scenario_id = ${scenarioId}
      ORDER BY so.option_order
    `;

    return NextResponse.json({
      ...scenario,
      options,
    });
  } catch (error: any) {
    console.error('Error fetching scenario:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch scenario' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/scenarios/[id]
 * Update a scenario (admin/instructor only)
 * Updates the scenarios table
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and instructors can update scenarios
    if (session.user.role !== 'admin' && session.user.role !== 'instructor') {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      );
    }

    const { id: scenarioId } = await params;
    const updates = await req.json();

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const allowedFields = [
      'title', 'title_en', 'title_es',
      'description', 'description_en', 'description_es',
      'question_text', 'question_text_en', 'question_text_es',
      'topic_id', 'difficulty', 'is_end_scenario', 'content_status',
      'prompt_video_url', 'prompt_video_file_id', 'prompt_video_source',
      'prompt_video_library_id',
      'introduction_video_url', 'introduction_video_file_id', 'introduction_video_source',
      'introduction_video_library_id',
      'transition_video_url', 'transition_video_file_id', 'transition_video_source',
      'transition_video_library_id',
      'fiction_contract_text',
      'timer_enabled', 'timer_visible', 'timer_display_location',
      'timer_type', 'timer_limit_seconds', 'show_timer_in_feedback',
      'timer_warning_threshold_seconds', 'hierarchy_level', 'auto_calculate_level', 'metadata'
    ];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Add updated_at
    fields.push(`updated_at = NOW()`);

    // Add scenario ID
    values.push(scenarioId);

    const query = `
      UPDATE scenarios
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const [scenario] = await sql.unsafe(query, values);

    if (!scenario) {
      return NextResponse.json(
        { error: 'Scenario not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(scenario);
  } catch (error: any) {
    console.error('Error updating scenario:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update scenario' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/scenarios/[id]
 * Delete a scenario (admin only)
 * Deletes from scenarios table
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can delete scenarios
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - admin access required' },
        { status: 403 }
      );
    }

    const { id: scenarioId } = await params;

    // Check if scenario is used in any simulations
    const [usage] = await sql`
      SELECT COUNT(*) as count
      FROM simulation_scenarios
      WHERE scenario_id = ${scenarioId}
    `;

    if (usage && parseInt(usage.count) > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete scenario - it is used in one or more simulations',
          used_in_simulations: parseInt(usage.count)
        },
        { status: 400 }
      );
    }

    // Check if this scenario has responses (can't delete if in use)
    const [responseUsage] = await sql`
      SELECT COUNT(*) as count
      FROM learner_responses lr
      INNER JOIN simulation_instances si ON si.id = lr.instance_id
      INNER JOIN simulation_scenarios ss ON ss.simulation_id = si.simulation_id AND ss.scenario_id = ${scenarioId}
      WHERE lr.scenario_id = ${scenarioId}
    `;

    if (responseUsage && parseInt(responseUsage.count) > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete scenario - learners have already responded to it',
          response_count: parseInt(responseUsage.count)
        },
        { status: 400 }
      );
    }

    // Delete options first
    await sql`
      DELETE FROM scenario_options
      WHERE scenario_id = ${scenarioId}
    `;

    // Delete the scenario
    const [deleted] = await sql`
      DELETE FROM scenarios
      WHERE id = ${scenarioId}
      RETURNING id
    `;

    if (!deleted) {
      return NextResponse.json(
        { error: 'Scenario not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, id: deleted.id });
  } catch (error: any) {
    console.error('Error deleting scenario:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete scenario' },
      { status: 500 }
    );
  }
}
