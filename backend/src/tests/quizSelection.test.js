const { pickNextConcept, difficultyForLevel } = require('../services/quizService');

describe('quizService.pickNextConcept', () => {
  test('prioritizes low-confidence concepts over simply-low-mastery ones', () => {
    const records = [
      { conceptName: 'A', level: 0.2, confidence: 0.9, consecutiveMistakes: 0 }, // well-established weakness
      { conceptName: 'B', level: 0.6, confidence: 0.1, consecutiveMistakes: 0 }, // barely any evidence yet
    ];
    const picked = pickNextConcept(records, {});
    expect(picked.conceptName).toBe('B');
  });

  test('prioritizes repeated mistakes heavily', () => {
    const records = [
      { conceptName: 'A', level: 0.7, confidence: 0.8, consecutiveMistakes: 0 },
      { conceptName: 'B', level: 0.7, confidence: 0.8, consecutiveMistakes: 3 },
    ];
    const picked = pickNextConcept(records, {});
    expect(picked.conceptName).toBe('B');
  });

  test('avoids hammering a concept that was just asked repeatedly', () => {
    const records = [
      { conceptName: 'A', level: 0.3, confidence: 0.3, consecutiveMistakes: 0 },
      { conceptName: 'B', level: 0.3, confidence: 0.3, consecutiveMistakes: 0 },
    ];
    const askedCounts = { A: 5 };
    const picked = pickNextConcept(records, askedCounts);
    expect(picked.conceptName).toBe('B');
  });

  test('is NOT a pure wrong->easy, correct->hard ladder: two concepts with the same last-answer ' +
    'outcome can still yield different difficulty based on mastery level', () => {
    // Both "just answered correctly" in this hypothetical, but at different mastery levels.
    expect(difficultyForLevel(0.9)).toBe('hard');
    expect(difficultyForLevel(0.3)).toBe('easy');
  });

  test('returns null for empty mastery list', () => {
    expect(pickNextConcept([], {})).toBeNull();
  });
});
