import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [metric] = await db`
      SELECT * FROM assessment_metrics
      WHERE id = ${params.id}
    `;

    if (!metric) {
      return NextResponse.json({ error: 'Metric not found' }, { status: 404 });
    }

    return NextResponse.json(metric);
  } catch (error) {
    console.error('Error fetching metric:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      metric_type,
      measurement_method,
      min_score,
      max_score,
      passing_threshold,
      is_global
    } = body;

    const [metric] = await db`
      UPDATE assessment_metrics
      SET
        name = COALESCE(${name}, name),
        description = COALESCE(${description || null}, description),
        metric_type = COALESCE(${metric_type}, metric_type),
        measurement_method = COALESCE(${measurement_method}, measurement_method),
        min_score = COALESCE(${min_score}, min_score),
        max_score = COALESCE(${max_score}, max_score),
        passing_threshold = COALESCE(${passing_threshold}, passing_threshold),
        is_global = COALESCE(${is_global}, is_global),
        updated_at = NOW()
      WHERE id = ${params.id}
      RETURNING *
    `;

    if (!metric) {
      return NextResponse.json({ error: 'Metric not found' }, { status: 404 });
    }

    return NextResponse.json(metric);
  } catch (error) {
    console.error('Error updating metric:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await db`DELETE FROM assessment_metrics WHERE id = ${params.id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting metric:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
