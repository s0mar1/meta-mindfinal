import express from 'express';
import DeckTier from '../models/DeckTier.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const tiers = await DeckTier.find({ totalGames: { $gte: 3 } })
      .sort({ tierOrder: 1, averagePlacement: 1 }) // 티어 순, 다음으로 평균등수 순 정렬
      .limit(30);
    res.json(tiers);
  } catch (error) {
    next(error);
  }
});

export default router;