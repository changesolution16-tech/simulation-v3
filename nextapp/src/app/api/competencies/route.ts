import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

/**
 * GET /api/competencies
 * Get all competencies
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const level = searchParams.get('level');
    const category = searchParams.get('category');

    const result = await sql`
      SELECT
        id,
        name,
        description,
        competency_level,
        category,
        tags,
        proficiency_levels,
        created_at,
        updated_at
      FROM competencies
      WHERE 1=1
        ${level ? sql`AND competency_level = ${parseInt(level)}` : sql``}
        ${category ? sql`AND category = ${category}` : sql``}
      ORDER BY competency_level, name
    `;

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching competencies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch competencies', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/competencies
 * Create a new competency (admin only)
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
      name,
      description,
      competency_level = 1,
      category,
      tags = [],
      proficiency_levels = []
    } = body;

    if (!name || !description) {
      return NextResponse.json(
        { error: 'Name and description are required' },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO competencies (
        name,
        description,
        competency_level,
        category,
        tags,
        proficiency_levels,
        created_at,
        updated_at
      )
      VALUES (
        ${name},
        ${description},
        ${competency_level},
        ${category},
        ${JSON.stringify(tags)},
        ${JSON.stringify(proficiency_levels)},
        NOW(),
        NOW()
      )
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error: any) {
    console.error('Error creating competency:', error);
    return NextResponse.json(
      { error: 'Failed to create competency', details: error.message },
      { status: 500 }
    );
  }
}
