// backend/services/chatService.js

// v4 이상 방식
const OpenAI = require("openai");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

module.exports = {
  /**
   * 사용자의 질문과 대화 히스토리를 기반으로 AI 응답 생성
   * @param {string} question
   * @param {Array<{role:string, content:string}>} history
   * @returns {Promise<string>} AI 응답
   */
  async getAnswer(question, history = []) {
    const messages = [
      { role: 'system', content: 'You are a TFT meta analysis expert.' },
      ...history,
      { role: 'user', content: question }
    ];

    // v4 방식의 Chat Completion 호출
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 512,
      temperature: 0.7
    });

    return response.choices[0].message.content;
  }
};
