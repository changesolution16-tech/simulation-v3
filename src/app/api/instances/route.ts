import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const simulationId = searchParams.get('simulation_id');
    const learnerId = searchParams.get('learner_id');
    const status = searchParams.get('status');
    const assignmentId = searchParams.get('assignment_id');

    const conditions: string[] = [];
    const params: any[] = [];

    if (simulationId) {
      conditions.push(`si.simulation_id = $${params.length + 1}`);
      params.push(simulationId);
    }

    if (learnerId) {
      conditions.push(`si.user_id = $${params.length + 1}`);
      params.push(learnerId);
    }

    if (status) {
      conditions.push(`si.status = $${params.length + 1}`);
      params.push(status);
    }

    if (assignmentId) {
      conditions.push(`si.assignment_id = $${params.length + 1}`);
      params.push(assignmentId);
    }

    // If no conditions provided, only show user's own instances (unless admin)
    if (conditions.length === 0) {
      if (session.user.role === 'admin') {
        // Admins can see all
      } else {
        conditions.push(`si.user_id = $${params.length + 1}`);
        params.push(session.user.id);
      }
    } else {
      // Non-admins can only see their own instances
      if (session.user.role !== 'admin' && learnerId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT
        si.*,
        s.name as simulation_name,
        s.display_name as simulation_display_name,
        s.difficulty as simulation_difficulty,
        s.max_level as simulation_max_level,
        u.full_name as user_name,
        u.email as user_email,
        ta.title as assignment_title
      FROM simulation_instances si
      INNER JOIN simulations s ON s.id = si.simulation_id
      LEFT JOIN users u ON u.id = si.user_id
      LEFT JOIN training_assignments ta ON ta.id = si.assignment_id
      ${whereClause}
      ORDER BY si.created_at DESC
    `;

    const instances = await db.unsafe(query, params);

    return NextResponse.json(instances);
  } catch (error: any) {
    console.error('Error fetching instances:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch instances' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      simulation_id,
      assignment_id,
      difficulty_level,
      selected_topic,
    } = body;

    if (!simulation_id) {
      return NextResponse.json(
        { error: 'simulation_id is required' },
        { status: 400 }
      );
    }

    // Check if there's already an in-progress instance for this user and simulation
    const [existingInstance] = await db`
      SELECT id
      FROM simulation_instances
      WHERE user_id = ${session.user.id}
        AND simulation_id = ${simulation_id}
        AND status = 'in_progress'
    `;

    if (existingInstance) {
      return NextResponse.json(existingInstance);
    }

    // Create new instance
    const [newInstance] = await db`
      INSERT INTO simulation_instances (
        simulation_id,
        user_id,
        assignment_id,
        status,
        difficulty_level,
        selected_topic,
        stages_completed,
        current_stage
      )
      VALUES (
        ${simulation_id},
        ${session.user.id},
        ${assignment_id || null},
        'in_progress',
        ${difficulty_level || 'intermediate'},
        ${selected_topic || null},
        0,
        1
      )
      RETURNING *
    `;

    return NextResponse.json(newInstance, { status: 201 });
  } catch (error: any) {
    console.error('Error creating instance:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create instance' },
      { status: 500 }
    );
  }
}
