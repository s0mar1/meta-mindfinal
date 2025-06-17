// backend/src/models/Match.js
import mongoose from 'mongoose';

const MatchSchema = new mongoose.Schema({
  'metadata.match_id': {
    type: String,
    unique: true,
    required: false, 
    sparse: true,    
  },
  metadata: { type: Object },
  info: { type: Object }
}, {
  strict: false,
  timestamps: true,
});

const Match = mongoose.model('Match', MatchSchema);

export default Match;