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
    const { metricIds, existingCompetencyIds = [] } = body;

    if (!Array.isArray(metricIds) || metricIds.length === 0) {
      return NextResponse.json([]);
    }

    const metrics = await sql`
      SELECT id, name, metric_type
      FROM assessment_metrics
      WHERE id IN ${sql(metricIds)}
    `;

    if (metrics.length === 0) {
      return NextResponse.json([]);
    }

    const competencies = await sql`
      SELECT id, code, name, description
      FROM competencies
      WHERE competency_level = 2 AND is_active = true
    `;

    const suggestionMap = new Map<string, any>();

    for (const metric of metrics as any[]) {
      const rules = await sql`
        SELECT *
        FROM default_metric_competency_rules
        WHERE metric_type = ${metric.metric_type}
          AND is_active = true
        ORDER BY mapping_priority DESC
      `;

      for (const rule of rules as any[]) {
        const pattern = new RegExp(rule.competency_code_pattern.replace(/%/g, '.*'));
        const matchingCompetencies = (competencies as any[]).filter(comp => pattern.test(comp.code));

        for (const competency of matchingCompetencies) {
          if (existingCompetencyIds.includes(competency.id)) {
            continue;
          }

          const existing = suggestionMap.get(competency.id);
          const confidence = rule.confidence_level as 'high' | 'medium' | 'low';
          const isPrimary = confidence === 'high' && rule.mapping_priority >= 90;
          const developmentPriority = rule.mapping_priority >= 90
            ? 'primary'
            : rule.mapping_priority >= 70
              ? 'secondary'
              : 'supplementary';

          if (existing) {
            existing.matching_metrics.push(metric.name);
            if (confidence === 'high' && existing.confidence !== 'high') {
              existing.confidence = confidence;
            }
            existing.target_weight = Math.max(existing.target_weight, Number(rule.default_weight));
          } else {
            suggestionMap.set(competency.id, {
              competency_id: competency.id,
              competency_code: competency.code,
              competency_name: competency.name,
              competency_description: competency.description,
              confidence,
              rationale: rule.rationale,
              is_primary: isPrimary,
              development_priority: developmentPriority,
              target_weight: Number(rule.default_weight),
              matching_metrics: [metric.name]
            });
          }
        }
      }
    }

    const suggestions = Array.from(suggestionMap.values()).sort((a, b) => {
      const confidenceOrder = { high: 0, medium: 1, low: 2 } as const;
      if (confidenceOrder[a.confidence] !== confidenceOrder[b.confidence]) {
        return confidenceOrder[a.confidence] - confidenceOrder[b.confidence];
      }
      return b.matching_metrics.length - a.matching_metrics.length;
    });

    return NextResponse.json(suggestions);
  } catch (error: any) {
    console.error('Error suggesting competencies:', error);
    return NextResponse.json(
      { error: 'Failed to suggest competencies', details: error.message },
      { status: 500 }
    );
  }
}
