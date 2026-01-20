import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const simulationId = searchParams.get('simulationId');

    if (!simulationId) {
      return NextResponse.json({ error: 'simulationId is required' }, { status: 400 });
    }

    const mappings = await sql`
      SELECT
        smcm.id,
        smcm.simulation_id,
        smcm.metric_id,
        smcm.competency_id,
        smcm.algorithm_id,
        smcm.calculation_method,
        smcm.mapping_weight,
        smcm.algorithm_config,
        smcm.score_conversion_rules,
        smcm.normalization_method,
        smcm.is_inherited,
        smcm.template_id,
        smcm.configuration_notes,
        smcm.is_active,
        smcm.created_at,
        smcm.updated_at,
        jsonb_build_object(
          'id', am.id,
          'name', am.name,
          'metric_type', am.metric_type
        ) as metric,
        jsonb_build_object(
          'id', c.id,
          'code', c.code,
          'name', c.name,
          'competency_level', c.competency_level
        ) as competency
      FROM simulation_metric_competency_mappings smcm
      JOIN assessment_metrics am ON am.id = smcm.metric_id
      JOIN competencies c ON c.id = smcm.competency_id
      WHERE smcm.simulation_id = ${simulationId}
        AND smcm.is_active = true
      ORDER BY smcm.created_at ASC
    `;

    return NextResponse.json(mappings);
  } catch (error: any) {
    console.error('Error fetching metric mappings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mappings', details: error.message },
      { status: 500 }
    );
  }
}

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
    const {
      simulation_id,
      metric_id,
      competency_id,
      calculation_method = 'weighted',
      mapping_weight = 1,
      normalization_method = 'weighted_average',
      algorithm_id,
      algorithm_config = {},
      score_conversion_rules = {},
      is_inherited = false,
      template_id,
      configuration_notes
    } = body;

    if (!simulation_id || !metric_id || !competency_id) {
      return NextResponse.json(
        { error: 'simulation_id, metric_id, and competency_id are required' },
        { status: 400 }
      );
    }

    const existing = await sql`
      SELECT id FROM simulation_metric_competency_mappings
      WHERE simulation_id = ${simulation_id}
        AND metric_id = ${metric_id}
        AND competency_id = ${competency_id}
    `;

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Mapping already exists' }, { status: 409 });
    }

    let resolvedAlgorithmId = algorithm_id;
    if (!resolvedAlgorithmId && calculation_method) {
      const [algorithm] = await sql`
        SELECT id FROM calculation_algorithms
        WHERE code = ${calculation_method} AND is_active = true
        LIMIT 1
      `;
      resolvedAlgorithmId = algorithm?.id;
    }

    const [mapping] = await sql`
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
        configuration_notes,
        is_active,
        created_at,
        updated_at
      ) VALUES (
        ${simulation_id},
        ${metric_id},
        ${competency_id},
        ${resolvedAlgorithmId || null},
        ${calculation_method},
        ${mapping_weight},
        ${JSON.stringify(algorithm_config)},
        ${JSON.stringify(score_conversion_rules)},
        ${normalization_method},
        ${is_inherited},
        ${template_id || null},
        ${session.user.id},
        ${configuration_notes || null},
        true,
        NOW(),
        NOW()
      )
      RETURNING *
    `;

    return NextResponse.json(mapping, { status: 201 });
  } catch (error: any) {
    console.error('Error creating metric mapping:', error);
    return NextResponse.json(
      { error: 'Failed to create mapping', details: error.message },
      { status: 500 }
    );
  }
}
