import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/learning-resources/[id]
 * Get a single learning resource
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

    const { id } = await params;

    const [resource] = await sql`
      SELECT
        lr.*,
        COUNT(DISTINCT olr.option_id) as usage_count
      FROM learning_resources lr
      LEFT JOIN option_learning_resources olr ON olr.resource_id = lr.id
      WHERE lr.id = ${id}
      GROUP BY lr.id
    `;

    if (!resource) {
      return NextResponse.json(
        { error: 'Learning resource not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(resource);
  } catch (error: any) {
    console.error('Error fetching learning resource:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch learning resource' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/learning-resources/[id]
 * Update a learning resource (admin/instructor only)
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

    // Only admins and instructors can update resources
    if (session.user.role !== 'admin' && session.user.role !== 'instructor') {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const updates = await req.json();

    // Build dynamic update query
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const allowedFields = [
      'title', 'resource_type', 'url', 'description',
      'author', 'publisher', 'published_date', 'duration_minutes',
      'difficulty_level', 'tags', 'category', 'metadata'
    ];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        if (key === 'metadata') {
          fields.push(`${key} = $${paramIndex}`);
          values.push(JSON.stringify(value));
        } else {
          fields.push(`${key} = $${paramIndex}`);
          values.push(value);
        }
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

    // Add resource ID
    values.push(id);

    const query = `
      UPDATE learning_resources
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const [resource] = await sql.unsafe(query, values);

    if (!resource) {
      return NextResponse.json(
        { error: 'Learning resource not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(resource);
  } catch (error: any) {
    console.error('Error updating learning resource:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update learning resource' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/learning-resources/[id]
 * Delete a learning resource (admin only)
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

    // Only admins can delete resources
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if resource is in use
    const [usage] = await sql`
      SELECT COUNT(*) as count
      FROM option_learning_resources
      WHERE resource_id = ${id}
    `;

    if (usage && parseInt(usage.count) > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete resource - it is assigned to scenario options',
          usage_count: parseInt(usage.count)
        },
        { status: 400 }
      );
    }

    // Delete the resource
    const [deleted] = await sql`
      DELETE FROM learning_resources
      WHERE id = ${id}
      RETURNING id
    `;

    if (!deleted) {
      return NextResponse.json(
        { error: 'Learning resource not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, id: deleted.id });
  } catch (error: any) {
    console.error('Error deleting learning resource:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete learning resource' },
      { status: 500 }
    );
  }
}
