import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import postgres from 'postgres';

const connectionString = process.env.POSTGRES_URL || '';
const db = postgres(connectionString, {
  ssl: process.env.NODE_ENV === 'production' ? 'require' : undefined,
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const metrics = await db`
      SELECT * FROM assessment_metrics
      ORDER BY name ASC
    `;

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || session.user.role !== 'admin') {
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

    if (!name || !metric_type) {
      return NextResponse.json({ error: 'Name and metric type are required' }, { status: 400 });
    }

    const [metric] = await db`
      INSERT INTO assessment_metrics (
        name, description, metric_type, measurement_method,
        min_score, max_score, passing_threshold, is_global
      )
      VALUES (
        ${name}, ${description || null}, ${metric_type}, ${measurement_method || 'automatic'},
        ${min_score ?? 0}, ${max_score ?? 100}, ${passing_threshold ?? 70}, ${is_global !== false}
      )
      RETURNING *
    `;

    return NextResponse.json(metric, { status: 201 });
  } catch (error) {
    console.error('Error creating metric:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
