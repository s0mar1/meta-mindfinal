// === src/routes/summoner.js ===
import express from 'express';
import {
  getAccountByRiotId,
  getMatchIdsByPUUID,
  getMatchDetail // getMatchDetails 대신 getMatchDetail 사용
} from '../services/riotApi.js';

// 플랫폼별 호스트 매핑 (이 부분은 현재 Riot API 호출 방식과 직접 연관이 적습니다. asia 라우팅 고정)
// const PLATFORM_HOSTS = {
//   kr:   'kr.api.riotgames.com',
//   na1:  'na1.api.riotgames.com',
//   euw1: 'euw1.api.riotgames.com',
//   eune1:'eune1.api.riotgames.com'
// };

const router = express.Router();

/**
 * GET /api/summoner/:region/:rawName
 * region: 'kr', 'na1', 'euw1', 'eune1'
 * rawName: encodeURIComponent(gameName#tagLine) or plain name
 */
router.get('/:region/:rawName', async (req, res) => {
  const { region, rawName } = req.params;
  console.log('🛠 [SummonerRoute] region:', region);
  console.log('🛠 [SummonerRoute] rawName (인코딩 전):', rawName);

  const decoded = decodeURIComponent(rawName);
  console.log('🛠 [SummonerRoute] decoded (인코딩 후):', decoded);

  let puuid;
  let account; // summoner 대신 account 변수를 사용

  try {
    // Riot ID 체계: gameName#tagLine만 지원합니다. (기존 이름만 사용하는 방식 제거)
    if (!decoded.includes('#')) {
      return res.status(400).json({ error: '소환사명#태그라인 형식으로 입력해주세요. (예: Hide on bush#KR1)' });
    }

    const [gameName, tagLine] = decoded.split('#');
    console.log('🛠 [SummonerRoute] gameName:', gameName, 'tagLine:', tagLine);

    // 1) Account-V1로 PUUID 조회
    // riotApi.js의 getAccountByRiotId는 region을 받지 않고, 내부적으로 'asia'를 고정 사용하므로,
    // 여기서는 region 파라미터를 넘기지 않습니다.
    account = await getAccountByRiotId(gameName, tagLine);
    puuid = account.puuid;

    // 2) PUUID로 Summoner-V4 조회 (getSummonerByPUUID/getSummonerByName 제거)
    // account 객체 자체가 필요한 정보를 담고 있으므로, 이를 그대로 summoner 정보로 사용합니다.
    const summonerInfo = {
        puuid: account.puuid,
        gameName: account.gameName,
        tagLine: account.tagLine
        // 추가적인 티어, 레벨 정보 등은 Summoner-V4 API가 필요하지만, riotApi.js에 없습니다.
        // 프론트엔드에서 필요한 경우, 별도의 API 호출 로직을 riotApi.js에 추가해야 합니다.
    };


    // 3) 최근 매치 ID 조회
    const matchIds = await getMatchIdsByPUUID(puuid, 10);

    // 4) 각 매치 상세 조회
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms)); // API Rate Limit 회피용
    const matchesRaw = [];
    for (const id of matchIds) {
      const detail = await getMatchDetail(id); // getMatchDetails 대신 getMatchDetail 사용
      matchesRaw.push(detail);
      await delay(120); // API 호출 간 지연
    }


    // 5) 데이터 단순화하여 응답
    const processedMatches = matchesRaw.map(m => {
      const participant = m.info.participants.find(p => p.puuid === puuid);
      if (!participant) return null; // 해당 참가자를 찾을 수 없는 경우 스킵

      // TFT Data (챔피언, 특성, 아이템 이미지 URL) 로딩 로직은 summoner.js의 다른 라우트에서 처리되거나
      // 전역적으로 로드되어야 합니다. 현재 라우터에서는 tftData를 직접 사용할 수 없습니다.
      // 이 라우터는 순수하게 라이엇 API 데이터만 반환하고, 가공은 클라이언트나 다른 서비스에서 하는 것이 좋습니다.
      // 또는 이 라우터에 tftData 로딩 로직을 추가해야 합니다.
      // (현재 여기서는 TFT 데이터를 가공하지 않고 라이엇 API 원본 데이터 구조에 맞춥니다.)

      return {
        matchId: m.metadata.match_id,
        game_datetime: m.info.game_datetime,
        placement: participant.placement,
        last_round: participant.last_round,
        units: participant.units, // 원본 유닛 데이터
        traits: participant.traits // 원본 특성 데이터
        // 챔피언이나 아이템 이미지 URL은 클라이언트에서 tftData를 이용해 생성해야 합니다.
        // (SummonerPage.jsx의 MatchCard 컴포넌트가 이미 이 작업을 하고 있습니다.)
      };
    }).filter(Boolean); // null 값 필터링

    // account 객체를 summoner 정보로 사용
    res.json({ account: summonerInfo, matches: processedMatches });
  } catch (err) {
    console.error('❌ [SummonerRoute] Riot API error:', err.response?.status, err.response?.data || err.message);
    const status = err.response?.status || 500;
    res.status(status).json({ error: err.response?.data || err.message });
  }
});

export default router;