import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { sql } from '@vercel/postgres';
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

    const categories = await db`
      SELECT * FROM simulation_categories
      ORDER BY display_order ASC, name ASC
    `;

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
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
    const { name, description, icon, color, display_order, is_active } = body;

    if (!name || !color) {
      return NextResponse.json({ error: 'Name and color are required' }, { status: 400 });
    }

    const [category] = await db`
      INSERT INTO simulation_categories (
        name, description, icon, color, display_order, is_active
      )
      VALUES (
        ${name}, ${description || null}, ${icon || 'Folder'}, ${color}, ${display_order || 0}, ${is_active !== false}
      )
      RETURNING *
    `;

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
