// backend/src/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import summonerRoutes from './routes/summoner.js';
import matchRoutes from './routes/match.js';
import aiRoutes from './routes/ai.js';
import errorHandler from './middlewares/errorHandler.js';
import './services/scheduler.js';
import connectDB from './config/db.js';
import tierlistRoutes from './routes/tierlist.js';
import rankingRoutes from './routes/ranking.js';
import staticDataRoutes from './routes/staticData.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
connectDB();

app.use(cors());
app.use(express.json());

// API 라우터
app.use('/api/static-data', staticDataRoutes); 
app.use('/api/summoner', summonerRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/ai', aiRoutes);
// ⬇️ 중복 라우트 제거하고, 프론트엔드에서 사용하는 주소로 통일 
app.use('/api/deck-tiers', tierlistRoutes); 
app.use('/api/ranking', rankingRoutes);

app.get('/', (req, res) => {
  res.send('TFT Meta Analyzer Backend is running!');
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Riot API Key Loaded: ${!!process.env.RIOT_API_KEY}`);
});