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
    const learnerId = searchParams.get('learner_id') || session.user.id;

    if (
      learnerId !== session.user.id &&
      session.user.role !== 'admin' &&
      session.user.role !== 'instructor'
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await sql`
      SELECT * FROM get_learner_category_progress(${learnerId})
    `;

    return NextResponse.json(result || []);
  } catch (error: any) {
    console.error('Error fetching category progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category progress', details: error.message },
      { status: 500 }
    );
  }
}
