import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const defaultBranding = {
    company_name: 'Soft Skills Simulation',
    primary_color: '#3B82F6',
    secondary_color: '#2563EB',
    login_title: 'Welcome',
    login_subtitle: 'Sign in to continue',
    logo_url: null,
  };

  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout')), 15000)
    );

    const queryPromise = sql`
      SELECT
        id,
        logo_url,
        primary_color,
        secondary_color,
        company_name,
        login_title,
        login_subtitle,
        updated_at,
        updated_by
      FROM branding_settings
      ORDER BY updated_at DESC
      LIMIT 1
    `;

    const result = await Promise.race([queryPromise, timeoutPromise]) as any[];

    if (result.length === 0) {
      return NextResponse.json(defaultBranding);
    }

    return NextResponse.json(result[0]);
  } catch (error: any) {
    console.error('Error fetching branding:', {
      message: error?.message,
      code: error?.code,
      errno: error?.errno,
      address: error?.address,
      port: error?.port,
    });

    return NextResponse.json(defaultBranding);
  }
}
