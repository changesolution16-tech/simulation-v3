import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const serverTime = new Date().toISOString();

  console.log('=== API ROUTE CALLED ===');
  console.log('Server Time:', serverTime);
  console.log('Process ID:', process.pid);
  console.log('Node Version:', process.version);
  console.log('Environment:', process.env.NODE_ENV);

  return NextResponse.json({
    message: 'API route is working',
    serverTime,
    pid: process.pid,
    nodeVersion: process.version,
    env: process.env.NODE_ENV,
    isServerSide: true
  });
}
