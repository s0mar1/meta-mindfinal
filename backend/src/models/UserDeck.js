// backend/src/models/UserDeck.js
import mongoose from 'mongoose';

const UnitPlacementSchema = new mongoose.Schema({
  unitApiName: { type: String, required: true },
  x: { type: Number, required: true }, // 헥사곤 그리드 x 좌표
  y: { type: Number, required: true }, // 헥사곤 그리드 y 좌표
}, { _id: false });

const UserDeckSchema = new mongoose.Schema({
  deckName: { type: String, required: true, trim: true },
  authorPuuid: { type: String, index: true }, // 작성자 (추후 로그인 기능 연동)
  authorName: { type: String },
  description: { type: String }, // 덱 설명 및 공략
  coreUnits: [{ type: String }], // 이 덱의 핵심 유닛 apiName 목록
  placements: [UnitPlacementSchema], // 유닛 배치 정보
  version: { type: String, default: "Set14" }, // TFT 시즌 정보
  isPublic: { type: Boolean, default: true }, // 공개/비공개 여부
}, { timestamps: true });

const UserDeck = mongoose.model('UserDeck', UserDeckSchema);
export default UserDeck;