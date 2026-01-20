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

    if (session.user.role !== 'admin' && session.user.role !== 'instructor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { template_id, simulation_id } = body;

    if (!template_id || !simulation_id) {
      return NextResponse.json(
        { error: 'template_id and simulation_id are required' },
        { status: 400 }
      );
    }

    const [template] = await sql`
      SELECT * FROM mapping_templates
      WHERE id = ${template_id} AND is_active = true
    `;

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const templateMappings = Array.isArray(template.mappings)
      ? template.mappings
      : JSON.parse(template.mappings || '[]');

    const metrics = await sql`
      SELECT id, metric_type
      FROM assessment_metrics
    `;

    const competencies = await sql`
      SELECT id, code
      FROM competencies
      WHERE is_active = true
    `;

    const algorithms = await sql`
      SELECT id, code
      FROM calculation_algorithms
      WHERE is_active = true
    `;

    const metricTypeMap = new Map(metrics.map((metric: any) => [metric.metric_type, metric.id]));
    const competencyCodeMap = new Map(competencies.map((comp: any) => [comp.code, comp.id]));
    const algorithmCodeMap = new Map(algorithms.map((alg: any) => [alg.code, alg.id]));

    let insertedCount = 0;

    for (const mapping of templateMappings) {
      const metricId = mapping.metric_id || metricTypeMap.get(mapping.metric_type);
      const competencyId = mapping.competency_id || competencyCodeMap.get(mapping.competency_code);

      if (!metricId || !competencyId) {
        continue;
      }

      const calculationMethod = mapping.calculation_method || 'linear';
      const algorithmId = mapping.algorithm_id || algorithmCodeMap.get(calculationMethod) || null;
      const algorithmConfig = mapping.algorithm_config || {};
      const scoreConversionRules = mapping.score_conversion_rules || {};
      const normalizationMethod = mapping.normalization_method || 'weighted_average';
      const mappingWeight = mapping.mapping_weight ?? 1;

      const inserted = await sql`
        INSERT INTO simulation_metric_competency_mappings (
          simulation_id,
          metric_id,
          competency_id,
          algorithm_id,
          calculation_method,
          mapping_weight,
          algorithm_config,
          score_conversion_rules,
          normalization_method,
          is_inherited,
          template_id,
          configured_by,
          is_active,
          created_at,
          updated_at
        ) VALUES (
          ${simulation_id},
          ${metricId},
          ${competencyId},
          ${algorithmId},
          ${calculationMethod},
          ${mappingWeight},
          ${JSON.stringify(algorithmConfig)},
          ${JSON.stringify(scoreConversionRules)},
          ${normalizationMethod},
          true,
          ${template_id},
          ${session.user.id},
          true,
          NOW(),
          NOW()
        )
        ON CONFLICT (simulation_id, metric_id, competency_id) DO NOTHING
        RETURNING id
      `;

      if (inserted.length > 0) {
        insertedCount += 1;
      }
    }

    if (insertedCount > 0) {
      await sql`
        UPDATE mapping_templates
        SET times_used = times_used + 1
        WHERE id = ${template_id}
      `;
    }

    return NextResponse.json({ success: true, inserted: insertedCount });
  } catch (error: any) {
    console.error('Error applying mapping template:', error);
    return NextResponse.json(
      { error: 'Failed to apply template', details: error.message },
      { status: 500 }
    );
  }
}
