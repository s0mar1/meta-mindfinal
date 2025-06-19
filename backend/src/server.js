// backend/src/server.js
import express from 'express'; //
import cors from 'cors'; //
import dotenv from 'dotenv'; //
import path from 'path'; //
import { fileURLToPath } from 'url'; //
import { loadTFTData } from './services/tftDataService.js'; // [수정] 데이터 로더 가져오기

import summonerRoutes from './routes/summoner.js'; //
import matchRoutes from './routes/match.js'; //
import aiRoutes from './routes/ai.js'; //
import tierlistRoutes from './routes/tierlist.js'; //
import rankingRoutes from './routes/ranking.js'; //
import staticDataRoutes from './routes/staticData.js'; //
import deckBuilderRoutes from './routes/deckBuilder.js'; //

import connectDB from './config/db.js'; //
import errorHandler from './middlewares/errorHandler.js'; //

dotenv.config(); //

const __filename = fileURLToPath(import.meta.url); //
const __dirname = path.dirname(__filename); //

const app = express(); //
const PORT = process.env.PORT || 4000; //

app.use(cors()); //
app.use(express.json()); //

// [삭제] 더 이상 로컬 데이터 드래곤 폴더를 제공할 필요가 없습니다.
// app.use('/datadragon', express.static(path.join(__dirname, '../tft-datadragon'))); // 이 라인 완전 삭제

app.use('/api/static-data', staticDataRoutes); //
app.use('/api/summoner', summonerRoutes); //
app.use('/api/match', matchRoutes); //
app.use('/api/ai', aiRoutes); //
app.use('/api/deck-tiers', tierlistRoutes); //
app.use('/api/ranking', rankingRoutes); //
app.use('/api/deck-builder', deckBuilderRoutes); //

app.get('/', (req, res) => { //
  res.send('TFT Meta Analyzer Backend is running!'); //
});

app.use(errorHandler); //

/**
 * [핵심 수정] 서버를 시작하는 비동기 함수
 * 데이터 로딩이 완료된 후에 서버를 실행합니다.
 */
const startServer = async () => { //
    try { //
        console.log('데이터베이스 연결을 시작합니다...'); //
        await connectDB(); //
        console.log('MongoDB Connected.'); //

        console.log('TFT 기본 데이터 로딩을 시작합니다...'); //
        await loadTFTData(); // 데이터가 로드될 때까지 기다립니다.
        
        // [수정] 스케줄러는 데이터 로딩 후에 import 하여 실행합니다.
        await import('./services/scheduler.js'); //

        app.listen(PORT, () => { //
            console.log(`모든 준비 완료. 서버가 http://localhost:${PORT} 에서 실행 중입니다.`); //
        });
    } catch (error) { //
        console.error('서버 시작에 실패했습니다:', error); //
        process.exit(1); // 실패 시 프로세스 종료
    }
};

startServer(); // 서버 시작 함수 호출