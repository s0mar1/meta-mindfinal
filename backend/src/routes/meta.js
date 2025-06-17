const express = require('express');
const router = express.Router();
const metaService = require('../services/metaService');

router.get('/pick-rates', async (req, res, next) => {
  try {
    const pickRates = await metaService.calculatePickRates();
    res.json(pickRates);
  } catch (err) {
    next(err);
  }
});

router.get('/win-rates', async (req, res, next) => {
  try {
    const winRates = await metaService.calculateWinRates();
    res.json(winRates);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
