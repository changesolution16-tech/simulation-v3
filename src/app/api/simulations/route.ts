import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/simulations
 * Fetch all simulations (optionally filtered by category)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('category_id');
    const status = searchParams.get('status');
    const userRole = session.user.role;

    // For learners, only show published simulations
    // For instructors and admins, show all simulations
    const showOnlyPublished = userRole === 'learner';

    let query;
    if (categoryId) {
      query = sql`
        SELECT
          s.*,
          c.name as category_name,
          c.color as category_color,
          c.icon as category_icon,
          COUNT(DISTINCT ss.id) as scenario_count,
          COUNT(DISTINCT si.id) as total_attempts,
          COUNT(DISTINCT si.user_id) as unique_users
        FROM simulations s
        LEFT JOIN simulation_categories c ON c.id = s.category_id
        LEFT JOIN simulation_scenarios ss ON ss.simulation_id = s.id
        LEFT JOIN simulation_instances si ON si.simulation_id = s.id
        WHERE s.category_id = ${categoryId}
          ${showOnlyPublished ? sql`AND s.status = 'published'` : sql``}
          ${status ? sql`AND s.status = ${status}` : sql``}
        GROUP BY s.id, c.name, c.color, c.icon
        ORDER BY s.created_at DESC
      `;
    } else {
      query = sql`
        SELECT
          s.*,
          c.name as category_name,
          c.color as category_color,
          c.icon as category_icon,
          COUNT(DISTINCT ss.id) as scenario_count,
          COUNT(DISTINCT si.id) as total_attempts,
          COUNT(DISTINCT si.user_id) as unique_users
        FROM simulations s
        LEFT JOIN simulation_categories c ON c.id = s.category_id
        LEFT JOIN simulation_scenarios ss ON ss.simulation_id = s.id
        LEFT JOIN simulation_instances si ON si.simulation_id = s.id
        ${showOnlyPublished ? sql`WHERE s.status = 'published'` : sql``}
        ${!showOnlyPublished && status ? sql`WHERE s.status = ${status}` : sql``}
        GROUP BY s.id, c.name, c.color, c.icon
        ORDER BY s.created_at DESC
      `;
    }

    const simulations = await query;

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

    const parsedSimulations = simulations.map((sim: any) => ({
      ...sim,
      landing_objectives: parseJsonField(sim.landing_objectives) || [],
      landing_objectives_es: parseJsonField(sim.landing_objectives_es) || [],
      tags: parseJsonField(sim.tags) || [],
    }));

    return NextResponse.json(parsedSimulations);
  } catch (error) {
    console.error('Error fetching simulations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch simulations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/simulations
 * Create a new simulation (admin/instructor only)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and instructors can create simulations
    if (session.user.role !== 'admin' && session.user.role !== 'instructor') {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await req.json();

    const {
      name,
      display_name,
      description,
      category_id,
      difficulty,
      estimated_duration_minutes,
      landing_page_enabled,
      landing_intro_video_url,
      landing_intro_video_type,
      landing_title,
      landing_description,
      landing_objectives,
      landing_role_description,
      landing_image_url,
      landing_image_alt,
      landing_fiction_contract,
      introduction_page_enabled,
      introduction_title,
      introduction_description,
      introduction_video_url,
      introduction_video_type,
      closing_page_enabled,
      closing_video_url,
      closing_video_type,
      closing_video_excellent_url,
      closing_video_excellent_type,
      closing_video_good_url,
      closing_video_good_type,
      closing_video_developing_url,
      closing_video_developing_type,
      closing_excellent_threshold,
      closing_good_threshold,
      closing_page_show_before_results,
      closing_title,
      closing_analysis_type,
      closing_recommendations_enabled,
      tags,
    } = body;

    // Validation
    if (!name || !display_name) {
      return NextResponse.json(
        { error: 'Name and display name are required' },
        { status: 400 }
      );
    }

    const [simulation] = await sql`
      INSERT INTO simulations (
        name,
        display_name,
        description,
        category_id,
        difficulty,
        estimated_duration_minutes,
        created_by,
        status,
        landing_page_enabled,
        landing_intro_video_url,
        landing_intro_video_type,
        landing_title,
        landing_description,
        landing_objectives,
        landing_role_description,
        landing_image_url,
        landing_image_alt,
        landing_fiction_contract,
        introduction_page_enabled,
        introduction_title,
        introduction_description,
        introduction_video_url,
        introduction_video_type,
        closing_page_enabled,
        closing_video_url,
        closing_video_type,
        closing_video_excellent_url,
        closing_video_excellent_type,
        closing_video_good_url,
        closing_video_good_type,
        closing_video_developing_url,
        closing_video_developing_type,
        closing_excellent_threshold,
        closing_good_threshold,
        closing_page_show_before_results,
        closing_title,
        closing_analysis_type,
        closing_recommendations_enabled,
        tags
      ) VALUES (
        ${name},
        ${display_name},
        ${description || null},
        ${category_id || null},
        ${difficulty || 'beginner'},
        ${estimated_duration_minutes || 10},
        ${session.user.id},
        'draft',
        ${landing_page_enabled !== false},
        ${landing_intro_video_url || null},
        ${landing_intro_video_type || 'synthesia'},
        ${landing_title || null},
        ${landing_description || null},
        ${landing_objectives ? JSON.stringify(landing_objectives) : '[]'},
        ${landing_role_description || null},
        ${landing_image_url || null},
        ${landing_image_alt || null},
        ${landing_fiction_contract !== false},
        ${introduction_page_enabled !== false},
        ${introduction_title || null},
        ${introduction_description || null},
        ${introduction_video_url || null},
        ${introduction_video_type || 'synthesia'},
        ${closing_page_enabled !== false},
        ${closing_video_url || null},
        ${closing_video_type || 'synthesia'},
        ${closing_video_excellent_url || null},
        ${closing_video_excellent_type || 'synthesia'},
        ${closing_video_good_url || null},
        ${closing_video_good_type || 'synthesia'},
        ${closing_video_developing_url || null},
        ${closing_video_developing_type || 'synthesia'},
        ${closing_excellent_threshold || 85},
        ${closing_good_threshold || 70},
        ${closing_page_show_before_results !== false},
        ${closing_title || null},
        ${closing_analysis_type || 'competency'},
        ${closing_recommendations_enabled !== false},
        ${tags ? JSON.stringify(tags) : '[]'}
      )
      RETURNING *
    `;

    return NextResponse.json(simulation, { status: 201 });
  } catch (error: any) {
    console.error('Error creating simulation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create simulation' },
      { status: 500 }
    );
  }
}
