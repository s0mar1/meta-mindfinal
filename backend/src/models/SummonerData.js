// backend/src/models/SummonerData.js

import mongoose from 'mongoose';

const SummonerDataSchema = new mongoose.Schema({
  // 고유 식별자
  puuid: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  gameName: {
    type: String,
    required: true,
  },
  tagLine: {
    type: String,
    required: true,
  },
  // 캐시된 데이터 본문
  // 프론트엔드로 전달되는 account, league, matches 객체를 그대로 저장
  data: {
    type: Object,
    required: true,
  },
  // 마지막 갱신 시간
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

const SummonerData = mongoose.model('SummonerData', SummonerDataSchema);

export default SummonerData;