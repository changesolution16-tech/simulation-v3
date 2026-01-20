import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/competencies/[id]
 * Get a specific competency
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

    const { id: competencyId } = await params;

    const result = await sql`
      SELECT
        id,
        code,
        name,
        description,
        parent_competency_id,
        competency_level,
        category,
        industry_standard,
        tags,
        proficiency_levels,
        is_active,
        created_at,
        updated_at
      FROM competencies
      WHERE id = ${competencyId}
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Competency not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error: any) {
    console.error('Error fetching competency:', error);
    return NextResponse.json(
      { error: 'Failed to fetch competency', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/competencies/[id]
 * Update a competency (admin only)
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

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - admin access required' }, { status: 403 });
    }

    const { id: competencyId } = await params;
    const body = await req.json();

    const updates: Record<string, any> = { updated_at: new Date() };

    const allowedFields = [
      'code',
      'name',
      'description',
      'parent_competency_id',
      'competency_level',
      'category',
      'industry_standard',
      'tags',
      'proficiency_levels',
      'is_active'
    ];

    Object.entries(body).forEach(([key, value]) => {
      if (allowedFields.includes(key)) {
        // JSON fields need to be stringified
        const processedValue = ['tags', 'proficiency_levels'].includes(key)
          ? JSON.stringify(value)
          : value;
        updates[key] = processedValue;
      }
    });

    if (Object.keys(updates).length === 1) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const result = await sql`
      UPDATE competencies
      SET ${sql(updates)}
      WHERE id = ${competencyId}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Competency not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error: any) {
    console.error('Error updating competency:', error);
    return NextResponse.json(
      { error: 'Failed to update competency', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/competencies/[id]
 * Delete a competency (admin only)
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

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - admin access required' }, { status: 403 });
    }

    const { id: competencyId } = await params;

    const result = await sql`
      UPDATE competencies
      SET is_active = false, updated_at = NOW()
      WHERE id = ${competencyId}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Competency not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Competency deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting competency:', error);
    return NextResponse.json(
      { error: 'Failed to delete competency', details: error.message },
      { status: 500 }
    );
  }
}
