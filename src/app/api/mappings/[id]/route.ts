import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin' && session.user.role !== 'instructor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const updates: Record<string, any> = { updated_at: new Date() };
    const allowedFields = [
      'algorithm_id',
      'calculation_method',
      'mapping_weight',
      'algorithm_config',
      'score_conversion_rules',
      'normalization_method',
      'configuration_notes',
      'is_active'
    ];

    Object.entries(body).forEach(([key, value]) => {
      if (allowedFields.includes(key)) {
        const processedValue =
          key === 'algorithm_config' || key === 'score_conversion_rules'
            ? JSON.stringify(value)
            : value;
        updates[key] = processedValue;
      }
    });

    if (body.calculation_method && !body.algorithm_id) {
      const [algorithm] = await sql`
        SELECT id FROM calculation_algorithms
        WHERE code = ${body.calculation_method} AND is_active = true
        LIMIT 1
      `;
      if (algorithm?.id) {
        updates.algorithm_id = algorithm.id;
      }
    }

    if (Object.keys(updates).length === 1) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const result = await sql`
      UPDATE simulation_metric_competency_mappings
      SET ${sql(updates)}
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Mapping not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error: any) {
    console.error('Error updating metric mapping:', error);
    return NextResponse.json(
      { error: 'Failed to update mapping', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin' && session.user.role !== 'instructor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const result = await sql`
      DELETE FROM simulation_metric_competency_mappings
      WHERE id = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Mapping not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting metric mapping:', error);
    return NextResponse.json(
      { error: 'Failed to delete mapping', details: error.message },
      { status: 500 }
    );
  }
}
