import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const algorithms = await sql`
      SELECT
        id,
        code,
        name,
        description,
        formula_template,
        required_parameters,
        example_config,
        best_for,
        industry_standard_reference,
        is_active,
        display_order,
        created_at,
        updated_at
      FROM calculation_algorithms
      WHERE is_active = true
      ORDER BY display_order ASC
    `;

    return NextResponse.json(algorithms);
  } catch (error: any) {
    console.error('Error fetching calculation algorithms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch algorithms', details: error.message },
      { status: 500 }
    );
  }
}
