import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

console.log('='.repeat(80));
console.log('Testing Competency Calculation System');
console.log('='.repeat(80));

const testScores = {
  bravin_alignment: 8,
  trust_impact: 1,
  emotional_intelligence_index: 4,
  ethical_decision_quality: 4
};

console.log('\nTest Metric Scores (Raw):');
console.log('  BRAVIN Alignment: 8/10');
console.log('  Trust Impact: +1/2');
console.log('  EI Index: 4/5');
console.log('  Ethical Quality: 4/5');

console.log('\nNormalized Scores (0-1 scale):');
const normalizedScores = {
  bravin_alignment: testScores.bravin_alignment / 10,
  trust_impact: (testScores.trust_impact + 2) / 4,
  emotional_intelligence_index: testScores.emotional_intelligence_index / 5,
  ethical_decision_quality: testScores.ethical_decision_quality / 5
};

Object.entries(normalizedScores).forEach(([metric, score]) => {
  console.log(`  ${metric}: ${score.toFixed(4)}`);
});

async function testCalculations() {
  try {
    console.log('\n' + '-'.repeat(80));
    console.log('Fetching Target Competencies');
    console.log('-'.repeat(80));

    const { data: competencies, error: compError } = await supabase
      .from('competencies')
      .select('id, code, name')
      .in('code', ['TBR-03', 'AC-06', 'EI-02', 'EL-05', 'VBD-01']);

    if (compError) {
      console.error('Error fetching competencies:', compError);
      return;
    }

    console.log(`\nFound ${competencies.length} target competencies:`);
    competencies.forEach(comp => {
      console.log(`  - ${comp.code}: ${comp.name}`);
    });

    console.log('\n' + '-'.repeat(80));
    console.log('Fetching Global Weight Matrix');
    console.log('-'.repeat(80));

    const { data: weights, error: weightsError } = await supabase
      .from('competency_metric_weights_global')
      .select(`
        *,
        competency:competencies(code, name)
      `)
      .eq('is_active', true);

    if (weightsError) {
      console.error('Error fetching weights:', weightsError);
      return;
    }

    console.log(`\nFound ${weights.length} weight mappings`);

    const weightMatrix = {};
    weights.forEach(w => {
      const compCode = w.competency.code;
      if (!weightMatrix[compCode]) {
        weightMatrix[compCode] = {};
      }
      weightMatrix[compCode][w.metric_type] = w.weight;
    });

    console.log('\nWeight Matrix:');
    console.log('Competency'.padEnd(12) + ' | ' +
      'BRAVIN'.padEnd(8) + ' | ' +
      'Trust'.padEnd(8) + ' | ' +
      'EI Index'.padEnd(10) + ' | ' +
      'Ethical'.padEnd(8));
    console.log('-'.repeat(80));

    ['TBR-03', 'AC-06', 'EI-02', 'EL-05', 'VBD-01'].forEach(code => {
      const weights = weightMatrix[code] || {};
      console.log(
        code.padEnd(12) + ' | ' +
        (weights.bravin_alignment || 0).toFixed(3).padEnd(8) + ' | ' +
        (weights.trust_impact || 0).toFixed(3).padEnd(8) + ' | ' +
        (weights.emotional_intelligence_index || 0).toFixed(3).padEnd(10) + ' | ' +
        (weights.ethical_decision_quality || 0).toFixed(3).padEnd(8)
      );
    });

    console.log('\n' + '-'.repeat(80));
    console.log('Calculating Competency Scores');
    console.log('-'.repeat(80));

    const results = {};

    for (const comp of competencies) {
      const weights = weightMatrix[comp.code] || {};
      let score = 0;

      score += (normalizedScores.bravin_alignment || 0) * (weights.bravin_alignment || 0);
      score += (normalizedScores.trust_impact || 0) * (weights.trust_impact || 0);
      score += (normalizedScores.emotional_intelligence_index || 0) * (weights.emotional_intelligence_index || 0);
      score += (normalizedScores.ethical_decision_quality || 0) * (weights.ethical_decision_quality || 0);

      let level = 'Awareness';
      if (score >= 0.80) level = 'Advanced';
      else if (score >= 0.60) level = 'Proficient';
      else if (score >= 0.30) level = 'Developing';

      results[comp.code] = { score, level, name: comp.name };
    }

    console.log('\nCalculated Competency Scores:');
    console.log('');
    Object.entries(results).forEach(([code, data]) => {
      console.log(`${code} - ${data.name}`);
      console.log(`  Score: ${data.score.toFixed(4)}`);
      console.log(`  Level: ${data.level}`);
      console.log('');
    });

    console.log('\n' + '-'.repeat(80));
    console.log('Expected vs Actual Comparison');
    console.log('-'.repeat(80));

    const expected = {
      'TBR-03': 0.775,
      'AC-06': 0.785,
      'EI-02': 0.785,
      'EL-05': 0.795,
      'VBD-01': 0.795
    };

    console.log('\nCompetency | Expected | Actual   | Diff     | Match');
    console.log('-'.repeat(60));

    let allMatch = true;
    Object.entries(expected).forEach(([code, expectedScore]) => {
      const actualScore = results[code].score;
      const diff = Math.abs(expectedScore - actualScore);
      const match = diff < 0.001 ? '✓' : '✗';
      if (diff >= 0.001) allMatch = false;

      console.log(
        `${code.padEnd(10)} | ${expectedScore.toFixed(4)} | ${actualScore.toFixed(4)} | ${diff.toFixed(4).padStart(8)} | ${match}`
      );
    });

    console.log('\n' + '='.repeat(80));
    if (allMatch) {
      console.log('✓ ALL CALCULATIONS MATCH EXPECTED VALUES');
    } else {
      console.log('✗ SOME CALCULATIONS DO NOT MATCH');
    }
    console.log('='.repeat(80));

  } catch (error) {
    console.error('\nTest failed with error:', error);
  }
}

testCalculations();
