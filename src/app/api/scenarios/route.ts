import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/scenarios
 * Fetch all scenarios (admin/instructor only)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and instructors can view all scenarios
    if (session.user.role !== 'admin' && session.user.role !== 'instructor') {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const topicId = searchParams.get('topic_id');
    const difficulty = searchParams.get('difficulty');

    let query;
    if (topicId || difficulty) {
      const conditions = [];
      const values = [];
      if (topicId) {
        conditions.push(`s.topic_id = $${values.length + 1}`);
        values.push(topicId);
      }
      if (difficulty) {
        conditions.push(`s.difficulty = $${values.length + 1}`);
        values.push(difficulty);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      query = await sql.unsafe(`
        SELECT
          s.*,
          COUNT(DISTINCT so.id) as options_count,
          COUNT(DISTINCT ss.simulation_id) as used_in_simulations
        FROM scenarios s
        LEFT JOIN scenario_options so ON so.scenario_id = s.id
        LEFT JOIN simulation_scenarios ss ON ss.scenario_id = s.id
        ${whereClause}
        GROUP BY s.id
        ORDER BY s.created_at DESC
      `, values);
    } else {
      query = await sql`
        SELECT
          s.*,
          COUNT(DISTINCT so.id) as options_count,
          COUNT(DISTINCT ss.simulation_id) as used_in_simulations
        FROM scenarios s
        LEFT JOIN scenario_options so ON so.scenario_id = s.id
        LEFT JOIN simulation_scenarios ss ON ss.scenario_id = s.id
        GROUP BY s.id
        ORDER BY s.created_at DESC
      `;
    }

    return NextResponse.json(query);
  } catch (error: any) {
    console.error('Error fetching scenarios:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch scenarios' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/scenarios
 * Create a new scenario (admin/instructor only)
 */
export async function POST(req: NextRequest) {
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

    const body = await req.json();

    const {
      title,
      description,
      question_text,
      topic_id,
      difficulty,
      is_end_scenario = false,
      prompt_video_url = null,
      prompt_video_source = null,
      prompt_video_file_id = null,
      prompt_video_library_id = null,
      introduction_video_url = null,
      introduction_video_source = null,
      introduction_video_file_id = null,
      introduction_video_library_id = null,
      transition_video_url = null,
      transition_video_source = null,
      transition_video_file_id = null,
      transition_video_library_id = null,
      fiction_contract_text = null,
      timer_enabled = false,
      timer_visible = false,
      timer_display_location = 'hidden',
      timer_type = 'count_up',
      timer_limit_seconds = null,
      show_timer_in_feedback = true,
      timer_warning_threshold_seconds = 30,
      hierarchy_level = 1,
      auto_calculate_level = true,
    } = body;

    // Validation
    if (!title || !question_text) {
      return NextResponse.json(
        { error: 'Title and question text are required' },
        { status: 400 }
      );
    }

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
        prompt_video_library_id,
        introduction_video_url,
        introduction_video_source,
        introduction_video_file_id,
        introduction_video_library_id,
        transition_video_url,
        transition_video_source,
        transition_video_file_id,
        transition_video_library_id,
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
        ${difficulty || 'beginner'},
        ${is_end_scenario},
        'draft',
        ${prompt_video_url},
        ${prompt_video_source},
        ${prompt_video_file_id},
        ${prompt_video_library_id},
        ${introduction_video_url},
        ${introduction_video_source},
        ${introduction_video_file_id},
        ${introduction_video_library_id},
        ${transition_video_url},
        ${transition_video_source},
        ${transition_video_file_id},
        ${transition_video_library_id},
        ${fiction_contract_text},
        ${timer_enabled},
        ${timer_visible},
        ${timer_display_location},
        ${timer_type},
        ${timer_limit_seconds},
        ${show_timer_in_feedback},
        ${timer_warning_threshold_seconds},
        ${hierarchy_level},
        ${auto_calculate_level}
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
