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

    const result = await sql`
      SELECT toggle_category_favorite(${category_id}, ${learnerId}) as is_favorite
    `;

    return NextResponse.json({ is_favorite: result[0]?.is_favorite ?? false });
  } catch (error: any) {
    console.error('Error toggling category favorite:', error);
    return NextResponse.json(
      { error: 'Failed to toggle favorite', details: error.message },
      { status: 500 }
    );
  }
}
