import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/simulations/[id]
 * Fetch a single simulation with all its scenarios and options
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

    // Fetch simulation basic info
    const [simulation] = await sql`
      SELECT
        s.*,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon,
        p.full_name as created_by_name,
        p.email as created_by_email
      FROM simulations s
      LEFT JOIN simulation_categories c ON c.id = s.category_id
      LEFT JOIN profiles p ON p.id = s.created_by
      WHERE s.id = ${simulationId}
    `;

    if (!simulation) {
      return NextResponse.json(
        { error: 'Simulation not found' },
        { status: 404 }
      );
    }

    // Check authorization for non-published simulations
    if (
      simulation.status !== 'published' &&
      session.user.role === 'learner'
    ) {
      return NextResponse.json(
        { error: 'Simulation not available' },
        { status: 403 }
      );
    }

    // Fetch scenarios for this simulation
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
        s.hierarchy_level
      FROM simulation_scenarios ss
      INNER JOIN scenarios s ON s.id = ss.scenario_id
      WHERE ss.simulation_id = ${simulationId}
      ORDER BY ss.sequence_order, ss.is_entry_point DESC
    `;

    // Fetch all options for these scenarios
    const scenarioIds = scenarios.map(s => s.scenario_id);
    let options: any[] = [];

    if (scenarioIds.length > 0) {
      options = await sql`
        SELECT
          so.id,
          so.scenario_id,
          so.option_text,
          so.option_text_en,
          so.option_text_es,
          so.option_order,
          so.next_scenario_id,
          so.feedback_beginner,
          so.feedback_beginner_en,
          so.feedback_beginner_es,
          so.feedback_intermediate,
          so.feedback_intermediate_en,
          so.feedback_intermediate_es,
          so.feedback_advanced,
          so.feedback_advanced_en,
          so.feedback_advanced_es,
          so.feedback_video_url_beginner,
          so.feedback_video_url_intermediate,
          so.feedback_video_url_advanced,
          so.transition_video_url,
          so.skill_impacts,
          so.competency_impacts
        FROM scenario_options so
        WHERE so.scenario_id = ANY(${scenarioIds})
        ORDER BY so.option_order
      `;
    }

    // Group options by scenario
    const scenariosWithOptions = scenarios.map(scenario => {
      const scenarioOptions = options
        .filter(opt => opt.scenario_id === scenario.scenario_id)
        .map(opt => ({
          id: opt.id,
          text: opt.option_text,
          option_text: opt.option_text,
          option_text_en: opt.option_text_en,
          option_text_es: opt.option_text_es,
          feedback: {
            beginner: opt.feedback_beginner || '',
            intermediate: opt.feedback_intermediate || opt.feedback_beginner || '',
            advanced: opt.feedback_advanced || opt.feedback_beginner || '',
          },
          feedback_beginner: opt.feedback_beginner,
          feedback_beginner_en: opt.feedback_beginner_en,
          feedback_beginner_es: opt.feedback_beginner_es,
          feedback_intermediate: opt.feedback_intermediate,
          feedback_intermediate_en: opt.feedback_intermediate_en,
          feedback_intermediate_es: opt.feedback_intermediate_es,
          feedback_advanced: opt.feedback_advanced,
          feedback_advanced_en: opt.feedback_advanced_en,
          feedback_advanced_es: opt.feedback_advanced_es,
          feedbackVideos: {
            beginner: opt.feedback_video_url_beginner || null,
            intermediate: opt.feedback_video_url_intermediate || null,
            advanced: opt.feedback_video_url_advanced || null,
          },
          transitionVideoUrl: opt.transition_video_url,
          nextScenarioId: opt.next_scenario_id,
          skillImpact: opt.skill_impacts || {},
          competency_impacts: opt.competency_impacts || opt.skill_impacts || {},
        }));

      return {
        id: scenario.simulation_scenario_id,
        simulation_id: scenario.simulation_id,
        scenario_id: scenario.scenario_id,
        is_entry_point: scenario.is_entry_point,
        is_exit_point: scenario.is_exit_point,
        sequence_order: scenario.sequence_order,
        position_x: scenario.position_x,
        position_y: scenario.position_y,
        notes: scenario.notes,
        scenarios: {
          id: scenario.scenario_id,
          title: scenario.title,
          title_en: scenario.title_en,
          title_es: scenario.title_es,
          description: scenario.description,
          description_en: scenario.description_en,
          description_es: scenario.description_es,
          question_text: scenario.question_text,
          question_text_en: scenario.question_text_en,
          question_text_es: scenario.question_text_es,
          topicId: scenario.topic_id,
          topic_id: scenario.topic_id,
          difficulty: scenario.difficulty,
          is_end_scenario: scenario.is_end_scenario,
          isEndScenario: scenario.is_end_scenario,
          content_status: scenario.content_status,
          promptVideoUrl: scenario.prompt_video_url,
          prompt_video_url: scenario.prompt_video_url,
          introductionVideoUrl: scenario.introduction_video_url,
          introduction_video_url: scenario.introduction_video_url,
          transitionVideoUrl: scenario.transition_video_url,
          transition_video_url: scenario.transition_video_url,
          fiction_contract_text: scenario.fiction_contract_text,
          timerEnabled: scenario.timer_enabled || false,
          timerVisible: scenario.timer_visible || false,
          timerDisplayLocation: scenario.timer_display_location || 'hidden',
          timerType: scenario.timer_type || 'count_up',
          timerLimitSeconds: scenario.timer_limit_seconds || null,
          showTimerInFeedback: scenario.show_timer_in_feedback !== false,
          timerWarningThresholdSeconds: scenario.timer_warning_threshold_seconds || 30,
          hierarchyLevel: scenario.hierarchy_level,
          options: scenarioOptions,
        },
      };
    });

    // Calculate max level from scenarios
    const maxLevel = scenarios.reduce((max, s) => {
      return Math.max(max, s.hierarchy_level || 0);
    }, 0);

    // Parse JSON fields if they're strings
    const parseJsonField = (field: any): any => {
      if (!field) return null;
      if (typeof field === 'string') {
        try {
          return JSON.parse(field);
        } catch {
          return field;
        }
      }
      return field;
    };

    const result = {
      ...simulation,
      landing_objectives: parseJsonField(simulation.landing_objectives) || [],
      landing_objectives_es: parseJsonField(simulation.landing_objectives_es) || [],
      tags: parseJsonField(simulation.tags) || [],
      scenarios: scenariosWithOptions,
      scenario_count: scenariosWithOptions.length,
      max_level: maxLevel,
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching simulation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch simulation' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/simulations/[id]
 * Update a simulation (admin/instructor only)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PATCH(req, { params });
}

/**
 * PATCH /api/simulations/[id]
 * Update a simulation (admin/instructor only)
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

    // Only admins and instructors can update simulations
    if (session.user.role !== 'admin' && session.user.role !== 'instructor') {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      );
    }

    const { id: simulationId } = await params;
    const updates = await req.json();

    // Build dynamic update query
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Define allowed fields
    const allowedFields = [
      'name', 'display_name', 'description', 'category_id', 'difficulty',
      'estimated_duration_minutes', 'status', 'landing_page_enabled',
      'landing_intro_video_url', 'landing_intro_video_type', 'landing_title',
      'landing_description', 'landing_objectives', 'landing_role_description',
      'landing_image_url', 'landing_image_alt', 'landing_fiction_contract',
      'introduction_page_enabled', 'introduction_title', 'introduction_description',
      'introduction_video_url', 'introduction_video_type', 'closing_page_enabled',
      'closing_video_url', 'closing_video_type', 'closing_video_excellent_url',
      'closing_video_excellent_type', 'closing_video_good_url', 'closing_video_good_type',
      'closing_video_developing_url', 'closing_video_developing_type',
      'closing_excellent_threshold', 'closing_good_threshold',
      'closing_page_show_before_results', 'closing_title', 'closing_analysis_type',
      'closing_recommendations_enabled', 'tags'
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

    // Add simulation ID
    values.push(simulationId);

    const query = `
      UPDATE simulations
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const [simulation] = await sql.unsafe(query, values);

    if (!simulation) {
      return NextResponse.json(
        { error: 'Simulation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(simulation);
  } catch (error: any) {
    console.error('Error updating simulation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update simulation' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/simulations/[id]
 * Delete a simulation (admin only)
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

    // Only admins can delete simulations
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - admin access required' },
        { status: 403 }
      );
    }

    const { id: simulationId } = await params;

    // Delete related data first (cascading deletes)
    await sql`
      DELETE FROM training_assignments
      WHERE simulation_id = ${simulationId}
    `;

    await sql`
      DELETE FROM simulation_scenarios
      WHERE simulation_id = ${simulationId}
    `;

    await sql`
      DELETE FROM simulation_competencies
      WHERE simulation_id = ${simulationId}
    `;

    await sql`
      DELETE FROM simulation_metrics
      WHERE simulation_id = ${simulationId}
    `;

    // Delete the simulation
    const [deleted] = await sql`
      DELETE FROM simulations
      WHERE id = ${simulationId}
      RETURNING id
    `;

    if (!deleted) {
      return NextResponse.json(
        { error: 'Simulation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, id: deleted.id });
  } catch (error: any) {
    console.error('Error deleting simulation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete simulation' },
      { status: 500 }
    );
  }
}
