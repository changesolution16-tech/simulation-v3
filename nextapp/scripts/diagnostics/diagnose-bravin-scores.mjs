import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseBravinScores() {
  console.log('\n=== BRAVIN Score Diagnosis ===\n');

  // Get the learner (assuming there's a user with learner role)
  const { data: learners, error: learnerError } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .eq('role', 'learner')
    .limit(5);

  if (learnerError) {
    console.error('Error fetching learners:', learnerError);
    return;
  }

  console.log(`Found ${learners.length} learners\n`);

  for (const learner of learners) {
    console.log(`\n--- Learner: ${learner.full_name} (${learner.email}) ---`);

    // Check their assignments
    const { data: assignments, error: assignmentError } = await supabase
      .from('assignment_learners')
      .select(`
        id,
        status,
        attempt_count,
        best_score,
        latest_score,
        current_instance_id,
        assignment:training_assignments(
          title,
          simulation:simulations(display_name)
        )
      `)
      .eq('learner_id', learner.id);

    if (assignmentError) {
      console.error('Assignment error:', assignmentError);
      continue;
    }

    console.log(`\nAssignments: ${assignments.length}`);
    for (const assignment of assignments) {
      console.log(`\n  Assignment: ${assignment.assignment?.title || 'N/A'}`);
      console.log(`  Simulation: ${assignment.assignment?.simulation?.display_name || 'N/A'}`);
      console.log(`  Status: ${assignment.status}`);
      console.log(`  Attempts: ${assignment.attempt_count}`);
      console.log(`  Best Score: ${assignment.best_score}%`);
      console.log(`  Latest Score: ${assignment.latest_score}%`);
      console.log(`  Current Instance: ${assignment.current_instance_id || 'none'}`);
    }

    // Check their simulation instances
    const { data: instances, error: instanceError } = await supabase
      .from('simulation_instances')
      .select(`
        id,
        status,
        attempt_number,
        final_score,
        bravin_overall_score,
        metrics_average_score,
        decision_count,
        is_best_attempt,
        completed_at,
        simulation:simulations(display_name)
      `)
      .eq('learner_id', learner.id)
      .order('completed_at', { ascending: false });

    if (instanceError) {
      console.error('Instance error:', instanceError);
      continue;
    }

    console.log(`\n  Simulation Instances: ${instances.length}`);
    for (const instance of instances) {
      console.log(`\n    Instance: ${instance.id.substring(0, 8)}...`);
      console.log(`    Simulation: ${instance.simulation?.display_name || 'N/A'}`);
      console.log(`    Status: ${instance.status}`);
      console.log(`    Attempt #: ${instance.attempt_number}`);
      console.log(`    Final Score: ${instance.final_score}%`);
      console.log(`    BRAVIN Score: ${instance.bravin_overall_score}%`);
      console.log(`    Metrics Score: ${instance.metrics_average_score}%`);
      console.log(`    Decisions: ${instance.decision_count}`);
      console.log(`    Best Attempt: ${instance.is_best_attempt ? 'YES' : 'no'}`);
      console.log(`    Completed: ${instance.completed_at ? new Date(instance.completed_at).toLocaleString() : 'not completed'}`);

      // Check BRAVIN assessments for this instance
      const { data: bravinAssessments, error: bravinError } = await supabase
        .from('bravin_decision_assessments')
        .select('*')
        .eq('simulation_instance_id', instance.id);

      if (!bravinError && bravinAssessments) {
        console.log(`    BRAVIN Assessments: ${bravinAssessments.length}`);
        if (bravinAssessments.length > 0) {
          const avgImpacts = bravinAssessments.map(a => {
            const sum = (a.boldness_impact || 0) + (a.responsibility_impact || 0) + 
                       (a.accountability_impact || 0) + (a.vision_impact || 0) + 
                       (a.integrity_impact || 0) + (a.nurturance_impact || 0);
            return sum / 6;
          });
          const overallAvg = avgImpacts.reduce((a, b) => a + b, 0) / avgImpacts.length;
          console.log(`    Calculated BRAVIN Impact: ${overallAvg.toFixed(2)}`);
          console.log(`    Expected Score: ${(50 + overallAvg / 2).toFixed(2)}%`);
        }
      }

      // Check metric assessments for this instance
      const { data: metricAssessments, error: metricError } = await supabase
        .from('learner_metric_assessments')
        .select('score_achieved')
        .eq('simulation_instance_id', instance.id);

      if (!metricError && metricAssessments) {
        console.log(`    Metric Assessments: ${metricAssessments.length}`);
        if (metricAssessments.length > 0) {
          const avgMetrics = metricAssessments.reduce((sum, a) => sum + a.score_achieved, 0) / metricAssessments.length;
          console.log(`    Average Metric Score: ${avgMetrics.toFixed(2)}%`);
        }
      }
    }

    // Check BRAVIN learner scores
    const { data: bravinScores, error: bravinScoreError } = await supabase
      .from('bravin_learner_scores')
      .select(`
        *,
        dimension:bravin_dimensions(name, code)
      `)
      .eq('learner_id', learner.id);

    if (!bravinScoreError && bravinScores) {
      console.log(`\n  BRAVIN Learner Scores: ${bravinScores.length}`);
      for (const score of bravinScores) {
        console.log(`    ${score.dimension?.name}: ${score.current_score} (${score.total_assessments} assessments)`);
      }
    }
  }
}

diagnoseBravinScores().catch(console.error);
