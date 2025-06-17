import mongoose from 'mongoose';

const RankerSchema = new mongoose.Schema({
  puuid: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  summonerId: {
    type: String,
    required: true,
  },
  summonerName: {
    type: String,
    required: true,
  },
// ⬇️⬇️⬇️ 3개 필드 추가 ⬇️⬇️⬇️
  gameName: { // 검색을 위한 실제 게임 이름
    type: String,
    required: true,
  },
  tagLine: { // 검색을 위한 태그
    type: String,
    required: true,
  },
  profileIconId: { // 프로필 아이콘 ID
    type: Number,
  },
  leaguePoints: {
    type: Number,
    required: true,
  },
  rank: {
    type: String,
  },
  wins: {
    type: Number,
    required: true,
  },
  losses: {
    type: Number,
    required: true,
  },
  firstPlaceWins: { type: Number, default: 0 },
}, {
  timestamps: true,
});

// LP(리그 포인트) 기준으로 내림차순 인덱스를 생성하여 조회 속도를 높입니다.
RankerSchema.index({ leaguePoints: -1 });

const Ranker = mongoose.model('Ranker', RankerSchema);

export default Ranker;