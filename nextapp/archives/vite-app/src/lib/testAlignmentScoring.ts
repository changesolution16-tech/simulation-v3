import { AlignmentMeetingScoringService, COMPETENCY_WEIGHTS } from './alignmentMeetingScoring';

export function testScoringCalculations() {
  console.log('='.repeat(80));
  console.log('ALIGNMENT MEETING SCORING TEST');
  console.log('='.repeat(80));

  const testCases = [
    {
      option: 'R1',
      description: 'Push for consensus quickly',
      metrics: { bravin: 30, trust: 25, ei: 20, ethical: 40 },
      expectedCompetencies: {
        'TBR-03': 30.5,
        'AC-06': 27.5,
        'EI-02': 27.5,
        'EL-05': 35.5,
        'VBD-01': 35.5
      }
    },
    {
      option: 'R2',
      description: 'Ask teams to present separately',
      metrics: { bravin: 50, trust: 50, ei: 40, ethical: 60 },
      expectedCompetencies: {
        'TBR-03': 49.0,
        'AC-06': 49.0,
        'EI-02': 49.0,
        'EL-05': 59.0,
        'VBD-01': 59.0
      }
    },
    {
      option: 'R3',
      description: 'Pause and name emotional tone',
      metrics: { bravin: 80, trust: 75, ei: 80, ethical: 80 },
      expectedCompetencies: {
        'TBR-03': 77.5,
        'AC-06': 78.5,
        'EI-02': 78.5,
        'EL-05': 79.5,
        'VBD-01': 79.5
      }
    },
    {
      option: 'R4',
      description: 'Invite shared storytelling',
      metrics: { bravin: 100, trust: 100, ei: 100, ethical: 100 },
      expectedCompetencies: {
        'TBR-03': 100.0,
        'AC-06': 100.0,
        'EI-02': 100.0,
        'EL-05': 100.0,
        'VBD-01': 100.0
      }
    }
  ];

  let allTestsPassed = true;

  testCases.forEach(testCase => {
    console.log(`\n${testCase.option}: ${testCase.description}`);
    console.log('-'.repeat(80));
    console.log(`Metric Scores: BRAVIN=${testCase.metrics.bravin}, Trust=${testCase.metrics.trust}, ` +
                `EI=${testCase.metrics.ei}, Ethical=${testCase.metrics.ethical}`);
    console.log('');

    Object.keys(testCase.expectedCompetencies).forEach(compCode => {
      const calculated = AlignmentMeetingScoringService.calculateCompetencyScore(compCode, testCase.metrics);
      const expected = testCase.expectedCompetencies[compCode as keyof typeof testCase.expectedCompetencies];
      const passed = Math.abs(calculated - expected) < 0.1;
      allTestsPassed = allTestsPassed && passed;

      const proficiency = AlignmentMeetingScoringService.getProficiencyLevel(calculated);
      const weights = COMPETENCY_WEIGHTS[compCode as keyof typeof COMPETENCY_WEIGHTS];
      const formula = `${testCase.metrics.bravin}×${weights.bravin} + ${testCase.metrics.trust}×${weights.trust} + ` +
                     `${testCase.metrics.ei}×${weights.ei} + ${testCase.metrics.ethical}×${weights.ethical}`;

      console.log(`  ${compCode}: ${calculated.toFixed(1)}% (Expected: ${expected}%) - ${proficiency.level}`);
      console.log(`    Formula: ${formula} = ${calculated.toFixed(1)}`);
      console.log(`    Status: ${passed ? '✓ PASS' : '✗ FAIL'}`);
    });
  });

  console.log('\n' + '='.repeat(80));
  console.log(`OVERALL RESULT: ${allTestsPassed ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED'}`);
  console.log('='.repeat(80));

  return allTestsPassed;
}

export function demonstrateExpectedScores() {
  console.log('\n' + '='.repeat(80));
  console.log('EXPECTED SCORES FOR EACH RESPONSE OPTION');
  console.log('='.repeat(80));

  for (let optionNum = 1; optionNum <= 4; optionNum++) {
    const { metrics, competencies } = AlignmentMeetingScoringService.getExpectedScores(optionNum);
    console.log(`\nOption R${optionNum}:`);
    console.log(`  Metrics: BRAVIN=${metrics.bravin}, Trust=${metrics.trust}, EI=${metrics.ei}, Ethical=${metrics.ethical}`);
    console.log(`  Competencies:`);
    Object.entries(competencies).forEach(([code, score]) => {
      const proficiency = AlignmentMeetingScoringService.getProficiencyLevel(score);
      console.log(`    ${code}: ${score.toFixed(1)}% → ${proficiency.level}`);
    });
  }

  console.log('\n' + '='.repeat(80));
}
