import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/users/[id]
 * Get a specific user
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

    const { id: userId } = await params;

    // Users can view their own profile, or admins can view any profile
    if (session.user.id !== userId && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await sql`
      SELECT
        id,
        email,
        full_name,
        role,
        organization,
        department,
        position,
        is_active,
        created_at,
        last_login,
        language_preference,
        phone_number,
        bio
      FROM profiles
      WHERE id = ${userId}
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/users/[id]
 * Update a user
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

    const { id: userId } = await params;
    const body = await req.json();

    // Users can update their own profile, or admins can update any profile
    const isOwnProfile = session.user.id === userId;
    const isAdmin = session.user.role === 'admin';

    if (!isOwnProfile && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Build update object
    const updates: Record<string, any> = { updated_at: new Date() };

    const allowedFields = [
      'full_name',
      'organization',
      'department',
      'position',
      'language_preference',
      'phone_number',
      'bio'
    ];

    // Only admins can update these fields
    const adminOnlyFields = ['role', 'is_active'];

    Object.entries(body).forEach(([key, value]) => {
      if (allowedFields.includes(key)) {
        updates[key] = value;
      } else if (adminOnlyFields.includes(key) && isAdmin) {
        updates[key] = value;
      }
    });

    if (Object.keys(updates).length === 1) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const result = await sql`
      UPDATE profiles
      SET ${sql(updates)}
      WHERE id = ${userId}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/[id]
 * Delete a user (admin only)
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

    const { id: userId } = await params;

    // Don't allow deleting yourself
    if (session.user.id === userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Instead of hard delete, deactivate the user
    const result = await sql`
      UPDATE profiles
      SET is_active = false, updated_at = NOW()
      WHERE id = ${userId}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User deactivated successfully' });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user', details: error.message },
      { status: 500 }
    );
  }
}
