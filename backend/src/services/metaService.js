const Match = require('../models/Match');

module.exports = {
  async calculatePickRates() {
    const totalMatches = await Match.countDocuments();
    if (totalMatches === 0) return [];
    const agg = await Match.aggregate([
      { $unwind: '$participants' },
      { $group: { _id: '$participants.championName', count: { $sum: 1 } } },
      { $project: { _id: 0, champion: '$_id', pickCount: '$count' } }
    ]);
    return agg.map(item => ({
      champion: item.champion,
      pickCount: item.pickCount,
      pickRate: parseFloat(((item.pickCount / (totalMatches * 8)) * 100).toFixed(2))
    }));
  },
  async calculateWinRates() {
    const agg = await Match.aggregate([
      { $unwind: '$participants' },
      { $group: {
        _id: '$participants.championName',
        totalCount: { $sum: 1 },
        winCount: { $sum: { $cond: ['$participants.win', 1, 0] } }
      }},
      { $project: {
        _id: 0,
        champion: '$_id',
        totalCount: 1,
        winCount: 1,
        winRate: { $round: [{ $multiply: [{ $divide: ['$winCount', '$totalCount'] }, 100] }, 2] }
      }}
    ]);
    return agg;
  }
};
