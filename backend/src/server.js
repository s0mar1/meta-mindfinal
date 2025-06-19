// backend/src/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 각종 라우터 import
import summonerRoutes from './routes/summoner.js';
import matchRoutes from './routes/match.js';
import aiRoutes from './routes/ai.js';
import tierlistRoutes from './routes/tierlist.js';
import rankingRoutes from './routes/ranking.js';
import staticDataRoutes from './routes/staticData.js';
import deckBuilderRoutes from './routes/deckBuilder.js';

// 스케줄러, DB, 에러핸들러 등
import './services/scheduler.js';
import connectDB from './config/db.js';
import errorHandler from './middlewares/errorHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

// MongoDB 연결
connectDB();

app.use(cors());
app.use(express.json());

// 정적 자산 제공: 로컬 tft-datadragon/* 상위 폴더를 /datadragon/* 경로로 매핑
app.use(
  '/datadragon',
  express.static(path.join(__dirname, '../tft-datadragon'))
);

// API 라우터 등록
app.use('/api/static-data', staticDataRoutes);
app.use('/api/summoner', summonerRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/deck-tiers', tierlistRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/deck-builder', deckBuilderRoutes);

app.get('/', (req, res) => {
  res.send('TFT Meta Analyzer Backend is running!');
});

// 전역 에러 핸들러
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Riot API Key Loaded: ${!!process.env.RIOT_API_KEY}`);
});
