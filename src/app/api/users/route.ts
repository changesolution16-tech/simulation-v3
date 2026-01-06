import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/users
 * Get all users (admin only)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

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
        language_preference
      FROM profiles
      WHERE 1=1
        ${role ? sql`AND role = ${role}` : sql``}
        ${search ? sql`AND (full_name ILIKE ${'%' + search + '%'} OR email ILIKE ${'%' + search + '%'})` : sql``}
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users
 * Create a new user (admin only)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const {
      email,
      password,
      full_name,
      role = 'learner',
      organization,
      department,
      position,
      language_preference = 'en'
    } = body;

    if (!email || !password || !full_name) {
      return NextResponse.json(
        { error: 'Email, password, and full name are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM auth.users WHERE email = ${email}
    `;

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Create user in auth.users
    const hashedPassword = await hashPassword(password);
    const userResult = await sql`
      INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, created_at, updated_at)
      VALUES (${email}, ${hashedPassword}, NOW(), NOW(), NOW())
      RETURNING id
    `;

    const userId = userResult[0].id;

    // Create profile
    await sql`
      INSERT INTO profiles (
        id, email, full_name, role, organization, department, position,
        is_active, language_preference, created_at, updated_at
      )
      VALUES (${userId}, ${email}, ${full_name}, ${role}, ${organization}, ${department}, ${position}, true, ${language_preference}, NOW(), NOW())
    `;

    return NextResponse.json(
      {
        id: userId,
        email,
        full_name,
        role,
        message: 'User created successfully'
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user', details: error.message },
      { status: 500 }
    );
  }
}

// Simple password hashing function (in production, use bcrypt or similar)
async function hashPassword(password: string): Promise<string> {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(password).digest('hex');
}
