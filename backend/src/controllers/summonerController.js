// src/controllers/summonerController.js
import { getAccountByRiotId, ... } from '../services/riotApi.js';

export const getSummonerData = async (req, res, next) => {
  // routes/summoner.js에 있던 try...catch 로직 전체를 이곳으로 이동
  try {
    // ... puuid, match details 조회 및 가공 로직 ...
    res.json({ account, matches: processedMatches });
  } catch (error) {
    next(error); // 중앙 에러 핸들러로 에러 전달
  }
};