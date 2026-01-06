import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

/**
 * PATCH /api/options/[id]
 * Update a scenario option (admin/instructor only)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and instructors can update options
    if (session.user.role !== 'admin' && session.user.role !== 'instructor') {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      );
    }

    const optionId = params.id;
    const updates = await req.json();

    // Build dynamic update query
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const allowedFields = [
      'option_text', 'option_text_en', 'option_text_es',
      'option_order', 'next_scenario_id',
      'feedback_beginner', 'feedback_beginner_en', 'feedback_beginner_es',
      'feedback_intermediate', 'feedback_intermediate_en', 'feedback_intermediate_es',
      'feedback_advanced', 'feedback_advanced_en', 'feedback_advanced_es',
      'feedback_video_url_beginner', 'feedback_video_source_beginner',
      'feedback_video_library_id_beginner', 'feedback_video_file_id_beginner',
      'feedback_video_url_intermediate', 'feedback_video_source_intermediate',
      'feedback_video_library_id_intermediate', 'feedback_video_file_id_intermediate',
      'feedback_video_url_advanced', 'feedback_video_source_advanced',
      'feedback_video_library_id_advanced', 'feedback_video_file_id_advanced',
      'transition_video_url', 'transition_video_source',
      'transition_video_library_id', 'transition_video_file_id',
      'skill_impacts', 'competency_impacts'
    ];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        // For JSON fields, stringify them
        if (['skill_impacts', 'competency_impacts'].includes(key)) {
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

    // Add option ID
    values.push(optionId);

    const query = `
      UPDATE scenario_options
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const [option] = await sql.unsafe(query, values);

    if (!option) {
      return NextResponse.json(
        { error: 'Option not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(option);
  } catch (error: any) {
    console.error('Error updating option:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update option' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/options/[id]
 * Delete a scenario option (admin only)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can delete options
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - admin access required' },
        { status: 403 }
      );
    }

    const optionId = params.id;

    // Check if there are any responses using this option
    const [usage] = await sql`
      SELECT COUNT(*) as count
      FROM learner_responses
      WHERE selected_option_id = ${optionId}
    `;

    if (usage && parseInt(usage.count) > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete option - it has been selected in learner responses',
          response_count: parseInt(usage.count)
        },
        { status: 400 }
      );
    }

    // Delete the option
    const [deleted] = await sql`
      DELETE FROM scenario_options
      WHERE id = ${optionId}
      RETURNING id
    `;

    if (!deleted) {
      return NextResponse.json(
        { error: 'Option not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, id: deleted.id });
  } catch (error: any) {
    console.error('Error deleting option:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete option' },
      { status: 500 }
    );
  }
}
