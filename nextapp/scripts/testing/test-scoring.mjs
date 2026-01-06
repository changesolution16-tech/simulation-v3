const COMPETENCY_WEIGHTS = {
  'TBR-03': { bravin: 0.3, trust: 0.5, ei: 0.2, ethical: 0.0 },
  'AC-06': { bravin: 0.2, trust: 0.3, ei: 0.5, ethical: 0.0 },
  'EI-02': { bravin: 0.2, trust: 0.3, ei: 0.5, ethical: 0.0 },
  'EL-05': { bravin: 0.3, trust: 0.1, ei: 0.1, ethical: 0.5 },
  'VBD-01': { bravin: 0.4, trust: 0.1, ei: 0.1, ethical: 0.4 }
};

function calculateCompetencyScore(compCode, metrics) {
  const weights = COMPETENCY_WEIGHTS[compCode];
  return (metrics.bravin * weights.bravin) +
         (metrics.trust * weights.trust) +
         (metrics.ei * weights.ei) +
         (metrics.ethical * weights.ethical);
}

function getProficiencyLevel(score) {
  if (score >= 0 && score <= 29) return 'Awareness';
  if (score >= 30 && score <= 59) return 'Developing';
  if (score >= 60 && score <= 79) return 'Proficient';
  if (score >= 80 && score <= 100) return 'Advanced';
  return 'Unknown';
}

console.log('='.repeat(80));
console.log('ALIGNMENT MEETING SCORING VERIFICATION');
console.log('='.repeat(80));

const testCases = [
  {
    name: 'R1: Push for consensus quickly',
    metrics: { bravin: 30, trust: 25, ei: 20, ethical: 40 },
    expected: {
      'TBR-03': 30.5,
      'AC-06': 27.5,
      'EI-02': 27.5,
      'EL-05': 35.5,
      'VBD-01': 35.5
    }
  },
  {
    name: 'R2: Ask teams to present separately',
    metrics: { bravin: 50, trust: 50, ei: 40, ethical: 60 },
    expected: {
      'TBR-03': 49.0,
      'AC-06': 49.0,
      'EI-02': 49.0,
      'EL-05': 59.0,
      'VBD-01': 59.0
    }
  },
  {
    name: 'R3: Pause and name emotional tone',
    metrics: { bravin: 80, trust: 75, ei: 80, ethical: 80 },
    expected: {
      'TBR-03': 77.5,
      'AC-06': 78.5,
      'EI-02': 78.5,
      'EL-05': 79.5,
      'VBD-01': 79.5
    }
  },
  {
    name: 'R4: Invite shared storytelling',
    metrics: { bravin: 100, trust: 100, ei: 100, ethical: 100 },
    expected: {
      'TBR-03': 100.0,
      'AC-06': 100.0,
      'EI-02': 100.0,
      'EL-05': 100.0,
      'VBD-01': 100.0
    }
  }
];

let allPassed = true;

testCases.forEach(test => {
  console.log(`\n${test.name}`);
  console.log('-'.repeat(80));
  console.log(`Metrics: BRAVIN=${test.metrics.bravin}, Trust=${test.metrics.trust}, EI=${test.metrics.ei}, Ethical=${test.metrics.ethical}\n`);

  Object.keys(test.expected).forEach(comp => {
    const calculated = calculateCompetencyScore(comp, test.metrics);
    const expected = test.expected[comp];
    const proficiency = getProficiencyLevel(calculated);
    const passed = Math.abs(calculated - expected) < 0.1;
    allPassed = allPassed && passed;

    const weights = COMPETENCY_WEIGHTS[comp];
    const detail = `${test.metrics.bravin}×${weights.bravin} + ${test.metrics.trust}×${weights.trust} + ${test.metrics.ei}×${weights.ei} + ${test.metrics.ethical}×${weights.ethical}`;

    console.log(`  ${comp}: ${calculated.toFixed(1)}% (Expected: ${expected}%) → ${proficiency}`);
    console.log(`    Calculation: ${detail} = ${calculated.toFixed(1)}`);
    console.log(`    ${passed ? '✓ PASS' : '✗ FAIL'}`);
  });
});

console.log('\n' + '='.repeat(80));
console.log(allPassed ? '✓ ALL TESTS PASSED - Calculations match the logic table!' : '✗ SOME TESTS FAILED');
console.log('='.repeat(80));
