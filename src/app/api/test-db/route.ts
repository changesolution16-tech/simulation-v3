import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('=== DATABASE CONNECTION TEST ===');
    console.log('Attempting to connect...');

    const result = await sql`SELECT NOW() as current_time, version() as postgres_version`;

    console.log('✅ Database connection successful');
    console.log('Result:', result);

    return NextResponse.json({
      success: true,
      message: 'Database connected',
      data: result[0]
    });
  } catch (error) {
    console.error('❌ Database connection failed:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
