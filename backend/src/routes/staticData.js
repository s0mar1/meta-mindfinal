// backend/src/routes/staticData.js
import express from 'express';
import { loadTFTData } from '../services/tftDataService.js';

const router = express.Router();

router.get('/', (req, res, next) => {
    try {
        const tftData = loadTFTData();
        res.json(tftData);
    } catch (error) {
        next(error);
    }
});

export default router;