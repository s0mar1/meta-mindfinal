const express = require('express');
const router = express.Router();
const chatService = require('../services/chatService');

router.post('/', async (req, res, next) => {
  try {
    const { question, history } = req.body;
    const answer = await chatService.getAnswer(question, history);
    res.json({ answer });
  } catch(err) {
    next(err);
  }
});

module.exports = router;
