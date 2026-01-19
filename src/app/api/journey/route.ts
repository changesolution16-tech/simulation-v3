import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

const emptyJourneyResponse = {
  journey: [],
  totalTime: 0,
  skillGains: {}
};

const parseJsonField = (value: any) => {
  if (!value) return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
};

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const instanceId = searchParams.get('instanceId');

    let targetInstanceId = instanceId;
    if (!targetInstanceId) {
      const [latestInstance] = await sql`
        SELECT id
        FROM simulation_instances
        WHERE learner_id = ${session.user.id}
        ORDER BY started_at DESC
        LIMIT 1
      `;

      targetInstanceId = latestInstance?.id || null;
    }

    if (!targetInstanceId) {
      return NextResponse.json(emptyJourneyResponse);
    }

    const journeyRows = await sql`
      SELECT
        lj.id,
        lj.scenario_id,
        COALESCE(s.title, 'Unknown Scenario') as scenario_title,
        lj.option_id,
        COALESCE(so.option_text, 'Unknown Option') as option_text,
        lj.sequence_number,
        lj.skill_impacts,
        lj.cumulative_skills,
        lj.decision_time_seconds,
        lj.created_at as timestamp
      FROM learner_journeys lj
      LEFT JOIN scenarios s ON s.id = lj.scenario_id
      LEFT JOIN scenario_options so ON so.id = lj.option_id
      WHERE lj.simulation_instance_id = ${targetInstanceId}
      ORDER BY lj.sequence_number ASC
    `;

    const journey = journeyRows.map((row: any) => ({
      ...row,
      skill_impacts: parseJsonField(row.skill_impacts) || {},
      cumulative_skills: parseJsonField(row.cumulative_skills) || {}
    }));

    const totalTime = journey.reduce(
      (sum: number, step: any) => sum + (step.decision_time_seconds || 0),
      0
    );

    const lastStep = journey[journey.length - 1];
    const skillGains = lastStep?.cumulative_skills || {};

    return NextResponse.json({
      journey,
      totalTime,
      skillGains
    });
  } catch (error: any) {
    if (error?.code === '42P01') {
      return NextResponse.json(emptyJourneyResponse);
    }

    console.error('Error fetching learner journey:', error);
    return NextResponse.json(
      { error: 'Failed to fetch learner journey', details: error.message },
      { status: 500 }
    );
  }
}
