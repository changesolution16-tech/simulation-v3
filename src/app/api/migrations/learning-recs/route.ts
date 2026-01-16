import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';
import { readFileSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

/**
 * POST /api/migrations/learning-recs
 * Run the learning recommendations migration (admin only)
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - admin access required' }, { status: 401 });
    }

    console.log('🔄 Starting learning recommendations migration...');

    // Read the migration file
    const migrationPath = join(process.cwd(), 'add-learning-recommendations-schema.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Execute the migration
    await sql.unsafe(migrationSQL);

    // Verify installation
    const columns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'scenario_options'
        AND column_name IN ('practice_exercises', 'next_steps')
      ORDER BY column_name
    `;

    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('learning_resources', 'option_learning_resources')
      ORDER BY table_name
    `;

    const [count] = await sql`
      SELECT COUNT(*) as count FROM learning_resources
    `;

    const resourcesByType = await sql`
      SELECT resource_type, COUNT(*) as count
      FROM learning_resources
      GROUP BY resource_type
      ORDER BY count DESC
    `;

    console.log('✅ Migration completed successfully!');

    return NextResponse.json({
      success: true,
      message: 'Learning Recommendations System installed successfully',
      details: {
        newColumns: columns.map(c => c.column_name),
        newTables: tables.map(t => t.table_name),
        sampleResourceCount: parseInt(count.count),
        resourcesByType: resourcesByType.map(r => ({
          type: r.resource_type,
          count: parseInt(r.count)
        }))
      }
    });
  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    return NextResponse.json(
      {
        error: 'Migration failed',
        message: error.message,
        details: error.toString()
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/migrations/learning-recs
 * Check if learning recommendations system is installed
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if tables exist
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('learning_resources', 'option_learning_resources')
    `;

    // Check if columns exist
    const columns = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'scenario_options'
        AND column_name IN ('practice_exercises', 'next_steps')
    `;

    const installed = tables.length === 2 && columns.length === 2;

    if (installed) {
      const [count] = await sql`
        SELECT COUNT(*) as count FROM learning_resources
      `;

      return NextResponse.json({
        installed: true,
        resourceCount: parseInt(count.count)
      });
    }

    return NextResponse.json({
      installed: false,
      message: 'Learning Recommendations System not installed'
    });
  } catch (error: any) {
    console.error('Error checking installation:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
