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

    const { searchParams } = new URL(req.url);
    const publicOnly = searchParams.get('publicOnly');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const templates = await sql`
      SELECT *
      FROM mapping_templates
      WHERE 1=1
        ${includeInactive ? sql`` : sql`AND is_active = true`}
        ${publicOnly === 'false' ? sql`` : sql`AND is_public = true`}
      ORDER BY times_used DESC
    `;

    return NextResponse.json(templates);
  } catch (error: any) {
    console.error('Error fetching mapping templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates', details: error.message },
      { status: 500 }
    );
  }
}
