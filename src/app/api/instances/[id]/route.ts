import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/instances/[id]
 * Get a specific simulation instance with its responses
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

    const [instance] = await sql`
      SELECT
        si.*,
        s.name as simulation_name,
        s.display_name as simulation_display_name,
        s.difficulty as simulation_difficulty,
        s.max_level as simulation_max_level,
        ta.title as assignment_title
      FROM simulation_instances si
      INNER JOIN simulations s ON s.id = si.simulation_id
      LEFT JOIN training_assignments ta ON ta.id = si.assignment_id
      WHERE si.id = ${instanceId}
    `;

    if (!instance) {
      return NextResponse.json(
        { error: 'Instance not found' },
        { status: 404 }
      );
    }

    // Check authorization
    if (instance.user_id !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - not your instance' },
        { status: 403 }
      );
    }

    // Fetch responses for this instance
    const responses = await sql`
      SELECT
        lr.*,
        s.title as scenario_title,
        so.option_text,
        so.skill_impacts,
        so.competency_impacts
      FROM learner_responses lr
      INNER JOIN scenarios s ON s.id = lr.scenario_id
      LEFT JOIN scenario_options so ON so.id = lr.selected_option_id
      WHERE lr.instance_id = ${instanceId}
      ORDER BY lr.responded_at
    `;

    return NextResponse.json({
      ...instance,
      responses,
    });
  } catch (error: any) {
    console.error('Error fetching instance:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch instance' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/instances/[id]
 * Update a simulation instance (progress, completion, etc.)
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

    const { id: instanceId } = await params;

    // Verify ownership
    const [existing] = await sql`
      SELECT user_id
      FROM simulation_instances
      WHERE id = ${instanceId}
    `;

    if (!existing) {
      return NextResponse.json(
        { error: 'Instance not found' },
        { status: 404 }
      );
    }

    if (existing.user_id !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - not your instance' },
        { status: 403 }
      );
    }

    const updates = await req.json();

    // Build dynamic update query
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const allowedFields = [
      'status',
      'completed_at',
      'current_scenario_id',
      'stages_completed',
      'current_stage',
      'overall_score',
      'completion_time_seconds',
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

    // Add instance ID
    values.push(instanceId);

    const query = `
      UPDATE simulation_instances
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const [instance] = await sql.unsafe(query, values);

    return NextResponse.json(instance);
  } catch (error: any) {
    console.error('Error updating instance:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update instance' },
      { status: 500 }
    );
  }
}
