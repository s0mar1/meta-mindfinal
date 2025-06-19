// backend/src/routes/staticData.js
import express from 'express';
import { loadTFTData } from '../services/tftDataService.js';

const router = express.Router();

router.get('/', (req, res, next) => {
    try {
        const tftData = loadTFTData();
        res.json(tftData);
    } catch (error) {
        // 데이터 로딩 중 에러가 발생하면 중앙 에러 핸들러로 전달합니다.
        next(error);
    }
});

export default router;