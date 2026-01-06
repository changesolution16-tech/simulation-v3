import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

console.log('=== SIMULATION SCORE DIAGNOSIS ===\n');

async function diagnoseScoreIssues() {
  try {
    // 1. Check simulations
    console.log('1. CHECKING SIMULATIONS');
    console.log('========================');
    const { data: simulations, error: simError } = await supabase
      .from('simulations')
      .select('id, name, display_name, status')
      .order('created_at', { ascending: false })
      .limit(5);

    if (simError) {
      console.error('Error fetching simulations:', simError);
      return;
    }

    console.log(`Found ${simulations.length} recent simulations`);
    simulations.forEach((sim, i) => {
      console.log(`  ${i + 1}. ${sim.display_name} (${sim.status})`);
      console.log(`     ID: ${sim.id}`);
    });

    if (simulations.length === 0) {
      console.log('❌ No simulations found. Create a simulation first.');
      return;
    }

    const testSimulation = simulations[0];
    console.log(`\n✓ Testing with simulation: "${testSimulation.display_name}"\n`);

    // 2. Check scenarios in simulation
    console.log('2. CHECKING SIMULATION SCENARIOS');
    console.log('=================================');
    const { data: simScenarios, error: scenError } = await supabase
      .from('simulation_scenarios')
      .select(`
        id,
        scenario_id,
        is_entry_point,
        scenarios (
          id,
          title,
          description
        )
      `)
      .eq('simulation_id', testSimulation.id);

    if (scenError) {
      console.error('Error fetching scenarios:', scenError);
      return;
    }

    console.log(`Found ${simScenarios?.length || 0} scenarios in simulation`);
    if (!simScenarios || simScenarios.length === 0) {
      console.log('❌ No scenarios found in simulation. Add scenarios to the simulation.');
      return;
    }

    simScenarios.forEach((ss, i) => {
      console.log(`  ${i + 1}. ${ss.scenarios.title}`);
      console.log(`     Scenario ID: ${ss.scenario_id}`);
      console.log(`     Entry Point: ${ss.is_entry_point ? 'YES' : 'No'}`);
    });

    // 3. Check scenario options and their metric scores
    console.log('\n3. CHECKING SCENARIO OPTIONS AND METRIC SCORES');
    console.log('===============================================');

    for (const simScenario of simScenarios.slice(0, 3)) { // Check first 3 scenarios
      const scenarioId = simScenario.scenario_id;
      console.log(`\nScenario: ${simScenario.scenarios.title}`);

      // Get options
      const { data: options, error: optError } = await supabase
        .from('scenario_options')
        .select('id, option_text, option_order')
        .eq('scenario_id', scenarioId)
        .order('option_order');

      if (optError) {
        console.error('  Error fetching options:', optError);
        continue;
      }

      console.log(`  Options: ${options?.length || 0}`);

      if (!options || options.length === 0) {
        console.log('  ❌ No options found for this scenario');
        continue;
      }

      // Check metric scores for each option
      for (const option of options) {
        const { data: metricScores, error: metricError } = await supabase
          .from('scenario_option_metrics')
          .select(`
            id,
            metric_id,
            score_value,
            metric:assessment_metrics(metric_type, name)
          `)
          .eq('scenario_id', scenarioId)
          .eq('option_id', option.id);

        if (metricError) {
          console.error(`    Error fetching metrics for option ${option.id}:`, metricError);
          continue;
        }

        const metricsCount = metricScores?.length || 0;
        console.log(`    Option ${option.option_order}: "${option.option_text.substring(0, 50)}..."`);
        console.log(`      Metric scores configured: ${metricsCount}`);

        if (metricsCount === 0) {
          console.log('      ⚠️  WARNING: No metric scores configured!');
        } else {
          metricScores.forEach(ms => {
            console.log(`        - ${ms.metric.name}: ${ms.score_value}`);
          });
        }
      }
    }

    // 4. Check BRAVIN mappings
    console.log('\n4. CHECKING BRAVIN MAPPINGS');
    console.log('============================');

    for (const simScenario of simScenarios.slice(0, 3)) {
      const scenarioId = simScenario.scenario_id;
      console.log(`\nScenario: ${simScenario.scenarios.title}`);

      const { data: options } = await supabase
        .from('scenario_options')
        .select('id, option_text')
        .eq('scenario_id', scenarioId)
        .limit(2);

      if (!options || options.length === 0) continue;

      for (const option of options) {
        const { data: bravinMapping, error: bravinError } = await supabase
          .from('bravin_scenario_option_mappings')
          .select('*')
          .eq('scenario_id', scenarioId)
          .eq('option_id', option.id)
          .maybeSingle();

        if (bravinError) {
          console.error(`  Error checking BRAVIN mapping:`, bravinError);
          continue;
        }

        console.log(`  Option: "${option.option_text.substring(0, 40)}..."`);
        if (!bravinMapping) {
          console.log('    ⚠️  WARNING: No BRAVIN mapping configured!');
        } else {
          console.log('    ✓ BRAVIN mapping exists');
          console.log(`      Boldness: ${bravinMapping.boldness_impact || 0}`);
          console.log(`      Responsibility: ${bravinMapping.responsibility_impact || 0}`);
          console.log(`      Accountability: ${bravinMapping.accountability_impact || 0}`);
        }
      }
    }

    // 5. Check assessment metrics table
    console.log('\n5. CHECKING ASSESSMENT METRICS');
    console.log('===============================');
    const { data: metrics, error: metricsError } = await supabase
      .from('assessment_metrics')
      .select('id, metric_type, name, is_active')
      .eq('is_active', true);

    if (metricsError) {
      console.error('Error fetching metrics:', metricsError);
    } else {
      console.log(`Active metrics: ${metrics?.length || 0}`);
      metrics?.forEach(m => {
        console.log(`  - ${m.name} (${m.metric_type})`);
      });
    }

    // 6. Check recent simulation instances and their scores
    console.log('\n6. CHECKING RECENT SIMULATION INSTANCES');
    console.log('========================================');
    const { data: instances, error: instError } = await supabase
      .from('simulation_instances')
      .select('id, learner_id, simulation_id, status, started_at, completed_at')
      .eq('simulation_id', testSimulation.id)
      .order('started_at', { ascending: false })
      .limit(5);

    if (instError) {
      console.error('Error fetching instances:', instError);
    } else {
      console.log(`Found ${instances?.length || 0} instances`);

      if (instances && instances.length > 0) {
        const recentInstance = instances[0];
        console.log(`\nMost recent instance: ${recentInstance.id}`);
        console.log(`  Status: ${recentInstance.status}`);
        console.log(`  Learner: ${recentInstance.learner_id}`);

        // Check learner attempts for this instance
        const { data: attempts, error: attemptError } = await supabase
          .from('learner_attempts')
          .select('id, scenario_id, option_id, decision_timestamp')
          .eq('instance_id', recentInstance.id);

        if (attemptError) {
          console.error('  Error fetching attempts:', attemptError);
        } else {
          console.log(`  Learner attempts: ${attempts?.length || 0}`);
        }

        // Check competency assessments
        const { data: compAssessments, error: compError } = await supabase
          .from('learner_competency_assessments')
          .select('id, competency_id, competency_score, proficiency_level')
          .eq('simulation_instance_id', recentInstance.id);

        if (compError) {
          console.error('  Error fetching competency assessments:', compError);
        } else {
          console.log(`  Competency assessments: ${compAssessments?.length || 0}`);
          if (compAssessments && compAssessments.length > 0) {
            compAssessments.forEach(ca => {
              console.log(`    - Competency ${ca.competency_id}: Score ${ca.competency_score}, Level ${ca.proficiency_level}`);
            });
          } else {
            console.log('    ⚠️  No competency assessments recorded!');
          }
        }

        // Check BRAVIN decision assessments
        const { data: bravinAssessments, error: bravinAssError } = await supabase
          .from('bravin_decision_assessments')
          .select('id, scenario_id, boldness_impact, responsibility_impact, trust_impact_score')
          .eq('simulation_instance_id', recentInstance.id);

        if (bravinAssError) {
          console.error('  Error fetching BRAVIN assessments:', bravinAssError);
        } else {
          console.log(`  BRAVIN decision assessments: ${bravinAssessments?.length || 0}`);
          if (bravinAssessments && bravinAssessments.length > 0) {
            bravinAssessments.forEach((ba, i) => {
              console.log(`    ${i + 1}. Boldness: ${ba.boldness_impact}, Responsibility: ${ba.responsibility_impact}`);
            });
          } else {
            console.log('    ⚠️  No BRAVIN assessments recorded!');
          }
        }
      } else {
        console.log('ℹ️  No instances found. Complete a simulation to generate data.');
      }
    }

    // 7. Summary and recommendations
    console.log('\n7. DIAGNOSIS SUMMARY');
    console.log('====================');

    const issues = [];

    // Check if any scenarios lack metric scores
    let hasMetricScores = false;
    for (const simScenario of simScenarios.slice(0, 3)) {
      const { data: options } = await supabase
        .from('scenario_options')
        .select('id')
        .eq('scenario_id', simScenario.scenario_id)
        .limit(1)
        .maybeSingle();

      if (options) {
        const { data: metricScores } = await supabase
          .from('scenario_option_metrics')
          .select('id')
          .eq('scenario_id', simScenario.scenario_id)
          .eq('option_id', options.id)
          .limit(1)
          .maybeSingle();

        if (metricScores) {
          hasMetricScores = true;
          break;
        }
      }
    }

    if (!hasMetricScores) {
      issues.push('❌ No metric scores configured for scenario options');
      console.log('Issue: Scenario options need metric scores configured.');
      console.log('  Fix: Use the Admin Dashboard > Scenario Manager to add metric scores to each option.');
    }

    // Check if BRAVIN mappings exist
    let hasBravinMappings = false;
    for (const simScenario of simScenarios.slice(0, 3)) {
      const { data: mappings } = await supabase
        .from('bravin_scenario_option_mappings')
        .select('id')
        .eq('scenario_id', simScenario.scenario_id)
        .limit(1)
        .maybeSingle();

      if (mappings) {
        hasBravinMappings = true;
        break;
      }
    }

    if (!hasBravinMappings) {
      issues.push('❌ No BRAVIN mappings configured for scenario options');
      console.log('Issue: Scenario options need BRAVIN mappings configured.');
      console.log('  Fix: Use the Admin Dashboard > Scenario Manager to configure BRAVIN impacts.');
    }

    if (!metrics || metrics.length === 0) {
      issues.push('❌ No assessment metrics defined in the system');
      console.log('Issue: Assessment metrics table is empty.');
      console.log('  Fix: Run the metrics seeding migration or use Admin Dashboard > Metrics Manager.');
    }

    if (issues.length === 0) {
      console.log('✓ All basic configuration checks passed!');
      console.log('  If scores are still showing as 0, check:');
      console.log('  - Browser console for JavaScript errors during simulation');
      console.log('  - Network tab for failed API calls to Supabase');
      console.log('  - Supabase logs for RPC function errors');
    } else {
      console.log(`\nFound ${issues.length} issue(s):`);
      issues.forEach((issue, i) => console.log(`  ${i + 1}. ${issue}`));
    }

    console.log('\n=== DIAGNOSIS COMPLETE ===\n');

  } catch (error) {
    console.error('Unexpected error during diagnosis:', error);
  }
}

diagnoseScoreIssues();
