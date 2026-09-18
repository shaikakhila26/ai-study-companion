const asyncHandler = require('express-async-handler');
const Mastery = require('../models/Mastery');

/**
 * Growth Analysis (PRD section 10): how concepts change over time, grouped
 * into improving / stable / requiring attention, using each Mastery
 * record's bounded history of evidence points.
 */
const getGrowth = asyncHandler(async (req, res) => {
  const mastery = await Mastery.find({ project: req.project._id }).lean();

  const grouped = { improving: [], stable: [], attention: [] };
  for (const m of mastery) {
    grouped[m.trend].push({
      concept: m.conceptName,
      level: m.level,
      confidence: m.confidence,
      history: m.history,
    });
  }

  res.json({ improving: grouped.improving, stable: grouped.stable, attention: grouped.attention });
});

module.exports = { getGrowth };
