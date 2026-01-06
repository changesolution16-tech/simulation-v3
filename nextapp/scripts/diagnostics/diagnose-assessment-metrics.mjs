import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function diagnoseAssessmentMetrics() {
  console.log('=== ASSESSMENT METRICS DIAGNOSTIC ===\n');

  // Get the most recent simulation instance
  const { data: instances, error: instanceError } = await supabase
    .from('simulation_instances')
    .select('id, simulation_id, learner_id, status, created_at, max_level, levels_completed, decision_count')
    .order('created_at', { ascending: false })
    .limit(3);

  if (instanceError) {
    console.error('Error fetching instances:', instanceError);
    return;
  }

  if (!instances || instances.length === 0) {
    console.log('No simulation instances found.');
    return;
  }

  console.log('Recent Simulation Instances:\n');
  for (let i = 0; i < instances.length; i++) {
    const inst = instances[i];
    console.log(`${i + 1}. Instance ID: ${inst.id.substring(0, 8)}...`);
    console.log(`   Status: ${inst.status}`);
    console.log(`   Levels: ${inst.levels_completed + 1}/${inst.max_level + 1}`);
    console.log(`   Decisions Made: ${inst.decision_count}`);
    console.log(`   Created: ${new Date(inst.created_at).toLocaleString()}\n`);
  }

  // Analyze the most recent instance in detail
  const targetInstance = instances[0];
  console.log(`\n=== DETAILED ANALYSIS: Instance ${targetInstance.id.substring(0, 8)}... ===\n`);

  // Get all assessments for this instance
  const { data: assessments, error: assessError } = await supabase
    .from('learner_metric_assessments')
    .select('id, metric_id, scenario_id, option_id, score_achieved, created_at, assessment_notes')
    .eq('simulation_instance_id', targetInstance.id);

  if (assessError) {
    console.error('Error fetching assessments:', assessError);
    return;
  }

  console.log(`Total Assessments Recorded: ${assessments.length}`);
  console.log(`Decisions Made: ${targetInstance.decision_count}`);
  console.log(`Assessments per Decision (Average): ${(assessments.length / targetInstance.decision_count).toFixed(1)}\n`);

  // Group by scenario-option combination
  const decisionGroups = {};
  assessments.forEach(a => {
    const key = `${a.scenario_id}-${a.option_id}`;
    if (!decisionGroups[key]) {
      decisionGroups[key] = {
        scenarioId: a.scenario_id,
        optionId: a.option_id,
        assessments: []
      };
    }
    decisionGroups[key].assessments.push(a);
  });

  console.log('=== BREAKDOWN BY DECISION ===\n');

  let decisionNum = 1;
  for (const [key, group] of Object.entries(decisionGroups)) {
    console.log(`Decision ${decisionNum}:`);
    console.log(`  Scenario ID: ${group.scenarioId.substring(0, 8)}...`);
    console.log(`  Option ID: ${group.optionId.substring(0, 8)}...`);
    console.log(`  Assessments Recorded: ${group.assessments.length}`);

    // Count by metric type
    const metricIds = new Set(group.assessments.map(a => a.metric_id));
    console.log(`  Unique Metrics: ${metricIds.size}`);

    // Identify BRAVIN metrics
    const bravinMetrics = group.assessments.filter(a =>
      a.assessment_notes && a.assessment_notes.includes('BRAVIN')
    );
    const standardMetrics = group.assessments.filter(a =>
      !a.assessment_notes || !a.assessment_notes.includes('BRAVIN')
    );

    console.log(`  - BRAVIN Metrics: ${bravinMetrics.length}`);
    console.log(`  - Standard Metrics: ${standardMetrics.length}`);

    // Check for duplicates
    const metricCounts = {};
    group.assessments.forEach(a => {
      metricCounts[a.metric_id] = (metricCounts[a.metric_id] || 0) + 1;
    });

    const duplicates = Object.entries(metricCounts).filter(([id, count]) => count > 1);
    if (duplicates.length > 0) {
      console.log(`  ⚠️  WARNING: ${duplicates.length} metrics recorded multiple times!`);
      duplicates.forEach(([metricId, count]) => {
        console.log(`     - Metric ${metricId.substring(0, 8)}: ${count} times`);
      });
    }

    console.log('');
    decisionNum++;
  }

  // Get metric details
  console.log('\n=== METRIC CONFIGURATION ===\n');

  const uniqueMetrics = new Set(assessments.map(a => a.metric_id));
  const { data: metricDetails, error: metricError } = await supabase
    .from('assessment_metrics')
    .select('id, name, metric_type, max_score')
    .in('id', Array.from(uniqueMetrics));

  if (!metricError && metricDetails) {
    const bravinMetrics = metricDetails.filter(m =>
      ['bravin_alignment', 'trust_impact', 'ethical_decision_quality',
       'emotional_intelligence_index', 'cultural_stewardship'].includes(m.metric_type)
    );
    const standardMetrics = metricDetails.filter(m =>
      !['bravin_alignment', 'trust_impact', 'ethical_decision_quality',
        'emotional_intelligence_index', 'cultural_stewardship'].includes(m.metric_type)
    );

    console.log(`Total Unique Metrics Used: ${metricDetails.length}`);
    console.log(`  - BRAVIN Metrics: ${bravinMetrics.length}`);
    console.log(`  - Standard Metrics: ${standardMetrics.length}\n`);

    if (standardMetrics.length > 0) {
      console.log('Standard Metrics Configured:');
      standardMetrics.forEach(m => {
        const count = assessments.filter(a => a.metric_id === m.id).length;
        console.log(`  - ${m.name} (${m.metric_type}): Used ${count} times`);
      });
    }
  }

  // Check scenario_option_metrics configuration
  console.log('\n=== SCENARIO OPTION METRICS CONFIGURATION ===\n');

  const uniqueScenarioOptionPairs = Array.from(new Set(
    assessments.map(a => JSON.stringify({ scenarioId: a.scenario_id, optionId: a.option_id }))
  )).map(s => JSON.parse(s));

  for (const pair of uniqueScenarioOptionPairs) {
    const { data: configuredMetrics, error: configError } = await supabase
      .from('scenario_option_metrics')
      .select('id, metric_id, score_value')
      .eq('scenario_id', pair.scenarioId)
      .eq('option_id', pair.optionId);

    if (!configError && configuredMetrics) {
      console.log(`Scenario ${pair.scenarioId.substring(0, 8)}... / Option ${pair.optionId.substring(0, 8)}...`);
      console.log(`  Configured Standard Metrics: ${configuredMetrics.length}`);
      console.log(`  + BRAVIN Metrics: 5`);
      console.log(`  = Expected Total: ${configuredMetrics.length + 5}`);

      const actualCount = assessments.filter(a =>
        a.scenario_id === pair.scenarioId && a.option_id === pair.optionId
      ).length;
      console.log(`  Actual Assessments Recorded: ${actualCount}`);

      if (actualCount !== configuredMetrics.length + 5) {
        console.log(`  ⚠️  MISMATCH: Expected ${configuredMetrics.length + 5} but got ${actualCount}`);
      }
      console.log('');
    }
  }

  // Summary
  console.log('\n=== SUMMARY ===\n');
  console.log(`Total Assessments: ${assessments.length}`);
  console.log(`Total Decisions: ${targetInstance.decision_count}`);
  console.log(`Average Metrics per Decision: ${(assessments.length / targetInstance.decision_count).toFixed(1)}`);

  const expectedMin = targetInstance.decision_count * 5; // Just BRAVIN
  const expectedTypical = targetInstance.decision_count * 13; // BRAVIN + 8 standard

  console.log(`\nExpected Range:`);
  console.log(`  Minimum (BRAVIN only): ${expectedMin}`);
  console.log(`  Typical (BRAVIN + 8 standard): ${expectedTypical}`);
  console.log(`  Your Actual: ${assessments.length}`);

  if (assessments.length > expectedTypical * 2) {
    console.log(`\n⚠️  WARNING: Assessment count is unusually high!`);
    console.log(`   This could indicate:`);
    console.log(`   1. Many metrics configured per option (intentional)`);
    console.log(`   2. Duplicate recordings (bug)`);
    console.log(`   3. Assessment logic being called multiple times`);
  }
}

diagnoseAssessmentMetrics().catch(console.error);
