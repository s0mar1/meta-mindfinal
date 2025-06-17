import express from 'express';
import Ranker from '../models/Ranker.js';

const router = express.Router();

// GET /api/ranking?page=1&limit=50
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50; // 한 페이지에 50명씩
    const skip = (page - 1) * limit;

    // DB에서 랭커 데이터를 LP순으로 정렬하여 가져옵니다.
    const rankers = await Ranker.find()
      .sort({ leaguePoints: -1 })
      .skip(skip)
      .limit(limit);

    // 전체 랭커 수를 구해서 총 페이지 수를 계산합니다.
    const totalRankers = await Ranker.countDocuments();
    const totalPages = Math.ceil(totalRankers / limit);

    res.json({
      rankers,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.error('랭킹 정보 조회 중 에러 발생:', error.message);
    next(error);
  }
});

export default router;