import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const result = await sql`
      SELECT
        id,
        organization_name,
        logo_url,
        primary_color,
        secondary_color,
        accent_color,
        login_title,
        login_subtitle,
        app_title,
        footer_text,
        custom_css,
        created_at,
        updated_at
      FROM branding_settings
      WHERE is_active = true
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (result.length === 0) {
      return NextResponse.json({
        organization_name: 'Soft Skills Simulation',
        primary_color: '#3B82F6',
        secondary_color: '#2563EB',
        accent_color: '#60A5FA',
        login_title: 'Welcome',
        login_subtitle: 'Sign in to continue',
        app_title: 'Soft Skills Training',
        footer_text: '',
      });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error fetching branding:', error);
    return NextResponse.json(
      {
        organization_name: 'Soft Skills Simulation',
        primary_color: '#3B82F6',
        secondary_color: '#2563EB',
        accent_color: '#60A5FA',
        login_title: 'Welcome',
        login_subtitle: 'Sign in to continue',
        app_title: 'Soft Skills Training',
        footer_text: '',
      }
    );
  }
}
