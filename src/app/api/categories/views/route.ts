import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { category_id, learner_id } = body;

    if (!category_id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const learnerId = learner_id || session.user.id;

    if (
      learnerId !== session.user.id &&
      session.user.role !== 'admin' &&
      session.user.role !== 'instructor'
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await sql`
      SELECT track_category_view(${category_id}, ${learnerId})
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error tracking category view:', error);
    return NextResponse.json(
      { error: 'Failed to track view', details: error.message },
      { status: 500 }
    );
  }
}
