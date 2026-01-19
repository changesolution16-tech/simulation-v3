import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/simulations/[id]/scenarios/[scenarioId]
 * Update simulation_scenarios mapping fields
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; scenarioId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin' && session.user.role !== 'instructor') {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      );
    }

    const { id: simulationId, scenarioId } = await params;
    const updates = await req.json();

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const allowedFields = [
      'is_entry_point',
      'is_exit_point',
      'sequence_order',
      'position_x',
      'position_y',
      'notes'
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

    if (updates.is_entry_point === true) {
      await sql`
        UPDATE simulation_scenarios
        SET is_entry_point = false
        WHERE simulation_id = ${simulationId}
      `;
    }

    values.push(simulationId, scenarioId);

    const query = `
      UPDATE simulation_scenarios
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE simulation_id = $${paramIndex} AND scenario_id = $${paramIndex + 1}
      RETURNING *
    `;

    const [mapping] = await sql.unsafe(query, values);

    if (!mapping) {
      return NextResponse.json(
        { error: 'Scenario mapping not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(mapping);
  } catch (error: any) {
    console.error('Error updating simulation scenario mapping:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update scenario mapping' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/simulations/[id]/scenarios/[scenarioId]
 * Remove scenario from a simulation (admin only)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; scenarioId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - admin access required' },
        { status: 403 }
      );
    }

    const { id: simulationId, scenarioId } = await params;

    const [deleted] = await sql`
      DELETE FROM simulation_scenarios
      WHERE simulation_id = ${simulationId} AND scenario_id = ${scenarioId}
      RETURNING id
    `;

    if (!deleted) {
      return NextResponse.json(
        { error: 'Scenario mapping not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error removing scenario from simulation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove scenario from simulation' },
      { status: 500 }
    );
  }
}
