import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(session.user.id)) {
      console.error('Invalid UUID in session:', session.user.id);
      return NextResponse.json(
        { error: 'Invalid session. Please log in again.' },
        { status: 401 }
      );
    }

    const result = await sql`
      SELECT
        id,
        email,
        full_name as name,
        username,
        role,
        institution,
        department,
        position,
        is_active,
        preferred_language,
        progress,
        created_at,
        updated_at
      FROM profiles
      WHERE id = ${session.user.id}
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(session.user.id)) {
      console.error('Invalid UUID in session:', session.user.id);
      return NextResponse.json(
        { error: 'Invalid session. Please log in again.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { full_name, department, position, preferred_language } = body;

    const result = await sql`
      UPDATE profiles
      SET
        full_name = COALESCE(${full_name}, full_name),
        department = COALESCE(${department}, department),
        position = COALESCE(${position}, position),
        preferred_language = COALESCE(${preferred_language}, preferred_language),
        updated_at = NOW()
      WHERE id = ${session.user.id}
      RETURNING
        id,
        email,
        full_name as name,
        username,
        role,
        institution,
        department,
        position,
        preferred_language
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user data' },
      { status: 500 }
    );
  }
}
