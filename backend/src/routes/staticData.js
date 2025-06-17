// backend/src/routes/staticData.js

import express from 'express';
import getTFTData from '../services/tftData.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        const tftData = await getTFTData('latest');
        if (!tftData) {
            return res.status(503).json({ error: 'TFT 데이터를 불러오는 데 실패했습니다.' });
        }
        
        res.json({
            champions: tftData.champions,
            items: tftData.items,
            augments: tftData.augments,
            traits: tftData.traits,
        });
    } catch (error) {
        next(error);
    }
});

export default router;