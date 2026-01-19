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
        ss.id as simulation_scenario_id,
        ss.simulation_id,
        ss.scenario_id,
        ss.is_entry_point,
        ss.is_exit_point,
        ss.sequence_order,
        ss.position_x,
        ss.position_y,
        ss.notes,
        s.id,
        s.title,
        s.title_en,
        s.title_es,
        s.description,
        s.description_en,
        s.description_es,
        s.question_text,
        s.question_text_en,
        s.question_text_es,
        s.topic_id,
        s.difficulty,
        s.is_end_scenario,
        s.content_status,
        s.prompt_video_url,
        s.introduction_video_url,
        s.transition_video_url,
        s.fiction_contract_text,
        s.timer_enabled,
        s.timer_visible,
        s.timer_display_location,
        s.timer_type,
        s.timer_limit_seconds,
        s.show_timer_in_feedback,
        s.timer_warning_threshold_seconds,
        s.hierarchy_level,
        s.created_at,
        s.updated_at,
        COUNT(DISTINCT so.id) as option_count
      FROM simulation_scenarios ss
      INNER JOIN scenarios s ON s.id = ss.scenario_id
      LEFT JOIN scenario_options so ON so.scenario_id = s.id
      WHERE ss.simulation_id = ${simulationId}
      GROUP BY ss.id, ss.simulation_id, ss.scenario_id, ss.is_entry_point, ss.is_exit_point,
               ss.sequence_order, ss.position_x, ss.position_y, ss.notes,
               s.id, s.title, s.title_en, s.title_es, s.description, s.description_en, s.description_es,
               s.question_text, s.question_text_en, s.question_text_es, s.topic_id, s.difficulty,
               s.is_end_scenario, s.content_status, s.prompt_video_url, s.introduction_video_url,
               s.transition_video_url, s.fiction_contract_text, s.timer_enabled, s.timer_visible,
               s.timer_display_location, s.timer_type, s.timer_limit_seconds, s.show_timer_in_feedback,
               s.timer_warning_threshold_seconds, s.hierarchy_level, s.created_at, s.updated_at
      ORDER BY ss.sequence_order ASC, s.created_at ASC
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
      title,
      description,
      question_text,
      topic_id,
      difficulty = 'beginner',
      is_end_scenario = false,
      prompt_video_url,
      prompt_video_source,
      prompt_video_file_id,
      introduction_video_url,
      introduction_video_source,
      introduction_video_file_id,
      transition_video_url,
      transition_video_source,
      transition_video_file_id,
      fiction_contract_text,
      timer_enabled = false,
      timer_visible = false,
      timer_display_location = 'hidden',
      timer_type = 'count_up',
      timer_limit_seconds,
      show_timer_in_feedback = true,
      timer_warning_threshold_seconds = 30,
      hierarchy_level = 1,
      auto_calculate_level = true,
      sequence_order,
      is_entry_point = false,
      is_exit_point = false,
      position_x,
      position_y,
      notes
    } = body;

    // Validation
    if (!title || !question_text) {
      return NextResponse.json(
        { error: 'Title and question text are required' },
        { status: 400 }
      );
    }

    // Get the next sequence order if not provided
    let finalSequenceOrder = sequence_order;
    if (finalSequenceOrder === undefined || finalSequenceOrder === null) {
      const [result] = await sql`
        SELECT COALESCE(MAX(sequence_order), 0) + 1 as next_order
        FROM simulation_scenarios
        WHERE simulation_id = ${simulationId}
      `;
      finalSequenceOrder = result.next_order;
    }

    // First, create the scenario in the scenarios table
    const [scenario] = await sql`
      INSERT INTO scenarios (
        title,
        description,
        question_text,
        topic_id,
        difficulty,
        is_end_scenario,
        content_status,
        prompt_video_url,
        prompt_video_source,
        prompt_video_file_id,
        introduction_video_url,
        introduction_video_source,
        introduction_video_file_id,
        transition_video_url,
        transition_video_source,
        transition_video_file_id,
        fiction_contract_text,
        timer_enabled,
        timer_visible,
        timer_display_location,
        timer_type,
        timer_limit_seconds,
        show_timer_in_feedback,
        timer_warning_threshold_seconds,
        hierarchy_level,
        auto_calculate_level
      ) VALUES (
        ${title},
        ${description || null},
        ${question_text},
        ${topic_id || null},
        ${difficulty},
        ${is_end_scenario},
        'draft',
        ${prompt_video_url || null},
        ${prompt_video_source || null},
        ${prompt_video_file_id || null},
        ${introduction_video_url || null},
        ${introduction_video_source || null},
        ${introduction_video_file_id || null},
        ${transition_video_url || null},
        ${transition_video_source || null},
        ${transition_video_file_id || null},
        ${fiction_contract_text || null},
        ${timer_enabled},
        ${timer_visible},
        ${timer_display_location},
        ${timer_type},
        ${timer_limit_seconds || null},
        ${show_timer_in_feedback},
        ${timer_warning_threshold_seconds},
        ${hierarchy_level},
        ${auto_calculate_level}
      )
      RETURNING *
    `;

    // Then, create the mapping in simulation_scenarios
    const [mapping] = await sql`
      INSERT INTO simulation_scenarios (
        simulation_id,
        scenario_id,
        sequence_order,
        is_entry_point,
        is_exit_point,
        position_x,
        position_y,
        notes
      ) VALUES (
        ${simulationId},
        ${scenario.id},
        ${finalSequenceOrder},
        ${is_entry_point},
        ${is_exit_point},
        ${position_x || null},
        ${position_y || null},
        ${notes || null}
      )
      RETURNING *
    `;

    // Return combined result
    return NextResponse.json({
      ...mapping,
      scenario: scenario
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating scenario:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create scenario' },
      { status: 500 }
    );
  }
}
