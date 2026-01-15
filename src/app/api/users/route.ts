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
  console.log('=== GET /api/users - FETCH USERS REQUEST ===');
  console.log('Timestamp:', new Date().toISOString());

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('❌ No session - Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      console.log('❌ Not admin - Forbidden');
      return NextResponse.json({ error: 'Forbidden - admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('Query params:', { role, search, limit, offset });

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

    console.log('✓ Query successful - Found', result.length, 'users');

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('=== ERROR FETCHING USERS ===');
    console.error('Error:', error);
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
  console.log('=== POST /api/users - CREATE USER REQUEST ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Request URL:', req.url);

  try {
    console.log('Step 1: Checking session...');
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      console.log('❌ No session found - Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✓ Session found:', { userId: session.user.id, role: session.user.role });

    if (session.user.role !== 'admin') {
      console.log('❌ User is not admin - Forbidden');
      return NextResponse.json({ error: 'Forbidden - admin access required' }, { status: 403 });
    }

    console.log('✓ Admin access confirmed');

    console.log('Step 2: Parsing request body...');
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

    console.log('Request body (sanitized):', {
      email,
      full_name,
      role,
      organization,
      department,
      position,
      language_preference,
      hasPassword: !!password
    });

    console.log('Step 3: Validating required fields...');
    if (!email || !password || !full_name) {
      console.log('❌ Missing required fields:', { email: !!email, password: !!password, full_name: !!full_name });
      return NextResponse.json(
        { error: 'Email, password, and full name are required' },
        { status: 400 }
      );
    }

    console.log('✓ All required fields present');

    console.log('Step 4: Checking if user already exists...');
    const existingUser = await sql`
      SELECT id FROM auth.users WHERE email = ${email}
    `;

    console.log('Existing user check result:', { found: existingUser.length > 0 });

    if (existingUser.length > 0) {
      console.log('❌ User already exists with email:', email);
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    console.log('✓ Email is available');

    console.log('Step 5: Hashing password...');
    const hashedPassword = await hashPassword(password);
    console.log('✓ Password hashed');

    console.log('Step 6: Creating user in auth.users...');
    const userResult = await sql`
      INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, created_at, updated_at)
      VALUES (${email}, ${hashedPassword}, NOW(), NOW(), NOW())
      RETURNING id
    `;

    const userId = userResult[0].id;
    console.log('✓ User created in auth.users with ID:', userId);

    console.log('Step 7: Creating user profile...');
    await sql`
      INSERT INTO profiles (
        id, email, full_name, role, organization, department, position,
        is_active, language_preference, created_at, updated_at
      )
      VALUES (${userId}, ${email}, ${full_name}, ${role}, ${organization}, ${department}, ${position}, true, ${language_preference}, NOW(), NOW())
    `;

    console.log('✓ Profile created successfully');

    const response = {
      id: userId,
      email,
      full_name,
      role,
      message: 'User created successfully'
    };

    console.log('=== USER CREATION SUCCESS ===');
    console.log('Response:', response);

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error('=== USER CREATION ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error object:', JSON.stringify(error, null, 2));

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
