import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/learning-resources
 * Get all learning resources with optional filtering
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const resourceType = searchParams.get('type');
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let resources;

    if (resourceType || category || difficulty || search) {
      // Filtered query
      let conditions = [];
      let params: any = {};

      if (resourceType) {
        conditions.push('resource_type = @resourceType');
        params.resourceType = resourceType;
      }
      if (category) {
        conditions.push('category = @category');
        params.category = category;
      }
      if (difficulty) {
        conditions.push('difficulty_level = @difficulty');
        params.difficulty = difficulty;
      }
      if (search) {
        conditions.push('(title ILIKE @search OR description ILIKE @search)');
        params.search = `%${search}%`;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const query = `
        SELECT
          lr.*,
          COUNT(DISTINCT olr.option_id) as usage_count
        FROM learning_resources lr
        LEFT JOIN option_learning_resources olr ON olr.resource_id = lr.id
        ${whereClause}
        GROUP BY lr.id
        ORDER BY lr.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      resources = await sql.unsafe(query, Object.values(params));
    } else {
      // Get all resources
      resources = await sql`
        SELECT
          lr.*,
          COUNT(DISTINCT olr.option_id) as usage_count
        FROM learning_resources lr
        LEFT JOIN option_learning_resources olr ON olr.resource_id = lr.id
        GROUP BY lr.id
        ORDER BY lr.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    // Get total count
    const [countResult] = await sql`
      SELECT COUNT(*) as total FROM learning_resources
    `;

    return NextResponse.json({
      resources,
      total: parseInt(countResult.total),
      limit,
      offset
    });
  } catch (error: any) {
    console.error('Error fetching learning resources:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch learning resources' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/learning-resources
 * Create a new learning resource (admin/instructor only)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and instructors can create resources
    if (session.user.role !== 'admin' && session.user.role !== 'instructor') {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await req.json();

    const {
      title,
      resource_type,
      url = null,
      description = null,
      author = null,
      publisher = null,
      published_date = null,
      duration_minutes = null,
      difficulty_level = null,
      tags = [],
      category = null,
      metadata = {}
    } = body;

    // Validation
    if (!title || !resource_type) {
      return NextResponse.json(
        { error: 'Title and resource_type are required' },
        { status: 400 }
      );
    }

    const validTypes = ['book', 'article', 'course', 'video', 'podcast', 'tool', 'framework', 'assessment'];
    if (!validTypes.includes(resource_type)) {
      return NextResponse.json(
        { error: `Invalid resource_type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const [resource] = await sql`
      INSERT INTO learning_resources (
        title,
        resource_type,
        url,
        description,
        author,
        publisher,
        published_date,
        duration_minutes,
        difficulty_level,
        tags,
        category,
        metadata
      ) VALUES (
        ${title},
        ${resource_type},
        ${url},
        ${description},
        ${author},
        ${publisher},
        ${published_date},
        ${duration_minutes},
        ${difficulty_level},
        ${tags},
        ${category},
        ${JSON.stringify(metadata)}
      )
      RETURNING *
    `;

    return NextResponse.json(resource, { status: 201 });
  } catch (error: any) {
    console.error('Error creating learning resource:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create learning resource' },
      { status: 500 }
    );
  }
}
