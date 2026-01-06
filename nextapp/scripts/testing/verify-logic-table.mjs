console.log('='.repeat(80));
console.log('VERIFYING YOUR ORIGINAL LOGIC TABLE');
console.log('='.repeat(80));

console.log('\nYour Original Logic Table (0-1 scale):');
console.log('-'.repeat(80));
console.log('Response | BRAVIN | Trust | EI | Ethics | TBR-03 | AC-06 | EI-02 | EL-05 | VBD-01');
console.log('-'.repeat(80));
console.log('R1       | 0.3    | 0.25  | 0.2| 0.4    | 0.305  | 0.275 | 0.275 | 0.355 | 0.355');
console.log('R2       | 0.5    | 0.5   | 0.4| 0.6    | 0.49   | 0.49  | 0.49  | 0.59  | 0.59');
console.log('R3       | 0.8    | 0.75  | 0.8| 0.8    | 0.775  | 0.785 | 0.785 | 0.795 | 0.795');
console.log('R4       | 1.0    | 1.0   | 1.0| 1.0    | 1.0    | 1.0   | 1.0   | 1.0   | 1.0');

console.log('\n\nConverted to 0-100 scale:');
console.log('-'.repeat(80));
console.log('Response | BRAVIN | Trust | EI  | Ethics | TBR-03 | AC-06 | EI-02 | EL-05  | VBD-01');
console.log('-'.repeat(80));
console.log('R1       | 30     | 25    | 20  | 40     | 30.5   | 27.5  | 27.5  | 35.5   | 35.5');
console.log('R2       | 50     | 50    | 40  | 60     | 49.0   | 49.0  | 49.0  | 59.0   | 59.0');
console.log('R3       | 80     | 75    | 80  | 80     | 77.5   | 78.5  | 78.5  | 79.5   | 79.5');
console.log('R4       | 100    | 100   | 100 | 100    | 100.0  | 100.0 | 100.0 | 100.0  | 100.0');

console.log('\n\nWeighting Formula from your table:');
console.log('-'.repeat(80));
console.log('TBR-03: BRAVIN×0.3 + Trust×0.5 + EI×0.2');
console.log('AC-06:  BRAVIN×0.2 + Trust×0.3 + EI×0.5');
console.log('EI-02:  BRAVIN×0.2 + Trust×0.3 + EI×0.5');
console.log('EL-05:  BRAVIN×0.3 + Trust×0.1 + EI×0.1 + Ethics×0.5');
console.log('VBD-01: BRAVIN×0.4 + Trust×0.1 + EI×0.1 + Ethics×0.4');

console.log('\n\nNow calculating with these formulas to see if they match:');
console.log('='.repeat(80));

const WEIGHTS = {
  'TBR-03': { bravin: 0.3, trust: 0.5, ei: 0.2, ethical: 0.0 },
  'AC-06': { bravin: 0.2, trust: 0.3, ei: 0.5, ethical: 0.0 },
  'EI-02': { bravin: 0.2, trust: 0.3, ei: 0.5, ethical: 0.0 },
  'EL-05': { bravin: 0.3, trust: 0.1, ei: 0.1, ethical: 0.5 },
  'VBD-01': { bravin: 0.4, trust: 0.1, ei: 0.1, ethical: 0.4 }
};

function calc(comp, b, t, e, eth) {
  const w = WEIGHTS[comp];
  return b * w.bravin + t * w.trust + e * w.ei + eth * w.ethical;
}

console.log('\nR1 Calculations:');
console.log(`TBR-03: 30×0.3 + 25×0.5 + 20×0.2 = ${calc('TBR-03', 30, 25, 20, 40)} (Expected: 30.5)`);
console.log(`AC-06:  30×0.2 + 25×0.3 + 20×0.5 = ${calc('AC-06', 30, 25, 20, 40)} (Expected: 27.5)`);
console.log(`EI-02:  30×0.2 + 25×0.3 + 20×0.5 = ${calc('EI-02', 30, 25, 20, 40)} (Expected: 27.5)`);
console.log(`EL-05:  30×0.3 + 25×0.1 + 20×0.1 + 40×0.5 = ${calc('EL-05', 30, 25, 20, 40)} (Expected: 35.5)`);
console.log(`VBD-01: 30×0.4 + 25×0.1 + 20×0.1 + 40×0.4 = ${calc('VBD-01', 30, 25, 20, 40)} (Expected: 35.5)`);

console.log('\n** ANALYSIS **');
console.log('The calculated values DO NOT match the expected values in your table.');
console.log('This suggests the values in your table may have been pre-calculated differently,');
console.log('or there may be a different interpretation of the scoring formula.');
console.log('\nPossibility 1: The metric scores in the table are already weighted/adjusted');
console.log('Possibility 2: There might be an additional normalization step');
console.log('Possibility 3: The competency scores in the table might be targets, not calculations');

console.log('\n' + '='.repeat(80));
console.log('RECOMMENDATION:');
console.log('='.repeat(80));
console.log('Should we:');
console.log('A) Use the mathematical formula exactly as stated (current implementation)?');
console.log('B) Adjust the metric input scores to produce the desired competency outputs?');
console.log('C) Use the competency scores from your table as fixed values per response?');
console.log('\nCurrent implementation uses option A - pure mathematical calculation.');
console.log('='.repeat(80));
