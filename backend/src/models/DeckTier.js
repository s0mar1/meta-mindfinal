import mongoose from 'mongoose';

const DeckTierSchema = new mongoose.Schema({
  deckKey: { type: String, required: true, unique: true },
  tierRank: { type: String },
  tierOrder: { type: Number },
  carryChampionName: { type: String, required: true },
  mainTraitName: { type: String },
  
  // 유닛별 상세 정보를 포함하도록 구조 변경
  coreUnits: [{
    name: String,
    apiName: String,
    image_url: String,
    cost: Number,
    recommendedItems: [{
        name: String,
        image_url: String,
    }]
  }],
  
  totalGames: { type: Number, default: 0 },
  top4Count: { type: Number, default: 0 },
  winCount: { type: Number, default: 0 },
  averagePlacement: { type: Number, default: 0 },
}, { timestamps: true });

DeckTierSchema.index({ tierOrder: 1, averagePlacement: 1 });
const DeckTier = mongoose.model('DeckTier', DeckTierSchema);
export default DeckTier;