import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';
import { ScenarioCompetencyService } from '@/lib/scenarioCompetencies';
import {
  generateMappingMatches,
  getDefaultAlgorithmConfig,
  getDefaultConversionRules
} from '@/lib/autoMappingLogic';

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
    const { scenarioId, simulationId, metricIds } = body;

    if (!scenarioId || !simulationId || !Array.isArray(metricIds) || metricIds.length === 0) {
      return NextResponse.json(
        { error: 'scenarioId, simulationId, and metricIds are required' },
        { status: 400 }
      );
    }

    const result = {
      created: 0,
      skipped: 0,
      errors: [] as string[],
      mappings: [] as any[]
    };

    const targetedCompetencies = await ScenarioCompetencyService.getTargetedCompetencies(scenarioId);
    if (targetedCompetencies.length === 0) {
      result.errors.push('No targeted competencies defined for this scenario');
      return NextResponse.json(result);
    }

    const metrics = await sql`
      SELECT id, name, metric_type
      FROM assessment_metrics
      WHERE id IN ${sql(metricIds)}
    `;

    if (metrics.length === 0) {
      result.errors.push('No valid metrics found');
      return NextResponse.json(result);
    }

    const existingMappings = await sql`
      SELECT metric_id, competency_id
      FROM simulation_metric_competency_mappings
      WHERE simulation_id = ${simulationId}
        AND is_active = true
    `;

    const existingKeys = new Set(
      (existingMappings as any[]).map(m => `${m.metric_id}_${m.competency_id}`)
    );

    const algorithms = await sql`
      SELECT id, code
      FROM calculation_algorithms
      WHERE is_active = true
    `;

    const algorithmCodeMap = new Map(
      (algorithms as any[]).map(alg => [alg.code, alg.id])
    );

    const matches = generateMappingMatches(metrics as any[], targetedCompetencies as any[]);

    for (const match of matches) {
      const key = `${match.metric_id}_${match.competency_id}`;
      if (existingKeys.has(key)) {
        result.skipped += 1;
        continue;
      }

      try {
        const algorithmId = algorithmCodeMap.get(match.calculation_method) || null;
        const algorithmConfig = getDefaultAlgorithmConfig(match.calculation_method);
        const scoreConversionRules = getDefaultConversionRules(match.calculation_method);

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
            configuration_notes,
            configured_by,
            is_active,
            created_at,
            updated_at
          ) VALUES (
            ${simulationId},
            ${match.metric_id},
            ${match.competency_id},
            ${algorithmId},
            ${match.calculation_method},
            ${match.mapping_weight},
            ${JSON.stringify(algorithmConfig)},
            ${JSON.stringify(scoreConversionRules)},
            'weighted_average',
            false,
            ${`Auto-generated: ${match.rationale} (Confidence: ${match.confidence})`},
            ${session.user.id},
            true,
            NOW(),
            NOW()
          )
          ON CONFLICT (simulation_id, metric_id, competency_id) DO NOTHING
          RETURNING *
        `;

        if (inserted.length > 0) {
          result.created += 1;
          result.mappings.push(inserted[0]);
        } else {
          result.skipped += 1;
        }
      } catch (error) {
        result.errors.push(
          `Failed to create mapping for ${match.metric_name} -> ${match.competency_name}`
        );
      }
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error generating mappings:', error);
    return NextResponse.json(
      { error: 'Failed to generate mappings', details: error.message },
      { status: 500 }
    );
  }
}
