// backend/src/routes/deckBuilder.js
import express from 'express';
import UserDeck from '../models/UserDeck.js';
// import authMiddleware from '../middlewares/auth.js'; // (미래) 로그인 인증 미들웨어

const router = express.Router();

// 덱 생성 API
router.post('/', async (req, res, next) => {
  try {
    // req.body 에는 deckName, placements 등이 포함됩니다.
    const newDeck = new UserDeck(req.body);
    await newDeck.save();
    res.status(201).json(newDeck);
  } catch (error) {
    next(error);
  }
});

// 특정 덱 조회 API
router.get('/:deckId', async (req, res, next) => {
  // ... deckId로 DB에서 덱 정보를 찾아 반환하는 로직 ...
});

// 덱 목록 조회 API (예: 최신순, 인기순)
router.get('/', async (req, res, next) => {
  // ... 모든 공개 덱 목록을 페이지네이션하여 반환하는 로직 ...
});

export default router;