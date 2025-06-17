// backend/src/middlewares/errorHandler.js

const errorHandler = (err, req, res, next) => {
  console.error('--- [중앙 에러 핸들러] ---');
  console.error(err.stack || err);

  // isAxiosError는 axios 1.0부터 deprecated 될 수 있으므로, response 객체 존재 여부로 확인
  if (err.response && err.response.data) {
    const { status, data } = err.response;
    const { message } = data.status || {};
    
    console.error(`Riot API Error (Status: ${status}): ${message}`);

    // Riot API 에러 코드에 따른 구체적인 메시지 분기
    let userMessage = `Riot API 에러가 발생했습니다 (HTTP ${status}).`;
    if (status === 400) userMessage = '잘못된 요청입니다. 입력값을 확인해주세요.';
    if (status === 401) userMessage = 'Riot API 인증에 실패했습니다. API 키가 유효한지 확인하세요.';
    if (status === 403) userMessage = 'Riot API 키가 만료되었거나 권한이 없습니다.';
    if (status === 404) userMessage = '요청하신 소환사 정보를 찾을 수 없습니다.';
    if (status === 429) userMessage = 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
    
    return res.status(status).json({ error: userMessage, details: message });
  }

  // 그 외 서버 내부 에러
  const statusCode = err.statusCode || 500;
  const message = err.message || '서버 내부에서 알 수 없는 에러가 발생했습니다.';
  res.status(statusCode).json({ error: message });
};

export default errorHandler;